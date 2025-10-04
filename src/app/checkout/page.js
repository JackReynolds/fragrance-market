"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

import CheckoutContent from "@/components/checkout/checkoutContent";

// Main page component with Suspense wrapper
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
