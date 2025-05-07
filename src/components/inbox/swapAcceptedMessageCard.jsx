"use client";
/* eslint-disable react/prop-types */

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button.jsx";
import { Check, CheckCircle, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase.config";
import ManualAddressForm from "@/components/profile/manualAddressForm";
import { useUserDoc } from "@/hooks/useUserDoc";
import { toast } from "sonner";

const SwapAcceptedMessageCard = ({ message, authUser, swapRequest }) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  // const [otherUserAddress, setOtherUserAddress] = useState("");

  const { userDoc } = useUserDoc();
  const router = useRouter();

  // Get user info from message
  const isRequestedFromUser = message?.requestedFrom?.uid === authUser.uid;
  const isOfferedByUser = message?.offeredBy?.uid === authUser.uid;

  // Determine current user and other party
  const currentUserInfo = isRequestedFromUser
    ? message.requestedFrom
    : message.offeredBy;
  const otherUserInfo = isRequestedFromUser
    ? message.offeredBy
    : message.requestedFrom;

  const [currentUserAddressConfirmed, setCurrentUserAddressConfirmed] =
    useState(swapRequest?.addressConfirmation?.[currentUserInfo.uid] || false);
  const [otherUserAddressConfirmed, setOtherUserAddressConfirmed] = useState(
    swapRequest?.addressConfirmation?.[otherUserInfo.uid] || false
  );

  // Store the address for current user
  const [currentUserAddress, setCurrentUserAddress] = useState(
    userDoc?.formattedAddress || ""
  );

  // Function to get address from the user document
  const getUserAddress = async (userUid) => {
    const userRef = doc(db, "users", userUid);
    const userDoc = await getDoc(userRef);
    return userDoc.data().formattedAddress;
  };

  // Use effect to get the other user's address
  // useEffect(() => {
  //   getUserAddress(
  //     authUser.uid === message.offeredBy.uid
  //       ? message.requestedFrom.uid
  //       : message.offeredBy.uid
  //   ).then((address) => {
  //     setOtherUserAddress(address);
  //   });
  // }, [message]);

  // Function to update address confirmation in Firestore
  const updateAddressConfirmation = async (confirmed) => {
    try {
      const swapRequestRef = doc(db, "swap_requests", swapRequest.id);

      // Create an object to update just the current user's confirmation status
      const addressConfirmation = {
        ...(message?.addressConfirmation || {}),
        [currentUserInfo.uid]: confirmed,
      };

      await updateDoc(swapRequestRef, {
        addressConfirmation,
        [`${
          isRequestedFromUser ? "requestedFrom" : "offeredBy"
        }.formattedAddress`]: currentUserAddress,
      });

      // check if both parties have confirmed the address
      if (
        addressConfirmation[currentUserInfo.uid] &&
        addressConfirmation[otherUserInfo.uid]
      ) {
        // Update swap_request document status to pending_shipment
        await updateDoc(swapRequestRef, { status: "pending_shipment" });
        // Update message document status to pending_shipment
        await updateDoc(
          doc(db, "swap_requests", swapRequest.id, "messages", message.id),
          {
            type: "pending_shipment",
          }
        );
        toast.success("Both addresses confirmed! Waiting for shipment.");
      }

      // Update local state
      setCurrentUserAddressConfirmed(confirmed);
    } catch (error) {
      console.error("Error updating address confirmation:", error);
    }
  };

  // Handle address form submission
  const handleSaveAddress = (locationData) => {
    setCurrentUserAddress(locationData.formattedAddress);
    setShowAddressForm(false);
    updateAddressConfirmation(true);
  };

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
                    <Button
                      size="sm"
                      onClick={() => updateAddressConfirmation(true)}
                      className="hover:cursor-pointer hover:bg-primary/80"
                    >
                      <Check size={14} /> Confirm Address
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddressForm(true)}
                      className="hover:cursor-pointer"
                    >
                      <X size={14} /> Update Address
                    </Button>
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
                  onCancel={() => setShowAddressForm(false)}
                />
              </div>
            )}
          </div>

          {/* Other user address confirmation status */}
          <div className="p-3 bg-muted/40 rounded-md">
            <p className="text-sm font-medium mb-1">
              {otherUserInfo.username}&apos;s Address:
            </p>

            {otherUserAddressConfirmed ? (
              <div className="flex items-center text-green-600 mt-1">
                <Check size={16} className="mr-1" />
                <span className="text-sm">Address Confirmed</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600 mt-1">
                <X size={16} className="mr-1" />
                <span className="text-sm">
                  Waiting for Address Confirmation
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
