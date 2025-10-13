import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";

// Define status codes as constants
const STATUS_CODES = {
  TRANSFERS_ENABLED: 1,
  REQUIREMENTS_DUE: 2,
  ONBOARDING_NOT_COMPLETE: 3,
  TRANSFERS_DISABLED: 4,
  NO_STRIPE_ACCOUNT: 5,
};

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

  try {
    const { uid } = await request.json();

    // Retrieve the Stripe secret key from the environment
    if (!process.env.STRIPE_TEST_SECRET_KEY) {
      console.error("Stripe secret key not set");
      return NextResponse.json(
        { error: "Stripe secret key not set correctly" },
        { status: 500 }
      );
    }

    // Initialize the Stripe instance with the secret key

    const profileRef = db.collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const stripeAccountId = profileDoc.data().stripeAccountId;

    if (!stripeAccountId) {
      return NextResponse.json(
        {
          status: STATUS_CODES.NO_STRIPE_ACCOUNT,
          message: "No Stripe account connected",
        },
        { status: 200 }
      );
    }

    // Retrieve the Stripe account to check for any outstanding requirements
    const account = await stripe.accounts.retrieve(stripeAccountId);

    let response = {
      status: "",
      message: "",
      actionURL: "",
    };

    if (
      account.charges_enabled &&
      account.payouts_enabled &&
      account.requirements.currently_due.length === 0
    ) {
      // Onboarding complete, no requirements due
      response.status = STATUS_CODES.TRANSFERS_ENABLED;
      response.message = "Onboarding complete and Stripe details up to date";
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
      response.actionURL = loginLink.url;
    } else if (
      account.charges_enabled &&
      account.payouts_enabled &&
      account.requirements.currently_due.length > 0
    ) {
      // Onboarding complete but new requirements are currently due
      response.status = STATUS_CODES.REQUIREMENTS_DUE;
      response.message =
        "Stripe requirements due. Complete these to avoid disruptions in transfers.";
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: "https://thefragrancemarket.com",
        return_url: "https://thefragrancemarket.com/my-profile",
        type: "account_onboarding",
      });
      response.actionURL = accountLink.url;
    } else if (
      !account.charges_enabled &&
      !account.payouts_enabled &&
      account.requirements.currently_due.length > 0
    ) {
      // Onboarding not complete
      response.status = STATUS_CODES.ONBOARDING_NOT_COMPLETE;
      response.message =
        "Onboarding not complete. Complete the process to enable payments.";
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: "https://thefragrancemarket.com",
        return_url: "https://thefragrancemarket.com/my-profile",
        type: "account_onboarding",
      });
      response.actionURL = accountLink.url;
    } else if (!account.payouts_enabled) {
      // Onboarding complete but transfers are disabled
      response.status = STATUS_CODES.TRANSFERS_DISABLED;
      response.message =
        "Transfers are disabled. This could be due to overdue requirements or other issues.";
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: "https://thefragrancemarket.com",
        return_url: "https://thefragrancemarket.com/my-profile",
        type: "account_onboarding",
      });
      response.actionURL = accountLink.url;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error retrieving Stripe account:", error);
    return NextResponse.json(
      { error: "Unable to retrieve Stripe account status" },
      { status: 500 }
    );
  }
}
