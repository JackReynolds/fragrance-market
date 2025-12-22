// create-stripe-login-link.js
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { stripeAccountId, linkType } = await request.json();

  // Predefined set of valid link types
  const VALID_LINK_TYPES = ["update", "login"];

  try {
    // Retrieve the Stripe secret key from the environment
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe secret key not set");
      return NextResponse.json(
        { error: "Stripe secret key not set correctly" },
        { status: 500 }
      );
    }

    // Validate input: check if stripeAccountId is provided
    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Missing required field: stripeAccountId" },
        { status: 400 }
      );
    }

    // Ensure the provided linkType is valid
    if (linkType && !VALID_LINK_TYPES.includes(linkType)) {
      return NextResponse.json(
        { error: "Invalid linkType provided" },
        { status: 400 }
      );
    }

    // Retrieve the Stripe account to check for any outstanding requirements
    const account = await stripe.accounts.retrieve(stripeAccountId);

    let actionURL;

    // If the user has requirements currently due, create an onboarding link
    if (account.requirements.currently_due.length > 0) {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: "https://thefragrancemarket.com",
        return_url: "https://thefragrancemarket.com/my-profile",
        type: "account_onboarding",
      });
      actionURL = accountLink.url;
      console.log(`Created account onboarding link: ${actionURL}`);
    }
    // If linkType is "update" and no requirements are due, create an account update link
    else if (linkType === "update") {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: "https://thefragrancemarket.com",
        return_url: "https://thefragrancemarket.com/my-profile",
        type: "account_update",
      });
      actionURL = accountLink.url;
      console.log(`Created account update link: ${actionURL}`);
    }
    // Otherwise, create a standard login link
    else {
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
      actionURL = loginLink.url;
      console.log(`Created dashboard login link: ${actionURL}`);
    }

    // Send back the appropriate link
    return NextResponse.json({ actionURL: actionURL });
  } catch (error) {
    console.error("Error creating Stripe express dashboard link:", error);
    // Optionally, you could send a more specific error message based on error type
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
