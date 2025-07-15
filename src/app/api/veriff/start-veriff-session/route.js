import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import axios from "axios";

// Define the Veriff secret key as a Firebase secret
const veriffTestSecretKey = process.env.VERIFF_TEST_SECRET_KEY;
const veriffSecretKey = process.env.VERIFF_SECRET_KEY;

export async function POST(request) {
  // Check request method
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const { userUid, firstName, lastName } = request.body;

  try {
    // 1) Fetch the user doc
    const userDocRef = db.collection("users").doc(userUid);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) {
      return NextResponse.json(
        { error: "User not found in Firestore" },
        { status: 404 }
      );
    }

    const userData = userDocSnap.data();
    const decision = userData?.veriff?.decision || "";
    // const verificationAttempts = userData.verificationAttempts || 0;

    // 2) Perform server-side checks
    // a) Check max attempts
    // if (verificationAttempts >= 3) {
    //   return res
    //     .status(403)
    //     .json({ error: "Maximum verification attempts reached." });
    // }

    // Approved => No new session needed
    if (decision === "approved") {
      return NextResponse.json(
        { error: "User is already verified. No new session needed." },
        { status: 400 }
      );
    }

    // Pending => Possibly the user is in the middle of a session. If you want to block:
    // if (verificationStatus === "pending") {
    //   return res
    //     .status(400)
    //     .json({ error: "User verification is still pending." });
    // }

    // resubmission_requested => The user can keep using the SAME session URL
    //   i.e. We only create new sessions if they're "declined", "expired_or_abandoned", or ""
    if (decision === "resubmission_requested") {
      // Return existing session url
      if (
        userData.veriff &&
        userData.veriff?.sessionUrl &&
        userData.veriff?.sessionId
      ) {
        return NextResponse.json(
          { verificationUrl: userData.veriff?.sessionUrl },
          { status: 200 }
        );
      } else {
        // If for some reason your user doc doesn't have the old session,
        // you might fallback to creating a new session below
        console.warn("No existing session URL found, creating new session...");
      }
    }

    // declined or expired_or_abandoned => allow new session
    // or if verificationStatus === "" => user hasn't tried yet => also create new

    // 3) If you reach here, create a new Veriff session
    const secretKey = veriffSecretKey;

    const veriffResponse = await axios.post(
      "https://stationapi.veriff.com/v1/sessions",
      {
        verification: {
          vendorData: userUid,
          person: {
            firstName: firstName,
            lastName: lastName,
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-AUTH-CLIENT": secretKey,
        },
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
      // We consider the user "pending" again since they've started a fresh session
      // verificationStatus: "pending",
    });

    // 5) Send the session URL back to the client
    return NextResponse.json({ verificationUrl }, { status: 200 });
  } catch (error) {
    console.error(
      "Error creating Veriff session:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
