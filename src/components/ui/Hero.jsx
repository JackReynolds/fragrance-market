"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import HeroSearchBar from "@/components/ui/heroSearchBar";

const Hero = () => {
  return (
    <section className="relative w-full h-[500px] sm:h-[600px] lg:h-[700px] flex items-center overflow-hidden">
      {/* Hero background image */}
      <div className="absolute inset-0 z-0">
        <div
          style={{
            background:
              "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
          }}
          className="relative w-full h-full"
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-white text-center sm:text-left">
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Discover, Swap, and Sell Fragrances
          </h1>
          <p className="mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl text-white/90">
            Join our exclusive marketplace for fragrance enthusiasts. Find rare
            scents, connect with collectors, and trade with confidence.
          </p>

          {/* Single CTA button */}
          <div className="flex justify-center sm:justify-start mb-6 sm:mb-8">
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="py-4 px-8 sm:py-5 sm:px-10 lg:py-6 lg:px-12 text-base sm:text-lg shadow-lg min-w-[240px] sm:min-w-[260px]"
            >
              <Link href="/marketplace">Browse Fragrances</Link>
            </Button>
          </div>

          {/* Search bar */}
          <HeroSearchBar />
        </div>
      </div>
    </section>
  );
};

export default Hero;
