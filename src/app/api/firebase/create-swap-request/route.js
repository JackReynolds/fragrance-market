import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export async function POST(request) {
  try {
    const { offeredListingId, requestedListingId, requestedFromUid } =
      await request.json();

    // Get current user from auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const currentUserUid = decodedToken.uid;

    // 1️⃣ Validate: Check if both listings exist and are active
    const [offeredListingDoc, requestedListingDoc] = await Promise.all([
      db.collection("listings").doc(offeredListingId).get(),
      db.collection("listings").doc(requestedListingId).get(),
    ]);

    if (!offeredListingDoc.exists || !requestedListingDoc.exists) {
      return NextResponse.json(
        { error: "One or both listings no longer exist" },
        { status: 400 }
      );
    }

    const offeredListing = {
      id: offeredListingDoc.id,
      ...offeredListingDoc.data(),
    };
    const requestedListing = {
      id: requestedListingDoc.id,
      ...requestedListingDoc.data(),
    };

    // Validate ownership and listing types
    if (offeredListing.ownerUid !== currentUserUid) {
      return NextResponse.json(
        { error: "You don't own the offered listing" },
        { status: 403 }
      );
    }

    if (requestedListing.ownerUid !== requestedFromUid) {
      return NextResponse.json(
        { error: "Invalid target listing owner" },
        { status: 400 }
      );
    }

    if (offeredListing.type !== "swap" || offeredListing.status !== "active") {
      return NextResponse.json(
        { error: "Offered listing is not available for swap" },
        { status: 400 }
      );
    }

    if (requestedListing.status !== "active") {
      return NextResponse.json(
        { error: "Requested listing is no longer active" },
        { status: 400 }
      );
    }

    // 2️⃣ Check for existing swap requests
    const existingRequest = await db
      .collection("swap_requests")
      .where("offeredBy.uid", "==", currentUserUid)
      .where("requestedListing.id", "==", requestedListingId)
      .where("offeredListing.id", "==", offeredListingId)
      .where("status", "in", ["swap_request", "swap_accepted"])
      .get();

    if (!existingRequest.empty) {
      return NextResponse.json(
        { error: "Swap request already exists" },
        { status: 409 }
      );
    }

    // 3️⃣ Get user profiles
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      db.collection("users").doc(currentUserUid).get(),
      db.collection("users").doc(requestedFromUid).get(),
    ]);

    if (!currentUserDoc.exists || !targetUserDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    const currentUser = currentUserDoc.data();
    const targetUser = targetUserDoc.data();

    // 4️⃣ Create swap request document
    const swapRequestData = {
      offeredBy: {
        uid: currentUserUid,
        username: currentUser.username || "Unknown",
        email: currentUser.email,
        isIdVerified: currentUser.isIdVerified || false,
        isPremium: currentUser.isPremium || false,
        profilePictureURL: currentUser.profilePictureURL || "",
        rating: currentUser.rating || 0,
      },
      offeredListing: {
        id: offeredListing.id,
        title: offeredListing.title,
        brand: offeredListing.brand,
        imageURL: offeredListing.imageURLs?.[0] || "",
        fragrance: offeredListing.fragrance,
        amountLeft: offeredListing.amountLeft,
      },
      requestedFrom: {
        uid: requestedFromUid,
        username: targetUser.username || "Unknown",
        email: targetUser.email,
        isIdVerified: targetUser.isIdVerified || false,
        isPremium: targetUser.isPremium || false,
        profilePictureURL: targetUser.profilePictureURL || "",
        rating: targetUser.rating || 0,
      },
      requestedListing: {
        id: requestedListing.id,
        title: requestedListing.title,
        brand: requestedListing.brand,
        imageURL: requestedListing.imageURLs?.[0] || "",
        fragrance: requestedListing.fragrance,
        amountLeft: requestedListing.amountLeft,
      },
      status: "swap_request",
      participants: [currentUserUid, requestedFromUid],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 5️⃣ Create swap request and initial message atomically
    const batch = db.batch();

    const swapRequestRef = db.collection("swap_requests").doc();
    batch.set(swapRequestRef, swapRequestData);

    // Create initial chat message
    const messageData = {
      ...swapRequestData,
      type: "swap_request",
      readBy: [currentUserUid],
      senderUid: currentUserUid,
      receiverUid: requestedFromUid,
      swapRequestId: swapRequestRef.id,
    };

    const messageRef = db
      .collection("swap_requests")
      .doc(swapRequestRef.id)
      .collection("messages")
      .doc();
    batch.set(messageRef, messageData);

    await batch.commit();

    return NextResponse.json({
      success: true,
      swapRequestId: swapRequestRef.id,
      message: "Swap request created successfully",
    });
  } catch (error) {
    console.error("Error creating swap request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
