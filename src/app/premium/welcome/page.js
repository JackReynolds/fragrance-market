"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Crown,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Repeat,
  ShoppingBag,
  ArrowUp,
  Medal,
  Upload,
} from "lucide-react";
import Link from "next/link";
import CrownBadge from "@/components/ui/premiumBadge";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { useRouter } from "next/navigation";
import PremiumDiscordAccessCard from "@/components/premiumDiscordAccessCard";

export default function PremiumWelcomePage() {
  const { authUser, authLoading } = useAuth();
  const { profileDoc, profileDocLoading } = useProfileDoc();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/sign-in");
    }
  }, [authUser, authLoading, router]);

  const benefits = [
    {
      icon: <Upload className="h-5 w-5" />,
      title: "Unlimited Listings",
      description: "Create as many fragrance listings as you want.",
    },
    {
      icon: <Repeat className="h-5 w-5" />,
      title: "Unlimited Swaps",
      description: "Trade freely with the community, no monthly limits.",
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      title: "Sell Fragrances",
      description: "Monetize your collection with secure payments.",
    },
    {
      icon: <ArrowUp className="h-5 w-5" />,
      title: "Priority Search Ranking",
      description: "Your listings appear higher in search results.",
    },
    {
      icon: <Crown className="h-5 w-5" />,
      title: "Premium Badge",
      description: "Stand out with a badge on your profile and listings.",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Exclusive Discord",
      description: "Join our premium community for insider tips.",
    },
    {
      icon: <Medal className="h-5 w-5" />,
      title: "Priority Support",
      description: "Get faster responses when you need help.",
    },
  ];

  if (authLoading || profileDocLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading premium access...
        </div>
      </div>
    );
  }

  const premiumIsActive = Boolean(profileDoc?.isPremium);

  if (!premiumIsActive) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(31,114,90,0.12),_transparent_45%),linear-gradient(to_bottom,_rgba(31,114,90,0.04),_transparent_28%)]">
        <div className="container mx-auto flex max-w-3xl px-4 py-16 md:px-6 md:py-24">
          <Card className="w-full border-primary/15 shadow-sm">
            <CardHeader className="space-y-4 pb-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Crown className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">
                  Premium Setup
                </p>
                <CardTitle className="text-3xl tracking-tight">
                  We&apos;re confirming your premium access
                </CardTitle>
                <CardDescription className="mx-auto max-w-xl text-base leading-7">
                  This page is only actionable once your premium membership is active.
                  If you&apos;ve just completed checkout, your membership should appear here in a moment.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm text-muted-foreground">
                Discord connection is blocked until the profile document shows an active
                premium membership. This prevents non-premium users from starting the
                Discord OAuth flow.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild>
                  <Link href="/my-profile">Go to My Profile</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/premium">View Premium Plans</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(31,114,90,0.12),_transparent_42%),linear-gradient(to_bottom,_rgba(31,114,90,0.04),_transparent_30%)]">
      <div className="container mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-10 space-y-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
            Premium Membership Active
          </p>

          <div className="mx-auto max-w-4xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Welcome to Premium
              {profileDoc?.username ? (
                <span className="text-primary">, {profileDoc.username}</span>
              ) : null}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              Your membership is active. Connect Discord, confirm your premium badge,
              and start using your upgraded marketplace access.
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-primary/15 bg-white/85 shadow-sm backdrop-blur">
            <CardContent className="flex items-center gap-5 p-6 md:p-8">
              <div className="hidden sm:block">
                <CrownBadge size="xl" showGlow={true} animated={true} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                  Membership Status
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Your premium badge is already live
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  Your profile and listings now display premium status, helping other
                  members recognise you immediately across the marketplace.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-primary/[0.035] shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                  Setup Flow
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Membership confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        Your premium features are already active in the app.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Connect Discord</p>
                      <p className="text-sm text-muted-foreground">
                        Link your Discord account below to activate server access.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Start using premium benefits</p>
                      <p className="text-sm text-muted-foreground">
                        List, trade, sell, and manage your upgraded account immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-10">
          <PremiumDiscordAccessCard returnTo="/premium/welcome" />
        </div>

        <div className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/75">
                Included Benefits
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Everything unlocked with Premium
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-primary/10 bg-white/80 shadow-sm backdrop-blur"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {benefit.icon}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-primary/15 bg-white/75 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                Next Actions
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Put your upgraded account to work
              </h2>
              <p className="text-sm leading-7 text-muted-foreground md:text-base">
                Create a new listing, browse the marketplace, or come back here later to
                finish Discord access if the subscription webhook is still catching up.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/new-listing">
                  <Upload className="h-5 w-5" />
                  Create Listing
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/marketplace">
                  Browse Marketplace
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/[0.03] p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            Discord connection is enforced server-side. Only profiles with active premium
            status can start the OAuth flow, and your account will update here automatically
            once the subscription webhook lands.
          </div>
        </div>
      </div>
    </div>
  );
}
