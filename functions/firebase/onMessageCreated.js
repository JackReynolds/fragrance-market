const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.onMessageCreated = onDocumentCreated(
  {
    document: "swap_requests/{swapId}/messages/{msgId}",
    region: "europe-west2",
  },
  async (event) => {
    try {
      const message = event.data.data();
      const { swapId, msgId } = event.params;

      logger.info(`New message ${msgId} created in swap ${swapId}`);

      // Only proceed if there's a sender
      if (!message.senderUid) {
        logger.warn(`Message ${msgId} has no sender, skipping counter update`);
        return;
      }

      // Get the Firestore instance
      const db = getFirestore();

      // Fetch the swap request to get participants
      const swapSnapshot = await db.doc(`swap_requests/${swapId}`).get();

      if (!swapSnapshot.exists) {
        logger.warn(`Swap request ${swapId} not found for message ${msgId}`);
        return;
      }

      const swapData = swapSnapshot.data();

      // Get participants from the swap request
      // If participants array doesn't exist, fall back to offered/requested
      let participants = swapData.participants || [];

      if (
        participants.length === 0 &&
        swapData.offeredBy?.uid &&
        swapData.requestedFrom?.uid
      ) {
        participants = [swapData.offeredBy.uid, swapData.requestedFrom.uid];
        logger.info(`Using fallback participant list for swap ${swapId}`);
      }

      if (participants.length === 0) {
        logger.warn(`No participants found for swap ${swapId}`);
        return;
      }

      // Increment unreadMessagesCount for each other participant
      const batch = db.batch();

      participants
        .filter((uid) => uid !== message.senderUid)
        .forEach((uid) => {
          logger.info(`Incrementing unread count for user ${uid}`);
          const userRef = db.doc(`users/${uid}`);
          batch.update(userRef, {
            unreadMessagesCount: FieldValue.increment(1),
          });
        });

      await batch.commit();
      logger.info(`Successfully updated unread counters for message ${msgId}`);
    } catch (error) {
      logger.error("Error processing new message:", error);
    }
  }
);
