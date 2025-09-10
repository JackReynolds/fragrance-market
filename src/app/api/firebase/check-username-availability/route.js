// function to check if username is already taken

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const { username } = await request.json();

    // Validate input
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
      return NextResponse.json(
        { error: "Username cannot be empty" },
        { status: 400 }
      );
    }

    // Check for case-insensitive username availability
    // We query against usernameLowercase to ensure case-insensitive uniqueness
    const userQuery = await db
      .collection("users")
      .where("usernameLowercase", "==", trimmedUsername.toLowerCase())
      .limit(1)
      .get();

    const isAvailable = userQuery.empty;

    return NextResponse.json({
      isAvailable,
      message: isAvailable
        ? "Username is available"
        : "Username is already taken",
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
