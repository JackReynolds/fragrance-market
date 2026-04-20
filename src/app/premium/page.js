"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUp,
  Check,
  Medal,
  MessageSquare,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CrownBadge from "@/components/ui/premiumBadge";
import GoPremiumButton from "@/components/goPremiumButton";
import IdentityVerificationButton from "@/components/identityVerificationButton";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { resolveIdentityVerification } from "@/lib/identityVerification";

function getMonthlyPrice(countryCode) {
  if (countryCode === "US") return "$5.99";
  if (countryCode === "GB") return "£4.99";
  return "€5.99";
}

export default function PremiumPage() {
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();
  const isPremium = Boolean(profileDoc?.isPremium);
  const verification = resolveIdentityVerification(profileDoc || {});
  const monthlyPrice = getMonthlyPrice(profileDoc?.countryCode);

  const heroTitle = isPremium
    ? "Your Premium Membership Is Active"
    : "Upgrade for Better Trading and Trusted Selling";
  const heroDescription = isPremium
    ? "Your premium features are live. Manage your membership, finish verification, and complete seller setup from here."
    : "Premium unlocks unlimited swaps and listings, exclusive Discord access, and the verified path to selling fragrances safely.";
  const secondaryCtaHref = isPremium
    ? verification.verified
      ? "/new-listing"
      : "/my-profile"
    : "#comparison";
  const secondaryCtaLabel = isPremium
    ? verification.verified
      ? "Create a Listing"
      : "Complete Seller Setup"
    : "Compare Plans";

  const benefits = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Unlimited Listings",
      description:
        "Create as many fragrance listings as you want without hitting a cap.",
      standardLimit: "3 active listings",
      premiumFeature: "Unlimited listings",
    },
    {
      icon: <Repeat className="h-6 w-6" />,
      title: "Unlimited Swaps",
      description:
        "Trade more often without waiting for a monthly reset to make another swap.",
      standardLimit: "1 swap per month",
      premiumFeature: "Unlimited swaps",
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "Selling Access",
      description:
        "Unlock the ability to sell fragrances, with ID verification and seller setup required before your first sale.",
      standardLimit: "Swaps only",
      premiumFeature: "Sell with 5% fee",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Trusted Seller Flow",
      description:
        "Complete Stripe Identity verification to earn the ID Verified badge and give buyers more confidence.",
      standardLimit: "No verification access",
      premiumFeature: "ID Verified badge",
    },
    {
      icon: <ArrowUp className="h-6 w-6" />,
      title: "Priority Search Ranking",
      description:
        "Your listings appear higher in search results, giving you more visibility.",
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
        "Stand out across your profile and listings with visible premium status.",
      standardLimit: "No premium badge",
      premiumFeature: "Premium badge",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Exclusive Discord",
      description:
        "Join premium-only channels for discussion, rare finds, and insider conversation.",
      standardLimit: "No Discord access",
      premiumFeature: "Full access",
    },
    {
      icon: <Medal className="h-6 w-6" />,
      title: "Priority Support",
      description:
        "Get faster support when you need help with account, payments, or listings.",
      standardLimit: "Standard support",
      premiumFeature: "Priority support",
    },
  ];

  const trustedSellingSteps = [
    {
      title: "Upgrade to Premium",
      description:
        "Premium unlocks selling, unlimited activity, and access to ID verification.",
    },
    {
      title: "Verify your identity",
      description:
        "Stripe Identity checks your ID so your profile can show an ID Verified badge.",
    },
    {
      title: "Connect seller payouts",
      description:
        "Finish your Stripe seller setup so you can receive funds from completed sales.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative overflow-hidden py-8 md:py-14"
        style={{
          background:
            "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
        }}
      >
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 text-center">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                <CrownBadge
                  outerWidth="5"
                  outerHeight="5"
                  crownWidth="3"
                  crownHeight="3"
                />
                {isPremium ? "Premium Active" : "Premium Membership"}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <CrownBadge
                  outerWidth="16"
                  outerHeight="16"
                  crownWidth="10"
                  crownHeight="10"
                />
              </div>
              <h1 className="text-2xl font-bold text-white md:text-4xl">
                {heroTitle}
              </h1>
              <p className="mx-auto max-w-3xl text-sm text-white/90 md:text-base">
                {heroDescription}
              </p>
            </div>

            <div className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">
                Selling on The Fragrance Market
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Premium unlocks selling access. Before you can create sale
                listings, you will also need to verify your identity and finish
                your Stripe seller setup.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <GoPremiumButton
                size="lg"
                activeLabel="Manage Membership"
                className={
                  isPremium
                    ? "min-w-[220px] border-white/30 bg-white/10 text-white hover:bg-white hover:text-primary"
                    : "min-w-[220px] bg-white text-primary hover:bg-white/90"
                }
              />
              <Button
                variant="outline"
                size="lg"
                asChild
                className="min-w-[220px] border-white/30 bg-white/10 text-white shadow-md hover:bg-white hover:text-primary"
              >
                <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute left-10 top-10 opacity-20">
          <div className="h-32 w-32 rounded-full bg-white/10" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-20">
          <div className="h-24 w-24 rounded-full bg-white/10" />
        </div>
      </section>

      <section className="py-8 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-bold md:text-2xl">
              Everything Included with Premium
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Premium is built for members who want fewer limits, more
              visibility, and a trusted route into selling.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="h-full border-border/60 transition-shadow hover:shadow-lg"
              >
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                  </div>

                  <p className="mb-5 text-sm text-muted-foreground">
                    {benefit.description}
                  </p>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center text-sm">
                      <X className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Standard: {benefit.standardLimit}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">
                        Premium: {benefit.premiumFeature}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-8 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-primary/15">
              <CardContent className="p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Trusted Selling
                </p>
                <h2 className="mt-3 text-xl font-bold md:text-2xl">
                  Premium unlocks selling. Verification adds trust.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Upgrade to premium to access selling tools, then complete ID
                  verification and Stripe seller setup to become a trusted
                  seller on the marketplace.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {trustedSellingSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="rounded-xl border bg-background p-4"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Your seller setup status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!authUser ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Sign in to see whether premium is already active and to
                      continue the trusted seller setup flow.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                  </>
                ) : !isPremium ? (
                  <>
                    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                      <p className="font-medium text-foreground">
                        Premium is the first step
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Upgrade first, then verify your identity and connect
                        Stripe payouts before creating sale listings.
                      </p>
                    </div>
                    <GoPremiumButton size="lg" className="w-full" />
                  </>
                ) : verification.verified ? (
                  <>
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-2 text-green-900">
                        <ShieldCheck className="h-5 w-5" />
                        <p className="font-medium">Identity verified</p>
                      </div>
                      <p className="mt-2 text-sm text-green-800">
                        Your profile can display the ID Verified badge. If you
                        have also completed Stripe seller setup, you are ready
                        to create sale listings.
                      </p>
                    </div>
                    <Button asChild className="w-full" size="lg">
                      <Link href="/new-listing">Create a Listing</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-medium text-amber-900">
                        Verification still needs to be completed
                      </p>
                      <p className="mt-2 text-sm text-amber-800">
                        Premium is active, but ID verification is still required
                        before you can sell fragrances on the platform.
                      </p>
                    </div>
                    <IdentityVerificationButton
                      authUser={authUser}
                      profileDoc={profileDoc}
                    />
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      You will also need to finish your Stripe seller payout
                      setup in your profile before your first sale.
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="comparison" className="py-8 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-bold md:text-2xl">Choose Your Plan</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Standard works for browsing and occasional swapping. Premium is
              designed for heavier trading and the verified seller route.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
            <Card className="relative flex h-full flex-col">
              <CardHeader className="pb-6 text-center">
                <CardTitle className="text-2xl">Standard</CardTitle>
                <div className="text-3xl font-bold">Free</div>
                <p className="text-muted-foreground">
                  Best for browsing and occasional swaps
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-green-500" />
                    <span>Browse all listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-green-500" />
                    <span>Up to 3 active listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-green-500" />
                    <span>1 swap per month</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-green-500" />
                    <span>Standard support</span>
                  </div>
                  <div className="flex items-center">
                    <X className="mr-3 h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      No selling access
                    </span>
                  </div>
                  <div className="flex items-center">
                    <X className="mr-3 h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      No ID verification flow
                    </span>
                  </div>
                  <div className="flex items-center">
                    <X className="mr-3 h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      No premium Discord access
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={authUser ? "/marketplace" : "/sign-up"}>
                      {authUser ? "Browse Marketplace" : "Get Started Free"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="relative flex h-full flex-col border-2 border-primary">
              <div className="absolute right-0 top-0 rounded-bl-lg rounded-tr-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {isPremium ? "YOUR PLAN" : "MOST POPULAR"}
              </div>
              <CardHeader className="pb-6 text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <CrownBadge
                    outerWidth="6"
                    outerHeight="6"
                    crownWidth="4"
                    crownHeight="4"
                  />
                  Premium
                </CardTitle>
                <div className="text-3xl font-bold">
                  {monthlyPrice}
                  <span className="text-base font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="text-muted-foreground">
                  For members who want more activity, more visibility, and a
                  trusted seller profile
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span>Browse all listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span className="font-medium">Unlimited listings</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span className="font-medium">Unlimited swaps</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span className="font-medium">Priority search ranking</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span className="font-medium">Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span className="font-medium">
                      Sell fragrances after ID verification
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span className="font-medium">Premium badge</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span className="font-medium">
                      Exclusive Discord community
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <GoPremiumButton
                    size="lg"
                    activeLabel="Manage Membership"
                    className="w-full"
                  />
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Premium unlocks the seller flow. ID verification and Stripe
                    payout setup are still required before your first sale.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-8 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-bold md:text-2xl">
              Built for More Confidence
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Premium works best when visibility, community, and trust signals
              all reinforce each other.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="p-6 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">Exclusive Community</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Premium-only Discord access keeps your most engaged members in
                one place.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">Trusted Profiles</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Verified sellers can display stronger trust signals, which is
                especially important once money is involved.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Wallet className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">Monetise Your Collection</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Premium is the doorway into selling, with Stripe handling secure
                checkout and payouts.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
