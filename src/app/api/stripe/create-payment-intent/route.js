import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

export async function POST(request) {
  try {
    const {
      title,
      ownerUid,
      buyerUid,
      buyerName,
      buyerEmail,
      buyerPhone,
      amount,
      listingId,
      currency,
      shippingAddress, // CRITICAL: Capture full shipping address from checkout
    } = await request.json();

    // Validate required inputs
    if (!listingId || !buyerUid || !ownerUid || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate contact information
    if (!buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: "Buyer name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.address) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Fetch listing to validate
    const listingRef = db.collection("listings").doc(listingId);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = listingDoc.data();

    // Validate listing is still available
    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "This listing is no longer available" },
        { status: 400 }
      );
    }

    if (listing.type !== "sell") {
      return NextResponse.json(
        { error: "This listing is not for sale" },
        { status: 400 }
      );
    }

    // Prevent owner from buying own listing
    if (listing.ownerUid === buyerUid) {
      return NextResponse.json(
        { error: "You cannot purchase your own listing" },
        { status: 400 }
      );
    }

    // Fetch owner stripe account id from user's profile document
    const ownerProfileRef = db.collection("profiles").doc(ownerUid);
    const ownerProfileDoc = await ownerProfileRef.get();

    if (!ownerProfileDoc.exists) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const ownerStripeAccountId = ownerProfileDoc.data().stripeAccountId;

    if (!ownerStripeAccountId) {
      return NextResponse.json(
        { error: "Seller has not set up their payment account" },
        { status: 400 }
      );
    }

    // Generate idempotency key
    const idempotencyKey = `payment-${listingId}-${buyerUid}-${Date.now()}`;

    // Calculate platform fee (5%)
    const platformFee = Math.round(amount * 0.05);

    // Create payment intent on PLATFORM account with destination charge
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: currency?.toLowerCase() || "eur",
        description: title || `${listing.brand} - ${listing.fragrance}`,
        automatic_payment_methods: {
          enabled: true,
        },
        // Use transfer_data to send funds to connected account
        transfer_data: {
          destination: ownerStripeAccountId,
        },
        // Platform fee is kept automatically
        application_fee_amount: platformFee,
        metadata: {
          listingId,
          type: "fragrance_purchase",
          buyerUid,
          buyerName: buyerName.substring(0, 500),
          buyerEmail: buyerEmail.substring(0, 500),
          buyerPhone: buyerPhone || "",
          ownerUid,
          ownerStripeAccountId, // Store this for webhook processing
          title: listing.title.substring(0, 500),
          brand: listing.brand || "",
          fragrance: listing.fragrance || "",
          shippingAddress: JSON.stringify(shippingAddress).substring(0, 500),
        },
      },
      {
        idempotencyKey: idempotencyKey,
      }
    );

    console.log(
      `PaymentIntent created: ${paymentIntent.id}`,
      `\n   Listing: ${listingId}`,
      `\n   Buyer: ${buyerName} (${buyerEmail})`,
      `\n   Amount: ${amount / 100} ${currency?.toUpperCase()}`,
      `\n   Platform Fee: ${platformFee / 100} ${currency?.toUpperCase()}`,
      `\n   Seller receives: ${
        (amount - platformFee) / 100
      } ${currency?.toUpperCase()}`
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);

    // Provide more specific error messages
    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Unable to create payment intent" },
      { status: 500 }
    );
  }
}
