"use client";

/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Info } from "lucide-react";

const VeriffIDVerificationButton = ({ authUser, userDoc, removeTooltip }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [veriffData, setVeriffData] = useState({});

  // Helper function to create Veriff verification session
  const createVeriffSession = async () => {
    // Start new session
    const body = JSON.stringify({
      userUid: authUser.uid,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
    });

    try {
      const response = await fetch("/api/veriff/start-veriff-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create Veriff session.");
      }

      const data = await response.json();
      setIsLoading(false);

      // Redirect user to the newly created Veriff session
      window.location.href = data.verificationUrl;
    } catch (error) {
      console.log("Error creating Veriff session:", error.message);
      setIsLoading(false);
      toast.error(
        "Something went wrong creating the verification session. Please try again later.",
        { autoClose: 3000 }
      );
    }
  };

  const fetchSessionStatus = async (sessionId) => {
    const body = JSON.stringify({
      sessionId,
    });
    try {
      const response = await fetch(`/api/veriff/fetch-session-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
      const data = await response.json();
      return data.verifications;
    } catch (error) {
      toast.error("Failed to fetch session status.", {
        autoClose: 3000,
      });
    }
  };

  // ----------------------------------------------------------------
  // 3) Fetch user data from Firestore when component mounts
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!authUser) return;

    const fetchUserData = async () => {
      try {
        const db = getFirestore();
        const userRef = doc(db, "users", authUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setVerificationAttempts(userData.verificationAttempts || 0);
          setVeriffData(userData.veriff || {}); // e.g., { sessionUrl, sessionId, status }
        } else {
          console.error("User data not found.");
          toast.error("User data not found.", { autoClose: 5000 });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Error fetching user data.", { autoClose: 5000 });
      }
    };

    fetchUserData();
  }, [authUser]);

  // ----------------------------------------------------------------
  // 4) If there's a sessionId, optionally fetch the attempts on mount
  // ----------------------------------------------------------------
  useEffect(() => {
    if (veriffData && veriffData.sessionId) {
      fetchSessionStatus(veriffData.sessionId);
    }
  }, [veriffData]);

  // ----------------------------------------------------------------
  // 5) Handle creation of new Veriff session
  // ----------------------------------------------------------------
  const handleVerification = async () => {
    setIsLoading(true);
    if (!authUser) {
      toast.error("You need to be logged in to verify your identity.");
      return;
    }

    const { decision, sessionUrl, sessionId } = veriffData;

    // If user attempts are too high
    //  if (verificationAttempts >= 3) {
    //   toast.error(
    //     "You have reached the maximum number of verification attempts. Please contact support@kitshare.ie for further assistance.",
    //     { autoClose: 5000 }
    //   );
    //   return;
    // }

    // If there is no decision parameter but there is a session id, run fetchSessionStatus to confirm if there are any updated decisions
    if (!decision && sessionId) {
      console.log("test");
      const verifications = await fetchSessionStatus(veriffData.sessionId);
      console.log(verifications);
      if (verifications && verifications.length === 0) {
        await createVeriffSession();
        setIsLoading(false);
        return;
      }

      verifications.forEach((verification) => {
        if (verification.decision === "approved") {
          toast.info("Your ID is already approved. No need to verify again.", {
            autoClose: 5000,
          });
          return;
        } else if (verification.decision === "declined") {
          toast.error(
            "Your ID verification was declined. Please contact support@kitshare.ie for next steps.",
            { autoClose: 5000 }
          );
          setIsLoading(false);
          return;
        }
      });
    }

    // Handle different verification outcomes based on the decision
    if (decision === "approved") {
      toast.info("Your ID is already approved. No need to verify again.", {
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    } else if (decision === "declined") {
      toast.error(
        "Your ID verification was declined. Please contact support@kitshare.ie for next steps.",
        { autoClose: 5000 }
      );
      setIsLoading(false);
      return;
    } else if (decision === "resubmission_requested") {
      // Optionally let them reuse the same session if you have a valid sessionUrl
      if (veriffData.sessionUrl) {
        toast.info(
          "Veriff requires resubmission. Reopening your session now.",
          {
            autoClose: 3000,
          }
        );
        setIsLoading(false);
        window.location.href = sessionUrl;
      } else {
        // If there's no decision parameter, create a verification session
        await createVeriffSession();
        setIsLoading(false);
        return;
      }
    } else {
      await createVeriffSession();
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 6) Render
  // ----------------------------------------------------------------
  return (
    <div className="relative inline-block">
      <button
        className="btn-primary px-5 py-2"
        onClick={handleVerification}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Click to Verify ID"}
      </button>

      {/* Info Icon and Tooltip (only if removeTooltip is false) */}
      {!removeTooltip && (
        <>
          <Info
            className="ml-2 inline cursor-pointer text-gray-500 hover:text-gray-700"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
          {showTooltip && (
            <div className="absolute top-0 left-full ml-3 w-72 bg-white text-gray-800 p-3 rounded-md shadow-lg z-10">
              <p className="text-sm">
                🌟 At KitShare, we prioritize trust and safety. Verifying your
                ID helps create a secure community where everyone can
                confidently rent and share items.
              </p>
              <p className="text-sm font-semibold mt-2">
                You must verify your ID before you can rent or accept payments.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VeriffIDVerificationButton;
