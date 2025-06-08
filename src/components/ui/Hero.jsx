"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// Add background styling to hero section
// background: #1F725A;
// background: linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%);

export function Hero() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { authUser } = useAuth();
  // When the user submits the form, route to search-results page with the query param.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length > 0) {
      // Navigate to "/search-results?q=searchTerm"
      //router.push(`/search-results?q=${encodeURIComponent(searchTerm.trim())}`);
      router.push(`/marketplace?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <section className="relative w-full h-[600px] sm:h-[700px] flex items-center overflow-hidden">
      {/* Hero background image */}
      <div className="absolute inset-0 z-0">
        <div
          style={{
            background:
              "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
          }}
          className="relative w-full h-full"
        >
          {/* <Image
            src="/hero-background.jpg"
            alt="Luxury fragrance bottles"
            fill
            className="object-cover object-center mix-blend-overlay opacity-75"
            priority
          /> */}
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-white">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Discover, Swap, and Sell Fragrances
          </h1>
          <p className="mb-8 text-lg sm:text-xl text-white/90">
            Join our exclusive marketplace for fragrance enthusiasts. Find rare
            scents, connect with collectors, and trade with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push("/marketplace")}
              variant={"secondary"}
              className="hover:cursor-pointer py-6"
            >
              Browse Fragrances
            </Button>
            {authUser ? (
              <Button
                variant={"default"}
                className={"hover:cursor-pointer py-6 hover:bg-primary/80"}
                onClick={() => router.push("/new-listing")}
              >
                Swap or Sell
              </Button>
            ) : (
              <Button
                variant={"secondary"}
                className={"hover:cursor-pointer py-6"}
                onClick={() => router.push("/sign-up")}
              >
                Join the Community
              </Button>
            )}
          </div>

          {/* Integrated search box wrapped in a form */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative mt-10 max-w-md"
          >
            <input
              type="search"
              placeholder="Search by brand, name, or notes..."
              className="h-12 w-full rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-10 text-white placeholder:text-white/80 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 hover:cursor-pointer"
              onClick={handleSearchSubmit}
            />
          </form>
        </div>
      </div>
    </section>
  );
}
