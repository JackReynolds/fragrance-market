import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);
  try {
    let { title, email, ownerUid, buyerUid, amount, listingId, currency } =
      await request.json();

    // Create a payment intent and automatically capture the payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      description: title,
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: "automatic",
      metadata: {
        amount: amount,
        title,
        email,
        ownerUid,
        buyerUid,
        listingId,
        currency,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Unable to create payment intent" },
      { status: 500 }
    );
  }
}
