import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminApp, db } from "@/lib/firebaseAdmin";
import { generateSlug } from "@/utils/generateSlug";
import {
  getSellerEligibility,
  getSellerEligibilityError,
} from "@/lib/sellerEligibility";
import { isSupportedSaleCurrency } from "@/lib/listingSalePolicy";

const EDITABLE_STATUSES = new Set(["active", "inactive"]);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const STANDARD_ACTIVE_LISTING_LIMIT = 3;

function routeError(message, code, status = 409) {
  const error = new Error(message);
  error.code = code;
  error.httpStatus = status;
  return error;
}

function isCheckoutReservationActive(reservation) {
  const expiresAt = reservation?.expiresAt?.toMillis?.();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function errorResponse(error, status = 400, code = "invalid_request") {
  return NextResponse.json({ error, code }, { status });
}

async function authenticate(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  return getAuth(adminApp).verifyIdToken(authHeader.slice(7));
}

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeListingInput(input = {}) {
  const type = input.type === "sell" ? "sell" : input.type === "swap" ? "swap" : "";
  const brand = cleanString(input.brand, 100);
  const fragrance = cleanString(input.fragrance, 150);
  const description = cleanString(input.description, 5000);
  const swapPreferences = cleanString(input.swapPreferences, 2000);
  const sizeInMl = Number(input.sizeInMl);
  const amountLeft = Number(input.amountLeft);
  const priceCents = type === "sell" ? Number(input.priceCents) : null;
  const currency = type === "sell" ? cleanString(input.currency, 3).toLowerCase() : null;
  const imageURLs = Array.isArray(input.imageURLs)
    ? input.imageURLs
        .filter(
          (url) =>
            typeof url === "string" &&
            /^https:\/\/res\.cloudinary\.com\//.test(url)
        )
        .slice(0, 5)
    : [];

  if (!type) throw new Error("Choose a valid listing type.");
  if (!brand) throw new Error("Brand is required.");
  if (!fragrance) throw new Error("Fragrance name is required.");
  if (!description) throw new Error("Description is required.");
  if (!Number.isFinite(sizeInMl) || sizeInMl < 1 || sizeInMl > 500) {
    throw new Error("Bottle size must be between 1ml and 500ml.");
  }
  if (!Number.isFinite(amountLeft) || amountLeft < 0 || amountLeft > 100) {
    throw new Error("Amount left must be between 0 and 100 percent.");
  }
  if (imageURLs.length === 0) throw new Error("At least one image is required.");
  if (type === "swap" && !swapPreferences) {
    throw new Error("Swap preferences are required for swap listings.");
  }
  if (
    type === "sell" &&
    (!Number.isSafeInteger(priceCents) || priceCents <= 0)
  ) {
    throw new Error("Enter a valid sale price.");
  }
  if (type === "sell" && !isSupportedSaleCurrency(currency)) {
    throw new Error("Choose a supported currency.");
  }

  return {
    type,
    brand,
    fragrance,
    description,
    sizeInMl,
    amountLeft,
    imageURLs,
    swapPreferences: type === "swap" ? swapPreferences : null,
    priceCents,
    currency,
  };
}

async function requireSaleEligibility(userUid, listing) {
  if (listing.type !== "sell") return null;

  const eligibility = await getSellerEligibility(userUid);
  if (!eligibility.eligible) {
    return errorResponse(
      getSellerEligibilityError(eligibility.reasons),
      403,
      eligibility.reasons[0]
    );
  }

  return eligibility;
}

export async function POST(request) {
  try {
    const decodedToken = await authenticate(request);
    if (!decodedToken) return errorResponse("Unauthorized", 401, "unauthorized");
    if (decodedToken.email_verified !== true) {
      return errorResponse("Verify your email before creating a listing.", 403, "email_verification_required");
    }

    const input = normalizeListingInput(await request.json());
    const saleEligibility = await requireSaleEligibility(decodedToken.uid, input);
    if (saleEligibility instanceof NextResponse) return saleEligibility;

    const [userSnapshot, profileSnapshot] = await Promise.all([
      db.collection("users").doc(decodedToken.uid).get(),
      db.collection("profiles").doc(decodedToken.uid).get(),
    ]);
    if (!userSnapshot.exists || !profileSnapshot.exists) {
      return errorResponse("Your profile could not be found.", 404, "profile_not_found");
    }

    const user = userSnapshot.data();
    const profile = profileSnapshot.data();
    const isPremium = Boolean(
      user.isPremium &&
        profile.isPremium &&
        ACTIVE_SUBSCRIPTION_STATUSES.has(profile.subscriptionStatus) &&
        profile.stripeSubscriptionId
    );
    const listingRef = db.collection("listings").doc();
    const title = `${input.fragrance} - ${input.brand}`;
    const slug = generateSlug(title);

    await db.runTransaction(async (transaction) => {
      if (!isPremium) {
        const activeListingsQuery = db
          .collection("listings")
          .where("ownerUid", "==", decodedToken.uid)
          .where("status", "==", "active");
        const activeListings = await transaction.get(activeListingsQuery);
        if (activeListings.size >= STANDARD_ACTIVE_LISTING_LIMIT) {
          const limitError = new Error(
            `Standard accounts can have up to ${STANDARD_ACTIVE_LISTING_LIMIT} active listings.`
          );
          limitError.code = "listing_limit_reached";
          throw limitError;
        }
      }

      transaction.set(listingRef, {
        ...input,
        title,
        slug,
        status: "active",
        ownerUid: decodedToken.uid,
        ownerUsername: user.username || profile.username || decodedToken.name || "Anonymous User",
        ownerProfilePictureURL: user.profilePictureURL || profile.profilePictureURL || null,
        ownerIsPremium: Boolean(user.isPremium),
        ownerIsIdVerified: Boolean(user.isIdVerified || profile.isIdVerified),
        ownerPriority:
          user.isPremium && (user.isIdVerified || profile.isIdVerified)
            ? 3
            : user.isIdVerified || profile.isIdVerified
              ? 2
              : user.isPremium
                ? 1
                : 0,
        country: profile.country || null,
        countryCode: profile.countryCode || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true, id: listingRef.id, slug }, { status: 201 });
  } catch (error) {
    console.error("Error creating listing:", error);
    const status = error.code === "listing_limit_reached" ? 409 : 400;
    return errorResponse(error.message || "Unable to create listing.", status, error.code || "create_failed");
  }
}

export async function PATCH(request) {
  try {
    const decodedToken = await authenticate(request);
    if (!decodedToken) return errorResponse("Unauthorized", 401, "unauthorized");

    const body = await request.json();
    const listingId = cleanString(body.listingId, 200);
    if (!listingId) return errorResponse("Listing ID is required.");

    const input = normalizeListingInput(body);
    const listingRef = db.collection("listings").doc(listingId);
    const listingSnapshot = await listingRef.get();
    if (!listingSnapshot.exists) return errorResponse("Listing not found.", 404, "not_found");

    const existingListing = listingSnapshot.data();
    if (existingListing.ownerUid !== decodedToken.uid) {
      return errorResponse("You do not have permission to edit this listing.", 403, "forbidden");
    }
    if (!EDITABLE_STATUSES.has(existingListing.status)) {
      return errorResponse("Completed listings cannot be edited.", 409, "listing_not_editable");
    }
    if (input.type !== existingListing.type) {
      return errorResponse(
        "Listing type cannot be changed after creation. Deactivate this listing and create a new one instead.",
        409,
        "listing_type_immutable"
      );
    }

    const saleEligibility = await requireSaleEligibility(decodedToken.uid, input);
    if (saleEligibility instanceof NextResponse) return saleEligibility;

    const title = `${input.fragrance} - ${input.brand}`;
    await db.runTransaction(async (transaction) => {
      const latestSnapshot = await transaction.get(listingRef);
      if (!latestSnapshot.exists) {
        throw routeError("Listing not found.", "not_found", 404);
      }

      const latestListing = latestSnapshot.data();
      if (latestListing.ownerUid !== decodedToken.uid) {
        throw routeError(
          "You do not have permission to edit this listing.",
          "forbidden",
          403
        );
      }
      if (!EDITABLE_STATUSES.has(latestListing.status)) {
        throw routeError(
          "Completed listings cannot be edited.",
          "listing_not_editable"
        );
      }
      if (input.type !== latestListing.type) {
        throw routeError(
          "Listing type cannot be changed after creation. Deactivate this listing and create a new one instead.",
          "listing_type_immutable"
        );
      }
      if (isCheckoutReservationActive(latestListing.checkoutReservation)) {
        throw routeError(
          "This listing is reserved by a buyer and cannot be edited until checkout finishes or expires.",
          "listing_reserved"
        );
      }

      transaction.update(listingRef, {
        ...input,
        price: FieldValue.delete(),
        title,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      id: listingSnapshot.id,
      slug: existingListing.slug || listingSnapshot.id,
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    return errorResponse(
      error.message || "Unable to update listing.",
      error.httpStatus || 400,
      error.code || "update_failed"
    );
  }
}
