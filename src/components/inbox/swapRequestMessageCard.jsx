"use client";
/* eslint-disable react/prop-types */

import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button.jsx";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase.config";
import Image from "next/image";
import { useRouter } from "next/navigation";
const SwapRequestMessageCard = ({ message, authUser, swapRequest }) => {
  // Determine if current user is the one being requested from or the one who offered
  const isRequestedFromUser = message?.requestedFrom?.uid === authUser.uid;
  const isOfferedByUser = message?.offeredBy?.uid === authUser.uid;

  const router = useRouter();

  // Helper function to change swap_requests status to pending-shipment
  const changeSwapRequestStatus = async () => {
    const swapRequestRef = doc(db, "swap_requests", swapRequest.id);
    await updateDoc(swapRequestRef, {
      status: "swap_accepted",
    });
  };

  // Helper function to change swap_request message document status to swap_accepted
  const changeSwapRequestMessageStatus = async () => {
    const swapRequestMessageRef = doc(
      db,
      "swap_requests",
      swapRequest.id,
      "messages",
      message.id
    );
    await updateDoc(swapRequestMessageRef, {
      status: "swap_accepted",
    });
  };

  const handleAcceptSwap = async () => {
    await changeSwapRequestStatus();
    await changeSwapRequestMessageStatus();
  };

  const handleRejectSwap = () => {
    console.log("Reject swap");
  };

  return (
    <div className="max-w-[90%] w-[400px] rounded-lg p-4 border bg-card shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-primary">Swap Request</h4>
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
              <p
                className="font-medium text-sm truncate hover:cursor-pointer hover:underline hover:font-semibold"
                onClick={() => {
                  router.push(`/listings/${message.offeredListing.id}`);
                }}
              >
                {message.offeredListing.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.offeredListing.brand}
              </p>
              <p className="text-xs">{message.offeredListing.fragrance}</p>
              <p className="text-xs">
                {message.offeredListing.amountLeft}% full
              </p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        {/* <div className="px-2">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div> */}

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
              <p className="text-xs">{message.requestedListing.fragrance}</p>
              <p className="text-xs">
                {message.requestedListing.amountLeft}% full
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2 justify-end">
        {isRequestedFromUser ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="hover:cursor-pointer hover:bg-destructive/80"
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="hover:cursor-pointer hover:bg-primary/80"
              onClick={() => handleAcceptSwap()}
            >
              Accept
            </Button>
          </>
        ) : isOfferedByUser ? (
          <Button
            size="sm"
            variant="destructive"
            className="hover:cursor-pointer hover:bg-destructive/80"
            onClick={() => handleRejectSwap()}
          >
            Cancel Request
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default SwapRequestMessageCard;
