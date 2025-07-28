"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import GoPremiumButton from "@/components/goPremiumButton";
import { useAuth } from "@/hooks/useAuth";
import { useUserDoc } from "@/hooks/useUserDoc";

const PremiumCard = () => {
  const { authUser } = useAuth();
  const { userDoc } = useUserDoc();

  let currency;

  switch (userDoc?.countryCode) {
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
    <>
      {/* Premium Plan */}
      <Card className="border-2 border-primary relative">
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-md">
          POPULAR
        </div>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-muted-foreground mb-4">
              For passionate collectors and traders
            </p>
            <p className="text-3xl font-bold">
              {currency === "USD"
                ? "$6.99"
                : currency === "GBP"
                ? "£5.99"
                : "€6.99"}
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span>Browse all listings</span>
            </li>
            <li className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span>
                <strong>Unlimited</strong> fragrance uploads
              </span>
            </li>
            <li className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span>
                <strong>Unlimited</strong> swaps
              </span>
            </li>
            <li className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span>
                <strong>Priority</strong> Search Ranking
              </span>
            </li>
            <li className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span>Sell fragrances with 5% fee</span>
            </li>
            <li className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span>Premium profile badge</span>
            </li>
            <li className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span>Exclusive Discord community</span>
            </li>
          </ul>

          <GoPremiumButton
            authUser={authUser}
            userDoc={userDoc}
            currency={currency}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default PremiumCard;
