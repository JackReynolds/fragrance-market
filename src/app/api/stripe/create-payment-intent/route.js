import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

export async function POST(request) {
  try {
    const {
      title,
      email,
      ownerUid,
      buyerUid,
      buyerName,
      amount,
      listingId,
      currency,
      shippingAddress,
    } = await request.json();

    // Validate inputs
    if (!listingId || !buyerUid || !ownerUid || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
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

    // Prepare shipping address for metadata (Stripe has character limits)
    const shippingAddressString = JSON.stringify({
      formattedAddress: shippingAddress.formattedAddress,
      components: shippingAddress.addressComponents,
    });

    // Create payment intent with shipping address in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency?.toLowerCase() || "eur",
      description: title || `${listing.brand} - ${listing.fragrance}`,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listingId,
        buyerUid,
        buyerName: buyerName || "Unknown",
        buyerEmail: email || "",
        ownerUid,
        title: listing.title,
        brand: listing.brand,
        fragrance: listing.fragrance,
        type: "fragrance_purchase",
        // Store shipping address (note: metadata has 500 char limit per value)
        shippingAddress: shippingAddressString.substring(0, 500),
      },
      shipping: {
        name: buyerName || "Customer",
        address: {
          line1:
            shippingAddress.addressComponents?.streetAddress ||
            `${shippingAddress.addressComponents?.streetNumber || ""} ${
              shippingAddress.addressComponents?.streetName || ""
            }`.trim(),
          city: shippingAddress.addressComponents?.city || "",
          state: shippingAddress.addressComponents?.state || "",
          postal_code: shippingAddress.addressComponents?.postalCode || "",
          country:
            shippingAddress.addressComponents?.countryCode ||
            shippingAddress.addressComponents?.country ||
            "",
        },
      },
    });

    console.log(
      `✅ PaymentIntent created: ${paymentIntent.id} for listing ${listingId} with shipping address`
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Unable to create payment intent" },
      { status: 500 }
    );
  }
}
