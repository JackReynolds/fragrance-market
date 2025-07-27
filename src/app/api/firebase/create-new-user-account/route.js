import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    // Extract user data from request
    const { username, email, uid, country, countryCode } = await request.json();

    // Validate required fields
    if (!username || !email || !uid) {
      console.error("Missing required fields", { username, email, uid });
      return NextResponse.json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create user document
    const userRef = db.collection("users").doc(uid);

    await userRef.set({
      username,
      usernameLowercase: username.toLowerCase(),
      email,
      country: country || "",
      countryCode: countryCode || "",
      uid,
      swapCount: 0,
      isPremium: false,
      isIdVerified: false,
      unreadMessagesCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`Created new user account for ${uid}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user account:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create user account",
    });
  }
}
