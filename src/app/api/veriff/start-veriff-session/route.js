import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import axios from "axios";

//const veriffTestSecretKey = process.env.VERIFF_TEST_SECRET_KEY;
const veriffAPIKey = process.env.VERIFF_API_KEY;

export async function POST(request) {
  let userUid = "";

  try {
    // 1. Parse request body
    const { userUid } = await request.json();

    console.log("userUid", userUid);

    // 2. Input validation
    if (!userUid) {
      return NextResponse.json(
        { error: "Missing required fields: userUid" },
        { status: 400 }
      );
    }

    if (typeof userUid !== "string") {
      return NextResponse.json(
        { error: "Invalid field types" },
        { status: 400 }
      );
    }

    // 1) Fetch the user doc
    const userDocRef = db.collection("users").doc(userUid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDocSnap.data();
    const decision = userData?.veriff?.decision || "";

    // 6. Business logic checks
    if (decision === "approved") {
      return NextResponse.json(
        { error: "User is already verified" },
        { status: 400 }
      );
    }

    // Return existing session for resubmission cases
    if (decision === "resubmission_requested") {
      const existingUrl = userData.veriff?.sessionUrl;
      const existingId = userData.veriff?.sessionId;

      if (existingUrl && existingId) {
        return NextResponse.json(
          { verificationUrl: existingUrl },
          { status: 200 }
        );
      }
      console.warn(
        `No existing session URL found for user ${userUid}, creating new session`
      );
    }

    // 7. Create new Veriff session
    const veriffResponse = await axios.post(
      "https://stationapi.veriff.com/v1/sessions",
      {
        verification: {
          vendorData: userUid,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-AUTH-CLIENT": veriffAPIKey,
        },
        timeout: 10000,
      }
    );

    const { url: verificationUrl, id: sessionId } =
      veriffResponse.data.verification;

    // 4) Update Firestore with newly created session info
    await userDocRef.update({
      veriff: {
        sessionUrl: verificationUrl,
        sessionId: sessionId,
        status: "created",
        createdAt: FieldValue.serverTimestamp(),
      },
    });

    // 5) Send the session URL back to the client
    return NextResponse.json({ verificationUrl }, { status: 200 });
  } catch (error) {
    console.error("Error creating Veriff session:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      userUid: userUid || "unknown",
    });

    // Handle specific Axios errors
    if (error.response) {
      return NextResponse.json(
        { error: "Verification service error" },
        { status: 502 }
      );
    }

    // Handle timeout or network errors
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
