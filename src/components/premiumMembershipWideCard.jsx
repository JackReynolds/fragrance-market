"use client";
import React from "react";
import PremiumBadge from "./ui/premiumBadge";
import GoPremiumButton from "./goPremiumButton";
import { useProfileDoc } from "@/hooks/useProfileDoc";

const PremiumMembershipWideCard = () => {
  const { profileDoc } = useProfileDoc();

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
