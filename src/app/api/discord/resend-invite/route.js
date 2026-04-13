import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp, db } from "@/lib/firebaseAdmin";
import { syncPremiumDiscordAccess } from "@/lib/premiumDiscord";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    const profileSnapshot = await db
      .collection("profiles")
      .doc(decodedToken.uid)
      .get();

    if (!profileSnapshot.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const profile = profileSnapshot.data();
    if (!profile.isPremium) {
      return NextResponse.json(
        { error: "Premium membership is required" },
        { status: 400 }
      );
    }

    if (!profile.discord?.userId) {
      return NextResponse.json(
        { error: "Connect your Discord account first" },
        { status: 400 }
      );
    }

    const result = await syncPremiumDiscordAccess(decodedToken.uid, {
      forceInviteEmail: true,
    });

    return NextResponse.json(
      {
        success: true,
        inviteExpiresAt: result.inviteExpiresAt || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending Discord invite:", error);
    return NextResponse.json(
      { error: error.message || "Unable to resend Discord invite" },
      { status: 500 }
    );
  }
}
