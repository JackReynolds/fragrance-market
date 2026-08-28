import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";
import {
  mergeIdentityDocuments,
  resolveIdentityVerification,
} from "@/lib/identityVerification";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

let stripeClient;

function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

async function retrieveStripeResource(retrieve) {
  try {
    return await retrieve();
  } catch (error) {
    if (error.code === "resource_missing" || error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function getSellerEligibility(userUid, { verifyStripe = true } = {}) {
  const [userSnapshot, profileSnapshot] = await Promise.all([
    db.collection("users").doc(userUid).get(),
    db.collection("profiles").doc(userUid).get(),
  ]);

  const user = userSnapshot.exists ? userSnapshot.data() : {};
  const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
  const identity = resolveIdentityVerification(
    mergeIdentityDocuments(user, profile)
  );

  let subscriptionActive =
    Boolean(user.isPremium) &&
    Boolean(profile.isPremium) &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(profile.subscriptionStatus) &&
    Boolean(profile.stripeSubscriptionId);
  let identityVerified = identity.verified;
  let stripeAccountReady =
    profile.stripeAccountStatus?.statusCode === 1 &&
    Boolean(profile.stripeAccountId);

  if (verifyStripe && subscriptionActive) {
    const subscription = await retrieveStripeResource(() =>
      getStripeClient().subscriptions.retrieve(profile.stripeSubscriptionId)
    );
    subscriptionActive =
      subscription !== null &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
  }

  if (
    verifyStripe &&
    identityVerified &&
    identity.provider === "stripe_identity"
  ) {
    if (!identity.lastSessionId) {
      identityVerified = false;
    } else {
      const verificationSession = await retrieveStripeResource(() =>
        getStripeClient().identity.verificationSessions.retrieve(
          identity.lastSessionId
        )
      );
      identityVerified = verificationSession?.status === "verified";
    }
  }

  if (verifyStripe && stripeAccountReady) {
    const account = await retrieveStripeResource(() =>
      getStripeClient().accounts.retrieve(profile.stripeAccountId)
    );
    stripeAccountReady =
      account !== null &&
      account.deleted !== true &&
      account.charges_enabled === true &&
      account.payouts_enabled === true &&
      account.capabilities?.transfers === "active" &&
      (account.requirements?.currently_due?.length || 0) === 0;
  }

  const reasons = [];
  if (!subscriptionActive) reasons.push("active_premium_subscription_required");
  if (!identityVerified) reasons.push("identity_verification_required");
  if (!stripeAccountReady) reasons.push("stripe_account_setup_required");

  return {
    eligible: reasons.length === 0,
    reasons,
    subscriptionActive,
    identityVerified,
    stripeAccountReady,
    profile,
    user,
  };
}

export function getSellerEligibilityError(reasons = []) {
  if (reasons.includes("active_premium_subscription_required")) {
    return "An active Premium subscription is required to sell fragrances.";
  }
  if (reasons.includes("identity_verification_required")) {
    return "Identity verification is required to sell fragrances.";
  }
  if (reasons.includes("stripe_account_setup_required")) {
    return "A fully enabled Stripe seller account is required to sell fragrances.";
  }

  return "This account is not currently eligible to sell fragrances.";
}
