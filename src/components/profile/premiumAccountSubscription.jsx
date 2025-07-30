"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoPremiumButton } from "@/components/goPremiumButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserDoc } from "@/hooks/useUserDoc";
import PremiumBadge from "@/components/ui/premiumBadge";
import { Crown, Star, ExternalLink } from "lucide-react";

const PremiumAccountSubscription = () => {
  const router = useRouter();
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
      currency = "USD";
      break;
  }

  const isPremium = userDoc?.isPremium;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isPremium ? "bg-amber-100" : "bg-gray-100"
            }`}
          >
            {isPremium ? (
              <Crown className="h-5 w-5 text-amber-600" />
            ) : (
              <Star className="h-5 w-5 text-gray-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">Premium Subscription</CardTitle>
            <CardDescription className="text-sm mt-1">
              {isPremium
                ? "You have access to all premium features"
                : "Upgrade to unlock premium features and benefits"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isPremium ? (
          <>
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <PremiumBadge />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-amber-900">Premium Active</p>
                </div>
                <p className="text-sm text-amber-700">
                  You have full access to all premium features and unlimited
                  swaps.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Your premium benefits:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Unlimited fragrance swaps
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Unlimited fragrance uploads
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Priority fragrance search ranking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Premium badge on your profile
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Ability to sell fragrances
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t">
              <Button
                className="hover:cursor-pointer shadow-md"
                variant="outline"
                onClick={() =>
                  router.push(
                    `https://billing.stripe.com/p/login/test_eVq6oHdpleEngED1wQbMQ00?prefilled_email=${authUser?.email}`
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">
                  Unlock premium benefits:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Unlimited fragrance swaps
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Priority customer support
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Premium badge on your profile
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Early access to new features
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t">
                <GoPremiumButton authUser={authUser} currency={currency} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumAccountSubscription;
