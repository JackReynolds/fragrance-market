"use client";
/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button.jsx";
import { Check, CheckCircle, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase.config";
import ManualAddressForm from "@/components/profile/manualAddressForm";
import { useUserDoc } from "@/hooks/useUserDoc";
import { toast } from "sonner";

const SwapAcceptedMessageCard = ({ message, authUser, swapRequest }) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isConfirmingAddress, setIsConfirmingAddress] = useState(false);

  const { userDoc } = useUserDoc();
  const router = useRouter();

  // Get user info from message
  const isRequestedFromUser = message?.requestedFrom?.uid === authUser.uid;
  const isOfferedByUser = message?.offeredBy?.uid === authUser.uid;

  // Determine current user and other party using swapRequest data
  const currentUserInfo = isRequestedFromUser
    ? swapRequest.requestedFrom
    : swapRequest.offeredBy;
  const otherUserInfo = isRequestedFromUser
    ? swapRequest.offeredBy
    : swapRequest.requestedFrom;

  const [currentUserAddressConfirmed, setCurrentUserAddressConfirmed] =
    useState(swapRequest?.addressConfirmation?.[currentUserInfo.uid] || false);
  const [otherUserAddressConfirmed, setOtherUserAddressConfirmed] = useState(
    swapRequest?.addressConfirmation?.[otherUserInfo.uid] || false
  );

  // Initialize addresses from the swapRequest data
  const [currentUserAddress, setCurrentUserAddress] = useState(
    currentUserInfo?.formattedAddress || userDoc?.formattedAddress || ""
  );
  const [otherUserAddress, setOtherUserAddress] = useState(
    otherUserInfo?.formattedAddress || ""
  );

  // Function to update address confirmation in Firestore
  const updateAddressConfirmation = async (confirmed) => {
    if (!confirmed) return; // Only handle confirmation, not un-confirmation

    try {
      setIsConfirmingAddress(true);
      // Determine user role
      const userRole = isRequestedFromUser ? "requestedFrom" : "offeredBy";

      // Call the cloud function
      const response = await fetch(
        "https://handleconfirmaddress-handleconfirmaddress-qwe4clieqa-nw.a.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            swapRequestId: swapRequest.id,
            userUid: authUser.uid,
            address: currentUserAddress,
            userRole,
            messageId: message.id,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to confirm address");
      }

      // Update local state based on server response
      setCurrentUserAddressConfirmed(true);

      if (result.data.bothConfirmed) {
        if (result.data.pendingShipmentCreated) {
          toast.success("Both addresses confirmed! Ready for shipment.");
        } else {
          toast.success("Address confirmed! Waiting for shipment phase.");
        }
      } else {
        toast.success("Address confirmed! Waiting for other user.");
      }
    } catch (error) {
      console.error("Error confirming address:", error);
      toast.error(error.message || "Failed to confirm address");
    } finally {
      setIsConfirmingAddress(false);
    }
  };

  // Handle address form submission
  const handleSaveAddress = async (locationData) => {
    setCurrentUserAddress(locationData.formattedAddress);
    setShowAddressForm(false);

    // The cloud function will save to user doc, so we don't need to do it here
    await updateAddressConfirmation(true);
  };

  // Add this after your existing useEffects
  useEffect(() => {
    if (!swapRequest?.id) return;

    // Set up real-time listener for swap request changes
    const swapRequestRef = doc(db, "swap_requests", swapRequest.id);
    const unsubscribe = onSnapshot(swapRequestRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const addressConfirmation = data.addressConfirmation || {};

        // Update both users' confirmation status
        setCurrentUserAddressConfirmed(
          !!addressConfirmation[currentUserInfo.uid]
        );
        setOtherUserAddressConfirmed(!!addressConfirmation[otherUserInfo.uid]);

        // FIXED: Access addresses correctly from the swap request structure
        const updatedCurrentUserAddress = isRequestedFromUser
          ? data.requestedFrom?.formattedAddress
          : data.offeredBy?.formattedAddress;

        const updatedOtherUserAddress = isRequestedFromUser
          ? data.offeredBy?.formattedAddress
          : data.requestedFrom?.formattedAddress;

        // Update addresses if they exist
        if (updatedCurrentUserAddress) {
          setCurrentUserAddress(updatedCurrentUserAddress);
        }
        if (updatedOtherUserAddress) {
          setOtherUserAddress(updatedOtherUserAddress);
        }
      }
    });

    // Clean up listener
    return () => unsubscribe();
  }, [
    swapRequest?.id,
    currentUserInfo.uid,
    otherUserInfo.uid,
    isRequestedFromUser,
  ]);

  return (
    <div className="max-w-[90%] w-[400px] rounded-lg p-4 border bg-card shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-primary">Swap Accepted</h4>
          <CheckCircle size={16} className="text-green-600" />
        </div>
        <span className="text-xs text-muted-foreground">
          {message.createdAt
            ? format(
                message.createdAt instanceof Date
                  ? message.createdAt
                  : message.createdAt.toDate(),
                "MMM d, h:mm a"
              )
            : ""}
        </span>
      </div>

      {/* Swap details with images and info */}
      <div className="flex flex-col w-full items-start justify-start gap-3 mb-4">
        {/* Offered item */}
        <div className="flex-1 w-full">
          <p className="text-xs text-muted-foreground mb-1">
            {isOfferedByUser
              ? "You're offering:"
              : `${message.offeredBy.username} is offering:`}
          </p>
          <div className="flex items-center gap-2">
            <div
              className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border hover:cursor-pointer"
              onClick={() => {
                router.push(`/listings/${message.offeredListing.id}`);
              }}
            >
              <Image
                src={message.offeredListing.imageURL}
                alt={message.offeredListing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {message.offeredListing.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.offeredListing.brand}
              </p>
            </div>
          </div>
        </div>

        {/* Requested item */}
        <div className="flex-1 w-full">
          <p className="text-xs text-muted-foreground mb-1">
            {isRequestedFromUser
              ? "For your fragrance:"
              : `For ${message.requestedFrom.username}'s:`}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border">
              <Image
                src={message.requestedListing.imageURL}
                alt={message.requestedListing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {message.requestedListing.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.requestedListing.brand}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Address confirmation section */}
      <div className="border-t pt-3 mt-3">
        <div className="mb-4">
          <h5 className="font-medium text-sm mb-2">Shipping Information</h5>

          {/* Current user address confirmation */}
          <div className="mb-4 p-3 bg-muted/40 rounded-md">
            <p className="text-sm font-medium mb-1">Your Shipping Address:</p>

            {!showAddressForm ? (
              <>
                <p className="text-sm mb-2">
                  {currentUserAddress || "No address provided"}
                </p>

                {!currentUserAddressConfirmed ? (
                  <div className="flex gap-2 mt-3">
                    {currentUserAddress ? (
                      <Button
                        size="sm"
                        onClick={() => updateAddressConfirmation(true)}
                        className="hover:cursor-pointer hover:bg-primary/80"
                      >
                        {isConfirmingAddress ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <>
                            <Check size={14} /> Confirm Address
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setShowAddressForm(true)}
                        className="hover:cursor-pointer w-full"
                      >
                        Add Address
                      </Button>
                    )}

                    {currentUserAddress && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddressForm(true)}
                        className="hover:cursor-pointer"
                      >
                        <X size={14} /> Update Address
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 mt-1">
                    <Check size={16} className="mr-1" />
                    <span className="text-sm">Address Confirmed</span>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2">
                <ManualAddressForm
                  initialValue={{
                    streetAddress: currentUserAddress,
                  }}
                  onSave={handleSaveAddress}
                  onCancel={() => {
                    if (currentUserAddress) {
                      setShowAddressForm(false);
                    } else {
                      toast.error("Please add an address to proceed");
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Other user address confirmation status */}
          <div className="p-3 bg-muted/40 rounded-md">
            <p className="text-sm font-medium mb-1">
              {otherUserInfo.username}&apos;s Shipping Address:{" "}
              {otherUserAddress || "No address provided"}
            </p>

            {otherUserAddressConfirmed ? (
              <div className="flex items-center text-green-600 mt-1">
                <Check size={16} className="mr-1" />
                <span className="text-sm">Shipping Address Confirmed</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600 mt-1">
                <X size={16} className="mr-1" />
                <span className="text-sm">
                  Waiting for Shipping Address Confirmation
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation status for both parties */}
        <div className="border-t pt-3">
          <h5 className="font-medium text-sm mb-2">Confirmation Status:</h5>
          <div className="flex justify-between">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">{currentUserInfo.username} (You)</span>
              {currentUserAddressConfirmed ? (
                <Check size={20} className="text-green-600" />
              ) : (
                <X size={20} className="text-amber-600" />
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">{otherUserInfo.username}</span>
              {otherUserAddressConfirmed ? (
                <Check size={20} className="text-green-600" />
              ) : (
                <X size={20} className="text-amber-600" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapAcceptedMessageCard;
