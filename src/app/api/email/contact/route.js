import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = process.env.SENDGRID_CONTACT_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";

if (!apiKey || !templateId) {
  throw new Error("SendGrid API key or template ID is missing");
}

sgMail.setApiKey(apiKey);

const sendContactEmail = async (name, email, subject, inquiryType, message) => {
  const contactMessage = {
    to: "info@thefragrancemarket.com",
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId,
    dynamicTemplateData: {
      name,
      email,
      subject,
      inquiryType,
      message,
    },
    subject: "Contact | The Fragrance Market",
  };

  await sgMail.send(contactMessage);
};

export async function POST(request) {
  try {
    const { name, email, subject, inquiryType, message } = await request.json();

    if (!name || !email || !subject || !inquiryType || !message) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await sendContactEmail(name, email, subject, inquiryType, message);

    return NextResponse.json(
      { message: "Contact email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Unable to send contact email" },
      { status: 500 }
    );
  }
}
