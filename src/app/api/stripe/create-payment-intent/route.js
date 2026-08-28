import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminApp, db } from "@/lib/firebaseAdmin";
import {
  getSellerEligibility,
  getSellerEligibilityError,
} from "@/lib/sellerEligibility";
import {
  calculatePlatformFee,
  CHECKOUT_RESERVATION_MS,
  isSupportedSaleCurrency,
} from "@/lib/listingSalePolicy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function checkoutError(message, code, status = 409) {
  const error = new Error(message);
  error.code = code;
  error.httpStatus = status;
  return error;
}

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeShippingAddress(value = {}) {
  const address = value?.address || {};
  const line1 = cleanString(address.line1, 200);
  const city = cleanString(address.city, 100);
  const postalCode = cleanString(address.postal_code, 30);
  const countryCode = cleanString(address.country, 2).toUpperCase();

  if (!line1 || !city || !postalCode || !countryCode) {
    throw checkoutError(
      "Please provide a complete shipping address.",
      "invalid_shipping_address",
      400
    );
  }

  return {
    name: cleanString(value.name, 150),
    phone: cleanString(value.phone, 50) || null,
    address: {
      line1,
      line2: cleanString(address.line2, 200) || null,
      city,
      state: cleanString(address.state, 100) || null,
      postalCode,
      countryCode,
    },
  };
}

function getTimestampMillis(value) {
  const millis = value?.toMillis?.();
  return Number.isFinite(millis) ? millis : 0;
}

function validateListingForCheckout(
  listing,
  buyerUid,
  expectedPriceCents,
  expectedCurrency
) {
  const amount = Number(listing.priceCents);
  const currency = cleanString(listing.currency, 3).toLowerCase();

  if (listing.status !== "active") {
    throw checkoutError(
      "This listing is no longer available.",
      "listing_unavailable"
    );
  }
  if (listing.type !== "sell") {
    throw checkoutError("This listing is not for sale.", "listing_not_for_sale");
  }
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw checkoutError(
      "This listing does not have a valid sale price.",
      "invalid_listing_price"
    );
  }
  if (!listing.ownerUid || !isSupportedSaleCurrency(currency)) {
    throw checkoutError(
      "This listing has invalid seller or currency information.",
      "invalid_listing",
      400
    );
  }
  if (listing.ownerUid === buyerUid) {
    throw checkoutError(
      "You cannot purchase your own listing.",
      "self_purchase",
      400
    );
  }
  if (
    amount !== expectedPriceCents ||
    currency !== expectedCurrency.toLowerCase()
  ) {
    throw checkoutError(
      "The listing price changed. Refresh checkout before paying.",
      "listing_price_changed"
    );
  }

  return { amount, currency };
}

