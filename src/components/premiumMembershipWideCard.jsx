"use client";
import React from "react";
import PremiumBadge from "./ui/premiumBadge";
import GoPremiumButton from "./goPremiumButton";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

const PremiumMembershipWideCard = () => {
  const { profileDoc } = useProfileDoc();

  const isPremium = profileDoc?.isPremium;

  let currency;

  switch (profileDoc?.countryCode) {
    case "US":
      currency = "USD";
      break;
    case "GB":
      currency = "GBP";
      break;
    default:
      currency = "EUR";
  }

  const billingPortalUrl = `${
    process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL
  }?prefilled_email=${encodeURIComponent(profileDoc?.email || "")}`;

  // Already subscribed state
  if (isPremium) {
    return (
      <div className="bg-muted rounded-lg p-6">
        <div className="bg-card border rounded-lg p-8">
          <div className="flex items-center mb-6">
            <PremiumBadge
              outerWidth="12"
              outerHeight="12"
              crownWidth="7"
              crownHeight="7"
            />
            <div className="ml-4">
              <h3 className="font-bold text-base md:text-lg">
                Premium Membership
              </h3>
              <p className="text-sm md:text-base text-primary font-medium">
                Active Subscription
              </p>
            </div>
          </div>

          <div className="mb-6 bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-5 w-5 text-primary" />
              <p className="font-semibold text-primary">
                You&apos;re a Premium Member!
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              You have full access to all premium features including unlimited
              swaps, selling, and priority support.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(billingPortalUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>

          <p className="text-xs md:text-sm text-center text-muted-foreground mt-2">
            Thank you for supporting The Fragrance Market!
          </p>
        </div>
      </div>
    );
  }

  // Not subscribed state
  return (
    <div className="bg-muted rounded-lg p-6">
      <div className="bg-card border rounded-lg p-8">
        <div className="flex items-center mb-6">
          <PremiumBadge
            outerWidth="12"
            outerHeight="12"
            crownWidth="7"
            crownHeight="7"
          />
          <div className="ml-4">
            <h3 className="font-bold text-base md:text-lg">
              Premium Membership
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Billed monthly
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-2xl md:text-4xl font-bold mb-2">
            {currency === "USD"
              ? "$5.99"
              : currency === "GBP"
              ? "£4.99"
              : "€5.99"}
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          </p>
          <p className="text-sm md:text-base text-muted-foreground">
            Secure payment through Stripe
          </p>
        </div>

        <GoPremiumButton />

        <p className="text-xs md:text-sm text-center text-muted-foreground mt-2">
          Cancel anytime. No long-term commitment required.
        </p>
      </div>
    </div>
  );
};

export default PremiumMembershipWideCard;
