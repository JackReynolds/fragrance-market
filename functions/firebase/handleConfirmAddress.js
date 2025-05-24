// firebase function to handel the confirmation of a users address from within the swap_accepted message

const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const db = getFirestore();

exports.handleConfirmAddress = onRequest(
  { cors: true, region: "europe-west2" },
  async (req, res) => {
    try {
      const { swapRequestId, userUid, address, userRole, messageId } = req.body;

      // Validate required fields
      if (!swapRequestId || !userUid || !address || !userRole || !messageId) {
        logger.error("Missing required fields", {
          swapRequestId,
          userUid,
          address,
          userRole,
          messageId,
        });
        return res.status(400).json({
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
          logger.info(
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

        // Update the swap_accepted message with the address
        const messageRef = db.doc(
          `swap_requests/${swapRequestId}/messages/${messageId}`
        );
        transaction.update(messageRef, {
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Check if both users have confirmed
        const otherUserUid =
          swapData.offeredBy?.uid === userUid
            ? swapData.requestedFrom?.uid
            : swapData.offeredBy?.uid;

        const bothConfirmed =
          updatedConfirmations[userUid] && updatedConfirmations[otherUserUid];

        let messageUpdated = false;

        if (bothConfirmed) {
          // FIXED: Remove query, use status check instead
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
            logger.info(
              `Updated message ${messageId} to pending_shipment for swap ${swapRequestId}`
            );
          } else {
            logger.info(
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

      logger.info(
        `Address confirmed for user ${userUid} in swap ${swapRequestId}`,
        result
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error handling address confirmation:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
);
