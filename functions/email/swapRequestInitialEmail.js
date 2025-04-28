const sgMail = require("@sendgrid/mail");
const { defineSecret } = require("firebase-functions/params");
const apiKey = defineSecret("SENDGRID_API_KEY");

import {
  onDocumentWritten,
  Change,
  FirestoreEvent,
} from "firebase-functions/v2/firestore";

const { onDocumentCreated } = require("firebase-functions/v2/firestore");

const sendSwapRequestInitialEmail = async () => {
  sgMail.setApiKey(apiKey.value());

  const message = {
    personalizations: [
      {
        to: {
          email: lenderEmail,
        },
        from: {
          name: "KitShare",
          email: "info@kitshare.ie",
        },
        dynamic_template_data: {
          firstName,
          requestMessage,
          renterUsername,
          listingTitle,
          earnings: (earningsCents / 100).toFixed(2),
          duration,
          startDate,
          endDate,
        },
        subject: `KitShare | Availability request for ${listingTitle}`,
      },
    ],
    from: {
      name: "KitShare",
      email: "info@kitshare.ie",
    },
    reply_to: {
      name: "KitShare",
      email: "info@kitshare.ie",
    },
    template_id: "d-d6e8013af925419393c97cfa95e832a3",
  };

  try {
    await sgMail.send(message);
    console.log("Email sent");
  } catch (error) {
    console.error("Email failed to send", error);
    throw error; // Propagate the error
  }
};

// Specify the region directly in the function declaration
exports.swapRequestInitialEmail = onDocumentCreated(
  {
    document: "swap-requests/{swapRequestId}",
    region: "europe-west2",
    secrets: [sendGridApiKey],
  },
  async (event) => {
    const swapRequestData = event.data.data(); // Get the newly created document data
    const {} = swapRequestData;

    const sendGridAPIKey = apiKey.value();
    if (!sendGridAPIKey) {
      console.error("SendGrid API key not set");
      return res.status(400).send("SendGrid API key not set correctly");
    }

    try {
      await sendAvailabilityRequestEmail(
        firstName,
        lenderEmail,
        requestMessage,
        renterUsername,
        listingTitle,
        earningsCents,
        duration,
        startDate,
        endDate
      );
      res.status(200).send({ message: "success" });
    } catch (error) {
      console.error("Error processing availability request email:", error);
      res.status(500).send({ error: error.message });
    }
  }
);
