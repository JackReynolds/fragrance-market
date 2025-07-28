import React from "react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  Upload,
  Search,
  Repeat,
  ShoppingBag,
  MessageSquare,
  Medal,
  ArrowRight,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";
import GoPremiumButton from "@/components/goPremiumButton";
import CrownBadge from "@/components/ui/premiumBadge";
import StandardCard from "@/components/ui/standardCard";
import PremiumCard from "@/components/premiumCard";
import PremiumMembershipWideCard from "@/components/premiumMembershipWideCard";
import PremiumBenefits from "@/components/premiumBenefits";

const HowItWorks = () => {
  return (
    <div className="flex w-full min-h-screen justify-center items-center flex-col">
      <main className="flex-1 justify-center w-full">
        {/* Hero Section */}
        <section
          style={{
            background:
              "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
          }}
          className="py-16 md:py-24"
        >
          <div className=" px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-100 tracking-tight">
                How The Fragrance Market Works
              </h1>
              <p className="text-gray-100 md:text-xl max-w-[700px] mx-auto">
                Your destination for swapping and discovering premium fragrances
                from enthusiasts around the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button size="lg" asChild variant="secondary">
                  <Link href="/marketplace">
                    Browse Fragrances <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="default"
                  asChild
                  className="hover:bg-primary/80"
                >
                  <Link href="/new-listing">
                    Add Your Fragrance <Upload className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Steps */}
        <section className="py-16 md:py-24">
          <div className=" px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Getting Started is Simple
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 rounded-full p-5 mb-5">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Upload Your Fragrances
                </h3>
                <p className="text-muted-foreground">
                  Take photos and add details about your fragrances. Mark them
                  available for swap or sale.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 rounded-full p-5 mb-5">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Browse the Marketplace
                </h3>
                <p className="text-muted-foreground">
                  Discover fragrances from other collectors. Search by brand,
                  scent type, or user ratings.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 rounded-full p-5 mb-5">
                  <Repeat className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Swap or Purchase</h3>
                <p className="text-muted-foreground">
                  Make an offer to swap or buy. Chat with the owner and finalize
                  the exchange.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Membership Comparison */}
        <section className="py-16 md:py-24 bg-muted">
          <div className=" px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Choose Your Membership
              </h2>
              <p className="text-muted-foreground max-w-[600px] mx-auto">
                Whether you&apos;re just starting or a serious collector, we
                have the right plan for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Standard Plan */}
              <StandardCard />

              <PremiumCard />
            </div>
          </div>
        </section>

        {/* Premium Benefits */}
        <PremiumBenefits />

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-muted">
          <div className=" px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-[600px] mx-auto">
                Everything you need to know about The Fragrance Market
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-background rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">How do swaps work?</h3>
                <p className="text-muted-foreground">
                  Find a fragrance you like, send a swap request with your
                  offering, and wait for the owner to accept. Once accepted,
                  you&apos;ll arrange shipping details through our secure
                  messaging system.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">
                  Can I sell my fragrances?
                </h3>
                <p className="text-muted-foreground">
                  Yes! Premium members can list fragrances for sale with a 5%
                  platform fee. We handle secure payment processing through
                  Stripe.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">
                  How do I know if a user is trustworthy?
                </h3>
                <p className="text-muted-foreground">
                  Check user ratings and reviews from past transactions. We also
                  verify premium members for extra security.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">
                  What happens if a swap goes wrong?
                </h3>
                <p className="text-muted-foreground">
                  Contact our support team immediately. We have a resolution
                  process to help mediate issues between members.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className=" px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold">
                Ready to Join The Fragrance Market?
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Start exploring our collection of premium fragrances or add your
                own to start swapping today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button size="lg" asChild>
                  <Link href="/sign-up">Create Free Account</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/marketplace">Browse Fragrances</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HowItWorks;
