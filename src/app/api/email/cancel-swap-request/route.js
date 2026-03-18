import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = process.env.SENDGRID_CANCEL_SWAP_REQUEST_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";

if (!apiKey || !templateId) {
  throw new Error("SendGrid API key or template ID is missing");
}

sgMail.setApiKey(apiKey);

const VALID_ACTION_TYPES = new Set(["declined", "cancelled"]);

const sendCancellationEmail = async (emailData) => {
  const {
    actionType,
    recipientEmail,
    recipientUsername,
    cancellingUsername,
    offeredListingTitle,
    requestedListingTitle,
    cancelMessage,
    hasCancelMessage,
  } = emailData;

  const message = {
    to: recipientEmail,
    from: fromEmail,
    templateId,
    dynamicTemplateData: {
      actionType,
      recipientUsername,
      cancellingUsername,
      offeredListingTitle,
      requestedListingTitle,
      cancelMessage,
      hasCancelMessage,
    },
    subject:
      actionType === "declined"
        ? "Swap Request Declined | The Fragrance Market"
        : "Swap Request Cancelled | The Fragrance Market",
  };
  await sgMail.send(message);
};

export async function POST(request) {
  try {
    const {
      actionType,
      recipientUid,
      recipientUsername,
      cancellingUsername,
      offeredListingTitle,
      requestedListingTitle,
      cancelMessage,
    } = await request.json();
    const trimmedCancelMessage =
      typeof cancelMessage === "string" ? cancelMessage.trim() : "";

    if (
      !VALID_ACTION_TYPES.has(actionType) ||
      !recipientUid ||
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

    // Fetch recipient's email from profiles collection
    const { db } = await import("@/lib/firebaseAdmin");
    const recipientProfileDoc = await db
      .collection("profiles")
      .doc(recipientUid)
      .get();

    if (!recipientProfileDoc.exists) {
      throw new Error("Recipient profile not found");
    }

    const recipientEmail = recipientProfileDoc.data()?.email;
    if (!recipientEmail) {
      throw new Error("Recipient email not found");
    }

    await sendCancellationEmail({
      actionType,
      recipientEmail,
      recipientUsername,
      cancellingUsername,
      offeredListingTitle,
      requestedListingTitle,
      cancelMessage: trimmedCancelMessage,
      hasCancelMessage: !!trimmedCancelMessage,
    });

    return NextResponse.json(
      { message: "Swap notification email sent successfully" },
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
