import crypto from "crypto";
import { Timestamp } from "firebase-admin/firestore";

const DISCORD_API_BASE = "https://discord.com/api/v10";
export const DISCORD_INVITE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const DISCORD_STATE_TTL_MS = 10 * 60 * 1000;

function getDiscordConfig() {
  const config = {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    botToken: process.env.DISCORD_BOT_TOKEN,
    guildId: process.env.DISCORD_GUILD_ID,
    inviteChannelId: process.env.DISCORD_INVITE_CHANNEL_ID,
    redirectUri: process.env.DISCORD_OAUTH_REDIRECT_URI,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Discord environment variables: ${missing.join(", ")}`);
  }

  return config;
}

function getDiscordTokenEncryptionKey() {
  const { clientSecret } = getDiscordConfig();
  return crypto.createHash("sha256").update(clientSecret).digest();
}

function createStateSignature(value) {
  const { clientSecret } = getDiscordConfig();
  return crypto.createHmac("sha256", clientSecret).update(value).digest("base64url");
}

function decodeBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid Discord state payload");
  }
}

function safeJsonParse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function discordFetch(path, { authType = "bot", token, ...options } = {}) {
  const { botToken } = getDiscordConfig();
  const authToken = authType === "bot" ? botToken : token;

  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization:
        authType === "bot" ? `Bot ${authToken}` : `Bearer ${authToken}`,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = safeJsonParse(text);

  if (!response.ok) {
    const error = new Error(data?.message || `Discord API request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function exchangeDiscordToken(formData) {
  const { clientId, clientSecret } = getDiscordConfig();
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      )}`,
    },
    body: new URLSearchParams(formData).toString(),
  });

  const text = await response.text();
  const data = safeJsonParse(text);

  if (!response.ok) {
    throw new Error(
      data?.error_description ||
        data?.message ||
        `Discord OAuth token exchange failed (${response.status})`
    );
  }

  return data;
}

export function createDiscordState({ userUid, returnTo = "/premium/welcome" }) {
  if (!userUid) {
    throw new Error("Missing user UID for Discord state");
  }

  const safeReturnTo =
    typeof returnTo === "string" && returnTo.startsWith("/")
      ? returnTo
      : "/premium/welcome";

  const payload = {
    userUid,
    returnTo: safeReturnTo,
    timestamp: Date.now(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createStateSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyDiscordState(state) {
  if (!state || !state.includes(".")) {
    throw new Error("Invalid Discord state");
  }

  const [encodedPayload, signature] = state.split(".");
  const expectedSignature = createStateSignature(encodedPayload);
  const providedSignatureBuffer = Buffer.from(signature || "");
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error("Discord state signature mismatch");
  }

  const payload = decodeBase64UrlJson(encodedPayload);

  if (!payload.userUid || !payload.timestamp) {
    throw new Error("Discord state is incomplete");
  }

  if (Date.now() - payload.timestamp > DISCORD_STATE_TTL_MS) {
    throw new Error("Discord state has expired");
  }

  return payload;
}

export function buildDiscordAuthorizeUrl({ state }) {
  const { clientId, redirectUri } = getDiscordConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "identify guilds.join",
    redirect_uri: redirectUri,
    prompt: "consent",
    state,
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code) {
  const { redirectUri } = getDiscordConfig();

  return exchangeDiscordToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

export async function refreshDiscordAccessToken(refreshToken) {
  return exchangeDiscordToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export async function fetchDiscordUser(accessToken) {
  return discordFetch("/users/@me", {
    authType: "bearer",
    token: accessToken,
  });
}

export async function getGuildMember(discordUserId) {
  const { guildId } = getDiscordConfig();

  try {
    return await discordFetch(`/guilds/${guildId}/members/${discordUserId}`);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function addGuildMember({ discordUserId, accessToken }) {
  const { guildId } = getDiscordConfig();

  return discordFetch(`/guilds/${guildId}/members/${discordUserId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: accessToken,
    }),
  });
}

export async function removeGuildMember(discordUserId) {
  const { guildId } = getDiscordConfig();

  try {
    await discordFetch(`/guilds/${guildId}/members/${discordUserId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error.status === 404) {
      return;
    }
    throw error;
  }
}

export async function createDiscordInvite() {
  const { inviteChannelId } = getDiscordConfig();

  return discordFetch(`/channels/${inviteChannelId}/invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      max_age: DISCORD_INVITE_MAX_AGE_SECONDS,
      max_uses: 1,
      unique: true,
    }),
  });
}

export function encryptDiscordRefreshToken(refreshToken) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getDiscordTokenEncryptionKey(),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted]
    .map((value) => value.toString("base64url"))
    .join(".");
}

export function decryptDiscordRefreshToken(ciphertext) {
  const [ivPart, authTagPart, encryptedPart] = (ciphertext || "").split(".");

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error("Invalid encrypted Discord refresh token");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getDiscordTokenEncryptionKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function getDiscordInviteExpiryTimestamp(invite) {
  if (invite?.expires_at) {
    return Timestamp.fromDate(new Date(invite.expires_at));
  }

  return Timestamp.fromDate(
    new Date(Date.now() + DISCORD_INVITE_MAX_AGE_SECONDS * 1000)
  );
}

export function getDiscordTokenExpiryTimestamp(expiresInSeconds) {
  return Timestamp.fromDate(new Date(Date.now() + expiresInSeconds * 1000));
}
