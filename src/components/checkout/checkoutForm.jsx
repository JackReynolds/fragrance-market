/* eslint-disable react/prop-types */

"use client";
import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { toast } from "sonner";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import formatCurrency from "@/utils/formatCurrency";

// Checkout Form Component (needs to be inside Elements provider)
export default function CheckoutForm({
  listing,
  shippingAddress,
  onSuccess,
  onError,
  validateAddress,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate address first
    if (!validateAddress()) {
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    if (!authUser || !profileDoc) {
      toast.error("Please sign in to continue");
      return;
    }

    if (!shippingAddress) {
      toast.error("Please enter your shipping address");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Trigger form validation
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        setIsProcessing(false);
        return;
      }

      // Create PaymentIntent on the server with shipping address
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          buyerUid: authUser.uid,
          buyerEmail: profileDoc.email,
          buyerName: profileDoc.username || authUser.displayName,
          title: listing.title,
          amount: listing.priceCents,
          currency: listing.currency || "eur",
          ownerUid: listing.ownerUid,
          shippingAddress: shippingAddress, // Include address
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm the payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/purchase-success`,
          receipt_email: profileDoc.email,
        },
        redirect: "if_required", // Only redirect if needed (e.g., 3D Secure)
      });

      if (confirmError) {
        setErrorMessage(confirmError.message);
        setIsProcessing(false);
        onError(confirmError);
      } else {
        // Payment successful
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage(error.message || "Payment failed. Please try again.");
      setIsProcessing(false);
      onError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Secured by Stripe</span>
        </div>

        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card", "paypal"],
          }}
        />
      </div>

      {errorMessage && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !shippingAddress}
        className="w-full hover:cursor-pointer"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Pay {formatCurrency(listing.priceCents / 100, listing.currency)}
          </>
        )}
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        Your payment information is secure and encrypted
      </div>
    </form>
  );
}
