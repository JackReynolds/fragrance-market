import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const premiumWelcomeTemplateId = process.env.SENDGRID_PREMIUM_WELCOME_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";
const premiumWelcomeUrl = "https://thefragrancemarket.com/premium/welcome";
const myProfileUrl = "https://thefragrancemarket.com/my-profile";
const contactSupportUrl = "https://thefragrancemarket.com/contact";

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

function ensureConfig() {
  if (!apiKey || !premiumWelcomeTemplateId) {
    throw new Error("SendGrid premium welcome email is not configured");
  }
}

export async function sendPremiumWelcomeEmail({ email, username }) {
  ensureConfig();

  if (!email) {
    throw new Error("Missing required premium welcome email fields");
  }

  const safeUsername = username?.trim() || "there";

  await sgMail.send({
    to: email,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId: premiumWelcomeTemplateId,
    dynamicTemplateData: {
      username: safeUsername,
      premiumWelcomeUrl,
      myProfileUrl,
      contactSupportUrl,
    },
    subject: "Welcome to Premium | The Fragrance Market",
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await sendPremiumWelcomeEmail(body);

    return NextResponse.json(
      {
        message: "Premium welcome email sent successfully",
        email: body.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending premium welcome email:", error);
    return NextResponse.json(
      { error: error.message || "Unable to send premium welcome email" },
      { status: 500 }
    );
  }
}
