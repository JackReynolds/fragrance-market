import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY
);
const endpointSecret =
  process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_TEST_WEBHOOK_SECRET;

export const runtime = "nodejs";

export async function POST(request) {
  console.log("WEBHOOK HIT! Timestamp:", new Date().toISOString());

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Handling checkout.session.completed");
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        console.log("Handling customer.subscription.created");
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        console.log("Handling customer.subscription.updated");
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        console.log("Handling customer.subscription.deleted");
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("Webhook error:", error);
    console.error("Error stack:", error.stack);
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
      console.error("No client_reference_id in checkout session");
      return;
    }

    // Update Stripe customer with metadata
    await stripe.customers.update(session.customer, {
      metadata: {
        firebase_uid: userUid,
      },
    });

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    // GET CURRENT PERIOD END FROM SUBSCRIPTION ITEM
    const subscriptionCurrentPeriodEnd = subscription.items.data[0]
      ?.current_period_end
      ? Timestamp.fromDate(
          new Date(subscription.items.data[0].current_period_end * 1000)
        )
      : null;

    // Update Firebase user
    console.log("Updating Firebase user...");
    await db.collection("users").doc(userUid).update({
      isPremium: true,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subscriptionCurrentPeriodEnd,
      subscriptionPriceId: subscription.items.data[0]?.price?.id,
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCanceledAt: null,
      subscriptionCancelAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error in handleCheckoutCompleted:", error);
    console.error("Error stack:", error.stack);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log("Subscription created:", subscription.id);
  // For now, just log - main logic is in checkout.session.completed
}

async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);
  console.log("Subscription details:", {
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at,
    canceled_at: subscription.canceled_at,
    current_period_end: subscription.items.data[0]?.current_period_end, // Fixed: Get from items
  });

  try {
    // Find user by subscription ID
    const usersRef = db.collection("users");
    const userQuery = usersRef.where(
      "stripeSubscriptionId",
      "==",
      subscription.id
    );
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      console.error(`No user found with subscription ID: ${subscription.id}`);
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userUid = userDoc.id;

    // Determine if user should be premium based on subscription status
    // User remains premium if:
    // 1. Status is active or trialing
    // 2. Even if cancel_at_period_end is true, they keep premium until actual end date
    const isPremium = ["active", "trialing"].includes(subscription.status);

    // Determine if subscription is scheduled for cancellation
    const isScheduledForCancellation =
      subscription.cancel_at_period_end === true;

    // Calculate when the subscription will actually end - GET FROM SUBSCRIPTION ITEM
    const subscriptionCurrentPeriodEnd = subscription.items.data[0]
      ?.current_period_end
      ? Timestamp.fromDate(
          new Date(subscription.items.data[0].current_period_end * 1000)
        )
      : null;

    // Calculate when cancellation was requested (if applicable)
    const canceledAt = subscription.canceled_at
      ? Timestamp.fromDate(new Date(subscription.canceled_at * 1000))
      : null;

    // Calculate when cancellation will take effect (if applicable)
    const cancelAt = subscription.cancel_at
      ? Timestamp.fromDate(new Date(subscription.cancel_at * 1000))
      : null;

    console.log(
      `Updating subscription for user ${userUid}:`,
      `Status: ${subscription.status},`,
      `isPremium: ${isPremium},`,
      `scheduledForCancellation: ${isScheduledForCancellation},`,
      `cancelAt: ${cancelAt?.toDate()}`
    );

    // Update user document with comprehensive subscription info
    await userDoc.ref.update({
      isPremium: isPremium,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: isScheduledForCancellation,
      subscriptionCanceledAt: canceledAt,
      subscriptionCancelAt: cancelAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Log the action for debugging
    if (isScheduledForCancellation) {
      console.log(
        `User ${userUid} subscription is scheduled for cancellation on ${cancelAt?.toDate()}, but remains premium until then`
      );
    }
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);

  try {
    // Find user by subscription ID
    const usersRef = db.collection("users");
    const userQuery = usersRef.where(
      "stripeSubscriptionId",
      "==",
      subscription.id
    );
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      console.error(`No user found with subscription ID: ${subscription.id}`);
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userUid = userDoc.id;

    console.log(`Removing premium status for user ${userUid}`);

    // Update user document
    await userDoc.ref.update({
      isPremium: false,
      subscriptionStatus: "canceled",
      subscriptionCurrentPeriodEnd: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error in handleSubscriptionDeleted:", error);
  }
}
