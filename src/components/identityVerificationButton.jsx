"use client";

/* eslint-disable react/prop-types */

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { resolveIdentityVerification } from "@/lib/identityVerification";

function parseResponseErrorMessage(responseText) {
  if (!responseText) {
    return "";
  }

  try {
    const parsed = JSON.parse(responseText);
    return parsed?.error || parsed?.message || "";
  } catch {
    return "";
  }
}

const IdentityVerificationButton = ({ authUser, profileDoc }) => {
  const [isLoading, setIsLoading] = useState(false);
  const verification = resolveIdentityVerification(profileDoc || {});

  const handleVerification = async () => {
    if (!authUser?.uid) {
      toast.error("Please sign in to verify your identity");
      return;
    }

    if (verification.verified) {
      toast.info("Your ID is already verified", { duration: 4000 });
      return;
    }

    if (verification.locked) {
      toast.error(
        "Identity verification is locked. Contact support@thefragrancemarket.com.",
        { duration: 5000 }
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/identity/start-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userUid: authUser.uid,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        const message = parseResponseErrorMessage(responseText);
        throw new Error(
          message || `Identity session endpoint returned ${response.status}`
        );
      }

      const data = await response.json();
      const verificationUrl =
        typeof data?.verificationUrl === "string"
          ? data.verificationUrl.trim()
          : "";

      if (!verificationUrl) {
        throw new Error("Verification URL was not returned.");
      }

      window.location.href = verificationUrl;
    } catch (error) {
      console.error("Failed to start Stripe Identity verification:", error);
      toast.error(
        error?.message ||
          "Could not start identity verification right now. Please try again.",
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (isLoading) {
      return "Starting verification...";
    }

    if (verification.verified) {
      return "ID Verified";
    }

    if (verification.locked) {
      return "Verification Locked";
    }

    if (
      verification.status === "processing" ||
      verification.status === "requires_input" ||
      verification.status === "canceled"
    ) {
      return "Continue Verification";
    }

    return "Verify Identity";
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }

    if (verification.verified) {
      return <ShieldCheck className="mr-2 h-4 w-4" />;
    }

    if (verification.locked) {
      return <Lock className="mr-2 h-4 w-4" />;
    }

    if (
      verification.status === "processing" ||
      verification.status === "requires_input" ||
      verification.status === "canceled"
    ) {
      return <ShieldAlert className="mr-2 h-4 w-4" />;
    }

    return <ShieldCheck className="mr-2 h-4 w-4" />;
  };

  const variant = verification.verified
    ? "secondary"
    : verification.locked
      ? "destructive"
      : "default";

  return (
    <Button
      onClick={handleVerification}
      disabled={isLoading || verification.verified || verification.locked}
      variant={variant}
      size="lg"
      className="w-full sm:w-auto hover:cursor-pointer"
    >
      {getButtonIcon()}
      {getButtonLabel()}
    </Button>
  );
};

export default IdentityVerificationButton;
