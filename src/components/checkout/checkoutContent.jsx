"use client";

import React, { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import formatCurrency from "@/utils/formatCurrency";
import Image from "next/image";
import CheckoutForm from "@/components/checkout/checkoutForm";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase.config";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
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
  const [isToastShown, setIsToastShown] = useState(false);
  const [listingIdentifier, setListingIdentifier] = useState(null); // For navigation back to listing

  // Contact information state (email only, name and phone collected via AddressElement)
  const [contactInfo, setContactInfo] = useState({
    email: "",
  });

  const listingId = searchParams.get("listingId");

  // If user is not logged in, redirect to login page
  useEffect(() => {
    // Wait for auth to finish loading before doing anything
    if (authLoading) return;

    // If user is not authenticated, show toast once and redirect
    if (!authUser && !isToastShown) {
      toast.info("Please sign in to proceed");
      setIsToastShown(true);
      router.push("/sign-in"); // or "/" depending on where you want to send them
    }
  }, [authUser, authLoading, router, isToastShown]);

  // Pre-fill email from user profile
  useEffect(() => {
    if (profileDoc && authUser) {
      setContactInfo({
        email: profileDoc.email || authUser.email || "",
      });
    }
  }, [profileDoc, authUser]);

  // Fetch listing data
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

        // Store the identifier for navigation (prefer slug over ID)
        setListingIdentifier(listingData.slug || listingData.id);

        // Validate listing
        if (listingData.status !== "active") {
          toast.error("This listing is no longer available");
          router.push(`/listings/${listingData.slug || listingId}`);
          return;
        }

        if (listingData.type !== "sell") {
          toast.error("This listing is not for sale");
          router.push(`/listings/${listingData.slug || listingId}`);
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

  // Check if user is owner
  useEffect(() => {
    if (listing && authUser && listing.ownerUid === authUser.uid) {
      toast.error("You cannot purchase your own listing");
      router.push(`/listings/${listingIdentifier || listingId}`);
    }
  }, [listing, authUser, router, listingId, listingIdentifier]);

  const handlePaymentSuccess = () => {
    toast.success("Payment successful!");
    router.push(`/purchase-success?listingId=${listingId}`);
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    toast.error("Payment failed. Please try again.");
  };

  const validateContactInfo = () => {
    if (!contactInfo.email) {
      toast.error("Please enter your email address");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      toast.error("Please enter a valid email address");
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
          onClick={() =>
            router.push(`/listings/${listingIdentifier || listingId}`)
          }
          className="flex items-center text-sm font-medium mb-6 hover:underline hover:cursor-pointer"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to listing
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary & Contact Info */}
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
                        alt={`${listing.fragrance} - ${listing.brand}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {listing.fragrance} - {listing.brand}
                    </h3>
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

          {/* Right Column - Payment & Shipping Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment & Shipping Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <CheckoutForm
                    listing={listing}
                    contactInfo={contactInfo}
                    setContactInfo={setContactInfo}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    validateContactInfo={validateContactInfo}
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
