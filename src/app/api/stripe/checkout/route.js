import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

export async function POST(request) {
  try {
    const { userUid, email, successUrl, cancelUrl, currency } =
      await request.json();

    // Validate required parameters
    if (!userUid || !successUrl || !cancelUrl) {
      return NextResponse.json(
        {
          error: "Missing required parameters: userUid, successUrl, cancelUrl",
        },
        { status: 400 }
      );
    }

    // Use provided priceId or fall back to your default
    const selectedPriceId =
      currency === "USD"
        ? "price_1RexTuGfaSbiBr8ZKlzlS9cG"
        : currency === "GBP"
        ? "price_1RexSlGfaSbiBr8ZfozqXnpN"
        : "price_1RexTRGfaSbiBr8ZOzzJMEfi";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      client_reference_id: userUid,
      metadata: {
        userUid: userUid,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}
