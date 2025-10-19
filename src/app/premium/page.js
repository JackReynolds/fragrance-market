"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  X,
  Repeat,
  ShoppingBag,
  ArrowUp,
  MessageSquare,
  Medal,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import CrownBadge from "@/components/ui/premiumBadge";
import GoPremiumButton from "@/components/goPremiumButton";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";

export default function PremiumPage() {
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();

  const benefits = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Unlimited Listings",
      description:
        "Create as many fragrance listings as you want. No limits, no restrictions.",
      standardLimit: "2 listings max",
      premiumFeature: "Unlimited",
    },
    {
      icon: <Repeat className="h-6 w-6" />,
      title: "Unlimited Swaps",
      description:
        "Swap fragrances without monthly limits. Trade freely with the community.",
      standardLimit: "1 swap/month",
      premiumFeature: "Unlimited",
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "Sell Fragrances",
      description:
        "Monetize your collection by selling fragrances with secure payments.",
      standardLimit: "Swaps only",
      premiumFeature: "Sell with 5% fee",
    },
    {
      icon: <ArrowUp className="h-6 w-6" />,
      title: "Priority Search Ranking",
      description:
        "Your listings appear higher in search results, getting more visibility.",
      standardLimit: "Standard ranking",
      premiumFeature: "Priority placement",
    },
    {
      icon: (
        <CrownBadge
          outerWidth="6"
          outerHeight="6"
          crownWidth="4"
          crownHeight="4"
        />
      ),
      title: "Premium Badge",
      description:
        "Stand out with a premium badge on your profile and all listings.",
      standardLimit: "No badge",
      premiumFeature: "Premium badge",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Exclusive Discord",
      description:
        "Join our premium community for insider tips and exclusive deals.",
      standardLimit: "No access",
      premiumFeature: "Full access",
    },
    {
      icon: <Medal className="h-6 w-6" />,
      title: "Priority Support",
      description:
        "Get faster responses and dedicated assistance when you need help.",
      standardLimit: "Standard support",
      premiumFeature: "Priority support",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Early Access",
      description:
        "Be first to try new features and get exclusive beta access.",
      standardLimit: "Standard access",
      premiumFeature: "Early access",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        style={{
          background:
            "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
        }}
        className="py-6 md:py-12 relative overflow-hidden"
      >
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <CrownBadge
                outerWidth="16"
                outerHeight="16"
                crownWidth="10"
                crownHeight="10"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-6">
              Unlock Premium Benefits
            </h1>
            <p className="text-sm md:text-base text-white/90 mb-8 max-w-2xl mx-auto">
              Take your fragrance trading to the next level with unlimited
              swaps, selling capabilities, and exclusive community access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GoPremiumButton
                authUser={authUser}
                className="bg-white text-primary hover:bg-white/90 px-8 py-3 text-lg shadow-md hover:cursor-pointer hover:shadow-lg"
              />
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white hover:bg-white hover:text-primary px-8 shadow-md hover:cursor-pointer hover:shadow-lg"
              >
                <Link href="#comparison">Compare Plans</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 opacity-20">
          <div className="w-32 h-32 rounded-full bg-white/10"></div>
        </div>
        <div className="absolute bottom-10 right-10 opacity-20">
          <div className="w-24 h-24 rounded-full bg-white/10"></div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-6 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-lg md:text-xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Premium membership gives you the tools and access to make the most
              of your fragrance collection and community connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="h-full hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 rounded-lg p-3 mr-4">
                      <div className="text-primary">{benefit.icon}</div>
                    </div>
                    <h3 className="font-semibold text-lg">{benefit.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {benefit.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <X className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-muted-foreground">
                        Standard: {benefit.standardLimit}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span className="text-primary font-medium">
                        Premium: {benefit.premiumFeature}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">
              Ready to upgrade your experience?
            </h3>
            <GoPremiumButton authUser={authUser} size="lg" className="px-8" />
          </div>
        </div>
      </section>

      {/* Plan Comparison */}
      <section id="comparison" className="py-6 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-lg md:text-xl font-bold mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Compare what&apos;s included in each plan to find the perfect fit
              for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Standard Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">Standard</CardTitle>
                <div className="text-3xl font-bold">Free</div>
                <p className="text-muted-foreground">
                  Perfect for casual traders
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Browse all listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Up to 2 active listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>1 swap per month</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Standard search ranking</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Basic support</span>
                  </div>
                  <div className="flex items-center">
                    <X className="h-5 w-5 text-muted-foreground mr-3" />
                    <span className="text-muted-foreground">
                      No selling capability
                    </span>
                  </div>
                  <div className="flex items-center">
                    <X className="h-5 w-5 text-muted-foreground mr-3" />
                    <span className="text-muted-foreground">
                      No premium badge
                    </span>
                  </div>
                  <div className="flex items-center">
                    <X className="h-5 w-5 text-muted-foreground mr-3" />
                    <span className="text-muted-foreground">
                      No Discord access
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-6" asChild>
                  <Link href="/sign-up">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 border-primary">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-md">
                MOST POPULAR
              </div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <CrownBadge
                    outerWidth="6"
                    outerHeight="6"
                    crownWidth="4"
                    crownHeight="4"
                  />
                  Premium
                </CardTitle>
                <div className="text-3xl font-bold">
                  {profileDoc?.countryCode === "US"
                    ? "$6.99"
                    : profileDoc?.countryCode === "GB"
                    ? "£5.99"
                    : "€6.99"}
                  <span className="text-base font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="text-muted-foreground">For enthusiasts</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span>Browse all listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium">Unlimited listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium">Unlimited swaps</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium">Priority search ranking</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium">Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium">
                      Sell fragrances (5% fee)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium">Premium badge</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium">
                      Exclusive Discord community
                    </span>
                  </div>
                </div>
                <GoPremiumButton authUser={authUser} className="w-full mt-6" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof / Community */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Join the Premium Community
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with serious fragrance enthusiasts and take advantage of
              exclusive opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Exclusive Community
              </h3>
              <p className="text-muted-foreground">
                Access to premium-only Discord channels with insider tips and
                rare finds.
              </p>
            </Card>

            <Card className="text-center p-6">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Early Access</h3>
              <p className="text-muted-foreground">
                Be the first to try new features and get preview access to major
                updates.
              </p>
            </Card>

            <Card className="text-center p-6">
              <Medal className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Premium Support</h3>
              <p className="text-muted-foreground">
                Get priority help from our team when you need assistance with
                anything.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
