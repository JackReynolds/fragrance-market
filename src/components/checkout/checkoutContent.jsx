"use client";

import React, { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import formatCurrency from "@/utils/formatCurrency";
import Image from "next/image";
import CheckoutForm from "@/components/checkout/checkoutForm";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase.config";
import AddressLocationSearch from "@/components/googleLocationSearch";
import ManualAddressForm from "@/components/profile/manualAddressForm";
import { Button } from "@/components/ui/button";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
);

// Separate component that uses useSearchParams
const CheckoutContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, authLoading } = useAuth();
  const { profileDoc } = useProfileDoc();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elementsOptions, setElementsOptions] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [showAddressError, setShowAddressError] = useState(false);

  const listingId = searchParams.get("listingId");

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) {
        toast.error("No listing specified");
        router.push("/marketplace");
        return;
      }

      try {
        const listingRef = doc(db, "listings", listingId);
        const listingDoc = await getDoc(listingRef);

        if (!listingDoc.exists()) {
          toast.error("Listing not found");
          router.push("/marketplace");
          return;
        }

        const listingData = {
          id: listingDoc.id,
          ...listingDoc.data(),
        };

        // Validate listing
        if (listingData.status !== "active") {
          toast.error("This listing is no longer available");
          router.push(`/listings/${listingId}`);
          return;
        }

        if (listingData.type !== "sell") {
          toast.error("This listing is not for sale");
          router.push(`/listings/${listingId}`);
          return;
        }

        setListing(listingData);

        // Set up Stripe Elements options
        setElementsOptions({
          mode: "payment",
          amount: listingData.priceCents,
          currency: listingData.currency?.toLowerCase() || "eur",
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#0066cc",
            },
          },
          locale: "en",
        });
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error("Failed to load listing");
        router.push("/marketplace");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [listingId, router]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !authUser) {
      toast.error("Please sign in to continue");
      router.push(`/sign-in?redirect=/checkout?listingId=${listingId}`);
    }
  }, [authUser, authLoading, router, listingId]);

  // Check if user is owner
  useEffect(() => {
    if (listing && authUser && listing.ownerUid === authUser.uid) {
      toast.error("You cannot purchase your own listing");
      router.push(`/listings/${listingId}`);
    }
  }, [listing, authUser, router, listingId]);

  const handleAddressSelect = (addressData) => {
    setShippingAddress(addressData);
    setShowAddressError(false);
    console.log("Address selected:", addressData);
  };

  const handleManualAddressSave = (addressData) => {
    setShippingAddress(addressData);
    setShowAddressError(false);
    console.log("Manual address saved:", addressData);
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment successful!");
    router.push(`/purchase-success?listingId=${listingId}`);
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    toast.error("Payment failed. Please try again.");
  };

  const validateAddress = () => {
    if (!shippingAddress) {
      setShowAddressError(true);
      toast.error("Please enter your shipping address");
      return false;
    }
    return true;
  };

  // Loading state
  if (isLoading || authLoading || !listing || !elementsOptions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push(`/listings/${listingId}`)}
          className="flex items-center text-sm font-medium mb-6 hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to listing
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary & Address */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {listing.imageURLs?.[0] && (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={listing.imageURLs[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {listing.brand} - {listing.fragrance}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {listing.amountLeft}% full
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>
                      {formatCurrency(
                        listing.priceCents / 100,
                        listing.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing fee</span>
                    <span>Included</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        listing.priceCents / 100,
                        listing.currency
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <CardTitle>Shipping Address</CardTitle>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setUseManualEntry(!useManualEntry)}
                    className="text-xs hover:cursor-pointer hover:bg-primary/80"
                  >
                    {useManualEntry ? "Use search" : "Enter manually"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!useManualEntry ? (
                  <div className="space-y-2">
                    <AddressLocationSearch
                      onSelect={handleAddressSelect}
                      defaultValue={shippingAddress?.formattedAddress}
                    />
                    {shippingAddress && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Selected address:</strong>
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          {shippingAddress.formattedAddress}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ManualAddressForm
                    onSave={handleManualAddressSave}
                    onCancel={() => setUseManualEntry(false)}
                    initialValue={shippingAddress?.addressComponents}
                  />
                )}

                {showAddressError && !shippingAddress && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      Please enter your shipping address before proceeding to
                      payment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What happens next?</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-semibold">1.</span>
                    <span>Payment is processed securely through Stripe</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-semibold">2.</span>
                    <span>You&apos;ll receive a receipt via email</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-semibold">3.</span>
                    <span>The seller will be notified to ship your item</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-semibold">4.</span>
                    <span>Track your order in your purchases dashboard</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <CheckoutForm
                    listing={listing}
                    shippingAddress={shippingAddress}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    validateAddress={validateAddress}
                  />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutContent;
