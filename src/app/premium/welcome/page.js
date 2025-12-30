"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Repeat,
  ShoppingBag,
  ArrowUp,
  MessageSquare,
  Medal,
  Upload,
  Sparkles,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import CrownBadge from "@/components/ui/premiumBadge";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";

export default function PremiumWelcomePage() {
  const { authUser, authLoading } = useAuth();
  const { profileDoc } = useProfileDoc();
  const router = useRouter();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(true);

  // Set window size for confetti and auto-stop after 5 seconds
  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Redirect if not logged in
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
      icon: (
        <CrownBadge
          outerWidth="5"
          outerHeight="5"
          crownWidth="3"
          crownHeight="3"
        />
      ),
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Confetti celebration */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
        />
      )}

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <PartyPopper className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to <span className="text-primary">Premium</span>
            {profileDoc?.username && <span>, {profileDoc.username}</span>}! 🎉
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You&apos;re now part of an exclusive group of fragrance enthusiasts.
            Here&apos;s everything you&apos;ve unlocked:
          </p>
        </div>

        {/* Premium Badge Celebration */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <CrownBadge size="xl" showGlow={true} animated={true} />
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Premium Badge is Now Active
                </h3>
                <p className="text-muted-foreground">
                  Your profile and all listings now display the premium badge,
                  showing other members you&apos;re a verified premium member.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Your Premium Benefits
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{benefit.title}</h3>
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Put your new premium benefits to use right away.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/new-listing">
                <Upload className="h-5 w-5" />
                Create a Listing
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/marketplace">
                Browse Marketplace
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact our priority support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
