// functions/firebase/reduceSwapCountToZero.js
// Resets monthlySwapCount (NOT lifetime swapCount) on the 1st of each month
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
    let processedProfiles = 0;
    let processedUsers = 0;
    let errorCount = 0;

    logger.info("🚀 Starting monthly swap-count reset (monthlySwapCount only)");

    // 1️⃣  Create BulkWriters for both collections
    const profilesBulkWriter = db.bulkWriter();
    const usersBulkWriter = db.bulkWriter();

    profilesBulkWriter.onWriteError((err) => {
      errorCount++;
      logger.error(`BulkWriter error for profiles/${err.documentRef.id}`, err);
      return true; // continue retries with exponential back-off
    });

    usersBulkWriter.onWriteError((err) => {
      errorCount++;
      logger.error(`BulkWriter error for users/${err.documentRef.id}`, err);
      return true;
    });

    // 2️⃣  Reset monthlySwapCount in profiles collection
    const batchSize = 500;
    let lastProfileDoc = null;

    while (true) {
      let q = db
        .collection("profiles")
        .where("monthlySwapCount", ">", 0)
        .orderBy("monthlySwapCount")
        .limit(batchSize);

      if (lastProfileDoc) q = q.startAfter(lastProfileDoc);

      const snap = await q.get();
      if (snap.empty) break;

      snap.docs.forEach((doc) => {
        profilesBulkWriter.update(doc.ref, {
          monthlySwapCount: 0,
          lastMonthlySwapReset: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      processedProfiles += snap.size;
      lastProfileDoc = snap.docs[snap.size - 1];

      if (snap.size < batchSize) break;
    }

    // 3️⃣  Reset monthlySwapCount in users collection
    let lastUserDoc = null;

    while (true) {
      let q = db
        .collection("users")
        .where("monthlySwapCount", ">", 0)
        .orderBy("monthlySwapCount")
        .limit(batchSize);

      if (lastUserDoc) q = q.startAfter(lastUserDoc);

      const snap = await q.get();
      if (snap.empty) break;

      snap.docs.forEach((doc) => {
        usersBulkWriter.update(doc.ref, {
          monthlySwapCount: 0,
          lastMonthlySwapReset: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      processedUsers += snap.size;
      lastUserDoc = snap.docs[snap.size - 1];

      if (snap.size < batchSize) break;
    }

    // 4️⃣  Flush BulkWriter operations
    await profilesBulkWriter.close();
    await usersBulkWriter.close();

    const duration = Date.now() - startTime;
    logger.info("✅ Monthly swap-count reset finished", {
      processedProfiles,
      processedUsers,
      errorCount,
      durationMs: duration,
    });

    // 5️⃣  Persist run stats
    await db
      .collection("system")
      .doc("monthlySwapResetStats")
      .set({
        lastRun: FieldValue.serverTimestamp(),
        processedProfiles,
        processedUsers,
        errorCount,
        durationMs: duration,
        success: errorCount === 0,
      });
  }
);
