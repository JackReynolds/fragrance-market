import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const premiumDiscordInviteTemplateId =
  process.env.SENDGRID_PREMIUM_DISCORD_INVITE_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

function ensureConfig() {
  if (!apiKey || !premiumDiscordInviteTemplateId) {
    throw new Error(
      "SendGrid premium Discord invite email is not configured"
    );
  }
}

function formatInviteExpiry(inviteExpiresAt) {
  const date = new Date(inviteExpiresAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid Discord invite expiry date");
  }

  return date.toLocaleString("en-IE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export async function sendPremiumDiscordInviteEmail({
  email,
  username,
  discordUsername,
  inviteUrl,
  inviteExpiresAt,
}) {
  ensureConfig();

  if (!email || !inviteUrl || !inviteExpiresAt) {
    throw new Error("Missing required premium Discord invite email fields");
  }

  const safeUsername = username?.trim() || "there";
  const safeDiscordUsername = discordUsername?.trim() || "your Discord account";
  const formattedInviteExpiry = formatInviteExpiry(inviteExpiresAt);

  const message = {
    to: email,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId: premiumDiscordInviteTemplateId,
    dynamicTemplateData: {
      username: safeUsername,
      discordUsername: safeDiscordUsername,
      inviteUrl,
      inviteExpiresAt: formattedInviteExpiry,
    },
    subject: "Welcome to Premium | Your Discord Invite",
  };

  await sgMail.send(message);
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.email || !body?.inviteUrl || !body?.inviteExpiresAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await sendPremiumDiscordInviteEmail(body);

    return NextResponse.json(
      {
        message: "Premium Discord invite email sent successfully",
        email: body.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending premium Discord invite email:", error);
    return NextResponse.json(
      { error: error.message || "Unable to send premium Discord invite email" },
      { status: 500 }
    );
  }
}
