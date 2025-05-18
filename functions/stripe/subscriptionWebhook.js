const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const stripe = require("stripe");

// Define Stripe secret and SendGrid API key as Firebase secrets
const stripeTestSecretKey = defineSecret("STRIPE_TEST_SECRET_KEY");
const stripeProdSecretKey = defineSecret("STRIPE_PROD_SECRET_KEY");

const sendGridApiKey = defineSecret("SENDGRID_API_KEY");

const stripeProdEndpointSecret = defineSecret(
  "STRIPE_CONNECT_PROD_WEBHOOK_ENDPOINT_SECRET"
);
const stripeTestEndpointSecret = defineSecret(
  "STRIPE_CONNECT_TEST_WEBHOOK_ENDPOINT_SECRET"
);

// const stripeEndpointSecret = defineSecret(
//   "STRIPE_ACCOUNT_TEST_WEBHOOK_ENDPOINT_SECRET"
// );

// Firestore instance
const db = admin.firestore();

// Function to listen to Stripe webhook and update user data via Firestore
exports.subscriptionWebhook = onRequest(
  {
    cors: true,
    region: "europe-west2",
    secrets: [
      stripeProdSecretKey,
      stripeTestSecretKey,
      stripeTestEndpointSecret,
      stripeProdEndpointSecret,
      sendGridApiKey,
    ],
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    // Initialize Stripe with the secret key
    const stripeClient = stripe(stripeProdSecretKey.value());

    // Retrieve the Stripe webhook event
    try {
      event = stripeClient.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeProdEndpointSecret.value()
      );
    } catch (err) {
      console.error("Error verifying Stripe webhook:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process the event based on its type
    if (event.type === "account.updated") {
      const account = event.data.object;

      // Fetch the user associated with the Stripe account from Firestore
      const usersRef = db.collection("users");
      const snapshot = await usersRef
        .where("stripeAccountId", "==", account.id)
        .get();

      if (!snapshot.empty) {
        const userDocRef = snapshot.docs[0].ref;
        const user = snapshot.docs[0].data();

        try {
          const requirements = account.requirements;
          const updates = {};

          if (
            requirements &&
            requirements.currently_due.length > 0 &&
            account.details_submitted
          ) {
            // Send an email notification to the user for new requirements if onboarding is complete
            await sendRequirementsDueEmail(user.email);
            updates.stripeRequirementsDue = true;
            updates.stripeOnboardingCompleted = false;
            console.log(`Requirements due for user ${user.email}`);
          } else if (
            account.capabilities &&
            account.capabilities.transfers === "active"
          ) {
            // Update Firestore to mark onboarding as complete if transfers capability is active
            updates.stripeOnboardingCompleted = true;
            updates.stripeRequirementsDue = false;
            console.log(`User ${user.email} has completed onboarding`);
          }

          // Update Firestore document if there are updates to be made
          if (Object.keys(updates).length > 0) {
            await userDocRef.update(updates);
          }
        } catch (error) {
          console.error("Error updating Firestore or sending email:", error);
          return res.status(500).send("Error processing webhook");
        }
      }
    }

    // Respond with 200 status to acknowledge receipt of the webhook
    res.status(200).send("Webhook processed successfully.");
  }
);
