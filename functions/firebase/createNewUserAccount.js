const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const db = getFirestore();

exports.createNewUserAccount = onRequest(
  { cors: true, region: "europe-west2" },
  async (req, res) => {
    try {
      // Extract user data from request
      const { username, email, uid, country, countryCode } = req.body;

      // Validate required fields
      if (!username || !email || !uid) {
        logger.error("Missing required fields", { username, email, uid });
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      // Create user document
      const userRef = db.collection("users").doc(uid);

      await userRef.set({
        username,
        usernameLowercase: username.toLowerCase(),
        email,
        country: country || "",
        countryCode: countryCode || "",
        uid,
        isPremium: false,
        isIdVerified: false,
        unreadCount: 0,
        createdAt: FieldValue.serverTimestamp(),
      });

      logger.info(`Created new user account for ${uid}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      logger.error("Error creating user account:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create user account",
      });
    }
  }
);
