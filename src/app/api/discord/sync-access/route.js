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
    const profileRef = db.collection("profiles").doc(decodedToken.uid);
    const profileSnapshot = await profileRef.get();

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

    await syncPremiumDiscordAccess(decodedToken.uid);

    const updatedProfileSnapshot = await profileRef.get();
    const updatedDiscord = updatedProfileSnapshot.data()?.discord || {};

    return NextResponse.json(
      {
        success: true,
        accessStatus: updatedDiscord.accessStatus || null,
        lastError: updatedDiscord.lastError || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error syncing Discord access:", error);
    return NextResponse.json(
      { error: error.message || "Unable to sync Discord access" },
      { status: 500 }
    );
  }
}
