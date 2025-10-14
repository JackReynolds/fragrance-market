import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = process.env.SENDGRID_SHIPPING_ADDRESS_CONFIRMED_TEMPLATE_ID;
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
    confirmedAddress,
    bothConfirmed,
    offeredListingTitle,
    requestedListingTitle,
  } = emailData;

  const message = {
    to: recipientEmail,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId,
    dynamicTemplateData: {
      recipientUsername,
      confirmingUsername,
      confirmedAddress,
      bothConfirmed,
      offeredListingTitle,
      requestedListingTitle,
    },
    subject: bothConfirmed
      ? "Both Addresses Confirmed - Ready to Ship! | The Fragrance Market"
      : "Shipping Address Confirmed | The Fragrance Market",
  };

  await sgMail.send(message);
};

export async function POST(request) {
  try {
    const {
      swapRequestId,
      confirmingUserUid,
      swapRequestData,
      confirmedAddress,
      bothConfirmed,
    } = await request.json();

    if (!swapRequestId || !confirmingUserUid || !swapRequestData) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Determine who confirmed address and who gets the email
    const { offeredBy, requestedFrom } = swapRequestData;

    let confirmingUser, recipientUser;
    if (confirmingUserUid === offeredBy.uid) {
      confirmingUser = offeredBy;
      recipientUser = requestedFrom;
    } else {
      confirmingUser = requestedFrom;
      recipientUser = offeredBy;
    }

    // Fetch recipient's email from profiles collection
    const { db } = await import("@/lib/firebaseAdmin");
    const recipientProfileDoc = await db
      .collection("profiles")
      .doc(recipientUser.uid)
      .get();

    if (!recipientProfileDoc.exists) {
      throw new Error("Recipient profile not found");
    }

    const recipientEmail = recipientProfileDoc.data()?.email;
    if (!recipientEmail) {
      throw new Error("Recipient email not found");
    }

    // Use the passed bothConfirmed value (calculated by server)
    const addressToShow =
      confirmedAddress ||
      confirmingUser.formattedAddress ||
      "Address not provided";

    // Prepare email data
    const emailData = {
      recipientEmail: recipientEmail,
      recipientUsername: recipientUser.username,
      confirmingUsername: confirmingUser.username,
      confirmedAddress: addressToShow,
      bothConfirmed,
      offeredListingTitle: swapRequestData.offeredListing.title,
      requestedListingTitle: swapRequestData.requestedListing.title,
    };

    await sendAddressConfirmedEmail(emailData);

    return NextResponse.json(
      {
        message: "Address confirmed email sent successfully",
        bothConfirmed,
        recipient: recipientUser.username,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Unable to send address confirmed email" },
      { status: 500 }
    );
  }
}
