import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);
const endpointSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;

export async function POST(request) {
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
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log("Subscription created:", subscription.id);

  try {
    const sessions = await stripe.checkout.sessions.list({
      customer: subscription.customer,
      limit: 1,
    });

    const userUid = sessions.data[0].client_reference_id;

    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(subscription.customer);

    // Find user by email in Firebase
    const usersRef = adminDb.collection("users");
    const userQuery = await usersRef.where("email", "==", customer.email).get();

    if (userQuery.empty) {
      console.error("No user found with email:", customer.email);
      return;
    }

    const userDoc = userQuery.docs[0];
    const userId = userDoc.id;

    // 🔍 Debug: Log the subscription object
    console.log(
      "Full subscription object:",
      JSON.stringify(subscription, null, 2)
    );
    console.log(
      "current_period_end value:",
      subscription.items.data[0].current_period_end
    );
    console.log(
      "current_period_end type:",
      typeof subscription.items.data[0].current_period_end
    );

    // Check if current_period_end exists
    if (subscription.items.data[0].current_period_end) {
      console.log(
        "Period end exists:",
        subscription.items.data[0].current_period_end
      );
    } else {
      console.log("❌ Period end is null/undefined");
    }

    // Correct way to convert Stripe timestamp to Firebase Timestamp
    const subscriptionCurrentPeriodEnd = subscription.items.data[0]
      .current_period_end
      ? Timestamp.fromDate(
          new Date(subscription.items.data[0].current_period_end * 1000)
        )
      : null;

    // Update user document with subscription info
    await adminDb.collection("users").doc(userId).update({
      isPremium: true,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subscriptionCurrentPeriodEnd,
      subscriptionPriceId: subscription.items.data[0]?.price?.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Add to customer metadata where it's actually visible
    await stripe.customers.update(subscription.customer, {
      metadata: {
        firebase_uid: userUid,
      },
    });

    console.log(`Premium subscription activated for user: ${userId}`);
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);
  // Add your logic here
}

async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);
  // Add your logic here
}

async function handlePaymentSucceeded(invoice) {
  console.log("Payment succeeded:", invoice.id);
  // Add your logic here
}
