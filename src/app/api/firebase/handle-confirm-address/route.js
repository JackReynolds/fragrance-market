import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    const { swapRequestId, userUid, address, userRole, messageId } =
      await request.json();

    // Validate required fields
    if (!swapRequestId || !userUid || !address || !userRole || !messageId) {
      console.error("Missing required fields", {
        swapRequestId,
        userUid,
        address,
        userRole,
        messageId,
      });
      return NextResponse.json({
        success: false,
        error:
          "Missing required fields (swapRequestId, userUid, address, userRole, messageId)",
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
      if (swapData.status !== "swap_accepted") {
        throw new Error(
          `Cannot confirm address. Swap status is: ${swapData.status}`
        );
      }

      // Check if user already confirmed (prevent double confirmation)
      if (swapData.addressConfirmation?.[userUid]) {
        console.log(
          `User ${userUid} already confirmed address for swap ${swapRequestId}`
        );
        return {
          success: true,
          bothConfirmed:
            swapData.addressConfirmation?.[swapData.offeredBy?.uid] &&
            swapData.addressConfirmation?.[swapData.requestedFrom?.uid],
          confirmations: swapData.addressConfirmation,
          alreadyConfirmed: true,
        };
      }

      // Update address confirmation
      const currentConfirmations = swapData.addressConfirmation || {};
      const updatedConfirmations = {
        ...currentConfirmations,
        [userUid]: true,
      };

      // Update user's address in the swap request
      const addressField =
        userRole === "offeredBy"
          ? "offeredBy.formattedAddress"
          : "requestedFrom.formattedAddress";

      // get other user uid
      const otherUserUid =
        userRole === "offeredBy"
          ? swapData.requestedFrom?.uid
          : swapData.offeredBy?.uid;

      // Update swap request with address confirmation
      transaction.update(swapRequestRef, {
        addressConfirmation: updatedConfirmations,
        [addressField]: address,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Also update user's profile with the address
      const userRef = db.doc(`users/${userUid}`);
      transaction.update(userRef, {
        formattedAddress: address,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update the swap_accepted message to notify the other user that the address has been confirmed
      const messageRef = db.doc(
        `swap_requests/${swapRequestId}/messages/${messageId}`
      );
      transaction.update(messageRef, {
        updatedAt: FieldValue.serverTimestamp(),
        addressConfirmation: updatedConfirmations,
        readBy: [userUid],
        senderUid: userUid,
      });

      // Check if both users have confirmed
      const bothConfirmed =
        updatedConfirmations[userUid] && updatedConfirmations[otherUserUid];

      let messageUpdated = false;

      if (bothConfirmed) {
        // Only proceed if status is still "swap_accepted"
        if (swapData.status === "swap_accepted") {
          // Update swap request status
          transaction.update(swapRequestRef, {
            status: "pending_shipment",
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Update the existing swap_accepted message to pending_shipment
          const messageRef = db.doc(
            `swap_requests/${swapRequestId}/messages/${messageId}`
          );

          transaction.update(messageRef, {
            type: "pending_shipment",
            createdAt: FieldValue.serverTimestamp(),
            senderUid: userUid,
            readBy: [userUid],
          });

          messageUpdated = true;
          console.log(
            `Updated message ${messageId} to pending_shipment for swap ${swapRequestId}`
          );
        } else {
          console.log(
            `Swap ${swapRequestId} status changed during transaction, skipping message update`
          );
        }
      }

      return {
        success: true,
        bothConfirmed,
        messageUpdated,
        confirmations: updatedConfirmations,
        newStatus:
          bothConfirmed && swapData.status === "swap_accepted"
            ? "pending_shipment"
            : swapData.status,
      };
    });

    console.log(
      `Address confirmed for user ${userUid} in swap ${swapRequestId}`,
      result
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error handling address confirmation:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
