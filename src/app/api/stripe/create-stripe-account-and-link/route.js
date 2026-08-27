import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp, db } from "@/lib/firebaseAdmin";
import Stripe from "stripe";
import {
  getSellerEligibility,
  getSellerEligibilityError,
} from "@/lib/sellerEligibility";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await getAuth(adminApp).verifyIdToken(
      authHeader.slice(7)
    );
    const uid = decodedToken.uid;
    const accountType = "express";

    // Check if the user exists in Firestore
    const profileRef = db.collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      console.error(`Profile with UID ${uid} not found`);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileDoc.data();
    const eligibility = await getSellerEligibility(uid);
    if (!eligibility.subscriptionActive || !eligibility.identityVerified) {
      return NextResponse.json(
        { error: getSellerEligibilityError(eligibility.reasons) },
        { status: 403 }
      );
    }

    let stripeAccountId = profile.stripeAccountId;
    const username = profile.username;
    const email = profile.email || decodedToken.email;

    // If Stripe account ID doesn't exist, create a new account
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: accountType,
        business_type: "individual",
        individual: {
          email: email,
        },
        metadata: {
          uid,
        },
        email: email,
        business_profile: {
          url: `https://thefragrancemarket.com/users/${username}`,
        },
        settings: {
          payouts: {
            schedule: {
              interval: "weekly",
              weekly_anchor: "friday",
            },
          },
        },
      });
      stripeAccountId = account.id;
      await profileRef.update({ stripeAccountId });
      console.log(`Created new Stripe account with ID: ${stripeAccountId}`);
    }
    // Create the account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: "https://thefragrancemarket.com",
      return_url: "https://thefragrancemarket.com/my-profile",
      type: "account_onboarding",
    });

    console.log(`Created account link: ${accountLink.url}`);

    return NextResponse.json({ actionURL: accountLink.url });
  } catch (error) {
    console.error("Error creating Stripe account and link:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while creating the Stripe account link. Please try again later.",
      },
      { status: 500 }
    );
  }
}
