import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import Stripe from "stripe";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    // Retrieve and validate request parameters
    const { uid, accountType, email } = await request.json();

    // Check if the user exists in Firestore
    const profileRef = db.collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      console.error(`Profile with UID ${uid} not found`);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let stripeAccountId = profileDoc.data().stripeAccountId;
    let username = profileDoc.data().username;

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
