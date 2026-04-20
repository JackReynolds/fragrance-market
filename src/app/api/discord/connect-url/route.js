import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { buildDiscordAuthorizeUrl, createDiscordState } from "@/lib/discord";
import { adminApp, db } from "@/lib/firebaseAdmin";

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
    const profileSnapshot = await db
      .collection("profiles")
      .doc(decodedToken.uid)
      .get();

    if (!profileSnapshot.exists) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    if (!profileSnapshot.data()?.isPremium) {
      return NextResponse.json(
        { error: "Premium membership is required to connect Discord" },
        { status: 403 }
      );
    }

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
