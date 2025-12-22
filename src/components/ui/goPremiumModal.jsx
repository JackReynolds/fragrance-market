"use client";
/* eslint-disable react/prop-types */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Crown,
  Repeat,
  ShoppingBag,
  ArrowUp,
  MessageSquare,
  Medal,
  Upload,
  X,
  Zap,
  Star,
} from "lucide-react";
import CrownBadge from "./premiumBadge";
import GoPremiumButton from "../goPremiumButton";

const GoPremiumModal = ({
  isOpen,
  onClose,
  profileDoc,
  authUser,
  trigger = "general",
}) => {
  const currency =
    profileDoc?.countryCode === "US"
      ? "USD"
      : profileDoc?.countryCode === "GB"
      ? "GBP"
      : "EUR";

  const price =
    currency === "USD" ? "$5.99" : currency === "GBP" ? "£4.99" : "€5.99";

  const triggerContent = {
    swap_limit: {
      title: "Unlock Unlimited Swaps",
      subtitle: "You've reached your monthly swap limit",
      description:
        "Standard accounts get 1 swap per month. Upgrade to Premium for unlimited swapping and exclusive benefits.",
      highlight: "monthlySwapCount",
    },
    listing_limit: {
      title: "Create Unlimited Listings",
      subtitle: "You've reached your listing limit",
      description:
        "Standard accounts can have 3 active listings. Upgrade to Premium for unlimited listings and more features.",
      highlight: "listings",
    },
    general: {
      title: "Upgrade to Premium",
      subtitle: "Unlock your full potential",
      description:
        "Join thousands of premium members who are making the most of their fragrance collections.",
      highlight: "all",
    },
  };

  const content = triggerContent[trigger] || triggerContent.general;

  const benefits = [
    {
      icon: <Upload className="w-5 h-5" />,
      title: "Unlimited Listings",
      description: "Create as many listings as you want",
      standard: "3 listings max",
      premium: "Unlimited",
      highlight: trigger === "listing_limit",
    },
    {
      icon: <Repeat className="w-5 h-5" />,
      title: "Unlimited Swaps",
      description: "No monthly limits on swapping",
      standard: "1 swap/month",
      premium: "Unlimited",
      highlight: trigger === "swap_limit",
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      title: "Sell Fragrances",
      description: "Monetize your collection",
      standard: "Swaps only",
      premium: "Sell with 5% fee",
      highlight: false,
    },
    {
      icon: <ArrowUp className="w-5 h-5" />,
      title: "Priority Search",
      description: "Higher ranking in search results",
      standard: "Standard ranking",
      premium: "Priority placement",
      highlight: false,
    },
    {
      icon: <Crown className="w-5 h-5" />,
      title: "Premium Badge",
      description: "Stand out with premium status",
      standard: "No badge",
      premium: "Premium badge",
      highlight: false,
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Exclusive Discord",
      description: "Join premium community",
      standard: "No access",
      premium: "Full access",
      highlight: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-white p-6 rounded-t-lg relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <Crown className="absolute top-4 right-4 w-16 h-16" />
            <Star className="absolute bottom-4 left-4 w-12 h-12" />
          </div>

          <div className="relative z-10">
            <DialogHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <CrownBadge size="xl" showGlow={true} animated={true} />
              </div>

              <DialogTitle className="text-2xl md:text-3xl font-bold">
                {content.title}
              </DialogTitle>

              <DialogDescription className="text-white/90 text-lg">
                {content.subtitle}
              </DialogDescription>
            </DialogHeader>

            {/* Current usage display for specific triggers */}
            {trigger === "swap_limit" && (
              <div className="mt-4 bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">
                  {profileDoc?.monthlySwapCount || 0}/1
                </div>
                <div className="text-sm text-white/80">
                  Swaps used this month
                </div>
              </div>
            )}

            {trigger === "listing_limit" && (
              <div className="mt-4 bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">3/3</div>
                <div className="text-sm text-white/80">Active listings</div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-center text-muted-foreground">
            {content.description}
          </p>

          {/* Benefits comparison */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-center mb-4">
              Premium vs Standard
            </h3>

            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className={`transition-all ${
                  benefit.highlight
                    ? "border-primary bg-primary/5 shadow-md"
                    : "hover:shadow-sm"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        benefit.highlight
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {benefit.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{benefit.title}</h4>
                        {benefit.highlight && (
                          <div className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                            BLOCKED
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {benefit.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <X className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Standard: {benefit.standard}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-primary" />
                          <span className="text-primary font-medium">
                            Premium: {benefit.premium}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing */}
          <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CrownBadge size="sm" />
                <span className="font-semibold">Premium Membership</span>
              </div>

              <div className="text-3xl font-bold text-primary mb-1">
                {price}
                <span className="text-lg font-normal text-muted-foreground">
                  /month
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Cancel anytime • Secure payment through Stripe
              </p>

              <GoPremiumButton
                authUser={authUser}
                currency={currency.toLowerCase()}
                className="w-full"
                size="lg"
              />
            </CardContent>
          </Card>

          {/* Social proof */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Join <strong>1,000+</strong> premium members who are maximizing
              their fragrance trading
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t text-center">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoPremiumModal;
