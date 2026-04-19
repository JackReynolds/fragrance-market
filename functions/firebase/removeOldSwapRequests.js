const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const db = getFirestore();

// Configuration
const DAYS_THRESHOLD = 30; // Delete swap requests older than 30 days
const ACTIVE_SWAP_STATUSES = [
  "swap_request",
  "swap_accepted",
  "pending_shipment",
];
const BATCH_SIZE = 100; // Process swap requests in batches
const DELETE_BATCH_SIZE = 50; // Batch size for deleting subcollections

exports.removeOldSwapRequests = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "UTC",
    region: "europe-west2",
  },
  async () => {
    const startTime = Date.now();
    let processedSwapRequests = 0;
    let deletedSwapRequests = 0;
    let repairedSwapRequests = 0;
    let errorCount = 0;

    logger.info("🧹 Starting cleanup of old swap requests", {
      daysThreshold: DAYS_THRESHOLD,
      batchSize: BATCH_SIZE,
      activeStatuses: ACTIVE_SWAP_STATUSES,
    });

    try {
      // Calculate the cutoff date (30 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - DAYS_THRESHOLD);

      logger.info("Cleaning up swap requests with no activity since:", {
        cutoffDate: cutoffDate.toISOString(),
      });

      let lastDoc = null;

      while (true) {
        let query = db
          .collection("swap_requests")
          .where("status", "in", ACTIVE_SWAP_STATUSES)
          .limit(BATCH_SIZE);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
          logger.info("No more old swap requests found");
          break;
        }

        // Process each swap request in this batch
        for (const swapDoc of snapshot.docs) {
          try {
            const swapData = swapDoc.data();
            const swapId = swapDoc.id;
            const latestMessageAt = await getLatestMessageTimestamp(swapId);
            const parentActivityAt = getLatestDate(
              toDate(swapData.lastActivityAt),
              toDate(swapData.updatedAt),
              toDate(swapData.createdAt)
            );
            const effectiveActivityAt = getLatestDate(
              parentActivityAt,
              latestMessageAt
            );

            processedSwapRequests++;

            logger.info(`Processing swap request ${swapId}`, {
              lastActivityAt: swapData.lastActivityAt?.toDate?.()?.toISOString(),
              updatedAt: swapData.updatedAt?.toDate?.()?.toISOString(),
              createdAt: swapData.createdAt?.toDate?.()?.toISOString(),
              latestMessageAt: latestMessageAt?.toISOString() || null,
              effectiveActivityAt: effectiveActivityAt?.toISOString() || null,
              status: swapData.status,
              offeredBy: swapData.offeredBy?.username,
              requestedFrom: swapData.requestedFrom?.username,
            });

            if (!effectiveActivityAt) {
              logger.warn(
                `Swap request ${swapId} has no activity timestamps, skipping`
              );
              continue;
            }

            if (
              latestMessageAt &&
              (!parentActivityAt || latestMessageAt > parentActivityAt)
            ) {
              await db.collection("swap_requests").doc(swapId).update({
                lastActivityAt: latestMessageAt,
                updatedAt: latestMessageAt,
              });

              repairedSwapRequests++;
              logger.info(
                `🛠️ Repaired activity timestamps for legacy swap ${swapId}`
              );
              continue;
            }

            if (effectiveActivityAt >= cutoffDate) {
              logger.info(
                `Skipping active swap ${swapId} because activity is still within threshold`
              );
              continue;
            }

            // ✅ CRITICAL: Delete main document FIRST to prevent stale presence
            await db.collection("swap_requests").doc(swapId).delete();

            // Small delay to allow frontend listeners to react
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Then delete subcollections
            await deleteCollection(
              db,
              `swap_requests/${swapId}/messages`,
              DELETE_BATCH_SIZE
            );
            await deleteCollection(
              db,
              `swap_requests/${swapId}/presence`,
              DELETE_BATCH_SIZE
            );

            deletedSwapRequests++;
            logger.info(`✅ Deleted swap request ${swapId}`);
          } catch (error) {
            errorCount++;
            logger.error(
              `❌ Error deleting swap request ${swapDoc.id}:`,
              error
            );
            // Continue with next document even if one fails
          }
        }

        // Update lastDoc for pagination
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        // Break if we got fewer documents than requested (last page)
        if (snapshot.size < BATCH_SIZE) {
          break;
        }

        // Add a small delay between batches to avoid overwhelming Firestore
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const duration = Date.now() - startTime;

      logger.info("✅ Old swap requests cleanup completed", {
        processedSwapRequests,
        deletedSwapRequests,
        repairedSwapRequests,
        errorCount,
        durationMs: duration,
        durationMinutes: Math.round((duration / 60000) * 100) / 100,
      });

      // Log performance stats to a collection for monitoring
      await db.collection("cleanup_stats").add({
        type: "old_swap_requests_cleanup",
        timestamp: FieldValue.serverTimestamp(),
        processedCount: processedSwapRequests,
        deletedCount: deletedSwapRequests,
        repairedCount: repairedSwapRequests,
        errorCount,
        durationMs: duration,
        daysThreshold: DAYS_THRESHOLD,
        cutoffDate,
      });
    } catch (error) {
      logger.error("❌ Error in removeOldSwapRequests function:", error);
      throw error;
    }

    /**
     * Recursively deletes all documents in a collection using the same pattern as the API route
     * @param {Firestore} db - Firestore instance
     * @param {string} collectionPath - Path to the collection to delete
     * @param {number} batchSize - Batch size for deletion
     */
    async function deleteCollection(db, collectionPath, batchSize) {
      const collectionRef = db.collection(collectionPath);
      const query = collectionRef.orderBy("__name__").limit(batchSize);

      return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
      });
    }

    /**
     * Recursively deletes documents in batches - exact same logic as API route
     * @param {Firestore} db - Firestore instance
     * @param {Query} query - Firestore query for the batch
     * @param {Function} resolve - Promise resolve function
     */
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

      // Recurse on the next process tick, to avoid exploding the stack
      process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
      });
    }

    async function getLatestMessageTimestamp(swapId) {
      const latestMessageSnapshot = await db
        .collection(`swap_requests/${swapId}/messages`)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (latestMessageSnapshot.empty) {
        return null;
      }

      return toDate(latestMessageSnapshot.docs[0].data().createdAt);
    }

    function toDate(value) {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (typeof value.toDate === "function") return value.toDate();
      return null;
    }

    function getLatestDate(...dates) {
      const validDates = dates.filter(Boolean);
      if (validDates.length === 0) {
        return null;
      }

      return validDates.reduce((latest, current) =>
        current > latest ? current : latest
      );
    }
  }
);
