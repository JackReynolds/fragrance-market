import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = process.env.SENDGRID_SHIPMENT_CONFIRMED_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";

if (!apiKey || !templateId) {
  throw new Error("SendGrid API key or template ID is missing");
}

sgMail.setApiKey(apiKey);

const sendAddressConfirmedEmail = async (emailData) => {
  const {
    recipientEmail,
    recipientUsername,
    confirmingUsername,
    offeredListingTitle,
    requestedListingTitle,
    trackingNumber,
  } = emailData;

  const message = {
    to: recipientEmail,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId,
    dynamicTemplateData: {
      recipientUsername,
      confirmingUsername,
      offeredListingTitle,
      requestedListingTitle,
      trackingNumber,
    },
    subject: "Shipment Confirmed | The Fragrance Market",
  };

  await sgMail.send(message);
};

export async function POST(request) {
  try {
    const { swapRequest, confirmingUserUid, trackingNumber } =
      await request.json();

    if (!swapRequest || !confirmingUserUid) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Determine who confirmed shipment and who gets the email
    const { offeredBy, requestedFrom } = swapRequest;

    let confirmingUser, recipientUser;
    if (confirmingUserUid === offeredBy.uid) {
      confirmingUser = offeredBy;
      recipientUser = requestedFrom;
    } else {
      confirmingUser = requestedFrom;
      recipientUser = offeredBy;
    }

    // Prepare email data
    const emailData = {
      recipientEmail: recipientUser.email,
      recipientUsername: recipientUser.username,
      confirmingUsername: confirmingUser.username,
      offeredListingTitle: swapRequest.offeredListing.title,
      requestedListingTitle: swapRequest.requestedListing.title,
      trackingNumber,
    };

    await sendAddressConfirmedEmail(emailData);

    return NextResponse.json(
      {
        message: "Shipment confirmed email sent successfully",
        recipient: recipientUser.username,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Unable to send shipment confirmed email" },
      { status: 500 }
    );
  }
}
