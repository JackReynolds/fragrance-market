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
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    // Double-check username availability before creating account
    const existingUserQuery = await db
      .collection("users")
      .where("usernameLowercase", "==", trimmedUsername.toLowerCase())
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      console.error(`Username ${trimmedUsername} is already taken`);
      return NextResponse.json(
        {
          success: false,
          error: "Username is already taken",
        },
        { status: 409 }
      );
    }

    // Create user document with publicly accessible information
    const userRef = db.collection("users").doc(uid);

    await userRef.set({
      username: trimmedUsername,
      usernameLowercase: trimmedUsername.toLowerCase(),
      uid,
      swapCount: 0,
      isPremium: false,
      isIdVerified: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create profile document with all infromation (with the same uid)
    const profileRef = db.collection("profiles").doc(uid);
    await profileRef.set({
      uid,
      username: trimmedUsername,
      email,
      country: country || "",
      countryCode: countryCode || "",
      swapCount: 0,
      isPremium: false,
      isIdVerified: false,
      unreadConversations: [],
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `Created new user account for ${uid} with username ${trimmedUsername}`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user account:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user account",
      },
      { status: 500 }
    );
  }
}
