// src/app/marketplace/page.js
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import ErrorBoundary from "@/components/errorBoundary";

// Dynamically import the InstantSearch components with ssr: false
const InstantSearchWrapper = dynamic(
  () => import("@/components/marketplace/instantSearchWrapper"),
  { ssr: false }
);

const Marketplace = () => {
  const searchParams = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";

  return (
    <div className="min-h-screen flex flex-col justify-center">
      <Navigation />

      <ErrorBoundary>
        <InstantSearchWrapper initialQuery={queryFromURL} />
      </ErrorBoundary>

      <Footer />
    </div>
  );
};

export default Marketplace;
