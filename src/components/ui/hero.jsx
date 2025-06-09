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

          {/* Simple static buttons using Link */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start justify-center sm:justify-start mb-6 sm:mb-8">
            <Button
              asChild
              variant="secondary"
              className="py-3 px-6 sm:py-4 sm:px-8 lg:py-6 w-full sm:w-auto text-sm sm:text-base"
            >
              <Link href="/marketplace">Browse Fragrances</Link>
            </Button>

            <Button
              asChild
              variant="default"
              className="py-3 px-6 sm:py-4 sm:px-8 lg:py-6 hover:bg-primary/80 w-full sm:w-auto text-sm sm:text-base"
            >
              <Link href="/new-listing">Swap or Sell</Link>
            </Button>
          </div>

          {/* Only the search bar needs to be client-side */}
          <HeroSearchBar />
        </div>
      </div>
    </section>
  );
};

export default Hero;
