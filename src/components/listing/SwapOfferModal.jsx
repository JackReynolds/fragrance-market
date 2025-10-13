/* eslint-disable react/prop-types */

"use client";
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, and } from "firebase/firestore";
import { db } from "@/firebase.config";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SwapOfferModal = ({
  isOpen,
  onClose,
  currentUser,
  requestedListing,
  requestedFrom,
}) => {
  const [userListings, setUserListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);

  const { authUser } = useAuth();

  // Fetch user's swap listings and check for existing requests
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!currentUser?.uid) return;

      setIsLoading(true);
      try {
        // Fetch user's swap listings
        const listingsRef = collection(db, "listings");
        const q = query(
          listingsRef,
          where("ownerUid", "==", currentUser.uid),
          where("type", "==", "swap"),
          where("status", "==", "active")
        );

        const querySnapshot = await getDocs(q);
        const listings = [];
        querySnapshot.forEach((doc) => {
          listings.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setUserListings(listings);

        // Check for existing swap requests
        const swapRequestsRef = collection(db, "swap_requests");
        const requestsQuery = query(
          swapRequestsRef,
          where("participants", "array-contains", currentUser.uid),
          where("status", "==", "swap_request")
        );

        const requestsSnapshot = await getDocs(requestsQuery);

        // If ANY request exists, store it
        if (!requestsSnapshot.empty) {
          const requestDoc = requestsSnapshot.docs[0];
          setExistingRequest({
            id: requestDoc.id,
            ...requestDoc.data(),
          });
        } else {
          setExistingRequest(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load your listings");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUserListings();
      setSelectedListing(null);
    }
  }, [isOpen, currentUser?.uid, requestedListing.id, requestedFrom.uid]);

  // Create swap request
  const createSwapRequest = async () => {
    try {
      // Get the user's ID token for authentication
      const idToken = await authUser.getIdToken();

      const response = await fetch("/api/firebase/create-swap-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          offeredListingId: selectedListing.id,
          requestedListingId: requestedListing.id,
          requestedFromUid: requestedFrom.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));
        throw new Error(errorData.message || "Failed to create swap request");
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Error creating swap request:", error);
      throw error; // Re-throw to handle in calling function
    }
  };

  // Handle "Send offer" button click
  const handleSubmitOffer = async () => {
    if (!selectedListing) {
      toast.error("Please select a fragrance to offer");
      return;
    }

    if (!authUser) {
      toast.error("Please sign in to send swap offers");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create swap request first (critical)
      await createSwapRequest();

      // Email notification is sent in the create-swap-request route

      toast.success("Swap request sent successfully!");
      onClose();
    } catch (error) {
      console.error("Error sending swap offer:", error);
      toast.error(error.message || "Failed to send swap offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there's an existing request, show different UI
  if (existingRequest) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Swap Request Already Sent</DialogTitle>
            <DialogDescription>
              You already have an active swap request for &quot;
              {requestedListing?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Current offer:
                </p>
                <div className="flex items-center gap-3 bg-white p-3 rounded border">
                  <div className="w-12 h-12 relative">
                    <Image
                      src={
                        existingRequest.offeredListing.imageURL ||
                        "/placeholder-image.jpg"
                      }
                      alt={existingRequest.offeredListing.title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {existingRequest.offeredListing.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {existingRequest.offeredListing.brand} •{" "}
                      {existingRequest.offeredListing.fragrance}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {existingRequest.offeredListing.amountLeft}% full
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can only have one active swap request per listing. You can:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Wait for the current request to be accepted or declined</li>
              <li>• Cancel your current request to send a new one</li>
              <li>• Check your inbox to see the status</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                window.location.href = "/inbox";
              }}
              className="hover:cursor-pointer"
            >
              Go to Inbox
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offer a Swap</DialogTitle>
          <DialogDescription>
            Select one of your fragrances to offer for &quot;
            {requestedListing?.title}&quot;
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : userListings.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any fragrances to swap.
            </p>
            <Button
              onClick={() => (window.location.href = "/new-listing")}
              variant="outline"
            >
              Add a Fragrance
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground mb-2">
              Choose a fragrance to offer:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {userListings.map((listing) => (
                <Card
                  key={listing.id}
                  className={`transition-all cursor-pointer hover:shadow-md ${
                    selectedListing?.id === listing.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedListing(listing)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-16 h-16 relative">
                      <Image
                        src={listing.imageURLs?.[0] || "/placeholder-image.jpg"}
                        alt={listing.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {listing.title}
                      </h3>
                      <div className="flex flex-col mt-1">
                        <p className="text-xs font-semibold text-muted-foreground truncate">
                          {listing.brand}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {listing.fragrance}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {listing.amountLeft}% full
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            className="hover:cursor-pointer hover:bg-primary/5"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitOffer}
            className="hover:cursor-pointer hover:bg-primary/80"
            disabled={isSubmitting || !selectedListing || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send offer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwapOfferModal;
