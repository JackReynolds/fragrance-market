"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserDoc } from "@/hooks/useUserDoc";

const StandardCard = () => {
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
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Standard</h3>
          <p className="text-muted-foreground mb-4">
            Perfect for casual fragrance enthusiasts
          </p>
          <p className="text-3xl font-bold">
            {currency === "USD" ? "$0" : currency === "GBP" ? "£0" : "€0"}
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
            <span>Upload up to 5 fragrances</span>
          </li>
          <li className="flex items-center">
            <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
            <span>1 swap per month</span>
          </li>
          <li className="flex items-center">
            <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
            <span>Standard Search Ranking</span>
          </li>
          <li className="flex items-center text-muted-foreground">
            <X className="h-5 w-5 mr-2 flex-shrink-0 opacity-40" />
            <span>Sell fragrances</span>
          </li>
          <li className="flex items-center text-muted-foreground">
            <X className="h-5 w-5 mr-2 flex-shrink-0 opacity-40" />
            <span>Premium badge</span>
          </li>
          <li className="flex items-center text-muted-foreground">
            <X className="h-5 w-5 mr-2 flex-shrink-0 opacity-40" />
            <span>Discord community access</span>
          </li>
        </ul>

        <Button className="w-full" variant="outline" asChild>
          <Link href="/sign-up">Sign Up for Free</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default StandardCard;
