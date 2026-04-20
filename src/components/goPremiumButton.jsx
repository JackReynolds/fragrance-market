"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";

const GoPremiumButton = ({
  className = "",
  size = "default",
  variant = "default",
  defaultLabel = "Go Premium",
  activeLabel = "Manage Subscription",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { authUser, authLoading } = useAuth();
  const { profileDoc, profileDocLoading } = useProfileDoc();
  const isPremium = Boolean(profileDoc?.isPremium);
  const isMembershipLoading = authLoading || (Boolean(authUser) && profileDocLoading);

  // Determine currency based on country code
  const getCurrency = () => {
    const countryCode = profileDoc?.countryCode;
    if (countryCode === "US") return "USD";
    if (countryCode === "GB") return "GBP";
    return "EUR"; // Default to EUR for EU and other countries
  };

  const openBillingPortal = () => {
    const billingPortalBaseUrl =
      process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL;

    if (!billingPortalBaseUrl) {
      router.push("/my-profile");
      return;
    }

    const billingPortalUrl = `${billingPortalBaseUrl}?prefilled_email=${encodeURIComponent(
      profileDoc?.email || authUser?.email || ""
    )}`;

    window.open(billingPortalUrl, "_blank");
  };

  const createCheckoutSession = async () => {
    setIsLoading(true);
    try {
      if (!authUser) {
        toast.error("Please sign in to continue");
        router.push("/sign-in");
        return;
      }

      const currency = getCurrency();

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userUid: authUser.uid,
          email: authUser.email,
          successUrl: `${window.location.origin}/premium/welcome`,
          cancelUrl: `${window.location.origin}/how-it-works`,
          currency: currency,
        }),
      });

      if (!response.ok) throw new Error("Failed to create checkout session");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (isPremium) {
      openBillingPortal();
      return;
    }

    await createCheckoutSession();
  };

  const getButtonLabel = () => {
    if (isLoading) {
      return "Redirecting...";
    }

    if (isMembershipLoading) {
      return "Checking membership...";
    }

    return isPremium ? activeLabel : defaultLabel;
  };

  return (
    <Button
      onClick={handleClick}
      variant={isPremium ? "outline" : variant}
      size={size}
      className={cn(
        "hover:cursor-pointer shadow-md",
        !isPremium && "hover:bg-primary/80",
        className
      )}
      disabled={isLoading || isMembershipLoading}
    >
      {isLoading || isMembershipLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isPremium ? (
        <ExternalLink className="mr-2 h-4 w-4" />
      ) : null}
      {getButtonLabel()}
    </Button>
  );
};

GoPremiumButton.propTypes = {
  activeLabel: PropTypes.string,
  className: PropTypes.string,
  defaultLabel: PropTypes.string,
  size: PropTypes.oneOf(["default", "sm", "lg", "icon"]),
  variant: PropTypes.oneOf([
    "default",
    "destructive",
    "outline",
    "secondary",
    "ghost",
    "link",
  ]),
};

export default GoPremiumButton;
