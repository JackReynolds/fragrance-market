/* eslint-disable react/prop-types */

"use client";
import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Lock, Loader2, MapPin, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import formatCurrency from "@/utils/formatCurrency";

// Checkout Form Component (needs to be inside Elements provider)
export default function CheckoutForm({
  listing,
  contactInfo,
  setContactInfo,
  onSuccess,
  onError,
  validateContactInfo,
  ownerStripeAccountId,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [addressComplete, setAddressComplete] = useState(false);
  const { authUser } = useAuth();

  const handleAddressChange = (event) => {
    // Track if address is complete
    setAddressComplete(event.complete);
  };

  const handleEmailChange = (e) => {
    setContactInfo((prev) => ({
      ...prev,
      email: e.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate contact information first
    if (!validateContactInfo()) {
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    if (!authUser) {
      toast.error("Please sign in to continue");
      return;
    }

    // Check if address is complete
    if (!addressComplete) {
      toast.error("Please complete your shipping address");
      setErrorMessage("Please fill in all required shipping address fields");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Trigger form validation for all Stripe elements
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        setIsProcessing(false);
        return;
      }

      // Get the address data from the AddressElement
      const addressElement = elements.getElement("address");
      const { complete, value: addressValue } = await addressElement.getValue();

      if (!complete) {
        setErrorMessage("Please complete your shipping address");
        setIsProcessing(false);
        return;
      }

      console.log("Address collected:", addressValue);

      // Extract name and phone from address element
      const buyerName = addressValue.name;
      const buyerPhone = addressValue.phone;

      // Create PaymentIntent on the server with all collected data
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          buyerUid: authUser.uid,
          buyerName: buyerName,
          buyerEmail: contactInfo.email,
          buyerPhone: buyerPhone,
          title: listing.title,
          amount: listing.priceCents,
          currency: listing.currency || "eur",
          ownerUid: listing.ownerUid,
          shippingAddress: addressValue,
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
          receipt_email: contactInfo.email,
        },
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

  const isFormComplete = contactInfo?.email && addressComplete;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Address Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4" />
          <span>Email Address</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={contactInfo.email}
              onChange={handleEmailChange}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for order confirmation and receipt
          </p>
        </div>
      </div>

      {/* Shipping Address Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4" />
          <span>Shipping Address</span>
        </div>
        <AddressElement
          options={{
            mode: "shipping",
            fields: {
              phone: "always",
            },
          }}
          onChange={handleAddressChange}
        />
      </div>

      {/* Payment Details Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4" />
          <span>Payment Details</span>
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

      {!isFormComplete && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          Please complete your email address and shipping details above before
          proceeding
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !isFormComplete}
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
