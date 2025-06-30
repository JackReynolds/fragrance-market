import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);
const endpointSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;

export async function POST(request) {
  console.log("🔥 WEBHOOK HIT! Timestamp:", new Date().toISOString());

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        console.log("🎯 Handling checkout.session.completed");
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        console.log("🎯 Handling customer.subscription.created");
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        console.log("🎯 Handling customer.subscription.updated");
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        console.log("🎯 Handling customer.subscription.deleted");
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("💥 Webhook error:", error);
    console.error("💥 Error stack:", error.stack);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session) {
  try {
    // Only handle subscription checkouts
    if (session.mode !== "subscription") {
      return;
    }

    const userUid = session.client_reference_id;

    if (!userUid) {
      console.error("❌ No client_reference_id in checkout session");
      return;
    }

    // Update Stripe customer with metadata
    await stripe.customers.update(session.customer, {
      metadata: {
        firebase_uid: userUid,
        subscription_created: new Date().toISOString(),
      },
    });

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    const subscriptionCurrentPeriodEnd = subscription.items.data[0]
      .current_period_end
      ? Timestamp.fromDate(
          new Date(subscription.items.data[0].current_period_end * 1000)
        )
      : null;

    // Update Firebase user
    console.log("📝 Updating Firebase user...");
    await adminDb.collection("users").doc(userUid).update({
      isPremium: true,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subscriptionCurrentPeriodEnd,
      subscriptionPriceId: subscription.items.data[0]?.price?.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("❌ Error in handleCheckoutCompleted:", error);
    console.error("❌ Error stack:", error.stack);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log("📝 Subscription created:", subscription.id);
  // For now, just log - main logic is in checkout.session.completed
}

async function handleSubscriptionUpdated(subscription) {
  console.log("📝 Subscription updated:", subscription.id);
}

async function handleSubscriptionDeleted(subscription) {
  console.log("🗑️ Subscription deleted:", subscription.id);
}
