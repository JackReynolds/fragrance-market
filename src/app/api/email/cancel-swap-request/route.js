import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = process.env.SENDGRID_CANCEL_SWAP_REQUEST_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";

if (!apiKey || !templateId) {
  throw new Error("SendGrid API key or template ID is missing");
}

sgMail.setApiKey(apiKey);

const sendCancellationEmail = async (emailData) => {
  const {
    recipientEmail,
    recipientUsername,
    cancellingUsername,
    offeredListingTitle,
    requestedListingTitle,
    cancelMessage,
  } = emailData;

  const message = {
    to: recipientEmail,
    from: fromEmail,
    templateId,
    dynamicTemplateData: {
      recipientUsername,
      cancellingUsername,
      offeredListingTitle,
      requestedListingTitle,
      cancelMessage,
    },
    subject: "Swap Request Cancelled | The Fragrance Market",
  };
  await sgMail.send(message);
};

export async function POST(request) {
  try {
    const {
      recipientEmail,
      recipientUsername,
      cancellingUsername,
      offeredListingTitle,
      requestedListingTitle,
      cancelMessage,
    } = await request.json();

    if (
      !recipientEmail ||
      !recipientUsername ||
      !cancellingUsername ||
      !offeredListingTitle ||
      !requestedListingTitle
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await sendCancellationEmail({
      recipientEmail,
      recipientUsername,
      cancellingUsername,
      offeredListingTitle,
      requestedListingTitle,
      cancelMessage,
    });

    return NextResponse.json(
      { message: "Swap cancellation email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error);
    return NextResponse.json(
      { error: "Unable to send swap cancellation email" },
      { status: 500 }
    );
  }
}