async function releaseCanceledReservation({ listingId, reservationId }) {
  const listingRef = db.collection("listings").doc(listingId);
  const attemptRef = db.collection("payment_attempts").doc(reservationId);

  await db.runTransaction(async (transaction) => {
    const [listingSnapshot, attemptSnapshot] = await Promise.all([
      transaction.get(listingRef),
      transaction.get(attemptRef),
    ]);

    if (listingSnapshot.data()?.checkoutReservation?.id === reservationId) {
      transaction.update(listingRef, {
        checkoutReservation: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    if (attemptSnapshot.exists) {
      transaction.set(
        attemptRef,
        {
          status: "canceled",
          buyerName: FieldValue.delete(),
          buyerEmail: FieldValue.delete(),
          buyerPhone: FieldValue.delete(),
          shippingAddress: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await getAuth(adminApp).verifyIdToken(authHeader.slice(7));
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const buyerUid = decodedToken.uid;
    const body = await request.json();
    const listingId = cleanString(body.listingId, 200);
    const buyerName = cleanString(body.buyerName, 150);
    const buyerEmail = cleanString(body.buyerEmail, 320).toLowerCase();
    const buyerPhone = cleanString(body.buyerPhone, 50) || null;
    const expectedPriceCents = Number(body.expectedPriceCents);
    const expectedCurrency = cleanString(body.expectedCurrency, 3).toLowerCase();
    const shippingAddress = normalizeShippingAddress(body.shippingAddress);

    if (!listingId) {
      throw checkoutError("Listing ID is required.", "listing_id_required", 400);
    }
    if (!buyerName || !buyerEmail) {
      throw checkoutError(
        "Buyer name and email are required.",
        "buyer_details_required",
        400
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      throw checkoutError("Invalid email address.", "invalid_email", 400);
    }
    if (
      !Number.isSafeInteger(expectedPriceCents) ||
      !isSupportedSaleCurrency(expectedCurrency)
    ) {
      throw checkoutError(
        "Refresh checkout before paying.",
        "invalid_checkout_expectation",
        400
      );
    }

    const listingRef = db.collection("listings").doc(listingId);
    const initialListingSnapshot = await listingRef.get();
    if (!initialListingSnapshot.exists) {
      throw checkoutError("Listing not found.", "listing_not_found", 404);
    }

    const initialListing = initialListingSnapshot.data();
    validateListingForCheckout(
      initialListing,
      buyerUid,
      expectedPriceCents,
      expectedCurrency
    );

    const sellerEligibility = await getSellerEligibility(initialListing.ownerUid);
    if (!sellerEligibility.eligible) {
      throw checkoutError(
        getSellerEligibilityError(sellerEligibility.reasons),
        sellerEligibility.reasons[0] || "seller_ineligible"
      );
    }

    const ownerStripeAccountId = sellerEligibility.profile.stripeAccountId;
    const now = Date.now();
    let checkout;

    await db.runTransaction(async (transaction) => {
      const listingSnapshot = await transaction.get(listingRef);
      if (!listingSnapshot.exists) {
        throw checkoutError("Listing not found.", "listing_not_found", 404);
      }

      const listing = listingSnapshot.data();
      const { amount, currency } = validateListingForCheckout(
        listing,
        buyerUid,
        expectedPriceCents,
        expectedCurrency
      );
      if (listing.ownerUid !== initialListing.ownerUid) {
        throw checkoutError("The listing seller changed.", "listing_changed");
      }

      const currentReservation = listing.checkoutReservation;
      const currentReservationActive =
        Boolean(currentReservation?.id) &&
        getTimestampMillis(currentReservation.expiresAt) > now;
      let reservationId = currentReservationActive
        ? currentReservation.id
        : randomUUID();
      let attemptRef = db.collection("payment_attempts").doc(reservationId);
      let attemptSnapshot = await transaction.get(attemptRef);

      if (
        currentReservationActive &&
        attemptSnapshot.exists &&
        attemptSnapshot.data().buyerUid !== buyerUid
      ) {
        throw checkoutError(
          "Another buyer is currently checking out this listing. Please try again shortly.",
          "listing_reserved"
        );
      }

      if (currentReservationActive && !attemptSnapshot.exists) {
        reservationId = randomUUID();
        attemptRef = db.collection("payment_attempts").doc(reservationId);
        attemptSnapshot = await transaction.get(attemptRef);
      }

      const expiresAt = Timestamp.fromMillis(now + CHECKOUT_RESERVATION_MS);
      const reservation = {
        id: reservationId,
        createdAt: currentReservationActive
          ? currentReservation.createdAt || Timestamp.fromMillis(now)
          : Timestamp.fromMillis(now),
        expiresAt,
      };

      transaction.update(listingRef, {
        checkoutReservation: reservation,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const attemptData = {
        reservationId,
        listingId,
        buyerUid,
        buyerName,
        buyerEmail,
        buyerPhone,
        shippingAddress,
        sellerUid: listing.ownerUid,
        sellerStripeAccountId: ownerStripeAccountId,
        amount,
        currency,
        status: attemptSnapshot.exists
          ? attemptSnapshot.data().status || "reserved"
          : "reserved",
        expiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (!attemptSnapshot.exists) {
        attemptData.createdAt = FieldValue.serverTimestamp();
      }
      transaction.set(attemptRef, attemptData, { merge: true });

      checkout = {
        reservation,
        reservationId,
        listing,
        amount,
        currency,
        paymentIntentId: attemptSnapshot.exists
          ? attemptSnapshot.data().paymentIntentId || null
          : null,
      };
    });

    let paymentIntent;
    let createdPaymentIntent = false;
    if (checkout.paymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(
        checkout.paymentIntentId
      );
      if (paymentIntent.status === "canceled") {
        await releaseCanceledReservation({
          listingId,
          reservationId: checkout.reservationId,
        });
        throw checkoutError(
          "The previous checkout expired. Please try again.",
          "checkout_expired"
        );
      }
      if (paymentIntent.status === "succeeded") {
        throw checkoutError(
          "This payment has already completed.",
          "payment_already_completed"
        );
      }
      if (
        paymentIntent.amount !== checkout.amount ||
        paymentIntent.currency !== checkout.currency
      ) {
        throw checkoutError(
          "The existing checkout no longer matches this listing.",
          "checkout_mismatch"
        );
      }
    } else {
      const platformFee = calculatePlatformFee(checkout.amount);
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: checkout.amount,
          currency: checkout.currency,
          description:
            checkout.listing.title ||
            `${checkout.listing.brand} - ${checkout.listing.fragrance}`,
          automatic_payment_methods: { enabled: true },
          transfer_data: { destination: ownerStripeAccountId },
          application_fee_amount: platformFee,
          receipt_email: buyerEmail,
          metadata: {
            type: "fragrance_purchase",
            listingId,
            reservationId: checkout.reservationId,
            buyerUid,
            ownerUid: checkout.listing.ownerUid,
            expectedAmount: String(checkout.amount),
            expectedCurrency: checkout.currency,
          },
        },
        {
          idempotencyKey: `listing-checkout-${checkout.reservationId}`,
        }
      );
      createdPaymentIntent = true;
    }

    const attemptRef = db
      .collection("payment_attempts")
      .doc(checkout.reservationId);
    try {
      await db.runTransaction(async (transaction) => {
        const [listingSnapshot, attemptSnapshot] = await Promise.all([
          transaction.get(listingRef),
          transaction.get(attemptRef),
        ]);

        if (
          listingSnapshot.data()?.checkoutReservation?.id !==
            checkout.reservationId ||
          !attemptSnapshot.exists ||
          attemptSnapshot.data().buyerUid !== buyerUid
        ) {
          throw checkoutError(
            "This checkout reservation is no longer valid.",
            "reservation_expired"
          );
        }

        transaction.set(
          attemptRef,
          {
            paymentIntentId: paymentIntent.id,
            status: "payment_pending",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
    } catch (error) {
      if (createdPaymentIntent) {
        try {
          await stripe.paymentIntents.cancel(paymentIntent.id);
          await releaseCanceledReservation({
            listingId,
            reservationId: checkout.reservationId,
          });
        } catch (cleanupError) {
          console.error("Failed to cancel abandoned PaymentIntent:", cleanupError);
        }
      }
      throw error;
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      reservationExpiresAt: checkout.reservation.expiresAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}`, code: "stripe_error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Unable to create payment intent.",
        code: error.code || "payment_intent_failed",
      },
      { status: error.httpStatus || 500 }
    );
  }
}
