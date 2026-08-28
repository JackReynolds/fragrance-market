import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { syncPremiumDiscordAccess } from "@/lib/premiumDiscord";
import {
  getSellerEligibility,
  getSellerEligibilityError,
} from "@/lib/sellerEligibility";

const ADMIN_UID = "LLnA54zGzgTGnGtkQSIQy9svcTJ2";
const TOGGLEABLE_LISTING_STATUSES = new Set(["active", "inactive"]);

function actionError(message, code, status = 409) {
  const error = new Error(message);
  error.code = code;
  error.httpStatus = status;
  return error;
}

function hasActiveCheckoutReservation(listing) {
  const expiresAt = listing.checkoutReservation?.expiresAt?.toMillis?.();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function POST(request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, collection, documentId, data } = await request.json();

    if (!action || !collection || !documentId) {
      return NextResponse.json(
        { error: "Missing required fields: action, collection, documentId" },
        { status: 400 }
      );
    }

    const docRef = db.collection(collection).doc(documentId);

    switch (action) {
      case "disable": {
        if (collection !== "listings") {
          return NextResponse.json(
            { error: "Disable action only supported for listings" },
            { status: 400 }
          );
        }

        await db.runTransaction(async (transaction) => {
          const listingSnapshot = await transaction.get(docRef);
          if (!listingSnapshot.exists) {
            throw actionError("Listing not found", "listing_not_found", 404);
          }

          const listing = listingSnapshot.data();
          if (!TOGGLEABLE_LISTING_STATUSES.has(listing.status)) {
            throw actionError(
              "Sold or swapped listings cannot be deactivated.",
              "listing_not_toggleable"
            );
          }

          if (listing.status === "inactive") return;

          transaction.update(docRef, {
            status: "inactive",
            disabled: FieldValue.delete(),
            disabledAt: FieldValue.delete(),
            restrictionReason: "admin_deactivated",
            restrictedAt: FieldValue.serverTimestamp(),
            lastAdminActionBy: decoded.uid,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });

        return NextResponse.json({
          success: true,
          message: "Listing deactivated successfully",
        });
      }

      case "enable": {
        if (collection !== "listings") {
          return NextResponse.json(
            { error: "Enable action only supported for listings" },
            { status: 400 }
          );
        }

        const listingSnapshot = await docRef.get();
        if (!listingSnapshot.exists) {
          throw actionError("Listing not found", "listing_not_found", 404);
        }

        const listing = listingSnapshot.data();
        if (!TOGGLEABLE_LISTING_STATUSES.has(listing.status)) {
          throw actionError(
            "Sold or swapped listings cannot be reactivated.",
            "listing_not_toggleable"
          );
        }
        if (hasActiveCheckoutReservation(listing)) {
          throw actionError(
            "This listing still has an active checkout reservation.",
            "listing_reserved"
          );
        }

        if (listing.type === "sell") {
          const eligibility = await getSellerEligibility(listing.ownerUid);
          if (!eligibility.eligible) {
            throw actionError(
              getSellerEligibilityError(eligibility.reasons),
              eligibility.reasons[0] || "seller_ineligible",
              403
            );
          }
        }

        await db.runTransaction(async (transaction) => {
          const latestSnapshot = await transaction.get(docRef);
          if (!latestSnapshot.exists) {
            throw actionError("Listing not found", "listing_not_found", 404);
          }

          const latestListing = latestSnapshot.data();
          if (!TOGGLEABLE_LISTING_STATUSES.has(latestListing.status)) {
            throw actionError(
              "Sold or swapped listings cannot be reactivated.",
              "listing_not_toggleable"
            );
          }
          if (hasActiveCheckoutReservation(latestListing)) {
            throw actionError(
              "This listing still has an active checkout reservation.",
              "listing_reserved"
            );
          }
          if (
            latestListing.type !== listing.type ||
            latestListing.ownerUid !== listing.ownerUid
          ) {
            throw actionError(
              "The listing changed while its eligibility was being checked.",
              "listing_changed"
            );
          }

          transaction.update(docRef, {
            status: "active",
            checkoutReservation: FieldValue.delete(),
            disabled: FieldValue.delete(),
            disabledAt: FieldValue.delete(),
            restrictionReason: FieldValue.delete(),
            restrictedAt: FieldValue.delete(),
            lastAdminActionBy: decoded.uid,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });

        return NextResponse.json({
          success: true,
          message: "Listing reactivated successfully",
        });
      }

      case "delete": {
        // Delete a document
        const doc = await docRef.get();
        if (!doc.exists) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 }
          );
        }
        await docRef.delete();
        return NextResponse.json({
          success: true,
          message: `${collection.slice(0, -1)} deleted successfully`,
        });
      }

      case "suspend": {
        // Suspend a user account
        if (collection !== "profiles") {
          return NextResponse.json(
            { error: "Suspend action only supported for profiles" },
            { status: 400 }
          );
        }
        await docRef.update({ suspended: true, suspendedAt: new Date() });
        return NextResponse.json({
          success: true,
          message: "User suspended successfully",
        });
      }

      case "unsuspend": {
        // Unsuspend a user account
        if (collection !== "profiles") {
          return NextResponse.json(
            { error: "Unsuspend action only supported for profiles" },
            { status: 400 }
          );
        }
        await docRef.update({ suspended: false, suspendedAt: null });
        return NextResponse.json({
          success: true,
          message: "User unsuspended successfully",
        });
      }

      case "cancel": {
        // Cancel a swap request
        if (collection !== "swap_requests") {
          return NextResponse.json(
            { error: "Cancel action only supported for swap_requests" },
            { status: 400 }
          );
        }
        await docRef.update({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: "admin",
        });
        return NextResponse.json({
          success: true,
          message: "Swap request cancelled successfully",
        });
      }

      case "update": {
        // Generic update
        if (!data || typeof data !== "object") {
          return NextResponse.json(
            { error: "Update action requires data object" },
            { status: 400 }
          );
        }
        await docRef.update(data);
        return NextResponse.json({
          success: true,
          message: "Document updated successfully",
        });
      }

      case "syncDiscordAccess": {
        if (collection !== "profiles") {
          return NextResponse.json(
            { error: "Discord sync action only supported for profiles" },
            { status: 400 }
          );
        }

        const doc = await docRef.get();
        if (!doc.exists) {
          return NextResponse.json(
            { error: "User profile not found" },
            { status: 404 }
          );
        }

        const profile = doc.data();
        if (!profile.isPremium) {
          return NextResponse.json(
            { error: "User must have an active premium subscription" },
            { status: 400 }
          );
        }

        if (!profile.discord?.userId) {
          return NextResponse.json(
            { error: "User must link their Discord account before syncing access" },
            { status: 400 }
          );
        }

        await syncPremiumDiscordAccess(documentId);

        return NextResponse.json({
          success: true,
          message: "Discord access synced successfully",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error performing admin action:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        code: error.code || "admin_action_failed",
      },
      { status: error.httpStatus || 500 }
    );
  }
}
