import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    const { swapRequestId, userUid, trackingNumber, messageId } =
      await request.json();

    // Validate required fields
    if (!swapRequestId || !userUid || !messageId) {
      console.error("Missing required fields", {
        swapRequestId,
        userUid,
        messageId,
      });
      return NextResponse.json({
        success: false,
        error: "Missing required fields (swapRequestId, userUid, messageId)",
      });
    }

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Get the swap request document
      const swapRequestRef = db.doc(`swap_requests/${swapRequestId}`);
      const swapRequestDoc = await transaction.get(swapRequestRef);

      if (!swapRequestDoc.exists) {
        throw new Error("Swap request not found");
      }

      const swapData = swapRequestDoc.data();

      // Validate user is part of this swap
      const isValidUser =
        swapData.offeredBy?.uid === userUid ||
        swapData.requestedFrom?.uid === userUid;

      if (!isValidUser) {
        throw new Error("User not authorized for this swap request");
      }

      // Check if swap is in correct status
      if (swapData.status !== "pending_shipment") {
        throw new Error(
          `Cannot confirm shipment. Swap status is: ${swapData.status}`
        );
      }

      // Check if user already confirmed shipment (prevent double confirmation)
      if (swapData.shipmentStatus?.[userUid]) {
        console.log(
          `User ${userUid} already confirmed shipment for swap ${swapRequestId}`
        );
        return {
          success: true,
          bothShipped:
            swapData.shipmentStatus?.[swapData.offeredBy?.uid] &&
            swapData.shipmentStatus?.[swapData.requestedFrom?.uid],
          shipmentStatus: swapData.shipmentStatus,
          alreadyConfirmed: true,
        };
      }

      // Current timestamp for confirmation
      const confirmationTimestamp = FieldValue.serverTimestamp();

      // Update shipment status
      const currentShipmentStatus = swapData.shipmentStatus || {};
      const updatedShipmentStatus = {
        ...currentShipmentStatus,
        [userUid]: true,
      };

      // Store confirmation timestamps
      const currentConfirmationTimestamps =
        swapData.confirmationTimestamps || {};
      const updatedConfirmationTimestamps = {
        ...currentConfirmationTimestamps,
        [userUid]: confirmationTimestamp,
      };

      // Prepare update data for swap request
      const swapUpdateData = {
        shipmentStatus: updatedShipmentStatus,
        confirmationTimestamps: updatedConfirmationTimestamps,
        updatedAt: confirmationTimestamp,
        lastUpdatedBy: userUid,
      };

      const swapMessageUpdateData = {
        createdAt: confirmationTimestamp,
        shipmentStatus: updatedShipmentStatus,
        confirmationTimestamps: updatedConfirmationTimestamps,
        readBy: [userUid],
        senderUid: userUid,
      };

      // Add tracking number if provided
      if (trackingNumber && trackingNumber.trim()) {
        swapUpdateData[`trackingNumbers.${userUid}`] = trackingNumber.trim();
        swapMessageUpdateData[`trackingNumbers.${userUid}`] =
          trackingNumber.trim();
      }

      // Update swap request with shipment status
      transaction.update(swapRequestRef, swapUpdateData);

      // Update the pending_shipment message to notify the other user
      const messageRef = db.doc(
        `swap_requests/${swapRequestId}/messages/${messageId}`
      );

      transaction.update(messageRef, swapMessageUpdateData);

      const otherUserUid =
        swapData.offeredBy?.uid === userUid
          ? swapData.requestedFrom?.uid
          : swapData.offeredBy?.uid;

      // Check if both users have now shipped
      const bothShipped =
        updatedShipmentStatus[userUid] && updatedShipmentStatus[otherUserUid];

      let swapCompleted = false;

      if (bothShipped) {
        // Both users have shipped - complete the swap
        transaction.update(swapRequestRef, {
          status: "swap_completed",
          completedAt: confirmationTimestamp,
        });

        // Update message type to swap_completed
        transaction.update(messageRef, {
          type: "swap_completed",
          completedAt: confirmationTimestamp,
          readBy: [userUid],
        });

        // Increment swap count for both users
        transaction.update(db.doc(`profiles/${userUid}`), {
          swapCount: FieldValue.increment(1),
        });
        transaction.update(db.doc(`profiles/${otherUserUid}`), {
          swapCount: FieldValue.increment(1),
        });

        swapCompleted = true;
        console.log(
          `Swap ${swapRequestId} completed - both users have shipped`
        );
      }

      return {
        success: true,
        bothShipped,
        swapCompleted,
        shipmentStatus: updatedShipmentStatus,
        confirmationTimestamps: updatedConfirmationTimestamps,
        newStatus: bothShipped ? "swap_completed" : "pending_shipment",
      };
    });

    console.log(
      `Shipment confirmed for profile ${userUid} in swap ${swapRequestId}`,
      result
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error handling shipment confirmation:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
