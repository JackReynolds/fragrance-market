const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

const db = getFirestore();

async function validateUserUnreadConversations(userProfileDoc, stats) {
  const userProfileData = userProfileDoc.data();
  const userProfileUid = userProfileDoc.id;
  const currentUnreadConversations = userProfileData.unreadConversations || [];

  // Calculate actual unread conversations for this user
  const actualUnreadConversations = await calculateActualUnreadConversations(
    userProfileUid
  );

  // Sort for comparison
  const currentSorted = [...currentUnreadConversations].sort();
  const actualSorted = [...actualUnreadConversations].sort();

  // Check if arrays are different
  const isDifferent =
    currentSorted.length !== actualSorted.length ||
    currentSorted.some((id, index) => id !== actualSorted[index]);

  if (isDifferent) {
    const discrepancy = Math.abs(
      currentUnreadConversations.length - actualUnreadConversations.length
    );
    stats.totalDiscrepancy += discrepancy;
    stats.correctedUsers++;

    logger.info(
      `Correcting unread conversations for user profile ${userProfileUid}`,
      {
        currentCount: currentUnreadConversations.length,
        actualCount: actualUnreadConversations.length,
        currentConversations: currentUnreadConversations,
        actualConversations: actualUnreadConversations,
        discrepancy,
      }
    );

    // Update the user's unread conversations array
    await db.doc(`profiles/${userProfileUid}`).update({
      unreadConversations: actualUnreadConversations,
      lastCountValidation: new Date(),
    });
  }
}

async function calculateActualUnreadConversations(userProfileUid) {
  const unreadConversations = [];

  // Get all swap requests where user is a participant
  const swapRequestsQuery = db
    .collection("swap_requests")
    .where("participants", "array-contains", userProfileUid);

  const swapRequestsSnapshot = await swapRequestsQuery.get();

  // For each swap request, check if there are unread messages
  for (const swapDoc of swapRequestsSnapshot.docs) {
    const swapId = swapDoc.id;

    // Get all messages in this swap request
    const messagesQuery = db.collection(`swap_requests/${swapId}/messages`);

    const messagesSnapshot = await messagesQuery.get();

    let hasUnreadMessages = false;
    for (const messageDoc of messagesSnapshot.docs) {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const senderUid = messageData.senderUid;

      // Check if unread:
      // 1. User is not the sender
      // 2. User hasn't read it (not in readBy array)
      if (senderUid !== userProfileUid && !readBy.includes(userProfileUid)) {
        hasUnreadMessages = true;
        break;
      }
    }

    // If conversation has unread messages, add to array
    if (hasUnreadMessages) {
      unreadConversations.push(swapId);
    }
  }

  return unreadConversations;
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
      logger.info("Starting unread conversations validation for all users");

      const stats = {
        processedUsers: 0,
        correctedUsers: 0,
        totalDiscrepancy: 0,
      };

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
                await validateUserUnreadConversations(userProfileDoc, stats);
                stats.processedUsers++;
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

      logger.info("Unread conversations validation completed", stats);
    } catch (error) {
      logger.error("Error in validateUnreadCounts function:", error);
      throw error;
    }
  }
);
