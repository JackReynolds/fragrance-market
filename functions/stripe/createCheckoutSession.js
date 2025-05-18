const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const stripeTestSecretKey = defineSecret("STRIPE_TEST_SECRET_KEY");
const stripeProdSecretKey = defineSecret("STRIPE_PROD_SECRET_KEY");
let stripe;

exports.createCheckoutSession = onRequest(
  {
    cors: true,
    region: "europe-west2",
    secrets: [stripeProdSecretKey, stripeTestSecretKey],
  },
  async (req, res) => {
    // Retrieve the Stripe secret key
    const stripeSecretKey = stripeTestSecretKey.value();
    if (!stripeSecretKey) {
      console.error("Stripe secret key not set");
      return res.status(500).send("Stripe secret key not set correctly");
    }

    // Initialize the Stripe instance
    stripe = require("stripe")(stripeSecretKey);

    const { userUid, email, successUrl, cancelUrl } = req.body;

    if (!userUid || !successUrl || !cancelUrl) {
      return res.status(400).send("Missing required parameters");
    }

    try {
      // Create a Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: "price_1RPW3vGfaSbiBr8Z22Hhrx04",
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

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).send("Unable to create checkout session");
    }
  }
);
