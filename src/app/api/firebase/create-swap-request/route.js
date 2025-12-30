import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import sgMail from "@sendgrid/mail";

const ACTIVE_SWAP_STATUSES = new Set([
  "swap_request",
  "swap_accepted",
  "pending_shipment",
]);

const sendGridApiKey = process.env.SENDGRID_API_KEY;
const swapRequestTemplateId = process.env.SENDGRID_SWAP_REQUEST_TEMPLATE_ID;

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

export async function POST(request) {
  try {
    const { offeredListingId, requestedListingId, requestedFromUid } =
      await request.json();

    // Get current user from auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const currentUserUid = decodedToken.uid;

    // 1. Validate: Check if both listings exist and are active
    const [offeredListingDoc, requestedListingDoc] = await Promise.all([
      db.collection("listings").doc(offeredListingId).get(),
      db.collection("listings").doc(requestedListingId).get(),
    ]);

    if (!offeredListingDoc.exists || !requestedListingDoc.exists) {
      return NextResponse.json(
        { error: "One or both listings no longer exist" },
        { status: 400 }
      );
    }

    const offeredListing = {
      id: offeredListingDoc.id,
      ...offeredListingDoc.data(),
    };
    const requestedListing = {
      id: requestedListingDoc.id,
      ...requestedListingDoc.data(),
    };

    // Validate ownership and listing types
    if (offeredListing.ownerUid !== currentUserUid) {
      return NextResponse.json(
        { error: "You don't own the offered listing" },
        { status: 403 }
      );
    }

    if (requestedListing.ownerUid !== requestedFromUid) {
      return NextResponse.json(
        { error: "Invalid target listing owner" },
        { status: 400 }
      );
    }

    if (requestedListing.ownerUid === currentUserUid) {
      return NextResponse.json(
        { error: "You cannot initiate a swap with your own listing" },
        { status: 400 }
      );
    }

    if (offeredListing.type !== "swap" || offeredListing.status !== "active") {
      return NextResponse.json(
        { error: "Offered listing is not available for swap" },
        { status: 400 }
      );
    }

    if (requestedListing.status !== "active") {
      return NextResponse.json(
        { error: "Requested listing is no longer active" },
        { status: 400 }
      );
    }

    const [requestedListingConflicts, offeredListingConflicts] =
      await Promise.all([
        db
          .collection("swap_requests")
          .where("requestedListing.id", "==", requestedListing.id)
          .get(),
        db
          .collection("swap_requests")
          .where("offeredListing.id", "==", offeredListing.id)
          .get(),
      ]);

    const requestedListingHasActiveSwap = requestedListingConflicts.docs.some(
      (docSnap) => ACTIVE_SWAP_STATUSES.has(docSnap.data().status)
    );

    if (requestedListingHasActiveSwap) {
      return NextResponse.json(
        {
          error:
            "Requested listing is already involved in another active swap request",
        },
        { status: 409 }
      );
    }

    const offeredListingHasActiveSwap = offeredListingConflicts.docs.some(
      (docSnap) =>
        ACTIVE_SWAP_STATUSES.has(docSnap.data().status) &&
        docSnap.data().offeredBy?.uid === currentUserUid
    );

    if (offeredListingHasActiveSwap) {
      return NextResponse.json(
        {
          error:
            "You already have an active swap request using this listing. Complete or cancel it before creating a new one.",
        },
        { status: 409 }
      );
    }

    // 2. Check for existing swap requests
    const existingRequest = await db
      .collection("swap_requests")
      .where("offeredBy.uid", "==", currentUserUid)
      .where("requestedListing.id", "==", requestedListingId)
      .where("offeredListing.id", "==", offeredListingId)
      .where("status", "in", ["swap_request", "swap_accepted"])
      .get();

    if (!existingRequest.empty) {
      return NextResponse.json(
        { error: "Swap request already exists" },
        { status: 409 }
      );
    }

    // 3. Get user public profiles from USERS collection (not profiles!)
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      db.collection("users").doc(currentUserUid).get(), // ✅ Public data
      db.collection("users").doc(requestedFromUid).get(), // ✅ Public data
    ]);

    if (!currentUserDoc.exists || !targetUserDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    const currentUser = currentUserDoc.data();
    const targetUser = targetUserDoc.data();

    // 3.5. CHECK SWAP LIMIT (server-side enforcement)
    // Get current user's profile to check swap count
    const currentUserProfileDoc = await db
      .collection("profiles")
      .doc(currentUserUid)
      .get();

    if (!currentUserProfileDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    const currentUserProfile = currentUserProfileDoc.data();
    const isPremium = currentUserProfile.isPremium || false;
    const monthlySwapCount = currentUserProfile.monthlySwapCount || 0;

    // Non-premium users are limited to 1 swap per month
    if (!isPremium && monthlySwapCount >= 1) {
      return NextResponse.json(
        {
          error:
            "Monthly swap limit reached. Upgrade to Premium for unlimited swaps.",
          errorCode: "SWAP_LIMIT_REACHED",
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // 4. Create swap request document
    const swapRequestData = {
      offeredBy: {
        uid: currentUserUid,
        username: currentUser.username || "Unknown",
        isIdVerified: currentUser.isIdVerified || false,
        isPremium: currentUser.isPremium || false,
        profilePictureURL: currentUser.profilePictureURL || "",
        rating: currentUser.rating || 0,
      },
      offeredListing: {
        id: offeredListing.id,
        title: offeredListing.title,
        brand: offeredListing.brand,
        imageURL: offeredListing.imageURLs?.[0] || "",
        fragrance: offeredListing.fragrance,
        amountLeft: offeredListing.amountLeft,
      },
      requestedFrom: {
        uid: requestedFromUid,
        username: targetUser.username || "Unknown",
        isIdVerified: targetUser.isIdVerified || false,
        isPremium: targetUser.isPremium || false,
        profilePictureURL: targetUser.profilePictureURL || "",
        rating: targetUser.rating || 0,
      },
      requestedListing: {
        id: requestedListing.id,
        title: requestedListing.title,
        brand: requestedListing.brand,
        imageURL: requestedListing.imageURLs?.[0] || "",
        fragrance: requestedListing.fragrance,
        amountLeft: requestedListing.amountLeft,
      },
      status: "swap_request",
      participants: [currentUserUid, requestedFromUid],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 5. Create swap request and initial message atomically
    const batch = db.batch();

    const swapRequestRef = db.collection("swap_requests").doc();
    batch.set(swapRequestRef, swapRequestData);

    // Create initial chat message and remove "status" from swapRequestData - not needed in messages
    const { status, ...restOfSwapRequestData } = swapRequestData;
    const messageData = {
      ...restOfSwapRequestData,
      type: "swap_request",
      readBy: [currentUserUid],
      senderUid: currentUserUid,
      receiverUid: requestedFromUid,
      swapRequestId: swapRequestRef.id,
    };

    const messageRef = db
      .collection("swap_requests")
      .doc(swapRequestRef.id)
      .collection("messages")
      .doc();
    batch.set(messageRef, messageData);

    await batch.commit();

    // 6. Send email notification to the listing owner (server-side)
    try {
      // Fetch target user's email from profiles collection
      const targetProfileDoc = await db
        .collection("profiles")
        .doc(requestedFromUid)
        .get();
      const targetProfileData = targetProfileDoc.data();

      if (targetProfileData?.email && sendGridApiKey && swapRequestTemplateId) {
        const message = {
          to: targetProfileData.email,
          from: {
            name: "The Fragrance Market",
            email: "info@thefragrancemarket.com",
          },
          templateId: swapRequestTemplateId,
          dynamicTemplateData: {
            requestedFromUsername: targetUser.username,
            offeredByUsername: currentUser.username,
            requestedListingTitle: requestedListing.title,
            offeredListingTitle: offeredListing.title,
          },
          subject: "New Swap Request | The Fragrance Market",
        };

        await sgMail.send(message);
        console.log(`Swap request email sent to ${targetProfileData.email}`);
      } else {
        console.warn("Email not sent: Missing email, API key, or template ID");
      }
    } catch (emailError) {
      // Don't fail the request if email fails - just log it
      console.error("Failed to send swap request email:", emailError);
      console.error("Email error details:", emailError.response?.body);
    }

    return NextResponse.json({
      success: true,
      swapRequestId: swapRequestRef.id,
      message: "Swap request created successfully",
    });
  } catch (error) {
    console.error("Error creating swap request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
