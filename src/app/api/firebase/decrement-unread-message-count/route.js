import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

// Function to remove a conversation from user's unread conversations array

export async function POST(request) {
  try {
    const { userUid, swapId } = await request.json();

    // Validate required fields
    if (!userUid || !swapId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields (userUid, swapId)",
      });
    }

    const profileRef = db.doc(`profiles/${userUid}`);

    // Check if profile exists
    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      return NextResponse.json({
        success: false,
        error: "Profile not found",
      });
    }

    const unreadConversations = profileDoc.data()?.unreadConversations || [];

    // Check if conversation is in unread array
    if (!unreadConversations.includes(swapId)) {
      return NextResponse.json({
        success: true,
        message: "Conversation already marked as read",
      });
    }

    // Remove conversation from unread array
    const updateData = {
      unreadConversations: FieldValue.arrayRemove(swapId),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await profileRef.update(updateData);

    console.log(
      `Removed conversation ${swapId} from unreadConversations for profile ${userUid}`
    );

    return NextResponse.json({
      success: true,
      message: "Conversation marked as read successfully",
    });
  } catch (error) {
    console.error("Error removing conversation from unread array:", error);

    // Handle specific Firestore errors
    if (error.code === "not-found") {
      return NextResponse.json({
        success: false,
        error: "Profile not found",
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
