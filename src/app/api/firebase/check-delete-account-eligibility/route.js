import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Helper to calculate earliest deletion date from recent swaps
const calculateEarliestDeletionDate = (swapsSnapshot) => {
  let mostRecentDate = null;

  swapsSnapshot.forEach((doc) => {
    const data = doc.data();
    const updatedAt = data.updatedAt?.toDate();
    if (updatedAt && (!mostRecentDate || updatedAt > mostRecentDate)) {
      mostRecentDate = updatedAt;
    }
  });

  if (mostRecentDate) {
    const earliestDate = new Date(mostRecentDate);
    earliestDate.setDate(earliestDate.getDate() + 30);
    return earliestDate.toLocaleDateString();
  }

  return null;
};

export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the token and get user ID
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userUid = decodedToken.uid;

    console.log(`Checking deletion eligibility for user: ${userUid}`);

    // Get user profile
    const profileDoc = await db.collection("profiles").doc(userUid).get();

    if (!profileDoc.exists) {
      return NextResponse.json(
        {
          eligible: false,
          blockReason: "error",
          error: "User profile not found",
        },
        { status: 404 }
      );
    }

    const profile = profileDoc.data();

    // ============================================
    // CHECK 1: Active swap requests
    // ============================================
    const activeSwapQuery = await db
      .collection("swap_requests")
      .where("participants", "array-contains", userUid)
      .where("status", "in", [
        "swap_request",
        "swap_accepted",
        "pending_shipment",
      ])
      .get();

    if (!activeSwapQuery.empty) {
      console.log(`User has ${activeSwapQuery.size} active swap(s)`);
      return NextResponse.json({
        eligible: false,
        blockReason: "active_swaps",
        count: activeSwapQuery.size,
        error: "Cannot delete account with active swap requests.",
      });
    }

    // ============================================
    // CHECK 2: Recent completed swaps (within 30 days)
    // ============================================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSwapsQuery = await db
      .collection("swap_requests")
      .where("participants", "array-contains", userUid)
      .where("status", "==", "swap_completed")
      .where("updatedAt", ">=", Timestamp.fromDate(thirtyDaysAgo))
      .get();

    if (!recentSwapsQuery.empty) {
      const earliestDate = calculateEarliestDeletionDate(recentSwapsQuery);
      console.log(`User has ${recentSwapsQuery.size} recent swap(s)`);
      return NextResponse.json({
        eligible: false,
        blockReason: "recent_swaps",
        count: recentSwapsQuery.size,
        earliestDeletionDate: earliestDate,
        error: "Cannot delete account within 30 days of completing a swap.",
      });
    }

    // ============================================
    // CHECK 3: Active listings
    // ============================================
    const activeListingsQuery = await db
      .collection("listings")
      .where("ownerUid", "==", userUid)
      .get();

    if (!activeListingsQuery.empty) {
      console.log(`User has ${activeListingsQuery.size} active listing(s)`);
      return NextResponse.json({
        eligible: false,
        blockReason: "active_listings",
        count: activeListingsQuery.size,
        error: "Please delete all your listings first.",
      });
    }

    // ============================================
    // CHECK 4: Stripe Connected Account
    // ============================================
    if (profile?.stripeConnectedAccountId) {
      console.log(`User has seller account`);
      return NextResponse.json({
        eligible: false,
        blockReason: "connected_account",
        error: "You have an active seller account. Please contact support.",
      });
    }

    // All checks passed - eligible for deletion
    console.log(`✅ User is eligible for account deletion`);
    return NextResponse.json({
      eligible: true,
      isPremium: profile?.isPremium || false,
    });
  } catch (error) {
    console.error("Error checking deletion eligibility:", error);
    return NextResponse.json(
      {
        eligible: false,
        blockReason: "error",
        error: "Failed to check eligibility. Please try again.",
      },
      { status: 500 }
    );
  }
}
