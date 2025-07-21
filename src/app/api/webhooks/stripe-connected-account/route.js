import { sgMail } from "@sendgrid/mail";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

const sendGridApiKey = process.env.SENDGRID_API_KEY;

// Email to item lender - stating that requirements are due
const sendRequirementsDueEmail = async (userEmail) => {
  sgMail.setApiKey(sendGridApiKey);

  const message = {
    personalizations: [
      {
        to: {
          email: userEmail,
        },
        dynamic_template_data: {},
        subject: `ACTION REQUIRED | The Fragrance Market`,
      },
    ],
    from: {
      name: "The Fragrance Market",
      email: "info@thefragrancemarket.com",
    },
    reply_to: {
      name: "The Fragrance Market",
      email: "info@thefragrancemarket.com",
    },
    template_id: "",
  };

  try {
    await sgMail.send(message);
    console.log(`Requirements due email sent to ${userEmail}`);
  } catch (error) {
    console.error("Email failed to send", error);
  }
};

// Helper function to determine status code
function determineStatusCode(account) {
  if (
    account.charges_enabled &&
    account.payouts_enabled &&
    account.requirements?.currently_due?.length === 0
  ) {
    return 1; // TRANSFERS_ENABLED
  } else if (
    account.charges_enabled &&
    account.payouts_enabled &&
    account.requirements?.currently_due?.length > 0
  ) {
    return 2; // REQUIREMENTS_DUE
  } else if (
    !account.charges_enabled &&
    !account.payouts_enabled &&
    account.requirements?.currently_due?.length > 0
  ) {
    return 3; // ONBOARDING_NOT_COMPLETE
  } else if (!account.payouts_enabled) {
    return 4; // TRANSFERS_DISABLED
  }
  return 5; // NO_STRIPE_ACCOUNT (shouldn't happen in webhook)
}

// Function to listen to Stripe webhook and update user data via Firestore
export async function POST(request) {
  console.log("Webhook received!"); // Add this for debugging

  // Fix 1: Correct header access for App Router
  const sig = request.headers.get("stripe-signature");
  let event;

  // Initialize Stripe with the secret key
  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

  // Fix 2: Correct raw body handling for App Router
  let body;
  try {
    body = await request.text(); // Get raw text body
    console.log("Body received, length:", body.length);
  } catch (error) {
    console.error("❌ Error reading request body:", error);
    return NextResponse.json(
      { error: "Error reading request body" },
      { status: 400 }
    );
  }

  // Retrieve the Stripe webhook event
  try {
    event = stripe.webhooks.constructEvent(
      body, // Use the text body
      sig,
      process.env.STRIPE_CONNECT_TEST_WEBHOOK_ENDPOINT_SECRET
    );
    console.log("Webhook signature verified, event type:", event.type);
  } catch (err) {
    console.error("Error verifying Stripe webhook:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Process the event based on its type
  if (event.type === "account.updated") {
    console.log(
      "Processing account.updated event for account:",
      event.data.object.id
    );

    const account = event.data.object;

    // Fetch the user associated with the Stripe account from Firestore
    const usersRef = db.collection("users");

    try {
      const snapshot = await usersRef
        .where("stripeAccountId", "==", account.id)
        .get();

      console.log("Users found with this Stripe account ID:", snapshot.size);

      if (!snapshot.empty) {
        const userDocRef = snapshot.docs[0].ref;
        const user = snapshot.docs[0].data();

        console.log("Account status:", {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          transfersCapability: account.capabilities?.transfers,
          currentlyDue: account.requirements?.currently_due,
          detailsSubmitted: account.details_submitted,
        });

        // Build comprehensive status object
        const stripeAccountStatus = {
          // Core capabilities
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          transfersCapability: account.capabilities?.transfers || "inactive",

          // Requirements
          currentlyDue: account.requirements?.currently_due || [],

          // Status flags
          detailsSubmitted: account.details_submitted,

          // Generate status code based on current logic
          statusCode: determineStatusCode(account),

          // Last updated
          lastUpdated: FieldValue.serverTimestamp(),

          // Action URL (can be generated when needed, but store capability info)
          needsOnboarding: account.requirements?.currently_due?.length > 0,
        };

        const updates = {
          stripeAccountStatus,
          stripeOnboardingCompleted:
            account.capabilities?.transfers === "active",
          stripeRequirementsDue:
            account.requirements?.currently_due?.length > 0,
        };

        console.log("Updating user with:", updates);

        // Send email if new requirements and onboarding was previously complete
        if (
          account.requirements?.currently_due?.length > 0 &&
          account.details_submitted &&
          user.stripeOnboardingCompleted // Was previously completed
        ) {
          console.log("Sending requirements due email to:", user.email);
          await sendRequirementsDueEmail(user.email);
        }

        await userDocRef.update(updates);
        console.log("User document updated successfully");
      } else {
        console.log("No user found with Stripe account ID:", account.id);
      }
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      return NextResponse.json(
        { error: "Error updating Firestore" },
        { status: 500 }
      );
    }
  } else {
    console.log("Unhandled event type:", event.type);
  }

  // Respond with 200 status to acknowledge receipt of the webhook
  console.log("Webhook processed successfully");
  return NextResponse.json(
    { message: "Webhook processed successfully." },
    { status: 200 }
  );
}
