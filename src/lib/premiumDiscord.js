import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import {
  addGuildMember,
  decryptDiscordRefreshToken,
  encryptDiscordRefreshToken,
  fetchDiscordUser,
  getDiscordTokenExpiryTimestamp,
  getGuildMember,
  refreshDiscordAccessToken,
  removeGuildMember,
} from "@/lib/discord";

function getDiscordProfileData(profile) {
  return profile?.discord || {};
}

async function updateDiscordError(profileRef, message) {
  await profileRef.update({
    "discord.accessStatus": "error",
    "discord.lastError": message,
    "discord.updatedAt": FieldValue.serverTimestamp(),
  });
}

async function getFreshDiscordAccess(profileRef, discordData) {
  if (!discordData?.refreshTokenCiphertext) {
    throw new Error("Discord account needs to be reconnected.");
  }

  const refreshToken = decryptDiscordRefreshToken(discordData.refreshTokenCiphertext);
  const refreshedTokens = await refreshDiscordAccessToken(refreshToken);
  const refreshedUser = await fetchDiscordUser(refreshedTokens.access_token);
  const nextRefreshToken = refreshedTokens.refresh_token || refreshToken;
  const encryptedRefreshToken = encryptDiscordRefreshToken(nextRefreshToken);

  await profileRef.update({
    "discord.username": refreshedUser.username || null,
    "discord.globalName": refreshedUser.global_name || null,
    "discord.avatar": refreshedUser.avatar || null,
    "discord.refreshTokenCiphertext": encryptedRefreshToken,
    "discord.tokenExpiresAt": getDiscordTokenExpiryTimestamp(
      refreshedTokens.expires_in
    ),
    "discord.updatedAt": FieldValue.serverTimestamp(),
    "discord.lastError": null,
  });

  return refreshedTokens.access_token;
}

export async function syncPremiumDiscordAccess(userUid) {
  const profileRef = db.collection("profiles").doc(userUid);
  const profileSnapshot = await profileRef.get();

  if (!profileSnapshot.exists) {
    throw new Error(`Profile not found for user ${userUid}`);
  }

  const profile = profileSnapshot.data();
  const discordData = getDiscordProfileData(profile);

  try {
    if (!profile.isPremium) {
      if (discordData.userId) {
        await removeGuildMember(discordData.userId);
      }

      await profileRef.update({
        "discord.accessStatus": discordData.userId ? "removed" : "inactive",
        "discord.lastProvisionedSubscriptionId": null,
        "discord.lastRemovedAt": FieldValue.serverTimestamp(),
        "discord.lastError": null,
        "discord.updatedAt": FieldValue.serverTimestamp(),
      });

      return { status: discordData.userId ? "removed" : "inactive" };
    }

    if (!discordData.userId) {
      await profileRef.update({
        "discord.accessStatus": "pending_link",
        "discord.lastError": null,
        "discord.updatedAt": FieldValue.serverTimestamp(),
      });

      return { status: "pending_link" };
    }

    const existingMember = await getGuildMember(discordData.userId);

    if (
      existingMember &&
      discordData.accessStatus === "active" &&
      discordData.lastProvisionedSubscriptionId &&
      discordData.lastProvisionedSubscriptionId === profile.stripeSubscriptionId
    ) {
      await profileRef.update({
        "discord.lastError": null,
        "discord.updatedAt": FieldValue.serverTimestamp(),
      });

      return { status: "active" };
    }

    if (!existingMember) {
      const accessToken = await getFreshDiscordAccess(profileRef, discordData);
      await addGuildMember({
        discordUserId: discordData.userId,
        accessToken,
      });
    }

    await profileRef.update({
      "discord.accessStatus": "active",
      "discord.lastProvisionedSubscriptionId": profile.stripeSubscriptionId || null,
      "discord.lastError": null,
      "discord.updatedAt": FieldValue.serverTimestamp(),
    });

    return { status: "active" };
  } catch (error) {
    await updateDiscordError(profileRef, error.message);
    throw error;
  }
}
