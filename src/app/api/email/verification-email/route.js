import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebaseAdmin"; // Make sure this import exists

// Define SendGrid API key as a secret
const apiKey = process.env.SENDGRID_API_KEY;

// Set your SendGrid template ID
const SENDGRID_TEMPLATE_ID = "d-382562df8096445da90da7f902d79390";

// Function to send the verification email using SendGrid
const sendVerificationEmail = async (username, email, link) => {
  // ✅ Set API key here, not as .value()
  sgMail.setApiKey(apiKey);

  const message = {
    to: email,
    from: {
      name: "The Fragrance Market",
      email: "info@thefragrancemarket.com",
    },
    reply_to: {
      name: "The Fragrance Market",
      email: "info@thefragrancemarket.com",
    },
    templateId: SENDGRID_TEMPLATE_ID,
    dynamic_template_data: {
      username,
      email,
      link,
    },
  };

  try {
    await sgMail.send(message);
    console.log("✅ Email sent to:", email);
  } catch (error) {
    console.error("❌ SendGrid error:", error);
    throw error;
  }
};

export async function POST(request) {
  console.log("🔥 Verification email API called");

  try {
    const { username, email } = await request.json();
    console.log("📝 Request data:", { username, email });

    // Validate request body
    if (!username || !email) {
      console.error("❌ Missing username or email");
      return NextResponse.json(
        { error: "Username and email are required" },
        { status: 400 }
      );
    }

    // ✅ Check environment variables
    if (!apiKey) {
      console.error("❌ SendGrid API key not set");
      return NextResponse.json(
        { error: "SendGrid API key not configured" },
        { status: 500 }
      );
    }

    console.log("🔑 SendGrid API key present:", !!apiKey);

    const actionCodeSettings = {
      url: "https://thefragrancemarket.com/action-handler", // ✅ Update to your action handler
    };

    console.log("🔗 Generating email verification link...");

    // ✅ Properly await the email verification link generation
    const auth = getAuth(adminApp);
    const link = await auth.generateEmailVerificationLink(
      email,
      actionCodeSettings
    );

    console.log("✅ Email verification link generated");

    // ✅ Send the email
    await sendVerificationEmail(username, email, link);

    console.log("✅ Verification email sent successfully");

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in verification email function:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "Failed to send verification email",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
