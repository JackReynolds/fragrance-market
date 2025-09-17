const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { getFirestore } = require("firebase-admin/firestore");

// Server-side (functions/firebase/onMessageRead.js) - Handles counter decrement
exports.onMessageRead = onDocumentUpdated(
  {
    document: "swap_requests/{swapId}/messages/{msgId}",
    region: "europe-west2",
  },
  async (event) => {
    try {
      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();

      // Skip if readBy wasn't changed
      if (!beforeData.readBy && !afterData.readBy) return;

      // Find new readers (users added to readBy)
      const beforeReaders = beforeData.readBy || [];
      const afterReaders = afterData.readBy || [];

      const newReaders = afterReaders.filter(
        (uid) => !beforeReaders.includes(uid) && uid !== afterData.senderUid
      );

      if (newReaders.length === 0) return;

      const db = getFirestore();

      // Update counter for each user that newly read the message
      for (const uid of newReaders) {
        const userProfileRef = db.doc(`profiles/${uid}`);

        // Use transaction to ensure accurate count
        await db.runTransaction(async (transaction) => {
          const userProfileDoc = await transaction.get(userProfileRef);

          if (userProfileDoc.exists) {
            const currentCount = userProfileDoc.data().unreadMessageCount || 0;
            // Only decrement if count is positive
            if (currentCount > 0) {
              transaction.update(userProfileRef, {
                unreadMessageCount: currentCount - 1,
              });
              logger.info(
                `Decremented unreadMessageCount for user profile ${uid}`
              );
            }
          }
        });
      }
    } catch (error) {
      logger.error("Error handling message read event:", error);
    }
  }
);
