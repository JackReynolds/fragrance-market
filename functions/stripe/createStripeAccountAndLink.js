const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const { FieldValue } = require("firebase-admin/firestore");

const stripeTestSecretKey = defineSecret("STRIPE_TEST_SECRET_KEY");
const stripeProdSecretKey = defineSecret("STRIPE_PROD_SECRET_KEY");

exports.createStripeAccountAndLink = onRequest(
  {
    cors: true,
    region: "europe-west2",
    secrets: [stripeProdSecretKey, stripeTestSecretKey],
  },
  async (req, res) => {
    try {
      // 1. Authenticate user
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      // 2. Validate and extract parameters
      const { uid, email, baseUrl } = req.body;

      if (decodedToken.uid !== uid) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized access",
        });
      }

      if (!uid || !email) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: uid, email",
        });
      }

      // 3. Validate inputs
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }

      // 4. Initialize Stripe with appropriate key
      const isProduction = process.env.NODE_ENV === "production";
      const stripeSecretKey = isProduction
        ? stripeProdSecretKey.value()
        : stripeTestSecretKey.value();

      if (!stripeSecretKey) {
        logger.error("Stripe secret key not configured");
        return res.status(500).json({
          success: false,
          error: "Payment system configuration error",
        });
      }

      const stripe = require("stripe")(stripeSecretKey);

      // 5. Check if user exists in Firestore
      const userRef = admin.firestore().collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        logger.error(`User not found: ${uid}`);
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const userData = userDoc.data();
      let stripeAccountId = userData.stripeAccountId;

      // 6. Create Stripe account if it doesn't exist
      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: "express",
          metadata: {
            uid,
            createdAt: FieldValue.serverTimestamp(),
          },
          email: email,
          business_profile: {
            url: `${baseUrl || "https://thefragrancemarket.com"}/users/${uid}`,
            mcc: "5999",
          },
          settings: {
            payouts: {
              schedule: {
                interval: "weekly",
                weekly_anchor: "monday",
              },
            },
          },
        });

        stripeAccountId = account.id;

        // Update user document
        await userRef.update({
          stripeAccountId,
          stripeAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Created Stripe account`, {
          uid,
          stripeAccountId,
        });
      } else {
        logger.info(`Using existing Stripe account`, {
          uid,
          stripeAccountId,
        });
      }

      // 7. Create account link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${
          baseUrl || "https://thefragrancemarket.com"
        }/my-profile?setup=stripe&refresh=true`,
        return_url: `${
          baseUrl || "https://thefragrancemarket.com"
        }/my-profile?setup=stripe&success=true`,
        type: "account_onboarding",
      });

      logger.info(`Created account link for user ${uid}`);

      return res.status(200).json({
        success: true,
        data: {
          actionURL: accountLink.url,
          stripeAccountId,
          expiresAt: accountLink.expires_at,
        },
      });
    } catch (error) {
      logger.error("Error in createStripeAccountAndLink:", {
        error: error.message,
        stack: error.stack,
        uid: req.body?.uid,
      });

      // Return appropriate error based on type
      if (error.type === "StripeInvalidRequestError") {
        return res.status(400).json({
          success: false,
          error: "Invalid request to payment provider",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Unable to create seller account. Please try again.",
      });
    }
  }
);
