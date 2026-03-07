import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import { db } from "@/lib/firebaseAdmin";
import {
  MAX_NON_FRAUD_FAILURES,
  NON_FRAUD_RETRY_CAP,
  buildIdentityVerificationState,
  calculateRetriesRemainingNonFraud,
  isFraudSignalErrorCode,
  mergeIdentityDocuments,
  normalizeIdentityStatus,
} from "@/lib/identityVerification";

export const runtime = "nodejs";

const HANDLED_EVENT_TYPES = new Set([
  "identity.verification_session.verified",
  "identity.verification_session.requires_input",
  "identity.verification_session.processing",
  "identity.verification_session.canceled",
]);
const SENDGRID_TEMPLATE_ID = "d-ba820163b0a6491c9aa4c94fffd2ce6a";

function readSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey);
}

async function sendVerificationEmail(profileData, decision) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("Skipping verification email because SENDGRID_API_KEY is not set.");
    return;
  }

  const email = readSafeString(profileData?.email);
  if (!email) {
    console.warn("Skipping verification email because user email is missing.");
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
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
    dynamic_template_data: {
      username: readSafeString(profileData?.username) || "there",
      decision,
      isApproved: decision === "approved",
      isDeclined: decision === "declined",
      needsResubmission: decision === "resubmission_requested",
      supportEmail: "support@thefragrancemarket.com",
      dashboardUrl: "https://thefragrancemarket.com/my-profile",
      contactUrl: "https://thefragrancemarket.com/contact",
    },
  });
}

