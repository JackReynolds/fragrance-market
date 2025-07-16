"use client";

/* eslint-disable react/prop-types */

import React, { useState } from "react";
import { toast } from "sonner";
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

  // Safe access to veriff data
  const veriffData = userDoc?.veriff || {};
  const { decision, sessionUrl } = veriffData;

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

  // Handle verification button click
  const handleVerification = async () => {
    if (!authUser) {
      toast.error("Please sign in to verify your identity");
      return;
    }

    setIsLoading(true);

    try {
      // Handle different verification states
      switch (decision) {
        case "approved":
          toast.info("Your ID is already verified", { duration: 4000 });
          setIsLoading(false);
          return;

        case "declined":
          toast.error(
            "Your ID verification was declined. Please contact support@thefragrancemarket.com",
            { duration: 6000 }
          );
          setIsLoading(false);
          return;

        case "resubmission_requested":
          if (sessionUrl) {
            toast.info("Reopening your verification session", {
              duration: 3000,
            });
            setIsLoading(false);
            window.location.href = sessionUrl;
            return;
          }
          // Fall through to create new session
          break;

        default:
          await createVeriffSession();
          return;
      }
    } catch (error) {
      console.error("Verification error:", error);
      setIsLoading(false);
    }
  };

  // Determine button state and content
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }

    switch (decision) {
      case "approved":
        return (
          <>
            <CheckCircle className="h-5 w-5" />
            ID Verified
          </>
        );
      case "declined":
        return (
          <>
            <AlertTriangle className="h-5 w-5" />
            Verification Failed
          </>
        );
      case "resubmission_requested":
        return (
          <>
            <Shield className="h-5 w-5" />
            Continue Verification
          </>
        );
      default:
        return (
          <>
            <ShieldCheck className="h-5 w-5" />
            Verify Identity
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (decision) {
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
    return isLoading || decision === "approved" || decision === "declined";
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
      {decision === "approved" && (
        <p className="text-sm text-muted-foreground mt-2">
          Your identity has been successfully verified
        </p>
      )}
      {decision === "declined" && (
        <p className="text-sm text-destructive mt-2">
          Contact support for assistance with verification
        </p>
      )}
      {decision === "resubmission_requested" && (
        <p className="text-sm text-muted-foreground mt-2">
          Additional information required for verification
        </p>
      )}
    </div>
  );
};

export default VeriffIDVerificationButton;
