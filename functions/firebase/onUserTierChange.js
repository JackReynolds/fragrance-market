// functions/onUserTierChange.js
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const db = getFirestore();

exports.onUserTierChange = onDocumentUpdated("users/{uid}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!before || !after) return;

  // Only act if isPremium or isIdVerified changed
  const changed =
    before.isPremium !== after.isPremium ||
    before.isIdVerified !== after.isIdVerified;
  if (!changed) return;

  const uid = event.params.uid;
  const ownerIsPremium = !!after.isPremium;
  const ownerIsIdVerified = !!after.isIdVerified;
  const ownerPriority =
    ownerIsPremium && ownerIsIdVerified
      ? 3
      : ownerIsIdVerified
      ? 2
      : ownerIsPremium
      ? 1
      : 0;

  const batchSize = 500;
  let last = null;

  const writer = db.bulkWriter();

  while (true) {
    let q = db
      .collection("listings")
      .where("ownerUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(batchSize);

    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    snap.docs.forEach((doc) => {
      writer.update(doc.ref, {
        ownerIsPremium,
        ownerIsIdVerified,
        ownerPriority,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    last = snap.docs[snap.docs.length - 1];
    if (snap.size < batchSize) break;
  }

  await writer.close();
});
