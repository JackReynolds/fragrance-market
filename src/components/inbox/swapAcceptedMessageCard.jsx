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

        // Access addresses correctly from the swap request structure
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

  // Function to send address confirmed email
  const sendAddressConfirmedEmail = async (
    confirmedAddress = null,
    bothConfirmed = false
  ) => {
    try {
      console.log("bothConfirmed", bothConfirmed);

      const response = await fetch("/api/email/shipping-address-confirmed", {
        method: "POST",
        body: JSON.stringify({
          swapRequestId: swapRequest.id,
          swapRequestData: swapRequest,
          confirmingUserUid: authUser.uid,
          confirmedAddress,
          bothConfirmed,
        }),
      });

      const result = await response.json();

      // Check for error instead of success
      if (result.error) {
        throw new Error(
          result.error || "Failed to send address confirmed email"
        );
      }
    } catch (error) {
      console.error("Error sending address confirmed email:", error);
    }
  };

  // Function to save address to user document
  const saveAddressToUserDocument = async (
    formattedAddress,
    addressComponents = null
  ) => {
    try {
      const response = await fetch("/api/firebase/handle-save-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userUid: authUser.uid,
          formattedAddress,
          addressComponents,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save address");
      }

      return result;
    } catch (error) {
      console.error("Error saving address to user document:", error);
      throw error;
    }
  };

  // Function to update address confirmation in Firestore
  const handleConfirmAddress = async (confirmed, addressOverride = null) => {
    if (!confirmed) return;

    try {
      setIsConfirmingAddress(true);
      const userRole = isRequestedFromUser ? "requestedFrom" : "offeredBy";
      const addressToUse = addressOverride || currentUserAddress;

      // First, save the address to the user's document
      await saveAddressToUserDocument(addressToUse);

      // Then, handle the swap confirmation
      const response = await fetch("/api/firebase/handle-confirm-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          swapRequestId: swapRequest.id,
          userUid: authUser.uid,
          address: addressToUse,
          userRole,
          messageId: message.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to confirm address");
      }

      setCurrentUserAddressConfirmed(true);

      // Use the server-calculated bothConfirmed value
      sendAddressConfirmedEmail(addressToUse, result.data.bothConfirmed);

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
    try {
      // Save to user document first
      await saveAddressToUserDocument(
        locationData.formattedAddress,
        locationData.addressComponents
      );

      // Update local state
      setCurrentUserAddress(locationData.formattedAddress);
      setShowAddressForm(false);

      // Then confirm the address for the swap
      await handleConfirmAddress(true, locationData.formattedAddress);

      toast.success("Address saved and confirmed!");
    } catch (error) {
      console.error("Error in handleSaveAddress:", error);
      toast.error("Failed to save address. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg p-3 sm:p-4 border bg-card shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-primary text-sm sm:text-base">
            Swap Accepted
          </h4>
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
        <div className="w-full">
          <p className="text-xs text-muted-foreground mb-2">
            {isOfferedByUser
              ? "You're offering:"
              : `${message.offeredBy.username} is offering:`}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="relative w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0 border hover:cursor-pointer"
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
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base truncate">
                {message.offeredListing.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.offeredListing.brand}
              </p>
            </div>
          </div>
        </div>

        {/* Visual separator */}
        <div className="w-full flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs text-muted-foreground bg-background px-2">
            for
          </span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Requested item */}
        <div className="w-full">
          <p className="text-xs text-muted-foreground mb-2">
            {isRequestedFromUser
              ? "Your fragrance:"
              : `${message.requestedFrom.username}'s fragrance:`}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0 border">
              <Image
                src={message.requestedListing.imageURL}
                alt={message.requestedListing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base truncate">
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
          <h5 className="font-medium text-sm sm:text-base mb-3">
            Shipping Information
          </h5>

          {/* Current user address confirmation */}
          <div className="mb-3 p-3 bg-muted/40 rounded-md">
            <p className="text-sm font-medium mb-2">Your Shipping Address:</p>

            {!showAddressForm ? (
              <>
                <p className="text-xs sm:text-sm mb-3 text-muted-foreground break-words">
                  {currentUserAddress || "No address provided"}
                </p>

                {!currentUserAddressConfirmed ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {currentUserAddress ? (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmAddress(true)}
                        className="w-full sm:w-auto hover:cursor-pointer hover:bg-primary/80"
                        disabled={isConfirmingAddress}
                      >
                        {isConfirmingAddress ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <Check size={14} className="mr-2" />
                        )}
                        {isConfirmingAddress
                          ? "Confirming..."
                          : "Confirm Address"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setShowAddressForm(true)}
                        className="w-full sm:w-auto hover:cursor-pointer"
                      >
                        Add Address
                      </Button>
                    )}

                    {currentUserAddress && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddressForm(true)}
                        className="w-full sm:w-auto hover:cursor-pointer"
                      >
                        <X size={14} className="mr-2" />
                        Update Address
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 mt-1">
                    <Check size={16} className="mr-2" />
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
            <p className="text-sm font-medium mb-2">
              {otherUserInfo.username}&apos;s Shipping Address:
            </p>
            {otherUserAddressConfirmed && otherUserAddress && (
              <p className="text-xs sm:text-sm mb-2 text-muted-foreground break-words">
                {otherUserAddress}
              </p>
            )}

            {otherUserAddressConfirmed ? (
              <div className="flex items-center text-green-600 mt-1">
                <Check size={16} className="mr-2" />
                <span className="text-sm">Shipping Address Confirmed</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600 mt-1">
                <X size={16} className="mr-2" />
                <span className="text-sm">
                  Waiting for Shipping Address Confirmation
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation status for both parties */}
        <div className="border-t pt-3">
          <h5 className="font-medium text-sm sm:text-base mb-3">
            Confirmation Status:
          </h5>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-xs sm:text-sm text-center">
                {currentUserInfo.username} (You)
              </span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                {currentUserAddressConfirmed ? (
                  <Check size={20} className="text-green-600" />
                ) : (
                  <X size={20} className="text-amber-600" />
                )}
              </div>
            </div>

            <div className="flex-shrink-0 mx-4">
              <div className="w-8 h-px bg-border"></div>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-xs sm:text-sm text-center">
                {otherUserInfo.username}
              </span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
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
    </div>
  );
};

export default SwapAcceptedMessageCard;
