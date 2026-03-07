import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";
import {
  MAX_NON_FRAUD_FAILURES,
  NON_FRAUD_RETRY_CAP,
  buildIdentityVerificationState,
  calculateRetriesRemainingNonFraud,
  mergeIdentityDocuments,
  normalizeIdentityStatus,
} from "@/lib/identityVerification";

export const runtime = "nodejs";

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

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userUid = readSafeString(payload?.userUid);
  if (!userUid) {
    return NextResponse.json(
      { error: "Missing required field: userUid" },
      { status: 400 }
    );
  }

  const stripeClient = getStripeClient();
  if (!stripeClient) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY for Stripe Identity." },
      { status: 500 }
    );
  }

  try {
    const userRef = db.collection("users").doc(userUid);
    const profileRef = db.collection("profiles").doc(userUid);
    const [userSnap, profileSnap] = await Promise.all([
      userRef.get(),
      profileRef.get(),
    ]);

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!profileSnap.exists) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const combinedData = mergeIdentityDocuments(
      userSnap.data() || {},
      profileSnap.data() || {}
    );
    const state = buildIdentityVerificationState(combinedData);

    if (state.verified) {
      return NextResponse.json(
        {
          error: "User is already identity verified.",
          status: "verified",
        },
        { status: 409 }
      );
    }

    if (state.locked) {
      return NextResponse.json(
        {
          error:
            "Identity verification is locked for this account. Contact support@thefragrancemarket.com.",
          status: "locked",
          lockReason: state.lockReason || "manual_or_risk_lock",
        },
        { status: 403 }
      );
    }

    if (state.nonFraudFailures >= MAX_NON_FRAUD_FAILURES) {
      const lockedUpdate = {
        isIdVerified: false,
        "identityVerification.provider": "stripe_identity",
        "identityVerification.status": "locked",
        "identityVerification.verified": false,
        "identityVerification.locked": true,
        "identityVerification.lockReason": "non_fraud_retry_cap_reached",
        "identityVerification.retryCapNonFraud": NON_FRAUD_RETRY_CAP,
        "identityVerification.retriesRemainingNonFraud":
          calculateRetriesRemainingNonFraud(state.nonFraudFailures),
        "identityVerification.updatedAt": FieldValue.serverTimestamp(),
      };

      await Promise.all([userRef.update(lockedUpdate), profileRef.update(lockedUpdate)]);

      return NextResponse.json(
        {
          error:
            "Maximum identity verification retries reached. Contact support@thefragrancemarket.com.",
          status: "locked",
          lockReason: "non_fraud_retry_cap_reached",
        },
        { status: 403 }
      );
    }

    if (state.lastSessionId) {
      try {
        const existingSession =
          await stripeClient.identity.verificationSessions.retrieve(
            state.lastSessionId
          );
        const existingStatus = normalizeIdentityStatus(existingSession?.status);
        const existingUrl = readSafeString(existingSession?.url);
        const existingSessionId = readSafeString(existingSession?.id);

        if (
          ["requires_input", "processing"].includes(existingStatus) &&
          existingUrl
        ) {
          const reuseUpdate = {
            isIdVerified: false,
            "identityVerification.provider": "stripe_identity",
            "identityVerification.status": existingStatus,
            "identityVerification.verified": false,
            "identityVerification.locked": false,
            "identityVerification.lockReason": "",
            "identityVerification.lastSessionId":
              existingSessionId || state.lastSessionId,
            "identityVerification.lastSessionUrl": existingUrl,
            "identityVerification.lastEventType":
              "identity.verification_session.reused",
            "identityVerification.lastEventAt": FieldValue.serverTimestamp(),
            "identityVerification.updatedAt": FieldValue.serverTimestamp(),
          };

          await Promise.all([userRef.update(reuseUpdate), profileRef.update(reuseUpdate)]);

          await profileRef
            .collection("identityVerificationAttempts")
            .doc(existingSessionId || state.lastSessionId)
            .set(
              {
                provider: "stripe_identity",
                sessionId: existingSessionId || state.lastSessionId,
                status: existingStatus,
                verificationUrl: existingUrl,
                latestEventType: "identity.verification_session.reused",
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

          return NextResponse.json(
            {
              verificationUrl: existingUrl,
              sessionId: existingSessionId || state.lastSessionId,
              status: existingStatus,
            },
            { status: 200 }
          );
        }
      } catch (existingSessionError) {
        console.warn(
          "Unable to reuse Stripe Identity session, creating a new one:",
          existingSessionError.message
        );
      }
    }

    const verificationSession =
      await stripeClient.identity.verificationSessions.create({
        type: "document",
        metadata: {
          userUid,
        },
        options: {
          document: {
            require_matching_selfie: true,
          },
        },
      });

    const sessionId = readSafeString(verificationSession?.id);
    const verificationUrl = readSafeString(verificationSession?.url);
    const sessionStatus = normalizeIdentityStatus(verificationSession?.status);

    if (!sessionId || !verificationUrl) {
      throw new Error("Stripe did not return a verification session URL.");
    }

    const updateData = {
      isIdVerified: false,
      "identityVerification.provider": "stripe_identity",
      "identityVerification.status": sessionStatus,
      "identityVerification.verified": false,
      "identityVerification.locked": false,
      "identityVerification.lockReason": "",
      "identityVerification.lastSessionId": sessionId,
      "identityVerification.lastSessionUrl": verificationUrl,
      "identityVerification.lastErrorCode": "",
      "identityVerification.lastErrorReason": "",
      "identityVerification.attemptsTotal": state.attemptsTotal,
      "identityVerification.nonFraudFailures": state.nonFraudFailures,
      "identityVerification.fraudFailures": state.fraudFailures,
      "identityVerification.retryCapNonFraud": NON_FRAUD_RETRY_CAP,
      "identityVerification.retriesRemainingNonFraud":
        calculateRetriesRemainingNonFraud(state.nonFraudFailures),
      "identityVerification.lastEventType":
        "identity.verification_session.created",
      "identityVerification.lastEventAt": FieldValue.serverTimestamp(),
      "identityVerification.updatedAt": FieldValue.serverTimestamp(),
    };

    await Promise.all([userRef.update(updateData), profileRef.update(updateData)]);

    await profileRef.collection("identityVerificationAttempts").doc(sessionId).set(
      {
        provider: "stripe_identity",
        sessionId,
        status: sessionStatus,
        verificationUrl,
        riskClassification: "none",
        latestEventType: "identity.verification_session.created",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        verificationUrl,
        sessionId,
        status: sessionStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating Stripe Identity verification session:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to start Stripe Identity verification right now.",
      },
      { status: 500 }
    );
  }
}
