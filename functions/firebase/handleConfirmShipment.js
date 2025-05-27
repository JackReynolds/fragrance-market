const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const db = getFirestore();

exports.handleConfirmShipment = onRequest(
  { cors: true, region: "europe-west2" },
  async (req, res) => {
    try {
      const { swapRequestId, userUid, trackingNumber, messageId } = req.body;

      // Validate required fields
      if (!swapRequestId || !userUid || !messageId) {
        logger.error("Missing required fields", {
          swapRequestId,
          userUid,
          messageId,
        });
        return res.status(400).json({
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
          logger.info(
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

        // Update shipment status
        const currentShipmentStatus = swapData.shipmentStatus || {};
        const updatedShipmentStatus = {
          ...currentShipmentStatus,
          [userUid]: true,
        };

        // Prepare update data for swap request
        const swapUpdateData = {
          shipmentStatus: updatedShipmentStatus,
          updatedAt: FieldValue.serverTimestamp(),
          lastUpdatedBy: userUid,
        };

        const swapMessageUpdateData = {
          createdAt: FieldValue.serverTimestamp(),
          shipmentStatus: updatedShipmentStatus,
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
            completedAt: FieldValue.serverTimestamp(),
          });

          // Update message type to swap_completed
          transaction.update(messageRef, {
            type: "swap_completed",
            completedAt: FieldValue.serverTimestamp(),
            readBy: [userUid],
          });

          swapCompleted = true;
          logger.info(
            `Swap ${swapRequestId} completed - both users have shipped`
          );
        }

        return {
          success: true,
          bothShipped,
          swapCompleted,
          shipmentStatus: updatedShipmentStatus,
          newStatus: bothShipped ? "swap_completed" : "pending_shipment",
        };
      });

      logger.info(
        `Shipment confirmed for user ${userUid} in swap ${swapRequestId}`,
        result
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error handling shipment confirmation:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
);
