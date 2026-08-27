const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {logger} = require("firebase-functions");

const db = getFirestore();
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

module.exports = onDocumentWritten(
    {document: "listings/{id}", region: "europe-west2"},
    async (event) => {
      const listingSnapshot = event.data.after;
      if (!listingSnapshot.exists) return;

      const listing = listingSnapshot.data();
      if (listing.type !== "sell" || listing.status !== "active") return;

      const ownerUid = listing.ownerUid;
      if (!ownerUid) {
        await listingSnapshot.ref.update({
          status: "inactive",
          restrictionReason: "missing_owner",
          restrictedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const [userSnapshot, profileSnapshot] = await Promise.all([
        db.doc(`users/${ownerUid}`).get(),
        db.doc(`profiles/${ownerUid}`).get(),
      ]);
      const user = userSnapshot.exists ? userSnapshot.data() : {};
      const profile = profileSnapshot.exists ? profileSnapshot.data() : {};

      const eligible =
        user.isPremium === true &&
        profile.isPremium === true &&
        ACTIVE_SUBSCRIPTION_STATUSES.has(profile.subscriptionStatus) &&
        Boolean(profile.stripeSubscriptionId) &&
        (user.isIdVerified === true || profile.isIdVerified === true) &&
        profile.stripeAccountStatus?.statusCode === 1 &&
        Boolean(profile.stripeAccountId);

      if (eligible) return;

      await listingSnapshot.ref.update({
        status: "inactive",
        restrictionReason: "seller_not_eligible",
        restrictedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.warn(
          `Listing ${listingSnapshot.id} deactivated: seller ${ownerUid} ` +
          "does not meet sale eligibility requirements",
      );
    },
);
