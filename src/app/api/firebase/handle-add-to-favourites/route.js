import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function POST(request) {
  try {
    const { listingId, action } = await request.json();

    // Get current user from auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Validate action
    if (action !== "add" && action !== "remove") {
      return NextResponse.json(
        { error: "Action must be 'add' or 'remove'" },
        { status: 400 }
      );
    }

    // Check if listing exists
    const listingDoc = await db.collection("listings").doc(listingId).get();
    if (!listingDoc.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Get user's profile
    const profileRef = db.collection("profiles").doc(userId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const currentFavourites = profileDoc.data()?.favourites || [];

    let updatedFavourites;
    let message;

    if (action === "add") {
      // Add to favourites if not already there
      if (currentFavourites.includes(listingId)) {
        return NextResponse.json(
          {
            success: true,
            message: "Already in favourites",
            isFavourited: true,
          },
          { status: 200 }
        );
      }
      updatedFavourites = [...currentFavourites, listingId];
      message = "Added to favourites";
    } else {
      // Remove from favourites
      if (!currentFavourites.includes(listingId)) {
        return NextResponse.json(
          { success: true, message: "Not in favourites", isFavourited: false },
          { status: 200 }
        );
      }
      updatedFavourites = currentFavourites.filter((id) => id !== listingId);
      message = "Removed from favourites";
    }

    // Update the profile with new favourites array
    await profileRef.update({
      favourites: updatedFavourites,
    });

    return NextResponse.json(
      {
        success: true,
        message,
        isFavourited: action === "add",
        favouritesCount: updatedFavourites.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating favourites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
