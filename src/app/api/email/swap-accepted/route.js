import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = process.env.SENDGRID_SWAP_ACCEPTED_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";

if (!apiKey || !templateId) {
  throw new Error("SendGrid API key or template ID is missing");
}

sgMail.setApiKey(apiKey);

const sendSwapAcceptedEmail = async (
  offeredByEmail,
  offeredByUsername,
  offeredListingTitle,
  requestedFromUsername,
  requestedListingTitle
) => {
  const message = {
    to: offeredByEmail,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId,
    dynamicTemplateData: {
      offeredByUsername,
      offeredListingTitle,
      requestedFromUsername,
      requestedListingTitle,
    },
    subject: "Swap Accepted | The Fragrance Market",
  };

  await sgMail.send(message);
};

export async function POST(request) {
  try {
    const {
      offeredByEmail,
      offeredByUsername,
      offeredListingTitle,
      requestedFromUsername,
      requestedListingTitle,
    } = await request.json();

    if (
      !offeredByEmail ||
      !offeredByUsername ||
      !offeredListingTitle ||
      !requestedFromUsername ||
      !requestedListingTitle
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await sendSwapAcceptedEmail(
      offeredByEmail,
      offeredByUsername,
      offeredListingTitle,
      requestedFromUsername,
      requestedListingTitle
    );

    return NextResponse.json(
      { message: "Swap accepted email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Unable to send swap accepted email" },
      { status: 500 }
    );
  }
}
