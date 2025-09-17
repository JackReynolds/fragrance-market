const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

const db = getFirestore();

async function validateUserUnreadCount(userProfileDoc) {
  const userProfileData = userProfileDoc.data();
  const userProfileUid = userProfileDoc.id;
  const currentCount = userProfileData.unreadMessageCount || 0;

  // Calculate actual unread messages for this user
  const actualUnreadCount = await calculateActualUnreadCount(userProfileUid);

  if (currentCount !== actualUnreadCount) {
    const discrepancy = currentCount - actualUnreadCount;
    totalDiscrepancy += Math.abs(discrepancy);
    correctedUsers++;

    logger.info(`Correcting unread count for user profile ${userProfileUid}`, {
      currentCount,
      actualUnreadCount,
      discrepancy,
    });

    // Update the user's unread count
    await db.doc(`profiles/${userProfileUid}`).update({
      unreadMessageCount: actualUnreadCount,
      lastCountValidation: new Date(),
    });
  }
}

async function calculateActualUnreadCount(userProfileUid) {
  let totalUnread = 0;

  // Get all swap requests where user is a participant
  const swapRequestsQuery = db
    .collection("swap_requests")
    .where("participants", "array-contains", userProfileUid);

  const swapRequestsSnapshot = await swapRequestsQuery.get();

  // For each swap request, count unread messages
  for (const swapDoc of swapRequestsSnapshot.docs) {
    const swapId = swapDoc.id;

    // Get all messages in this swap request
    const messagesQuery = db.collection(`swap_requests/${swapId}/messages`);

    const messagesSnapshot = await messagesQuery.get();

    for (const messageDoc of messagesSnapshot.docs) {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const senderUid = messageData.senderUid;

      // Count as unread if:
      // 1. User is not the sender
      // 2. User hasn't read it (not in readBy array)
      if (senderUid !== userProfileUid && !readBy.includes(userProfileUid)) {
        totalUnread++;
      }
    }
  }

  return totalUnread;
}

exports.validateUnreadCounts = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "UTC",
    region: "europe-west2",
  },
  async (event) => {
    // Later to add
    // memory: "1GiB",
    // timeoutSeconds: 540,

    try {
      logger.info("Starting unread count validation for all users");

      let processedUsers = 0;
      let correctedUsers = 0;
      let totalDiscrepancy = 0;

      // Get all users in batches
      const userProfilesRef = db.collection("profiles");
      let lastDoc = null;
      const batchSize = 100;

      do {
        let query = userProfilesRef.orderBy("uid").limit(batchSize);
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const usersBatch = await query.get();

        if (usersBatch.empty) {
          break;
        }

        // Process users in parallel batches of 10 to avoid overwhelming Firestore
        const userProfileDocs = usersBatch.docs;
        for (let i = 0; i < userProfileDocs.length; i += 10) {
          const batch = userProfileDocs.slice(i, i + 10);
          await Promise.all(
            batch.map(async (userProfileDoc) => {
              try {
                await validateUserUnreadCount(userProfileDoc);
                processedUsers++;
              } catch (error) {
                logger.error(
                  `Error validating user ${userProfileDoc.id}:`,
                  error
                );
              }
            })
          );
        }

        lastDoc = usersBatch.docs[usersBatch.docs.length - 1];
      } while (lastDoc);

      logger.info("Unread count validation completed", {
        processedUsers,
        correctedUsers,
        totalDiscrepancy,
      });
    } catch (error) {
      logger.error("Error in validateUnreadCounts function:", error);
      throw error;
    }
  }
);
