import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";

// Define your secrets
const veriffSignatureKey = process.env.VERIFF_SIGNATURE_KEY;
const sendGridApiKey = process.env.SENDGRID_API_KEY;

export async function POST(request) {
  let rawBody = "";
  let payload = null;

  try {
    // 1. Get raw body for signature verification
    rawBody = await request.text();

    // 2. Verify the authenticity of the request
    const sharedSecret = veriffSignatureKey;
    const isValid = isValidSignature(request, rawBody, sharedSecret);

    if (!isValid) {
      console.error("Invalid signature. Unauthorized request.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse the JSON payload after signature verification
    payload = JSON.parse(rawBody);
    console.log("📨 Veriff webhook received:", {
      status: payload.status,
      eventType: payload.eventType,
      sessionId: payload.sessionId,
      vendorData: payload.vendorData,
      decision: payload.data?.verification?.decision,
    });

    // 4. Handle the verification result
    await handleVerificationResult(payload);

    // 5. Respond to Veriff
    return NextResponse.json(
      { message: "Webhook received successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling Veriff webhook:", {
      error: error.message,
      stack: error.stack,
      payload: payload ? "parsed" : "failed to parse",
      rawBodyLength: rawBody.length,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Function to verify the request signature
function isValidSignature(request, rawBody, sharedSecret) {
  try {
    // Get signature from headers
    const signature =
      request.headers.get("x-hmac-signature") ||
      request.headers.get("X-HMAC-SIGNATURE");

    if (!signature) {
      console.error("No signature found in headers");
      return false;
    }

    if (!rawBody) {
      console.error("No raw body found in request");
      return false;
    }

    if (!sharedSecret) {
      console.error("No shared secret configured");
      return false;
    }

    // Compute HMAC using 'utf8' encoding
    const hash = crypto
      .createHmac("sha256", sharedSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    // Compare signatures
    const isValid = signature === hash;

    if (!isValid) {
      console.error("Signature mismatch:", {
        expected: hash,
        received: signature,
        bodyLength: rawBody.length,
      });
    }

    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

// Function to handle the verification result
async function handleVerificationResult(payload) {
  const { status, eventType, sessionId, vendorData, data } = payload;

  // Extract verification details
  const verification = data?.verification || {};
  const { decision, decisionScore, code } = verification;

  console.log("Processing verification result:", {
    userUid: vendorData,
    status,
    eventType,
    decision,
    decisionScore,
  });

  // vendorData contains your custom data, such as the user's UID
  const userUid = vendorData;

  if (!userUid) {
    console.warn("No userUid found in vendorData");
    throw new Error("No userUid found in webhook payload");
  }

  try {
    const userRef = db.collection("users").doc(userUid);

    // Fetch existing user data
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      console.error(`User not found: ${userUid}`);
      throw new Error(`User not found: ${userUid}`);
    }

    const existingData = userSnapshot.data() || {};
    const verificationAttempts = existingData.verificationAttempts || 0;
    const newVerificationAttempts = verificationAttempts + 1;

    // Determine if user is verified based on decision
    const isIdVerified = decision === "approved";

    // Prepare comprehensive update data
    const updateData = {
      verificationAttempts: newVerificationAttempts,
      isIdVerified: isIdVerified, // Boolean field used throughout the app
      "veriff.status": status,
      "veriff.sessionId": sessionId,
      "veriff.eventType": eventType,
      "veriff.decision": decision || null,
      "veriff.decisionScore": decisionScore || null,
      "veriff.lastVerificationDate": FieldValue.serverTimestamp(),
    };

    // Handle max verification attempts
    if (newVerificationAttempts >= 3) {
      console.warn(
        `User ${userUid} has reached the maximum number of verification attempts (${newVerificationAttempts})`
      );
      updateData["veriff.maxAttemptsReached"] = true;
    }

    // Update Firestore
    await userRef.update(updateData);

    console.log(`✅ User ${userUid} verification status updated:`, {
      decision,
      isIdVerified,
      attempts: newVerificationAttempts,
    });

    // 🆕 ADD THIS: Sync verification status to all user's listings
    if (decision === "approved") {
      await updateUserListingsVerificationStatus(userUid, true);
    }

    // Send email notification based on decision
    const emailDecisions = ["approved", "declined", "resubmission_requested"];
    if (emailDecisions.includes(decision)) {
      try {
        await sendVerificationEmail(userUid, decision, existingData);
        console.log(`📧 Verification email sent for decision: ${decision}`);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't throw - email failure shouldn't fail the webhook
      }
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
}

// Function to send verification email using SendGrid
async function sendVerificationEmail(userUid, decision, userData) {
  try {
    // Validate SendGrid configuration
    if (!sendGridApiKey) {
      console.error("SendGrid API key not set");
      throw new Error("SendGrid API key not configured");
    }

    sgMail.setApiKey(sendGridApiKey);

    // Get user email and name
    const email = userData.email;

    if (!email) {
      console.error(`No email found for user ID: ${userUid}`);
      throw new Error(`No email found for user ID: ${userUid}`);
    }

    // Set SendGrid template ID
    const SENDGRID_TEMPLATE_ID = "d-ba820163b0a6491c9aa4c94fffd2ce6a";

    // Prepare dynamic template data based on decision
    const dynamicTemplateData = {
      decision,
      isApproved: decision === "approved",
      isDeclined: decision === "declined",
      needsResubmission: decision === "resubmission_requested",
      supportEmail: "support@thefragrancemarket.com",
      dashboardUrl: "https://thefragrancemarket.com/my-profile",
    };

    // Construct the message
    const message = {
      to: email,
      from: {
        name: "The Fragrance Market",
        email: "info@thefragrancemarket.com",
      },
      reply_to: {
        name: "The Fragrance Market Support",
        email: "support@thefragrancemarket.com",
      },
      templateId: SENDGRID_TEMPLATE_ID,
      dynamic_template_data: dynamicTemplateData,
    };

    // Send the email
    await sgMail.send(message);
    console.log(
      `📧 Verification email sent to ${email} with decision: ${decision}`
    );
  } catch (error) {
    console.error("Failed to send verification email:", {
      error: error.message,
      userUid,
      decision,
    });
    throw error;
  }
}

// Add this function to your webhook file
async function updateUserListingsVerificationStatus(userUid, isIdVerified) {
  try {
    console.log(
      `🔄 Syncing verification status for user ${userUid}'s listings...`
    );

    // Get all listings for this user
    const listingsRef = db.collection("listings");
    const userListingsQuery = listingsRef.where("ownerUid", "==", userUid);
    const listingsSnapshot = await userListingsQuery.get();

    if (listingsSnapshot.empty) {
      console.log(`No listings found for user ${userUid}`);
      return;
    }

    // Use batch write for atomic updates
    const batch = db.batch();

    listingsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        ownerIsIdVerified: isIdVerified,
        lastSyncedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(
      `Updated ${listingsSnapshot.docs.length} listings for user ${userUid}`
    );
  } catch (error) {
    console.error(`Error updating listings for user ${userUid}:`, error);
    // Don't throw - this shouldn't fail the main webhook
  }
}
