const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Server-side (functions/firebase/onMessageRead.js) - Removes conversation from unread array when all messages are read
exports.onMessageRead = onDocumentUpdated(
  {
    document: "swap_requests/{swapId}/messages/{msgId}",
    region: "europe-west2",
  },
  async (event) => {
    try {
      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();
      const { swapId } = event.params;

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

      // For each user that read this message, check if they have any remaining unread messages in this conversation
      for (const uid of newReaders) {
        // Query all messages in this conversation that are unread by this user
        const messagesRef = db.collection(`swap_requests/${swapId}/messages`);
        const unreadMessagesQuery = await messagesRef.get();

        let hasUnreadMessages = false;
        unreadMessagesQuery.forEach((doc) => {
          const msgData = doc.data();
          const readBy = msgData.readBy || [];
          const senderUid = msgData.senderUid;

          // Check if this message is unread by this user
          if (senderUid !== uid && !readBy.includes(uid)) {
            hasUnreadMessages = true;
          }
        });

        // If no more unread messages, remove conversation from unread array
        if (!hasUnreadMessages) {
          const userProfileRef = db.doc(`profiles/${uid}`);
          await userProfileRef.update({
            unreadConversations: FieldValue.arrayRemove(swapId),
          });
          logger.info(
            `Removed conversation ${swapId} from unreadConversations for user ${uid}`
          );
        }
      }
    } catch (error) {
      logger.error("Error handling message read event:", error);
    }
  }
);
