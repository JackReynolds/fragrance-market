// src/components/listing/SwapOfferModal.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  and,
} from "firebase/firestore";
import { db } from "@/firebase.config";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";

const SwapOfferModal = ({
  isOpen,
  onClose,
  currentUser,
  userDoc,
  targetListing,
  targetOwner,
}) => {
  const [userListings, setUserListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequests, setExistingRequests] = useState({});

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
        const swapRequestsRef = collection(db, "swap-requests");
        const requestsQuery = query(
          swapRequestsRef,
          and(
            where("offeredBy.uid", "==", currentUser.uid),
            where("requestedListing.id", "==", targetListing.id),
            where("requestedFrom.uid", "==", targetOwner.id),
            where("status", "==", "pending")
          )
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const existingRequestsMap = {};

        requestsSnapshot.forEach((doc) => {
          const request = doc.data();
          // Use the offered listing ID as the key
          existingRequestsMap[request.offeredListing.id] = {
            id: doc.id,
            ...request,
          };
        });

        setExistingRequests(existingRequestsMap);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load your listings");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUserListings();
    }
  }, [isOpen, currentUser?.uid, targetListing.id, targetOwner.id]);

  // Check if a listing already has a pending request
  const hasExistingRequest = (listingId) => {
    return !!existingRequests[listingId];
  };

  // Handle submitting swap offer
  const handleSubmitOffer = async () => {
    if (!selectedListing) {
      toast.error("Please select a fragrance to offer");
      return;
    }

    // Double check for existing request
    if (hasExistingRequest(selectedListing.id)) {
      toast.error("You already have a pending request for this fragrance");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a new swap request
      const swapRequest = {
        // The user making the offer
        offeredBy: {
          uid: currentUser.uid,
          username: currentUser.displayName || "Unknown",
        },
        // The listing being offered
        offeredListing: {
          id: selectedListing.id,
          title: selectedListing.title,
          brand: selectedListing.brand,
          imageURL: selectedListing.imageURLs?.[0] || "",
        },
        // The owner of the target listing
        requestedFrom: {
          uid: targetOwner.id,
          username: targetOwner.displayName || "Unknown",
        },
        // The listing being requested
        requestedListing: {
          id: targetListing.id,
          title: targetListing.title,
          brand: targetListing.brand,
          imageURL: targetListing.imageURLs?.[0] || "",
        },
        // Status info
        status: "pending", // pending, accepted, rejected, completed
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            text: `Hi, I'd like to offer my ${selectedListing.title} for your ${targetListing.title}.`,
            sentBy: currentUser.uid,
            timestamp: new Date(),
          },
        ],
      };

      await addDoc(collection(db, "swap-requests"), swapRequest);

      toast.success("Swap offer sent successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating swap request:", error);
      toast.error("Failed to send swap offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if any pending requests exist at all
  const hasPendingRequests = Object.keys(existingRequests).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offer a Swap</DialogTitle>
          <DialogDescription>
            Select one of your fragrances to offer for &quot;
            {targetListing?.title}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Show warning if there are pending requests */}
        {hasPendingRequests && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                You already have pending swap requests for this listing
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Fragrances with pending requests are marked below
              </p>
            </div>
          </div>
        )}

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
              {userListings.map((listing) => {
                const isPending = hasExistingRequest(listing.id);

                return (
                  <Card
                    key={listing.id}
                    className={`transition-all ${
                      isPending
                        ? "opacity-75 cursor-not-allowed border-amber-200 bg-amber-50"
                        : "cursor-pointer hover:shadow-md"
                    } ${
                      selectedListing?.id === listing.id && !isPending
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => {
                      if (!isPending) {
                        setSelectedListing(listing);
                      } else {
                        toast.info(
                          "You already have a pending request with this fragrance"
                        );
                      }
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-16 h-16 relative">
                        <Image
                          src={
                            listing.imageURLs?.[0] || "/placeholder-image.jpg"
                          }
                          alt={listing.title}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {listing.title}
                          </h3>
                          {isPending && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] ml-1 flex-shrink-0">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {listing.brand}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitOffer}
            disabled={isSubmitting || !selectedListing || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Offer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

SwapOfferModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  userDoc: PropTypes.object,
  targetListing: PropTypes.object.isRequired,
  targetOwner: PropTypes.object.isRequired,
};

export default SwapOfferModal;
