import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    const { userUid, formattedAddress, addressComponents } =
      await request.json();

    // Validate required fields
    if (!userUid || !formattedAddress) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields (userUid, formattedAddress)",
      });
    }

    // Update profile document with address
    const profileRef = db.doc(`profiles/${userUid}`);

    const updateData = {
      formattedAddress: formattedAddress.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Include address components if provided
    if (addressComponents) {
      updateData.addressComponents = addressComponents;
    }

    await profileRef.update(updateData);

    console.log(`Address updated for profile ${userUid}: ${formattedAddress}`);

    return NextResponse.json({
      success: true,
      message: "Address saved successfully",
      data: {
        formattedAddress: formattedAddress.trim(),
        addressComponents,
      },
    });
  } catch (error) {
    console.error("Error saving address for profile:", error);

    // Handle specific Firestore errors
    if (error.code === "not-found") {
      return NextResponse.json({
        success: false,
        error: "Profile not found",
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
