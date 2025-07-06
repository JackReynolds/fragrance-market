import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import Stripe from "stripe";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);
  try {
    // Retrieve and validate request parameters
    const { uid, accountType, email } = await request.json();

    // Check if the user exists in Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`User with UID ${uid} not found`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeAccountId = userDoc.data().stripeAccountId;

    // If Stripe account ID doesn't exist, create a new account
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: accountType,
        business_type: "individual",
        individual: {
          first_name: userDoc.data().firstName,
          last_name: userDoc.data().lastName,
          email: email,
          phone: userDoc.data().phoneNumber,
        },
        metadata: {
          uid,
        },
        email: email,
        business_profile: {
          url: `https://thefragrancemarket.com/users/${uid}`,
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
      await userRef.update({ stripeAccountId });
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
