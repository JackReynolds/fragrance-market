import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import {
  encryptDiscordRefreshToken,
  exchangeDiscordCode,
  fetchDiscordUser,
  getDiscordTokenExpiryTimestamp,
  verifyDiscordState,
} from "@/lib/discord";
import { syncPremiumDiscordAccess } from "@/lib/premiumDiscord";

export const runtime = "nodejs";

function buildRedirect(requestUrl, returnTo, status, message) {
  const url = new URL(returnTo || "/premium/welcome", requestUrl);
  url.searchParams.set("discord", status);

  if (message) {
    url.searchParams.set("discordMessage", message);
  }

  return NextResponse.redirect(url);
}

export async function GET(request) {
  const requestUrl = request.url;

  try {
    const { searchParams } = new URL(requestUrl);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return buildRedirect(
        requestUrl,
        "/premium/welcome",
        "error",
        "Discord authorization was cancelled."
      );
    }

    if (!code || !state) {
      return buildRedirect(
        requestUrl,
        "/premium/welcome",
        "error",
        "Missing Discord callback parameters."
      );
    }

    const statePayload = verifyDiscordState(state);
    const tokens = await exchangeDiscordCode(code);
    const discordUser = await fetchDiscordUser(tokens.access_token);

    const matchingProfiles = await db
      .collection("profiles")
      .where("discord.userId", "==", discordUser.id)
      .get();

    const conflictingProfile = matchingProfiles.docs.find(
      (doc) => doc.id !== statePayload.userUid
    );

    if (conflictingProfile) {
      return buildRedirect(
        requestUrl,
        statePayload.returnTo,
        "error",
        "That Discord account is already linked to another profile."
      );
    }

    const profileRef = db.collection("profiles").doc(statePayload.userUid);
    const profileSnapshot = await profileRef.get();

    if (!profileSnapshot.exists) {
      return buildRedirect(
        requestUrl,
        statePayload.returnTo,
        "error",
        "Your profile could not be found."
      );
    }

    const encryptedRefreshToken = tokens.refresh_token
      ? encryptDiscordRefreshToken(tokens.refresh_token)
      : null;

    await profileRef.update({
      "discord.userId": discordUser.id,
      "discord.username": discordUser.username || null,
      "discord.globalName": discordUser.global_name || null,
      "discord.avatar": discordUser.avatar || null,
      "discord.refreshTokenCiphertext": encryptedRefreshToken,
      "discord.tokenExpiresAt": getDiscordTokenExpiryTimestamp(tokens.expires_in),
      "discord.linkedAt": FieldValue.serverTimestamp(),
      "discord.accessStatus": profileSnapshot.data()?.isPremium ? "pending_sync" : "linked",
      "discord.lastError": null,
      "discord.updatedAt": FieldValue.serverTimestamp(),
    });

    if (profileSnapshot.data()?.isPremium) {
      await syncPremiumDiscordAccess(statePayload.userUid);

      return buildRedirect(
        requestUrl,
        statePayload.returnTo,
        "active",
        "Discord access is active."
      );
    }

    return buildRedirect(
      requestUrl,
      statePayload.returnTo,
      "linked",
      "Discord connected. Premium access will be provisioned when your subscription is active."
    );
  } catch (error) {
    console.error("Error handling Discord callback:", error);
    return buildRedirect(
      requestUrl,
      "/premium/welcome",
      "error",
      error.message || "Unable to complete Discord connection."
    );
  }
}
