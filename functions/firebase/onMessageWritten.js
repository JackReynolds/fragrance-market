const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.onMessageWritten = onDocumentWritten(
  {
    document: "swap_requests/{swapId}/messages/{msgId}",
    region: "europe-west2",
  },
  async (event) => {
    try {
      const beforeData = event.data.before?.data();
      const afterData = event.data.after.data();
      const { swapId, msgId } = event.params;

      // Skip if document was deleted
      if (!afterData) {
        logger.info(`Message ${msgId} was deleted, skipping`);
        return;
      }

      // Skip hidden messages
      if (afterData.hidden) {
        logger.info(`Message ${msgId} is hidden, skipping counter update`);
        return;
      }

      // Only proceed if there's a sender
      if (!afterData.senderUid) {
        logger.warn(`Message ${msgId} has no sender, skipping counter update`);
        return;
      }

      const isNewDocument = !beforeData;
      const isTypeChange = beforeData && beforeData.type !== afterData.type;
      const isReadByOnlyChange =
        beforeData &&
        JSON.stringify({ ...beforeData, readBy: null }) ===
          JSON.stringify({ ...afterData, readBy: null });

      // Skip if this is just a readBy update with no other changes
      if (!isNewDocument && isReadByOnlyChange && !isTypeChange) {
        logger.info(
          `Message ${msgId} only readBy changed, skipping counter update`
        );
        return;
      }

      // For updates, only process meaningful changes
      if (!isNewDocument && !isTypeChange) {
        logger.info(
          `Message ${msgId} updated but no significant changes, skipping`
        );
        return;
      }

      logger.info(`Processing message ${msgId} in swap ${swapId}`, {
        isNewDocument,
        isTypeChange,
        type: afterData.type,
        senderUid: afterData.senderUid,
      });

      const db = getFirestore();

      // Fetch the swap request to get participants
      const swapSnapshot = await db.doc(`swap_requests/${swapId}`).get();
      if (!swapSnapshot.exists) {
        logger.warn(`Swap request ${swapId} not found`);
        return;
      }

      const swapData = swapSnapshot.data();

      // Get participants
      let participants = swapData.participants || [];
      if (
        participants.length === 0 &&
        swapData.offeredBy?.uid &&
        swapData.requestedFrom?.uid
      ) {
        participants = [swapData.offeredBy.uid, swapData.requestedFrom.uid];
      }

      // Find recipients (not the sender)
      const recipients = participants.filter(
        (uid) => uid !== afterData.senderUid
      );

      if (recipients.length === 0) {
        logger.info(`No recipients found for message ${msgId}`);
        return;
      }

      // Check read status and presence for each recipient
      const batch = db.batch();
      const readBy = afterData.readBy || [];

      for (const recipientUid of recipients) {
        // Skip if already read
        if (readBy.includes(recipientUid)) {
          logger.info(
            `Recipient ${recipientUid} already read message ${msgId}`
          );
          continue;
        }

        // Check if user is currently active in this conversation (optional presence check)
        const presenceRef = db.doc(
          `swap_requests/${swapId}/presence/${recipientUid}`
        );
        try {
          const presenceSnap = await presenceRef.get();
          if (presenceSnap.exists) {
            const presenceData = presenceSnap.data();
            if (presenceData.active && presenceData.lastActive) {
              const now = new Date();
              const lastActive = presenceData.lastActive.toDate();
              const timeDiff = now - lastActive;

              // If user was active in the last 30 seconds, don't increment counter
              if (timeDiff < 30000) {
                logger.info(
                  `Recipient ${recipientUid} is currently active, skipping counter increment`
                );
                continue;
              }
            }
          }
        } catch (presenceError) {
          // Continue if presence check fails
          logger.warn(
            `Presence check failed for ${recipientUid}:`,
            presenceError.message
          );
        }

        // Increment counter for this recipient
        logger.info(`Incrementing unread count for user ${recipientUid}`, {
          reason: isNewDocument
            ? "new_message"
            : isTypeChange
            ? "type_change"
            : "unknown",
          messageType: afterData.type,
        });

        const userRef = db.doc(`users/${recipientUid}`);
        batch.update(userRef, {
          unreadMessagesCount: FieldValue.increment(1),
        });
      }

      await batch.commit();
      logger.info(`Successfully processed message ${msgId} changes`);
    } catch (error) {
      logger.error("Error processing message write:", error);
    }
  }
);
