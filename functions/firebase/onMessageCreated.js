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

      logger.info(`Processing new message ${msgId} in swap ${swapId}`);

      // Only proceed if there's a sender
      if (!message.senderUid) {
        logger.warn(`Message ${msgId} has no sender, skipping counter update`);
        return;
      }

      // CRITICAL FIX: Wait a moment before checking read status
      // This allows active recipients to mark as read first
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the latest version of the message (it might have been updated)
      const db = getFirestore();
      const updatedMessageSnap = await db
        .doc(`swap_requests/${swapId}/messages/${msgId}`)
        .get();

      if (!updatedMessageSnap.exists) {
        logger.warn(`Message ${msgId} no longer exists`);
        return;
      }

      const updatedMessage = updatedMessageSnap.data();
      const readBy = updatedMessage.readBy || [];

      // Fetch the swap request to get participants
      const swapSnapshot = await db.doc(`swap_requests/${swapId}`).get();
      if (!swapSnapshot.exists) return;

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

      // Find participants who need counter increment (not sender, not already read)
      const recipientsToUpdate = participants.filter(
        (uid) => uid !== updatedMessage.senderUid && !readBy.includes(uid)
      );

      if (recipientsToUpdate.length === 0) {
        logger.info(`No recipients need counter update for message ${msgId}`);
        return;
      }

      // Increment counter only for recipients who haven't read the message
      const batch = db.batch();
      recipientsToUpdate.forEach((uid) => {
        logger.info(`Incrementing unread count for user ${uid}`);
        const userRef = db.doc(`users/${uid}`);
        batch.update(userRef, {
          unreadMessagesCount: FieldValue.increment(1),
        });
      });

      await batch.commit();
    } catch (error) {
      logger.error("Error processing new message:", error);
    }
  }
);
