// functions/onListingCreate.js
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const db = getFirestore();

exports.onListingCreate = onDocumentCreated(
  { document: "listings/{id}", region: "europe-west2" },
  async (event) => {
    const ref = event.data.ref;
    const data = event.data.data();
    if (!data) return;

    const { ownerUid } = data;
    if (!ownerUid) {
      logger.warn(`Listing ${ref.id} missing ownerUid; skipping tier set.`);
      return;
    }

    const userSnap = await db.doc(`users/${ownerUid}`).get();
    const user = userSnap.exists ? userSnap.data() : {};
    const isPremium = !!user.isPremium;
    const isVerified = !!user.isIdVerified;
    const ownerPriority =
      isPremium && isVerified ? 3 : isVerified ? 2 : isPremium ? 1 : 0;

    // If values already correct, skip write
    if (
      data.ownerIsPremium === isPremium &&
      data.ownerIsIdVerified === isVerified &&
      data.ownerPriority === ownerPriority &&
      (user.username || null) === (data.ownerUsername || null)
    ) {
      return;
    }

    await ref.update({
      ownerIsPremium: isPremium,
      ownerIsIdVerified: isVerified,
      ownerPriority,
      ownerUsername: user.username || data.ownerUsername || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(
      `Listing ${ref.id}: owner flags set { premium:${isPremium}, verified:${isVerified}, priority:${ownerPriority} }`
    );
  }
);