export async function POST(request) {
  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Missing STRIPE_IDENTITY_WEBHOOK_SECRET for Stripe Identity webhook verification.",
      },
      { status: 500 }
    );
  }

  const stripeClient = getStripeClient();
  if (!stripeClient) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY for Stripe Identity." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Error verifying Stripe Identity webhook:", error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  }

  const session = event?.data?.object || {};
  const sessionId = readSafeString(session?.id);
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID." }, { status: 400 });
  }

  let userUid = readSafeString(session?.metadata?.userUid);
  if (!userUid) {
    const profileQuery = await db
      .collection("profiles")
      .where("identityVerification.lastSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (!profileQuery.empty) {
      userUid = profileQuery.docs[0].id;
    }
  }

  const eventRef = db.collection("stripeIdentityWebhookEvents").doc(event.id);

  if (!userUid) {
    await eventRef.set(
      {
        eventId: event.id,
        eventType: event.type,
        sessionId,
        status: "ignored",
        reason: "missing_user_uid",
        processedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json(
      { message: "No user UID mapped to session." },
      { status: 200 }
    );
  }

  const userRef = db.collection("users").doc(userUid);
  const profileRef = db.collection("profiles").doc(userUid);
  const attemptRef = profileRef
    .collection("identityVerificationAttempts")
    .doc(sessionId);
  const sessionStatus = normalizeIdentityStatus(session?.status);
  const errorCode = readSafeString(session?.last_error?.code);
  const errorReason =
    readSafeString(session?.last_error?.reason) ||
    readSafeString(session?.last_error?.message);
  const sessionUrl = readSafeString(session?.url);

  let duplicateEvent = false;
  let emailDecision = "";
  let emailProfileData = null;

  try {
    await db.runTransaction(async (transaction) => {
      const existingEventSnap = await transaction.get(eventRef);
      if (existingEventSnap.exists) {
        duplicateEvent = true;
        return;
      }

      const [userSnap, profileSnap, attemptSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(profileRef),
        transaction.get(attemptRef),
      ]);

      if (!userSnap.exists || !profileSnap.exists) {
        transaction.set(eventRef, {
          eventId: event.id,
          eventType: event.type,
          sessionId,
          userUid,
          status: "ignored",
          reason: !userSnap.exists ? "user_not_found" : "profile_not_found",
          processedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const userData = userSnap.data() || {};
      const profileData = profileSnap.data() || {};
      const combinedData = mergeIdentityDocuments(userData, profileData);
      const state = buildIdentityVerificationState(combinedData);

      let nextStatus = sessionStatus;
      let nextVerified = state.verified;
      let nextLocked = state.locked;
      let nextLockReason = state.lockReason;
      let nextAttemptsTotal = state.attemptsTotal;
      let nextNonFraudFailures = state.nonFraudFailures;
      let nextFraudFailures = state.fraudFailures;
      let nextErrorCode = errorCode;
      let nextErrorReason = errorReason;
      let riskClassification = "none";
      let hasTerminalAttempt = false;
      let verifiedAtValue = null;

      if (event.type === "identity.verification_session.verified") {
        nextStatus = "verified";
        nextVerified = true;
        nextLocked = false;
        nextLockReason = "";
        nextErrorCode = "";
        nextErrorReason = "";
        hasTerminalAttempt = true;
        verifiedAtValue = FieldValue.serverTimestamp();
        riskClassification = "verified";
        emailDecision = "approved";
      } else if (event.type === "identity.verification_session.processing") {
        nextStatus = "processing";
      } else if (
        event.type === "identity.verification_session.requires_input" ||
        event.type === "identity.verification_session.canceled"
      ) {
        hasTerminalAttempt = true;
        nextVerified = false;

        if (!nextErrorCode && event.type === "identity.verification_session.canceled") {
          nextErrorCode = "session_canceled";
          nextErrorReason =
            nextErrorReason || "Verification session was canceled.";
        }

        if (isFraudSignalErrorCode(nextErrorCode)) {
          nextFraudFailures += 1;
          nextLocked = true;
          nextLockReason = `fraud_signal:${nextErrorCode}`;
          nextStatus = "locked";
          riskClassification = "fraud_signal";
        } else {
          nextNonFraudFailures += 1;
          riskClassification = "non_fraud";

          if (nextNonFraudFailures >= MAX_NON_FRAUD_FAILURES) {
            nextLocked = true;
            nextLockReason = "non_fraud_retry_cap_reached";
            nextStatus = "locked";
          } else {
            nextLocked = false;
            nextLockReason = "";
            nextStatus =
              event.type === "identity.verification_session.canceled"
                ? "canceled"
                : "requires_input";
          }
        }

        emailDecision = nextLocked ? "declined" : "resubmission_requested";
      }

      if (hasTerminalAttempt) {
        nextAttemptsTotal += 1;
      }

      const retriesRemainingNonFraud =
        calculateRetriesRemainingNonFraud(nextNonFraudFailures);

      const identityUpdate = {
        isIdVerified: nextVerified,
        "identityVerification.provider": "stripe_identity",
        "identityVerification.status": nextStatus,
        "identityVerification.verified": nextVerified,
        "identityVerification.locked": nextLocked,
        "identityVerification.lockReason": nextLockReason,
        "identityVerification.lastSessionId": sessionId,
        "identityVerification.lastSessionUrl":
          sessionUrl || state.lastSessionUrl || "",
        "identityVerification.lastErrorCode": nextErrorCode,
        "identityVerification.lastErrorReason": nextErrorReason,
        "identityVerification.attemptsTotal": nextAttemptsTotal,
        "identityVerification.nonFraudFailures": nextNonFraudFailures,
        "identityVerification.fraudFailures": nextFraudFailures,
        "identityVerification.retryCapNonFraud": NON_FRAUD_RETRY_CAP,
        "identityVerification.retriesRemainingNonFraud":
          retriesRemainingNonFraud,
        "identityVerification.lastEventType": event.type,
        "identityVerification.lastEventAt": FieldValue.serverTimestamp(),
        "identityVerification.updatedAt": FieldValue.serverTimestamp(),
      };

      if (verifiedAtValue) {
        identityUpdate["identityVerification.verifiedAt"] = verifiedAtValue;
      }

      transaction.update(userRef, identityUpdate);
      transaction.update(profileRef, identityUpdate);

      const attemptUpdate = {
        provider: "stripe_identity",
        sessionId,
        status: nextStatus,
        verified: nextVerified,
        locked: nextLocked,
        lockReason: nextLockReason || "",
        riskClassification,
        lastErrorCode: nextErrorCode,
        lastErrorReason: nextErrorReason,
        latestEventId: event.id,
        latestEventType: event.type,
        eventCreatedAt: event.created
          ? Timestamp.fromMillis(event.created * 1000)
          : null,
        verificationUrl: sessionUrl || state.lastSessionUrl || "",
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!attemptSnap.exists) {
        attemptUpdate.createdAt = FieldValue.serverTimestamp();
      }

      transaction.set(attemptRef, attemptUpdate, { merge: true });
      transaction.set(eventRef, {
        eventId: event.id,
        eventType: event.type,
        sessionId,
        userUid,
        status: "processed",
        processedAt: FieldValue.serverTimestamp(),
        sessionStatus,
        riskClassification,
      });

      emailProfileData = profileData;
    });
  } catch (error) {
    console.error("Error processing Stripe Identity webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  if (duplicateEvent) {
    return NextResponse.json(
      { message: "Event already processed" },
      { status: 200 }
    );
  }

  if (emailDecision && emailProfileData) {
    try {
      await sendVerificationEmail(emailProfileData, emailDecision);
    } catch (error) {
      console.error("Failed to send identity verification email:", error);
    }
  }

  return NextResponse.json(
    { message: "Webhook processed successfully" },
    { status: 200 }
  );
}
