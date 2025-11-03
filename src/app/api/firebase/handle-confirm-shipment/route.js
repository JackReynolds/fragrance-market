import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

const ACTIVE_SWAP_STATUSES = new Set([
  "swap_request",
  "swap_accepted",
  "pending_shipment",
]);

async function deleteSubcollection(path, batchSize = 50) {
  let snapshot = await db
    .collection(path)
    .orderBy("__name__")
    .limit(batchSize)
    .get();

  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    if (snapshot.size < batchSize) {
      break;
    }

    snapshot = await db
      .collection(path)
      .orderBy("__name__")
      .limit(batchSize)
      .get();
  }
}

async function deleteSwapRequestCascade(swapRequestId) {
  const messagesPath = `swap_requests/${swapRequestId}/messages`;
  const presencePath = `swap_requests/${swapRequestId}/presence`;

  try {
    await deleteSubcollection(messagesPath);
  } catch (error) {
    console.warn(
      `Failed deleting messages subcollection for ${swapRequestId}:`,
      error
    );
  }

  try {
    await deleteSubcollection(presencePath);
  } catch (error) {
    console.warn(
      `Failed deleting presence subcollection for ${swapRequestId}:`,
      error
    );
  }

  await db.collection("swap_requests").doc(swapRequestId).delete();
}

async function cleanupConflictingSwapRequests(listingIds, activeSwapRequestId) {
  const candidateIds = new Set();

  for (const listingId of listingIds) {
    if (!listingId) continue;

    const [offeredSnapshot, requestedSnapshot] = await Promise.all([
      db
        .collection("swap_requests")
        .where("offeredListing.id", "==", listingId)
        .get(),
      db
        .collection("swap_requests")
        .where("requestedListing.id", "==", listingId)
        .get(),
    ]);

    offeredSnapshot.forEach((doc) => {
      if (doc.id === activeSwapRequestId) return;
      const data = doc.data();
      if (ACTIVE_SWAP_STATUSES.has(data.status)) {
        candidateIds.add(doc.id);
      }
    });

    requestedSnapshot.forEach((doc) => {
      if (doc.id === activeSwapRequestId) return;
      const data = doc.data();
      if (ACTIVE_SWAP_STATUSES.has(data.status)) {
        candidateIds.add(doc.id);
      }
    });
  }

  for (const candidateId of candidateIds) {
    try {
      await deleteSwapRequestCascade(candidateId);
      console.log(
        `Removed conflicting swap request ${candidateId} after completion of ${activeSwapRequestId}`
      );
    } catch (error) {
      console.error(
        `Failed to remove conflicting swap request ${candidateId}:`,
        error
      );
    }
  }
}

