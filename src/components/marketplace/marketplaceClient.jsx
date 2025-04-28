// src/app/marketplace/MarketplaceClient.jsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/errorBoundary";

// Dynamically import the InstantSearch components with ssr: false
const InstantSearchWrapper = dynamic(
  () => import("@/components/marketplace/instantSearchWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading search...</p>
      </div>
    ),
  }
);

export default function MarketplaceClient() {
  const searchParams = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";

  return (
    <ErrorBoundary>
      <InstantSearchWrapper initialQuery={queryFromURL} />
    </ErrorBoundary>
  );
}
