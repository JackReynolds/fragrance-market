import { getAuth } from "firebase-admin/auth";
import { adminApp, db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await getAuth(adminApp).verifyIdToken(
      authHeader.slice(7)
    );

    // Extract user data from request
    const { username, country, countryCode } = await request.json();
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Validate required fields
    if (!username || !email) {
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
      monthlySwapCount: 0,
      isPremium: false,
      isIdVerified: false,
      identityVerification: {
        provider: "stripe_identity",
        status: "unverified",
        verified: false,
        locked: false,
        lockReason: "",
        attemptsTotal: 0,
        nonFraudFailures: 0,
        fraudFailures: 0,
        retryCapNonFraud: 2,
        retriesRemainingNonFraud: 3,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
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
      monthlySwapCount: 0,
      isPremium: false,
      isIdVerified: false,
      identityVerification: {
        provider: "stripe_identity",
        status: "unverified",
        verified: false,
        locked: false,
        lockReason: "",
        attemptsTotal: 0,
        nonFraudFailures: 0,
        fraudFailures: 0,
        retryCapNonFraud: 2,
        retriesRemainingNonFraud: 3,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      discord: {
        userId: null,
        username: null,
        globalName: null,
        avatar: null,
        linkedAt: null,
        accessStatus: "inactive",
        lastProvisionedSubscriptionId: null,
        lastRemovedAt: null,
        lastError: null,
        refreshTokenCiphertext: null,
        tokenExpiresAt: null,
        updatedAt: null,
      },
      premiumWelcomeEmailSentAt: null,
      lastPremiumWelcomeSubscriptionId: null,
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
