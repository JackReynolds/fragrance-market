import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = process.env.SENDGRID_SWAP_REQUEST_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.ie";

if (!apiKey || !templateId) {
  throw new Error("SendGrid API key or template ID is missing");
}

sgMail.setApiKey(apiKey);

const sendSwapRequestEmail = async (
  ownerEmail,
  ownerUsername,
  ownerListingTitle,
  requesterUsername,
  requesterListingTitle
) => {
  const message = {
    to: ownerEmail,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId,
    dynamicTemplateData: {
      ownerUsername,
      ownerListingTitle,
      requesterUsername,
      requesterListingTitle,
    },
    subject: "Swap Request | The Fragrance Market",
  };

  await sgMail.send(message);
};

export async function POST(request) {
  try {
    const {
      ownerEmail,
      ownerUsername,
      ownerListingTitle,
      requesterUsername,
      requesterListingTitle,
    } = await request.json();

    if (
      !ownerEmail ||
      !ownerUsername ||
      !ownerListingTitle ||
      !requesterUsername ||
      !requesterListingTitle
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await sendSwapRequestEmail(
      ownerEmail,
      ownerUsername,
      ownerListingTitle,
      requesterUsername,
      requesterListingTitle
    );

    return NextResponse.json(
      { message: "Swap request email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Unable to send swap request email" },
      { status: 500 }
    );
  }
}
