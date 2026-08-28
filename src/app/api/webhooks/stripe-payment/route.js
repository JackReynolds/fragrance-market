import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { getSellerEligibility } from "@/lib/sellerEligibility";
import { calculatePlatformFee } from "@/lib/listingSalePolicy";
import { sendPurchaseConfirmationEmails } from "@/app/api/email/fragrance-purchase-emails/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_PAYMENT_WEBHOOK_SECRET;

function getCountryName(code, locale = "en") {
  if (!code) return undefined;

  try {
    const regionNames = new Intl.DisplayNames([locale], { type: "region" });
    return regionNames.of(code.toUpperCase());
  } catch (error) {
    console.error("Error converting country code:", error);
    return undefined;
  }
}

function getShippingInfo(attempt) {
  const shipping = attempt.shippingAddress;
  const address = shipping?.address;
  if (
    !shipping ||
    !address?.line1 ||
    !address?.city ||
    !address?.postalCode ||
    !address?.countryCode
  ) {
    return null;
  }

  const country =
    getCountryName(address.countryCode, "en") || address.countryCode;

  return {
    name: shipping.name || attempt.buyerName,
    email: attempt.buyerEmail,
    phone: shipping.phone || attempt.buyerPhone || null,
    addressLine1: address.line1,
    addressLine2: address.line2 || null,
    city: address.city,
    state: address.state || null,
    postalCode: address.postalCode,
    country,
    countryCode: address.countryCode,
    formattedAddress: [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      country,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

function getValidationFailure({
  paymentIntent,
  metadata,
  listing,
  attempt,
  sellerEligibility,
}) {
  if (!listing) return "listing_not_found";
  if (!attempt) return "payment_attempt_not_found";
  if (listing.status !== "active") return "listing_not_active";
  if (listing.type !== "sell") return "listing_not_for_sale";
  if (listing.ownerUid !== metadata.ownerUid) return "seller_mismatch";
  if (attempt.listingId !== metadata.listingId) return "attempt_listing_mismatch";
  if (attempt.buyerUid !== metadata.buyerUid) return "attempt_buyer_mismatch";
  if (attempt.sellerUid !== metadata.ownerUid) return "attempt_seller_mismatch";
  if (attempt.paymentIntentId !== paymentIntent.id) {
    return "payment_intent_mismatch";
  }
  if (
    attempt.sellerStripeAccountId !==
    paymentIntent.transfer_data?.destination
  ) {
    return "payment_destination_mismatch";
  }
  if (
    sellerEligibility.profile?.stripeAccountId !==
    attempt.sellerStripeAccountId
  ) {
    return "seller_account_changed";
  }
  if (listing.checkoutReservation?.id !== metadata.reservationId) {
    return "reservation_mismatch";
  }

  const listingAmount = Number(listing.priceCents);
  const metadataAmount = Number(metadata.expectedAmount);
  if (
    !Number.isSafeInteger(listingAmount) ||
    listingAmount <= 0 ||
    paymentIntent.amount !== listingAmount ||
    paymentIntent.amount !== attempt.amount ||
    paymentIntent.amount !== metadataAmount
  ) {
    return "amount_mismatch";
  }
  if (
    paymentIntent.application_fee_amount !==
    calculatePlatformFee(listingAmount)
  ) {
    return "platform_fee_mismatch";
  }

  const currency = listing.currency?.toLowerCase();
  if (
    paymentIntent.currency !== currency ||
    paymentIntent.currency !== attempt.currency ||
    paymentIntent.currency !== metadata.expectedCurrency
  ) {
    return "currency_mismatch";
  }
  if (!getShippingInfo(attempt)) return "shipping_address_missing";
  if (!sellerEligibility.eligible) return "seller_no_longer_eligible";

  return null;
}

async function findExistingLegacyOrder(paymentIntentId) {
  const snapshot = await db
    .collection("orders")
    .where("payment.stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].data();
}

async function refundInvalidPayment(paymentIntent, reservationId, reason) {
  const refund = await stripe.refunds.create(
    {
      payment_intent: paymentIntent.id,
      reverse_transfer: true,
      refund_application_fee: true,
      metadata: {
        reason: reason.slice(0, 500),
        reservationId: reservationId || "missing",
      },
    },
    { idempotencyKey: `listing-collision-refund-${paymentIntent.id}` }
  );

  if (reservationId) {
    await db.collection("payment_attempts").doc(reservationId).set(
      {
        status: "refunded",
        refundReason: reason,
        stripeRefundId: refund.id,
        buyerName: FieldValue.delete(),
        buyerEmail: FieldValue.delete(),
        buyerPhone: FieldValue.delete(),
        shippingAddress: FieldValue.delete(),
        refundedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  console.warn(
    `Refunded PaymentIntent ${paymentIntent.id} after validation failure: ${reason}`
  );
}

async function processSuccessfulPayment(paymentIntent, sellerEligibility) {
  const metadata = paymentIntent.metadata || {};
  const { listingId, reservationId, buyerUid, ownerUid } = metadata;
  const listingRef = db.collection("listings").doc(listingId);
  const attemptRef = db.collection("payment_attempts").doc(reservationId);
  const orderRef = db.collection("orders").doc(paymentIntent.id);
  const buyerRef = db.collection("profiles").doc(buyerUid);
  const sellerRef = db.collection("profiles").doc(ownerUid);

  return db.runTransaction(async (transaction) => {
    const [
      orderSnapshot,
      listingSnapshot,
      attemptSnapshot,
      buyerSnapshot,
      sellerSnapshot,
    ] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(listingRef),
      transaction.get(attemptRef),
      transaction.get(buyerRef),
      transaction.get(sellerRef),
    ]);

    if (orderSnapshot.exists) {
      return { status: "already_processed", order: orderSnapshot.data() };
    }

    const listing = listingSnapshot.exists ? listingSnapshot.data() : null;
    const attempt = attemptSnapshot.exists ? attemptSnapshot.data() : null;
    let failureReason = getValidationFailure({
      paymentIntent,
      metadata,
      listing,
      attempt,
      sellerEligibility,
    });

    if (!buyerSnapshot.exists || !sellerSnapshot.exists) {
      failureReason ||= "buyer_or_seller_profile_missing";
    }

    if (failureReason) {
      if (
        listingSnapshot.exists &&
        listing?.checkoutReservation?.id === reservationId
      ) {
        transaction.update(listingRef, {
          checkoutReservation: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      if (attemptSnapshot.exists) {
        transaction.set(
          attemptRef,
          {
            status: "refund_pending",
            refundReason: failureReason,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      return { status: "refund_required", reason: failureReason };
    }

    const buyer = buyerSnapshot.data();
    const seller = sellerSnapshot.data();
    const shippingInfo = getShippingInfo(attempt);
    const totalAmount = paymentIntent.amount;
    const currency = paymentIntent.currency;
    const platformFee = paymentIntent.application_fee_amount || 0;
    const sellerAmount = totalAmount - platformFee;
    const orderData = {
      orderId: orderRef.id,
      orderNumber: `ORD-${paymentIntent.created}-${paymentIntent.id
        .slice(-8)
        .toUpperCase()}`,
      status: "payment_completed",
      participants: [buyerUid, ownerUid],
      buyerUid,
      sellerUid: ownerUid,
      listingId,
      item: {
        title: listing.title,
        brand: listing.brand,
        fragrance: listing.fragrance,
        amountLeft: listing.amountLeft,
        imageURL: listing.imageURLs?.[0] || null,
        sizeInMl: listing.sizeInMl || null,
        price: totalAmount / 100,
        priceCents: totalAmount,
      },
      shippingTo: shippingInfo,
      buyer: {
        uid: buyerUid,
        username: buyer.username || "Unknown",
        displayName: buyer.displayName || buyer.username || "Unknown",
        profilePictureURL: buyer.profilePictureURL || null,
      },
      seller: {
        uid: ownerUid,
        username: seller.username || "Unknown",
        email: seller.email,
        profilePictureURL: seller.profilePictureURL || null,
      },
      payment: {
        totalAmount,
        currency,
        platformFee,
        sellerAmount,
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method_types?.[0] || "card",
        paidAt: FieldValue.serverTimestamp(),
      },
      shipment: {
        trackingNumber: null,
        carrier: null,
        shippedAt: null,
        estimatedDelivery: null,
        deliveredAt: null,
      },
      orderHistory: [
        {
          status: "payment_completed",
          timestamp: Timestamp.now(),
          note: "Payment successfully processed",
        },
      ],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    transaction.set(orderRef, orderData);
    transaction.update(listingRef, {
      status: "sold",
      checkoutReservation: FieldValue.delete(),
      soldAt: FieldValue.serverTimestamp(),
      soldTo: buyerUid,
      orderId: orderRef.id,
      salePrice: totalAmount,
      saleCurrency: currency,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.delete(attemptRef);
    transaction.update(buyerRef, {
      purchaseCount: FieldValue.increment(1),
      totalSpent: FieldValue.increment(totalAmount),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(sellerRef, {
      saleCount: FieldValue.increment(1),
      totalEarnings: FieldValue.increment(sellerAmount),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { status: "processed", order: orderData };
  });
}

async function handlePaymentSucceeded(paymentIntent) {
  const metadata = paymentIntent.metadata || {};
  if (metadata.type !== "fragrance_purchase") return;

  const { listingId, reservationId, buyerUid, ownerUid } = metadata;
  if (!listingId || !reservationId || !buyerUid || !ownerUid) {
    const legacyOrder = await findExistingLegacyOrder(paymentIntent.id);
    if (legacyOrder) return;

    await refundInvalidPayment(
      paymentIntent,
      reservationId,
      "missing_payment_metadata"
    );
    return;
  }

  const legacyOrder = await findExistingLegacyOrder(paymentIntent.id);
  if (legacyOrder) return;

  const deterministicOrder = await db
    .collection("orders")
    .doc(paymentIntent.id)
    .get();
  if (deterministicOrder.exists) return;

  const sellerEligibility = await getSellerEligibility(ownerUid);
  const outcome = await processSuccessfulPayment(paymentIntent, sellerEligibility);

  if (outcome.status === "refund_required") {
    await refundInvalidPayment(
      paymentIntent,
      reservationId,
      outcome.reason
    );
    return;
  }
  if (outcome.status === "already_processed") return;

  try {
    await sendPurchaseConfirmationEmails(outcome.order);
  } catch (emailError) {
    console.error("Failed to send purchase emails:", emailError);
  }
}

async function markAttempt(paymentIntent, status, { release = false } = {}) {
  const metadata = paymentIntent.metadata || {};
  const { listingId, reservationId } = metadata;
  if (metadata.type !== "fragrance_purchase" || !reservationId) return;

  const attemptRef = db.collection("payment_attempts").doc(reservationId);
  const listingRef = listingId
    ? db.collection("listings").doc(listingId)
    : null;

  await db.runTransaction(async (transaction) => {
    const attemptSnapshot = await transaction.get(attemptRef);
    const listingSnapshot = listingRef
      ? await transaction.get(listingRef)
      : null;

    transaction.set(
      attemptRef,
      {
        status,
        failureReason:
          paymentIntent.last_payment_error?.message ||
          (status === "canceled" ? "Payment canceled" : null),
        failureCode: paymentIntent.last_payment_error?.code || null,
        ...(status === "canceled"
          ? {
              buyerName: FieldValue.delete(),
              buyerEmail: FieldValue.delete(),
              buyerPhone: FieldValue.delete(),
              shippingAddress: FieldValue.delete(),
            }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (
      release &&
      listingSnapshot?.exists &&
      listingSnapshot.data()?.checkoutReservation?.id === reservationId
    ) {
      transaction.update(listingRef, {
        checkoutReservation: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (!attemptSnapshot.exists) {
      console.warn(`Payment attempt ${reservationId} was not found`);
    }
  });

  if (status === "payment_failed") {
    await db.collection("failed_payments").doc(paymentIntent.id).set(
      {
        paymentIntentId: paymentIntent.id,
        listingId: listingId || null,
        buyerUid: metadata.buyerUid || null,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        failureReason: paymentIntent.last_payment_error?.message || "Unknown",
        failureCode: paymentIntent.last_payment_error?.code || null,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: Timestamp.fromMillis(paymentIntent.created * 1000),
      },
      { merge: true }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (error) {
      console.error("Webhook signature verification failed:", error.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await markAttempt(event.data.object, "payment_failed");
        break;
      case "payment_intent.canceled":
        await markAttempt(event.data.object, "canceled", { release: true });
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}
