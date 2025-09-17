// functions/firebase/reduceSwapCountToZero.js
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const db = getFirestore();

exports.reduceSwapCountToZero = onSchedule(
  {
    schedule: "0 3 1 * *", // 3 AM UTC on day-1 each month
    timeZone: "UTC",
    region: "europe-west2",
  },
  async () => {
    const startTime = Date.now();
    let processedUsers = 0;
    let errorCount = 0;

    logger.info("🚀 Starting monthly swap-count reset");

    // 1️⃣  Create a single BulkWriter with an error handler
    const bulkWriter = db.bulkWriter();
    bulkWriter.onWriteError((err) => {
      errorCount++;
      logger.error(`BulkWriter error for document ${err.documentRef.id}`, err);
      return true; // continue retries with exponential back-off
    });

    // 2️⃣  Paginate reads to avoid loading all users into memory
    const batchSize = 500;
    let lastDoc = null;

    while (true) {
      let q = db
        .collection("profiles")
        .where("swapCount", ">", 0)
        .orderBy("swapCount") // required for startAfter with inequality
        .limit(batchSize);

      if (lastDoc) q = q.startAfter(lastDoc);

      const snap = await q.get();
      if (snap.empty) break;

      snap.docs.forEach((doc) => {
        bulkWriter.update(doc.ref, {
          swapCount: 0,
          lastSwapReset: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      processedUsers += snap.size;
      lastDoc = snap.docs[snap.size - 1];

      if (snap.size < batchSize) break; // no more pages
    }

    // 3️⃣  Flush BulkWriter operations
    await bulkWriter.close();

    const duration = Date.now() - startTime;
    logger.info("✅ Swap-count reset finished", {
      processedUsers,
      errorCount,
      durationMs: duration,
    });

    // 4️⃣  Persist run stats
    await db
      .collection("system")
      .doc("swapResetStats")
      .set({
        lastRun: FieldValue.serverTimestamp(),
        processedUsers,
        errorCount,
        durationMs: duration,
        success: errorCount === 0,
      });
  }
);
