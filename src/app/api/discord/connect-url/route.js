import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { buildDiscordAuthorizeUrl, createDiscordState } from "@/lib/discord";
import { adminApp } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    const { returnTo } = await request.json().catch(() => ({}));

    const state = createDiscordState({
      userUid: decodedToken.uid,
      returnTo,
    });
    const url = buildDiscordAuthorizeUrl({ state });

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Error creating Discord connect URL:", error);
    return NextResponse.json(
      { error: "Unable to start Discord connection" },
      { status: 500 }
    );
  }
}
