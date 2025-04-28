// src/app/marketplace/page.js
import React, { Suspense } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import MarketplaceClient from "@/components/marketplace/marketplaceClient";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component for Suspense
const MarketplaceLoading = () => (
  <div className="flex-1 w-full">
    <div className="bg-muted py-8 md:py-12">
      <div className="mx-auto px-4">
        <Skeleton className="h-10 w-3/4 mx-auto mb-6" />
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
    <div className="mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[300px] w-full" />
        ))}
      </div>
    </div>
  </div>
);

export default function Marketplace() {
  return (
    <div className="min-h-screen flex flex-col justify-center">
      <Navigation />
      <Suspense fallback={<MarketplaceLoading />}>
        <MarketplaceClient />
      </Suspense>
      <Footer />
    </div>
  );
}
