import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export async function POST(request) {
  try {
    // 1. AUTHENTICATE USER
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Missing or invalid token" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let authenticatedUserUid;

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      authenticatedUserUid = decodedToken.uid;
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid token",
        },
        { status: 401 }
      );
    }

    // 2. PARSE REQUEST BODY
    const { swapRequestId, userUid, address, userRole, messageId } =
      await request.json();

    // 3. VERIFY USER IS ACTING ON THEIR OWN BEHALF
    if (authenticatedUserUid !== userUid) {
      console.error(
        `Auth mismatch: ${authenticatedUserUid} attempted to act as ${userUid}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Cannot act on behalf of another user",
        },
        { status: 403 }
      );
    }

    // 4. VALIDATE REQUIRED FIELDS
    if (!swapRequestId || !userUid || !address || !userRole || !messageId) {
      console.error("Missing required fields", {
        swapRequestId,
        userUid,
        address,
        userRole,
        messageId,
      });
      return NextResponse.json({
        success: false,
        error:
          "Missing required fields (swapRequestId, userUid, address, userRole, messageId)",
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

      // Validate user is part of this swap
      const isValidUser =
        swapData.offeredBy?.uid === userUid ||
        swapData.requestedFrom?.uid === userUid;

      if (!isValidUser) {
        throw new Error("User not authorized for this swap request");
      }

      // Check if swap is in correct status
      if (swapData.status !== "swap_accepted") {
        throw new Error(
          `Cannot confirm address. Swap status is: ${swapData.status}`
        );
      }

      // Check if user already confirmed (prevent double confirmation)
      if (swapData.addressConfirmation?.[userUid]) {
        console.log(
          `User ${userUid} already confirmed address for swap ${swapRequestId}`
        );
        return {
          success: true,
          bothConfirmed:
            swapData.addressConfirmation?.[swapData.offeredBy?.uid] &&
            swapData.addressConfirmation?.[swapData.requestedFrom?.uid],
          confirmations: swapData.addressConfirmation,
          alreadyConfirmed: true,
        };
      }

      // Update address confirmation
      const currentConfirmations = swapData.addressConfirmation || {};
      const updatedConfirmations = {
        ...currentConfirmations,
        [userUid]: true,
      };

      // Update user's address in the swap request
      const addressField =
        userRole === "offeredBy"
          ? "offeredBy.formattedAddress"
          : "requestedFrom.formattedAddress";

      // get other user uid
      const otherUserUid =
        userRole === "offeredBy"
          ? swapData.requestedFrom?.uid
          : swapData.offeredBy?.uid;

      // Update swap request with address confirmation
      transaction.update(swapRequestRef, {
        addressConfirmation: updatedConfirmations,
        [addressField]: address,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Also update user's profile with the address
      const userRef = db.doc(`profiles/${userUid}`);
      transaction.update(userRef, {
        formattedAddress: address,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update the swap_accepted message to notify the other user that the address has been confirmed
      const messageRef = db.doc(
        `swap_requests/${swapRequestId}/messages/${messageId}`
      );
      transaction.update(messageRef, {
        updatedAt: FieldValue.serverTimestamp(),
        addressConfirmation: updatedConfirmations,
        readBy: [userUid],
        senderUid: userUid,
      });

      // Check if both users have confirmed
      const bothConfirmed =
        updatedConfirmations[userUid] && updatedConfirmations[otherUserUid];

      let messageUpdated = false;
      let swapCountIncremented = false;

      if (bothConfirmed) {
        // Only proceed if status is still "swap_accepted"
        if (swapData.status === "swap_accepted") {
          // Update swap request status
          transaction.update(swapRequestRef, {
            status: "pending_shipment",
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Update the existing swap_accepted message to pending_shipment
          const messageRef = db.doc(
            `swap_requests/${swapRequestId}/messages/${messageId}`
          );

          transaction.update(messageRef, {
            type: "pending_shipment",
            createdAt: FieldValue.serverTimestamp(),
            senderUid: userUid,
            readBy: [userUid],
          });

          // ✅ INCREMENT SWAP COUNT FOR BOTH USERS
          // This is when the swap is truly committed - both addresses confirmed
          const offeredByUserRef = db.doc(`profiles/${swapData.offeredBy.uid}`);
          const requestedFromUserRef = db.doc(
            `profiles/${swapData.requestedFrom.uid}`
          );

          transaction.update(offeredByUserRef, {
            swapCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });

          transaction.update(requestedFromUserRef, {
            swapCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });

          messageUpdated = true;
          swapCountIncremented = true;

          console.log(
            `Updated message ${messageId} to pending_shipment and incremented swap counts for swap ${swapRequestId}`
          );
          console.log(
            `Incremented swap count for users: ${swapData.offeredBy.uid}, ${swapData.requestedFrom.uid}`
          );
        } else {
          console.log(
            `Swap ${swapRequestId} status changed during transaction, skipping message update and swap count increment`
          );
        }
      }

      return {
        success: true,
        bothConfirmed,
        messageUpdated,
        swapCountIncremented,
        confirmations: updatedConfirmations,
        newStatus:
          bothConfirmed && swapData.status === "swap_accepted"
            ? "pending_shipment"
            : swapData.status,
      };
    });

    console.log(
      `Address confirmed for profile ${userUid} in swap ${swapRequestId}`,
      result
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error handling address confirmation:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
