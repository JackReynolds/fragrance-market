"use client";
/* eslint-disable react/prop-types */

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button.jsx";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase.config";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import profilePicturePlaceholder from "/public/profilePicturePlaceholder.png";

const SwapRequestMessageCard = ({ message, authUser, swapRequest }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Determine if current user is the one being requested from or the one who offered
  const isRequestedFromUser = message?.requestedFrom?.uid === authUser.uid;
  const isOfferedByUser = message?.offeredBy?.uid === authUser.uid;

  const router = useRouter();

  // Helper function to change swap_requests status to pending-shipment
  const changeSwapRequestStatus = async () => {
    const swapRequestRef = doc(db, "swap_requests", swapRequest.id);
    await updateDoc(swapRequestRef, {
      status: "swap_accepted",
      updatedAt: serverTimestamp(),
    });
  };

  // Helper function to decerement unread message count
  const decrementUnreadMessageCount = async (userUid) => {
    try {
      const response = await fetch(
        "/api/firebase/decrement-unread-message-count",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userUid }),
        }
      );
      if (!response.ok) {
        console.log("Failed to decrement unread message count");
      }
    } catch (error) {
      console.error("Error decrementing unread message count:", error);
      toast.error("Error decrementing unread message count");
    }
  };

  // Helper function to update the swap_request message document with type = swap_accepted
  const updateSwapRequestMessage = async () => {
    try {
      setIsAccepting(true);
      const swapRequestMessageRef = doc(
        db,
        "swap_requests",
        swapRequest.id,
        "messages",
        message.id
      );
      await updateDoc(swapRequestMessageRef, {
        type: "swap_accepted",
        createdAt: serverTimestamp(),
        senderUid: authUser.uid,
        readBy: [authUser.uid],
      });
    } catch (error) {
      console.error("Error updating swap request message:", error);
      toast.error("Error updating swap request message");
    } finally {
      setIsAccepting(false);
    }
  };

  // Helper function to send swap accepted email (don't throw errors)
  const sendSwapAcceptedEmail = async () => {
    try {
      const response = await fetch("/api/email/swap-accepted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredByEmail: message.offeredBy.email,
          offeredByUsername: message.offeredBy.username,
          offeredListingTitle: message.offeredListing.title,
          requestedFromUsername: message.requestedFrom.username,
          requestedListingTitle: message.requestedListing.title,
        }),
      });

      if (!response.ok) {
        console.log("Email failed to send, but swap was accepted");
      }
    } catch (error) {
      console.error("Error sending swap accepted email:", error);
      toast.error("Error sending swap accepted email");
    }
  };

  const handleAcceptSwap = async () => {
    try {
      setIsAccepting(true);
      await changeSwapRequestStatus();
      await updateSwapRequestMessage();

      sendSwapAcceptedEmail();

      toast.success("Swap request accepted");
    } catch (error) {
      console.error("Error accepting swap:", error);
      toast.error("Error accepting swap");
    } finally {
      setIsAccepting(false);
    }
  };

  // Helper function to delete swap request and messages collection
  const deleteSwapRequestAndMessages = async () => {
    console.log(swapRequest.id);
    try {
      const response = await fetch(`/api/firebase/delete-swap-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapRequestId: swapRequest.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete swap request");
      }
    } catch (error) {
      console.error("Error deleting swap request:", error);
      toast.error("Error deleting swap request");
    }
  };

  const handleRejectOrCancelSwap = async (decision) => {
    try {
      setIsRejecting(true);
      // delete swap request and messages collection
      await deleteSwapRequestAndMessages();

      // If the requested from user has not yet seen the message, decrement their unreadMessageCount
      if (!message.readBy.includes(message.requestedFrom.uid)) {
        decrementUnreadMessageCount(message.requestedFrom.uid);
      }

      toast.success(
        `Swap request ${decision === "reject" ? "rejected" : "cancelled"}`
      );
    } catch (error) {
      console.error(`Error ${decision}ing swap:`, error);
      toast.error(`Error ${decision}ing swap`);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg p-3 sm:p-4 border bg-card shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-primary text-sm sm:text-base">
          Swap Request
        </h4>
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
          <div className="flex items-center align-center gap-2 mb-2">
            <Image
              src={
                message.offeredBy.profilePictureURL || profilePicturePlaceholder
              }
              alt="Profile Picture"
              width={32}
              height={32}
              className="rounded-full hover:cursor-pointer hover:opacity-80"
              onClick={() => {
                router.push(`/users/${message.offeredBy.uid}`);
              }}
            />

            <p className="text-xs md:text-sm text-muted-foreground">
              {isOfferedByUser
                ? "You're offering:"
                : `${message.offeredBy.username} is offering:`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="relative w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0 border hover:cursor-pointer"
              onClick={() => {
                router.push(
                  `/listings/${
                    message.offeredListing.slug || message.offeredListing.id
                  }`
                );
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
              <p
                className="font-medium text-sm sm:text-base truncate hover:cursor-pointer hover:underline hover:font-semibold"
                onClick={() => {
                  router.push(
                    `/listings/${
                      message.offeredListing.slug || message.offeredListing.id
                    }`
                  );
                }}
              >
                {message.offeredListing.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.offeredListing.brand}
              </p>
              <p className="text-xs sm:text-sm">
                {message.offeredListing.fragrance}
              </p>
              <p className="text-xs sm:text-sm">
                {message.offeredListing.amountLeft}% full
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
              <p className="text-xs sm:text-sm">
                {message.requestedListing.fragrance}
              </p>
              <p className="text-xs sm:text-sm">
                {message.requestedListing.amountLeft}% full
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status message for accepted swaps */}
      {swapRequest.status !== "swap_request" && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <p className="text-sm text-green-700">
            {isRequestedFromUser
              ? "✅ You've accepted this swap request!"
              : `✅ ${message.requestedFrom.username} has accepted this swap request`}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {swapRequest.status === "swap_request" && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end">
          {isRequestedFromUser ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="w-full sm:w-auto hover:cursor-pointer hover:bg-destructive/80 order-2 sm:order-1"
                onClick={() => handleRejectOrCancelSwap("reject")}
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                size="sm"
                className="w-full sm:w-auto hover:cursor-pointer hover:bg-primary/80 order-1 sm:order-2"
                onClick={() => handleAcceptSwap()}
                disabled={isAccepting}
              >
                {isAccepting ? "Accepting..." : "Accept"}
              </Button>
            </>
          ) : isOfferedByUser ? (
            <Button
              size="sm"
              variant="destructive"
              className="w-full sm:w-auto hover:cursor-pointer hover:bg-destructive/80"
              onClick={() => handleRejectOrCancelSwap("cancel")}
              disabled={isRejecting}
            >
              {isRejecting ? "Cancelling..." : "Cancel Request"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SwapRequestMessageCard;
