"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function PurchaseSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser } = useAuth();
  const [countdown, setCountdown] = useState(10);

  const paymentIntent = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (countdown === 0) {
      router.push("/my-profile");
      // The profile page will auto-load purchases tab when clicked
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  const handleViewPurchases = () => {
    router.push("/my-profile");
    // Note: You could add a query param like ?activeTab=purchases if you implement URL-based tab switching
  };

  const handleContinueShopping = () => {
    router.push("/marketplace");
  };

  if (redirectStatus !== "succeeded") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-yellow-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold">Processing Payment...</h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Icon and Header */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Thank you for your purchase. Your order has been confirmed and the
            seller will ship your item soon.
          </p>
        </div>

        {/* Details Card */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    What happens next?
                  </h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-semibold text-primary">1.</span>
                      <span>
                        You&apos;ll receive a confirmation email with your order
                        details
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-primary">2.</span>
                      <span>
                        The seller has been notified and will prepare your item
                        for shipping
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-primary">3.</span>
                      <span>
                        You&apos;ll receive tracking information once your item
                        ships
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-primary">4.</span>
                      <span>
                        Track your order status anytime in your purchases
                        section
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {paymentIntent && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Order Reference: {paymentIntent}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Button
            onClick={handleViewPurchases}
            size="lg"
            className="flex-1 hover:cursor-pointer"
          >
            View My Purchases
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={handleContinueShopping}
            variant="outline"
            size="lg"
            className="flex-1 hover:cursor-pointer"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Auto-redirect notice */}
        <div className="text-center text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
          Redirecting to your purchases in {countdown} seconds...
        </div>
      </div>
    </div>
  );
}
