import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";

// Define your secrets
const veriffSignatureKey = process.env.VERIFF_SIGNATURE_KEY;
const sendGridApiKey = process.env.SENDGRID_API_KEY;

export async function POST(request) {
  try {
    // Retrieve the shared secret
    const sharedSecret = veriffSignatureKey;

    // Verify the authenticity of the request
    const isValid = isValidSignature(request, sharedSecret);

    if (!isValid) {
      console.error("Invalid signature. Unauthorized request.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the JSON payload
    const payload = JSON.parse(request.body.toString("utf8"));

    // Handle the verification result
    await handleVerificationResult(payload);

    // Respond to Veriff
    return NextResponse.json(
      { message: "Webhook received successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling Veriff webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Function to verify the request signature
function isValidSignature(request, sharedSecret) {
  // Use the correct header name as per Veriff's documentation
  const signature =
    request.headers["x-hmac-signature"] || request.headers["X-HMAC-SIGNATURE"];

  if (!signature) {
    console.error("No signature found in headers.");
    return false;
  }

  const payload = request.body;

  if (!payload) {
    console.error("No raw body found in request.");
    return false;
  }

  // Compute HMAC using 'utf8' encoding
  const hash = crypto
    .createHmac("sha256", sharedSecret)
    .update(payload, "utf8")
    .digest("hex");

  return signature === hash;
}

// Function to handle the verification result
async function handleVerificationResult(payload) {
  const { status, eventType, sessionId, vendorData, data } = payload;

  // Extract verification details
  const verification = data.verification || {};
  const { decision } = verification;

  console.log("Verification data:", verification);
  console.log("Data", data);

  // vendorData contains your custom data, such as the user's UID
  const userUid = vendorData;

  if (userUid) {
    const userRef = db.collection("users").doc(userUid);

    // Fetch existing user data
    const userSnapshot = await userRef.get();
    const existingData = userSnapshot.data() || {};
    const verificationAttempts = existingData.verificationAttempts || 0;
    const newVerificationAttempts = verificationAttempts + 1;

    // Prepare data to update using dot notation
    const updateData = {
      verificationAttempts: newVerificationAttempts,
      "veriff.status": status,
      "veriff.sessionId": sessionId,
      "veriff.eventType": eventType,
      "veriff.decision": decision || null,
      "veriff.decisionScore": verification.decisionScore || null,
      "veriff.lastVerificationDate": FieldValue.serverTimestamp(),
    };

    // Optional: Handle max verification attempts
    if (newVerificationAttempts >= 3) {
      console.warn(
        `User ${userUid} has reached the maximum number of verification attempts.`
      );
    }

    try {
      await userRef.update(updateData);

      // Determine if we should send an email based on the decision
      const emailDecisions = ["approved", "declined", "resubmission_requested"];
      if (emailDecisions.includes(decision)) {
        // Send email based on verification decision
        await sendVerificationEmail(userUid, decision);
      } else {
        console.log(`No email sent for decision: ${decision}`);
      }
    } catch (error) {
      console.error(
        `Error updating verification status for user ${userUid}:`,
        error
      );
      throw error;
    }
  } else {
    console.warn("No userUid found in vendorData");
  }
}

// Function to send verification email using SendGrid
async function sendVerificationEmail(userUid, decision) {
  // Retrieve the SendGrid API key
  const apiKey = sendGridApiKey.value();
  if (!apiKey) {
    console.error("SendGrid API key not set");
    throw new Error("SendGrid API key not set");
  }
  sgMail.setApiKey(apiKey);

  // Fetch user's email and first name from Firestore
  const userSnapshot = await db.collection("users").doc(userUid).get();
  const userData = userSnapshot.data();
  if (!userData) {
    console.error(`User data not found for user ID: ${userUid}`);
    throw new Error(`User data not found for user ID: ${userUid}`);
  }
  const email = userData.email;
  const firstName = userData.firstName || "User"; // Default to "User" if firstName is not available

  // Set SendGrid template ID
  const SENDGRID_TEMPLATE_ID = "d-ba820163b0a6491c9aa4c94fffd2ce6a";

  // Prepare dynamic template data
  const dynamicTemplateData = {
    firstName,
    decision,
    // Include any other dynamic data needed for your template
  };

  // Construct the message
  const message = {
    to: email,
    from: {
      name: "The Fragrance Market",
      email: "info@thefragrancemarket.com",
    },
    reply_to: {
      name: "The Fragrance Market",
      email: "info@thefragrancemarket.com",
    },
    templateId: SENDGRID_TEMPLATE_ID,
    dynamic_template_data: dynamicTemplateData,
  };

  try {
    await sgMail.send(message);
    console.log(
      `Verification email sent to ${email} with decision: ${decision}`
    );
  } catch (error) {
    console.error("Email failed to send:", error);
    throw error;
  }
}
