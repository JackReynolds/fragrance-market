import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

// Function to decrement unread message count for a user

export async function POST(request) {
  try {
    const { userUid } = await request.json();

    // Validate required fields
    if (!userUid) {
      return NextResponse.json({
        success: false,
        error: "Missing required field (userUid)",
      });
    }

    const profileRef = db.doc(`profiles/${userUid}`);

    // Get current count to ensure we don't go below 0
    const profileDoc = await profileRef.get();
    const currentCount = profileDoc.data()?.unreadMessageCount || 0;

    if (currentCount <= 0) {
      return NextResponse.json({
        success: true,
        message: "No unread messages to decrement",
      });
    }

    // Update user document with unread message count
    const updateData = {
      unreadMessageCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await profileRef.update(updateData);

    console.log(`Unread message count decremented for profile ${userUid}`);

    return NextResponse.json({
      success: true,
      message: "Unread message count decremented successfully",
    });
  } catch (error) {
    console.error(
      "Error decrementing unread message count for profile:",
      error
    );

    // Handle specific Firestore errors
    if (error.code === "not-found") {
      return NextResponse.json({
        success: false,
        error: "Profile not found or no unread messages",
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
