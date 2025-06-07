const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const stripeTestSecretKey = defineSecret("STRIPE_TEST_SECRET_KEY");
const stripeProdSecretKey = defineSecret("STRIPE_PROD_SECRET_KEY");
const db = getFirestore();
let stripe;

exports.createBuyCheckoutSession = onRequest(
  {
    cors: true,
    region: "europe-west2",
    secrets: [stripeProdSecretKey, stripeTestSecretKey],
  },
  async (req, res) => {
    try {
      // Retrieve the Stripe secret key
      const stripeSecretKey = stripeTestSecretKey.value();
      if (!stripeSecretKey) {
        logger.error("Stripe secret key not set");
        return res.status(500).json({
          success: false,
          error: "Stripe configuration error",
        });
      }

      // Initialize the Stripe instance
      stripe = require("stripe")(stripeSecretKey);

      const { listingId, buyerUid, buyerEmail, successUrl, cancelUrl } =
        req.body;

      // Validate required parameters
      if (!listingId || !buyerUid || !successUrl || !cancelUrl) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required parameters: listingId, buyerUid, successUrl, cancelUrl",
        });
      }

      // Validate email format
      if (buyerEmail && !/\S+@\S+\.\S+/.test(buyerEmail)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }

      // Fetch and validate the listing
      const listingData = await db.runTransaction(async (transaction) => {
        const listingRef = db.doc(`listings/${listingId}`);
        const doc = await transaction.get(listingRef);

        if (!doc.exists) {
          throw new Error("Listing not found");
        }

        const data = doc.data();

        // Validate listing can be purchased
        if (data.type !== "sell") {
          throw new Error("This listing is not for sale");
        }

        if (data.status !== "active") {
          throw new Error("This listing is not active");
        }

        if (data.ownerUid === buyerUid) {
          throw new Error("You cannot buy your own listing");
        }

        if (!data.price || data.price <= 0) {
          throw new Error("Invalid listing price");
        }

        return { id: doc.id, ...data };
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `${listingData.brand} - ${listingData.fragrance}`,
                description: `${listingData.title} (${listingData.amountLeft}% full)`,
                images:
                  listingData.imageURLs?.length > 0
                    ? [listingData.imageURLs[0]]
                    : [],
                metadata: {
                  listingId: listingId,
                  brand: listingData.brand || "Unknown",
                  fragrance: listingData.fragrance || "Unknown",
                },
              },
              unit_amount: Math.round(listingData.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: buyerEmail,
        client_reference_id: buyerUid,
        shipping_address_collection: {
          allowed_countries: [
            "AC",
            "AD",
            "AE",
            "AF",
            "AG",
            "AI",
            "AL",
            "AM",
            "AO",
            "AQ",
            "AR",
            "AT",
            "AU",
            "AW",
            "AX",
            "AZ",
            "BA",
            "BB",
            "BD",
            "BE",
            "BF",
            "BG",
            "BH",
            "BI",
            "BJ",
            "BL",
            "BM",
            "BN",
            "BO",
            "BQ",
            "BR",
            "BS",
            "BT",
            "BV",
            "BW",
            "BY",
            "BZ",
            "CA",
            "CD",
            "CF",
            "CG",
            "CH",
            "CI",
            "CK",
            "CL",
            "CM",
            "CN",
            "CO",
            "CR",
            "CV",
            "CW",
            "CY",
            "CZ",
            "DE",
            "DJ",
            "DK",
            "DM",
            "DO",
            "DZ",
            "EC",
            "EE",
            "EG",
            "EH",
            "ER",
            "ES",
            "ET",
            "FI",
            "FJ",
            "FK",
            "FO",
            "FR",
            "GA",
            "GB",
            "GD",
            "GE",
            "GF",
            "GG",
            "GH",
            "GI",
            "GL",
            "GM",
            "GN",
            "GP",
            "GQ",
            "GR",
            "GS",
            "GT",
            "GU",
            "GW",
            "GY",
            "HK",
            "HN",
            "HR",
            "HT",
            "HU",
            "ID",
            "IE",
            "IL",
            "IM",
            "IN",
            "IO",
            "IQ",
            "IS",
            "IT",
            "JE",
            "JM",
            "JO",
            "JP",
            "KE",
            "KG",
            "KH",
            "KI",
            "KM",
            "KN",
            "KR",
            "KW",
            "KY",
            "KZ",
            "LA",
            "LB",
            "LC",
            "LI",
            "LK",
            "LR",
            "LS",
            "LT",
            "LU",
            "LV",
            "LY",
            "MA",
            "MC",
            "MD",
            "ME",
            "MF",
            "MG",
            "MK",
            "ML",
            "MM",
            "MN",
            "MO",
            "MQ",
            "MR",
            "MS",
            "MT",
            "MU",
            "MV",
            "MW",
            "MX",
            "MY",
            "MZ",
            "NA",
            "NC",
            "NE",
            "NG",
            "NI",
            "NL",
            "NO",
            "NP",
            "NR",
            "NU",
            "NZ",
            "OM",
            "PA",
            "PE",
            "PF",
            "PG",
            "PH",
            "PK",
            "PL",
            "PM",
            "PN",
            "PR",
            "PS",
            "PT",
            "PY",
            "QA",
            "RE",
            "RO",
            "RS",
            "RU",
            "RW",
            "SA",
            "SB",
            "SC",
            "SD",
            "SE",
            "SG",
            "SH",
            "SI",
            "SJ",
            "SK",
            "SL",
            "SM",
            "SN",
            "SO",
            "SR",
            "SS",
            "ST",
            "SV",
            "SX",
            "SZ",
            "TA",
            "TC",
            "TD",
            "TF",
            "TG",
            "TH",
            "TJ",
            "TK",
            "TL",
            "TM",
            "TN",
            "TO",
            "TR",
            "TT",
            "TV",
            "TW",
            "TZ",
            "UA",
            "UG",
            "US",
            "UY",
            "UZ",
            "VA",
            "VC",
            "VE",
            "VG",
            "VN",
            "VU",
            "WF",
            "WS",
            "XK",
            "YE",
            "YT",
            "ZA",
            "ZM",
            "ZW",
            "ZZ",
          ],
        },
        metadata: {
          type: "fragrance_purchase",
          listingId: listingId,
          buyerUid: buyerUid,
          sellerUid: listingData.ownerUid,
          price: listingData.price.toString(),
        },
        payment_intent_data: {
          metadata: {
            listingId: listingId,
            buyerUid: buyerUid,
            sellerUid: listingData.ownerUid,
          },
        },
      });

      logger.info(`Checkout session created for listing ${listingId}`, {
        sessionId: session.id,
        buyerUid,
        sellerUid: listingData.ownerUid,
        amount: listingData.price,
        currency: "EUR",
      });

      return res.status(200).json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
          amount: listingData.price,
          currency: "EUR",
        },
      });
    } catch (error) {
      logger.error("Error creating buy checkout session:", error.message, {
        listingId: req.body?.listingId,
        buyerUid: req.body?.buyerUid,
        stack: error.stack,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Unable to create checkout session",
      });
    }
  }
);
