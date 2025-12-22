import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

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

    // Prepare update data
    const subscriptionData = {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subscriptionCurrentPeriodEnd,
      subscriptionPriceId: subscription.items.data[0]?.price?.id,
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCanceledAt: null,
      subscriptionCancelAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update BOTH collections
    console.log("Updating Firebase user in both collections...");
    await Promise.all([
      // Update profiles (private - has full subscription details)
      db
        .collection("profiles")
        .doc(userUid)
        .update({
          isPremium: true,
          ...subscriptionData,
        }),
      // Update users (public - only isPremium flag for display)
      db.collection("users").doc(userUid).update({
        isPremium: true,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);

    console.log(`✅ User ${userUid} upgraded to premium in both collections`);
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
    current_period_end: subscription.items.data[0]?.current_period_end,
  });

  try {
    // Find user by subscription ID
    const profilesRef = db.collection("profiles");
    const profilesQuery = profilesRef.where(
      "stripeSubscriptionId",
      "==",
      subscription.id
    );
    const profilesSnapshot = await profilesQuery.get();

    if (profilesSnapshot.empty) {
      console.error(`No user found with subscription ID: ${subscription.id}`);
      return;
    }

    const profileDoc = profilesSnapshot.docs[0];
    const userUid = profileDoc.id;

    // Determine if user should be premium based on subscription status
    const isPremium = ["active", "trialing"].includes(subscription.status);

    // Determine if subscription is scheduled for cancellation
    const isScheduledForCancellation =
      subscription.cancel_at_period_end === true;

    // Calculate timestamps
    const subscriptionCurrentPeriodEnd = subscription.items.data[0]
      ?.current_period_end
      ? Timestamp.fromDate(
          new Date(subscription.items.data[0].current_period_end * 1000)
        )
      : null;

    const canceledAt = subscription.canceled_at
      ? Timestamp.fromDate(new Date(subscription.canceled_at * 1000))
      : null;

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

    // Prepare profile update data (detailed subscription info)
    const profileUpdateData = {
      isPremium: isPremium,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: isScheduledForCancellation,
      subscriptionCanceledAt: canceledAt,
      subscriptionCancelAt: cancelAt,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update BOTH collections
    await Promise.all([
      // Update profiles (private - full subscription details)
      profileDoc.ref.update(profileUpdateData),
      // Update users (public - only isPremium flag)
      db.collection("users").doc(userUid).update({
        isPremium: isPremium,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);

    console.log(
      `✅ Updated subscription status in both collections for user ${userUid}`
    );

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
    const profilesRef = db.collection("profiles");
    const profilesQuery = profilesRef.where(
      "stripeSubscriptionId",
      "==",
      subscription.id
    );
    const profilesSnapshot = await profilesQuery.get();

    if (profilesSnapshot.empty) {
      console.error(`No user found with subscription ID: ${subscription.id}`);
      return;
    }

    const profileDoc = profilesSnapshot.docs[0];
    const userUid = profileDoc.id;

    console.log(`Removing premium status for user ${userUid}`);

    // Prepare profile update
    const profileUpdateData = {
      isPremium: false,
      subscriptionStatus: "canceled",
      subscriptionCurrentPeriodEnd: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update BOTH collections
    await Promise.all([
      // Update profiles (private)
      profileDoc.ref.update(profileUpdateData),
      // Update users (public)
      db.collection("users").doc(userUid).update({
        isPremium: false,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);

    console.log(
      `Removed premium status in both collections for user ${userUid}`
    );
  } catch (error) {
    console.error("Error in handleSubscriptionDeleted:", error);
  }
}
