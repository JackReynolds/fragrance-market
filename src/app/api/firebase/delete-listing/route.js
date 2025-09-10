import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAuth().verifyIdToken(token);
    const requesterUid = decoded.uid;

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json(
        { error: "Missing required field: listingId" },
        { status: 400 }
      );
    }

    const listingRef = db.collection("listings").doc(listingId);
    const listingSnap = await listingRef.get();

    if (!listingSnap.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = listingSnap.data();
    if (listing.ownerUid !== requesterUid) {
      return NextResponse.json(
        { error: "You do not have permission to delete this listing" },
        { status: 403 }
      );
    }

    await listingRef.delete();

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
