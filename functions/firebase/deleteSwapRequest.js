const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

exports.deleteSwapRequest = onRequest(
  { cors: true, region: "europe-west2" },
  async (req, res) => {
    let swapRequestId = req.body.swapRequestId;

    async function deleteCollection(db, collectionPath, batchSize = 50) {
      const collectionRef = db.collection(collectionPath);
      const query = collectionRef.orderBy("__name__").limit(batchSize);

      return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
      });
    }

    async function deleteQueryBatch(db, query, resolve) {
      const snapshot = await query.get();

      const batchSize = snapshot.size;
      if (batchSize === 0) {
        resolve();
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
      });
    }

    // ✅ NEW: Function to check if count should be decremented
    async function shouldDecrementCount(swapRequestId, requestedFromUid) {
      try {
        // Get the initial swap request message
        const messagesRef = db.collection(
          `swap_requests/${swapRequestId}/messages`
        );
        const swapRequestMessages = await messagesRef
          .where("type", "==", "swap_request")
          .limit(1)
          .get();

        if (swapRequestMessages.empty) {
          console.log("No swap request message found");
          return true; // Decrement if no message (safety fallback)
        }

        const swapRequestMessage = swapRequestMessages.docs[0].data();
        const readBy = swapRequestMessage.readBy || [];

        // If target user hasn't read the initial message, decrement count
        const hasTargetUserRead = readBy.includes(requestedFromUid);

        console.log(
          `Target user ${requestedFromUid} has read message: ${hasTargetUserRead}`
        );
        return !hasTargetUserRead; // Decrement if NOT read
      } catch (error) {
        console.error("Error checking read status:", error);
        return false; // Don't decrement on error (safe default)
      }
    }

    // ✅ NEW: Function to safely decrement count
    async function decrementMonthlySwapCount(userUid) {
      try {
        const userRef = db.collection("users").doc(userUid);
        const userDoc = await userRef.get();

        if (!userDoc.exists()) {
          console.log(`User ${userUid} not found`);
          return;
        }

        const userData = userDoc.data();
        const currentCount = userData.monthlySwapCount || 0;

        // ✅ SAFETY: Only decrement if count > 0
        if (currentCount > 0) {
          await userRef.update({
            monthlySwapCount: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(
            `Decremented monthly swap count for user ${userUid}: ${currentCount} -> ${
              currentCount - 1
            }`
          );
        } else {
          console.log(
            `User ${userUid} already has 0 monthly swaps, not decrementing`
          );
        }
      } catch (error) {
        console.error(`Error decrementing count for user ${userUid}:`, error);
      }
    }

    try {
      // ✅ NEW: Get swap request data before deletion
      const swapRequestDoc = await db
        .collection("swap_requests")
        .doc(swapRequestId)
        .get();

      if (!swapRequestDoc.exists()) {
        return res.status(404).send({ error: "Swap request not found" });
      }

      const swapRequestData = swapRequestDoc.data();
      const { offeredBy, requestedFrom } = swapRequestData;

      // ✅ NEW: Check if we should decrement the requester's count
      const shouldDecrement = await shouldDecrementCount(
        swapRequestId,
        requestedFrom.uid
      );

      // Delete messages collection
      await deleteCollection(db, `swap_requests/${swapRequestId}/messages`, 50);

      // Delete presence collection
      await deleteCollection(db, `swap_requests/${swapRequestId}/presence`, 50);

      // Delete main swap request document
      await db.collection("swap_requests").doc(swapRequestId).delete();

      // ✅ NEW: Decrement count if target user never read the request
      if (shouldDecrement) {
        await decrementMonthlySwapCount(offeredBy.uid);
        console.log(
          `Decremented count for requester ${offeredBy.uid} - target user never read the request`
        );
      } else {
        console.log(
          `Not decrementing count for requester ${offeredBy.uid} - target user had read the request`
        );
      }

      res.status(200).send({
        message: "Swap request deleted",
        countDecremented: shouldDecrement,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: error.message });
    }
  }
);
