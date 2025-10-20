import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

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

    console.log(`Processing account deletion request for user: ${userUid}`);

    // Get user profile first
    const profileDoc = await db.collection("profiles").doc(userUid).get();

    if (!profileDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    const profile = profileDoc.data();

    // ============================================
    // GUARDRAIL 1: Check for active swap requests
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
      console.log(
        `Blocking deletion: User has ${activeSwapQuery.size} active swap(s)`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete account with active swap requests. Please cancel or complete all active swaps first.",
          blockReason: "active_swaps",
          count: activeSwapQuery.size,
        },
        { status: 400 }
      );
    }

    // ============================================
    // GUARDRAIL 2: Check for recent completed swaps (within 30 days)
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
      console.log(
        `Blocking deletion: User has ${recentSwapsQuery.size} swap(s) completed within 30 days`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete account within 30 days of completing a swap. This protects both parties from fraud.",
          blockReason: "recent_swaps",
          count: recentSwapsQuery.size,
          earliestDeletionDate: earliestDate,
        },
        { status: 400 }
      );
    }

    // ============================================
    // GUARDRAIL 3: Check for active listings
    // ============================================
    const activeListingsQuery = await db
      .collection("listings")
      .where("ownerUid", "==", userUid)
      .get();

    if (!activeListingsQuery.empty) {
      console.log(
        `Blocking deletion: User has ${activeListingsQuery.size} active listing(s)`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Please delete all your listings before deleting your account.",
          blockReason: "active_listings",
          count: activeListingsQuery.size,
        },
        { status: 400 }
      );
    }

    // ============================================
    // GUARDRAIL 4: Check for Stripe Connected Account (Seller Account)
    // ============================================
    if (profile?.stripeAccountId) {
      console.log(`Blocking deletion: User has active seller account`);
      // Check if there are pending payouts or balances
      try {
        const balance = await stripe.balance.retrieve({
          stripeAccount: profile.stripeAccountId,
        });

        const hasPendingBalance =
          balance.pending?.some((b) => b.amount > 0) ||
          balance.available?.some((b) => b.amount > 0);

        if (hasPendingBalance) {
          return NextResponse.json(
            {
              success: false,
              error:
                "You have pending payouts in your seller account. Please withdraw all funds and contact support to delete your account.",
              blockReason: "connected_account_balance",
            },
            { status: 400 }
          );
        }
      } catch (stripeError) {
        console.error("Error checking Stripe balance:", stripeError);
        // If we can't check, be safe and block
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to verify seller account status. Please contact support to delete your account.",
            blockReason: "connected_account_error",
          },
          { status: 400 }
        );
      }
    }

    // ============================================
    // STEP 1: Cancel active Stripe subscription (if exists)
    // ============================================
    if (
      profile?.stripeSubscriptionId &&
      profile?.subscriptionStatus !== "canceled"
    ) {
      try {
        console.log(`Canceling subscription: ${profile.stripeSubscriptionId}`);
        await stripe.subscriptions.cancel(profile.stripeSubscriptionId);
        console.log(`Subscription canceled successfully`);
      } catch (stripeError) {
        console.error("Error canceling subscription:", stripeError);
        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to cancel your subscription. Please try again or contact support.",
            blockReason: "subscription_cancel_error",
          },
          { status: 500 }
        );
      }
    }

    // ============================================
    // STEP 2: Delete account data from Firestore
    // ============================================
    console.log(`Deleting Firestore data for user: ${userUid}`);

    // Use batch for efficiency (max 500 operations per batch)
    const batch = db.batch();

    // Delete user document
    const userRef = db.collection("users").doc(userUid);
    batch.delete(userRef);

    // Delete profile document
    const profileRef = db.collection("profiles").doc(userUid);
    batch.delete(profileRef);

    // Mark old completed swap requests as having a deleted user
    // (Keep them for the other party's history but anonymize this user)
    const allSwapsQuery = await db
      .collection("swap_requests")
      .where("participants", "array-contains", userUid)
      .get();

    allSwapsQuery.forEach((doc) => {
      batch.update(doc.ref, {
        [`deletedUsers.${userUid}`]: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Commit the batch
    await batch.commit();
    console.log(`Firestore data deleted successfully`);

    // ============================================
    // STEP 3: Delete user from Firebase Auth
    // ============================================
    try {
      await getAuth().deleteUser(userUid);
      console.log(`Firebase Auth user deleted successfully`);
    } catch (authError) {
      console.error("Error deleting Firebase Auth user:", authError);
      // Even if auth deletion fails, Firestore data is gone
      // This is acceptable - the user can't sign in anyway
    }

    console.log(`Account deletion complete for user: ${userUid}`);

    return NextResponse.json({
      success: true,
      message: "Account successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete account. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
