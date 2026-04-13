import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { syncPremiumDiscordAccess } from "@/lib/premiumDiscord";

const ADMIN_UID = "LLnA54zGzgTGnGtkQSIQy9svcTJ2";

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
        // Disable a listing
        if (collection !== "listings") {
          return NextResponse.json(
            { error: "Disable action only supported for listings" },
            { status: 400 }
          );
        }
        await docRef.update({ disabled: true, disabledAt: new Date() });
        return NextResponse.json({
          success: true,
          message: "Listing disabled successfully",
        });
      }

      case "enable": {
        // Re-enable a listing
        if (collection !== "listings") {
          return NextResponse.json(
            { error: "Enable action only supported for listings" },
            { status: 400 }
          );
        }
        await docRef.update({ disabled: false, disabledAt: null });
        return NextResponse.json({
          success: true,
          message: "Listing enabled successfully",
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

      case "sendDiscordInvite": {
        if (collection !== "profiles") {
          return NextResponse.json(
            { error: "Discord invite action only supported for profiles" },
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
            { error: "User must link their Discord account before sending an invite" },
            { status: 400 }
          );
        }

        if (!profile.email) {
          return NextResponse.json(
            { error: "User profile is missing an email address" },
            { status: 400 }
          );
        }

        await syncPremiumDiscordAccess(documentId, {
          forceInviteEmail: true,
        });

        return NextResponse.json({
          success: true,
          message: "Discord invite email sent successfully",
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
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