export async function POST(request) {
  try {
    const { swapRequestId, userUid, trackingNumber, messageId } =
      await request.json();

    // Validate required fields
    if (!swapRequestId || !userUid || !messageId) {
      console.error("Missing required fields", {
        swapRequestId,
        userUid,
        messageId,
      });
      return NextResponse.json({
        success: false,
        error: "Missing required fields (swapRequestId, userUid, messageId)",
      });
    }

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Get the swap request document
      const swapRequestRef = db.doc(`swap_requests/${swapRequestId}`);
      const swapRequestDoc = await transaction.get(swapRequestRef);

      if (!swapRequestDoc.exists) {
        throw new Error("Swap request not found");
      }

      const swapData = swapRequestDoc.data();

      // READ LISTINGS EARLY - Move this up here before any writes
      const offeredListingId = swapData.offeredListing?.id || null;
      const requestedListingId = swapData.requestedListing?.id || null;

      let offeredListingDoc = null;
      let requestedListingDoc = null;
      let offeredListingSnapshot = null;
      let requestedListingSnapshot = null;

      if (offeredListingId && requestedListingId) {
        const offeredListingRef = db.doc(`listings/${offeredListingId}`);
        const requestedListingRef = db.doc(`listings/${requestedListingId}`);

        offeredListingDoc = await transaction.get(offeredListingRef);
        requestedListingDoc = await transaction.get(requestedListingRef);

        offeredListingSnapshot = offeredListingDoc.exists
          ? { id: offeredListingDoc.id, ...offeredListingDoc.data() }
          : null;
        requestedListingSnapshot = requestedListingDoc.exists
          ? { id: requestedListingDoc.id, ...requestedListingDoc.data() }
          : null;
      }

      // Validate user is part of this swap
      const isValidUser =
        swapData.offeredBy?.uid === userUid ||
        swapData.requestedFrom?.uid === userUid;

      if (!isValidUser) {
        throw new Error("User not authorized for this swap request");
      }

      // Check if swap is in correct status
      if (swapData.status !== "pending_shipment") {
        throw new Error(
          `Cannot confirm shipment. Swap status is: ${swapData.status}`
        );
      }

      // Check if user already confirmed shipment (prevent double confirmation)
      if (swapData.shipmentStatus?.[userUid]) {
        console.log(
          `User ${userUid} already confirmed shipment for swap ${swapRequestId}`
        );
        return {
          success: true,
          bothShipped:
            swapData.shipmentStatus?.[swapData.offeredBy?.uid] &&
            swapData.shipmentStatus?.[swapData.requestedFrom?.uid],
          shipmentStatus: swapData.shipmentStatus,
          alreadyConfirmed: true,
        };
      }

      // Current timestamp for confirmation
      const confirmationTimestamp = FieldValue.serverTimestamp();

      // Update shipment status
      const currentShipmentStatus = swapData.shipmentStatus || {};
      const updatedShipmentStatus = {
        ...currentShipmentStatus,
        [userUid]: true,
      };

      // Store confirmation timestamps
      const currentConfirmationTimestamps =
        swapData.confirmationTimestamps || {};
      const updatedConfirmationTimestamps = {
        ...currentConfirmationTimestamps,
        [userUid]: confirmationTimestamp,
      };

      // Merge tracking numbers
      const currentTrackingNumbers = swapData.trackingNumbers || {};
      const trimmedTrackingNumber = trackingNumber?.trim();
      const updatedTrackingNumbers = trimmedTrackingNumber
        ? {
            ...currentTrackingNumbers,
            [userUid]: trimmedTrackingNumber,
          }
        : currentTrackingNumbers;

      // Prepare update data for swap request
      const swapUpdateData = {
        shipmentStatus: updatedShipmentStatus,
        confirmationTimestamps: updatedConfirmationTimestamps,
        trackingNumbers: updatedTrackingNumbers,
        updatedAt: confirmationTimestamp,
        lastUpdatedBy: userUid,
      };

      const swapMessageUpdateData = {
        createdAt: confirmationTimestamp,
        shipmentStatus: updatedShipmentStatus,
        confirmationTimestamps: updatedConfirmationTimestamps,
        trackingNumbers: updatedTrackingNumbers,
        readBy: [userUid],
        senderUid: userUid,
      };

      // Update swap request with shipment status
      transaction.update(swapRequestRef, swapUpdateData);

      // Update the pending_shipment message to notify the other user
      const messageRef = db.doc(
        `swap_requests/${swapRequestId}/messages/${messageId}`
      );

      transaction.update(messageRef, swapMessageUpdateData);

      const otherUserUid =
        swapData.offeredBy?.uid === userUid
          ? swapData.requestedFrom?.uid
          : swapData.offeredBy?.uid;

      // Check if both users have now shipped
      const bothShipped =
        updatedShipmentStatus[userUid] && updatedShipmentStatus[otherUserUid];

      let swapCompleted = false;

      if (bothShipped) {
        // Both users have shipped - complete the swap
        transaction.update(swapRequestRef, {
          status: "swap_completed",
          completedAt: confirmationTimestamp,
          trackingNumbers: updatedTrackingNumbers,
        });

        // Update message type to swap_completed
        transaction.update(messageRef, {
          type: "swap_completed",
          completedAt: confirmationTimestamp,
          trackingNumbers: updatedTrackingNumbers,
          readBy: [userUid],
        });

        // Increment swap count for both users
        transaction.update(db.doc(`profiles/${userUid}`), {
          swapCount: FieldValue.increment(1),
        });
        transaction.update(db.doc(`profiles/${otherUserUid}`), {
          swapCount: FieldValue.increment(1),
        });

        if (!offeredListingId || !requestedListingId) {
          throw new Error("Swap listings are missing required identifiers");
        }

        const offeredListingRef = db.doc(`listings/${offeredListingId}`);
        const requestedListingRef = db.doc(`listings/${requestedListingId}`);

        const offeredListingArchiveUpdate = {
          status: "swapped",
          swappedAt: confirmationTimestamp,
          swappedWithListingId: requestedListingId,
          swappedWithUserUid: swapData.requestedFrom?.uid || null,
          swapRequestId,
          updatedAt: confirmationTimestamp,
        };

        const requestedListingArchiveUpdate = {
          status: "swapped",
          swappedAt: confirmationTimestamp,
          swappedWithListingId: offeredListingId,
          swappedWithUserUid: swapData.offeredBy?.uid || null,
          swapRequestId,
          updatedAt: confirmationTimestamp,
        };

        transaction.update(offeredListingRef, offeredListingArchiveUpdate);
        transaction.update(requestedListingRef, requestedListingArchiveUpdate);

        const completedSwapRef = db.doc(`completed_swaps/${swapRequestId}`);

        const completedSwapData = {
          id: swapRequestId,
          status: "swap_completed",
          completedAt: confirmationTimestamp,
          createdAt: confirmationTimestamp,
          participants:
            swapData.participants ||
            [swapData.offeredBy?.uid, swapData.requestedFrom?.uid].filter(
              Boolean
            ),
          offeredBy: swapData.offeredBy,
          requestedFrom: swapData.requestedFrom,
          offeredListing: swapData.offeredListing,
          requestedListing: swapData.requestedListing,
          shipmentStatus: updatedShipmentStatus,
          confirmationTimestamps: updatedConfirmationTimestamps,
          trackingNumbers: updatedTrackingNumbers,
          offeredListingSnapshot,
          requestedListingSnapshot,
        };

        transaction.set(completedSwapRef, completedSwapData, { merge: true });

        swapCompleted = true;
        console.log(
          `Swap ${swapRequestId} completed - both users have shipped`
        );
      }

      return {
        success: true,
        bothShipped,
        swapCompleted,
        shipmentStatus: updatedShipmentStatus,
        confirmationTimestamps: updatedConfirmationTimestamps,
        newStatus: bothShipped ? "swap_completed" : "pending_shipment",
        affectedListingIds:
          swapCompleted && offeredListingId && requestedListingId
            ? [offeredListingId, requestedListingId]
            : [],
      };
    });

    console.log(
      `Shipment confirmed for profile ${userUid} in swap ${swapRequestId}`,
      result
    );

    if (result.swapCompleted && result.affectedListingIds?.length) {
      try {
        await cleanupConflictingSwapRequests(
          result.affectedListingIds,
          swapRequestId
        );
      } catch (cleanupError) {
        console.error(
          `Failed to clean up conflicting swap requests for ${swapRequestId}:`,
          cleanupError
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error handling shipment confirmation:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
