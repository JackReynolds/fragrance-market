const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

exports.deleteSwapRequest = onRequest(
  { cors: true, region: "europe-west2" },
  async (req, res) => {
    let swapRequestId = req.body.swapRequestId;

    async function deleteCollection(db, collectionPath, batchSize) {
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
        // When there are no documents left, we are done
        resolve();
        return;
      }

      // Delete documents in a batch
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
      });
    }

    try {
      // Delete messages collection
      await deleteCollection(db, `swap_requests/${swapRequestId}/messages`, 50);

      // Delete presence collection if present
      await deleteCollection(db, `swap_requests/${swapRequestId}/presence`);

      // Delete rental-request document
      await db.collection("swap_requests").doc(swapRequestId).delete();
      res.status(200).send({ message: "Swap request deleted." });
    } catch (error) {
      console.log(error);
      res.send({ error: error.message });
    }
  }
);
