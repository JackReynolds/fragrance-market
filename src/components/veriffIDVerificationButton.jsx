"use client";

/* eslint-disable react/prop-types */

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

const VeriffIDVerificationButton = ({ authUser, userDoc }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [veriffData, setVeriffData] = useState({});
  const [sessionStatus, setSessionStatus] = useState(null);

  console.log("authUser", authUser);

  // Helper function to create Veriff verification session
  const createVeriffSession = async () => {
    if (!authUser?.uid) {
      toast.error("Missing required user information");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/veriff/start-veriff-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add auth token if your API requires it
          // "Authorization": `Bearer ${await authUser.getIdToken()}`
        },
        body: JSON.stringify({
          userUid: authUser.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Veriff session");
      }

      const data = await response.json();

      // Redirect user to the newly created Veriff session
      if (data.verificationUrl) {
        window.location.href = data.verificationUrl;
      } else {
        throw new Error("No verification URL received");
      }
    } catch (error) {
      console.error("Error creating Veriff session:", error.message);
      toast.error(
        error.message.includes("already verified")
          ? "You are already verified"
          : "Failed to create verification session. Please try again.",
        { duration: 4000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionStatus = useCallback(async (sessionId) => {
    if (!sessionId) return null;

    try {
      const response = await fetch(`/api/veriff/fetch-session-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.verifications;
      }
    } catch (error) {
      console.error("Failed to fetch session status:", error);
    }
    return null;
  }, []);

  // Fetch user data from Firestore when component mounts or userDoc changes
  useEffect(() => {
    if (!authUser?.uid) return;

    const fetchUserData = async () => {
      try {
        const db = getFirestore();
        const userRef = doc(db, "users", authUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setVeriffData(userData.veriff || {});
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Error loading verification status", { duration: 3000 });
      }
    };

    fetchUserData();
  }, [authUser?.uid, userDoc]); // Re-run when userDoc changes

  // Check session status when sessionId is available
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      if (veriffData?.sessionId && !veriffData?.decision) {
        const verifications = await fetchSessionStatus(veriffData.sessionId);
        if (mounted && verifications?.length > 0) {
          setSessionStatus(verifications[0]);
        }
      }
    };

    checkStatus();
    return () => {
      mounted = false;
    };
  }, [veriffData?.sessionId, veriffData?.decision, fetchSessionStatus]);

  // Handle verification button click
  const handleVerification = async () => {
    if (!authUser) {
      toast.error("Please sign in to verify your identity");
      return;
    }

    setIsLoading(true);

    const { decision, sessionUrl, sessionId } = veriffData;
    const currentDecision = decision || sessionStatus?.decision;

    try {
      // Handle different verification states
      switch (currentDecision) {
        case "approved":
          toast.info("Your ID is already verified", { duration: 4000 });
          setIsLoading(false);
          return;

        case "declined":
          toast.error(
            "Your ID verification was declined. Please contact support@fragrance-market.com",
            { duration: 6000 }
          );
          setIsLoading(false);
          return;

        case "resubmission_requested":
          if (sessionUrl) {
            toast.info("Reopening your verification session", {
              duration: 3000,
            });
            window.location.href = sessionUrl;
            return;
          }
          // Fall through to create new session
          break;

        default:
          // No decision yet, check if we have pending verifications
          if (sessionId && !currentDecision) {
            const verifications = await fetchSessionStatus(sessionId);
            if (verifications?.length === 0) {
              // No verifications found, create new session
              await createVeriffSession();
              return;
            }

            // Handle existing verification results
            const latestVerification = verifications[0];
            if (latestVerification.decision === "approved") {
              toast.info("Your ID is already verified", { duration: 4000 });
              setIsLoading(false);
              return;
            } else if (latestVerification.decision === "declined") {
              toast.error(
                "Your ID verification was declined. Please contact support@fragrance-market.com",
                { duration: 6000 }
              );
              setIsLoading(false);
              return;
            }
          }
      }

      // Create new verification session
      await createVeriffSession();
    } catch (error) {
      console.error("Verification error:", error);
      setIsLoading(false);
    }
  };

  // Determine button state and content
  const getButtonContent = () => {
    const currentDecision = veriffData?.decision || sessionStatus?.decision;

    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }

    switch (currentDecision) {
      case "approved":
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            ID Verified
          </>
        );
      case "declined":
        return (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Verification Failed
          </>
        );
      case "resubmission_requested":
        return (
          <>
            <Shield className="h-4 w-4" />
            Continue Verification
          </>
        );
      default:
        return (
          <>
            <ShieldCheck className="h-4 w-4" />
            Verify Identity
          </>
        );
    }
  };

  const getButtonVariant = () => {
    const currentDecision = veriffData?.decision || sessionStatus?.decision;

    switch (currentDecision) {
      case "approved":
        return "secondary";
      case "declined":
        return "destructive";
      case "resubmission_requested":
        return "outline";
      default:
        return "default";
    }
  };

  const isDisabled = () => {
    const currentDecision = veriffData?.decision || sessionStatus?.decision;
    return (
      isLoading ||
      currentDecision === "approved" ||
      currentDecision === "declined"
    );
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleVerification}
        disabled={isDisabled()}
        variant={getButtonVariant()}
        size="lg"
        className="w-full sm:w-auto hover:cursor-pointer"
      >
        {getButtonContent()}
      </Button>

      {/* Optional status text */}
      {veriffData?.decision === "approved" && (
        <p className="text-sm text-muted-foreground mt-2">
          Your identity has been successfully verified
        </p>
      )}
      {veriffData?.decision === "declined" && (
        <p className="text-sm text-destructive mt-2">
          Contact support for assistance with verification
        </p>
      )}
      {veriffData?.decision === "resubmission_requested" && (
        <p className="text-sm text-muted-foreground mt-2">
          Additional information required for verification
        </p>
      )}
    </div>
  );
};

export default VeriffIDVerificationButton;
