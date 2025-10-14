/* eslint-disable react/prop-types */
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase.config";
import { Badge } from "@/components/ui/badge";
import { Truck, Loader2, MapPin, Package } from "lucide-react";
import { toast } from "sonner";

const PendingShipmentMessageCard = ({ message, swapRequest, authUser }) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isConfirmingShipment, setIsConfirmingShipment] = useState(false);

  // Get user info from message
  const isRequestedFromUser = message?.requestedFrom?.uid === authUser.uid;

  // Determine current user and other party
  const currentUserInfo = isRequestedFromUser
    ? message.requestedFrom
    : message.offeredBy;
  const otherUserInfo = isRequestedFromUser
    ? message.offeredBy
    : message.requestedFrom;

  // State for shipment status (initialize from swapRequest, not message)
  const [isCurrentUserShipped, setIsCurrentUserShipped] = useState(
    swapRequest?.shipmentStatus?.[currentUserInfo.uid] || false
  );
  const [isOtherUserShipped, setIsOtherUserShipped] = useState(
    swapRequest?.shipmentStatus?.[otherUserInfo.uid] || false
  );

  // 🔥 ADD: Local state for tracking numbers
  const [currentUserTrackingNumber, setCurrentUserTrackingNumber] = useState(
    swapRequest?.trackingNumbers?.[currentUserInfo.uid] || null
  );
  const [otherUserTrackingNumber, setOtherUserTrackingNumber] = useState(
    swapRequest?.trackingNumbers?.[otherUserInfo.uid] || null
  );

  // Local state for addresses
  const [recipientAddress, setRecipientAddress] = useState(
    isRequestedFromUser
      ? swapRequest.offeredBy?.formattedAddress
      : swapRequest.requestedFrom?.formattedAddress
  );

  // Real-time listener for swap request changes
  useEffect(() => {
    if (!swapRequest?.id) return;

    const swapRequestRef = doc(db, "swap_requests", swapRequest.id);
    const unsubscribe = onSnapshot(swapRequestRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const shipmentStatus = data.shipmentStatus || {};
        const trackingNumbers = data.trackingNumbers || {}; // Get tracking numbers

        console.log("Shipment status update:", shipmentStatus); // Debug
        console.log("Tracking numbers update:", trackingNumbers); // Debug

        // Update both users' shipment status
        setIsCurrentUserShipped(!!shipmentStatus[currentUserInfo.uid]);
        setIsOtherUserShipped(!!shipmentStatus[otherUserInfo.uid]);

        // Update tracking numbers
        setCurrentUserTrackingNumber(
          trackingNumbers[currentUserInfo.uid] || null
        );
        setOtherUserTrackingNumber(trackingNumbers[otherUserInfo.uid] || null);

        // Update recipient address in real-time
        const updatedRecipientAddress = isRequestedFromUser
          ? data.offeredBy?.formattedAddress
          : data.requestedFrom?.formattedAddress;

        if (updatedRecipientAddress) {
          setRecipientAddress(updatedRecipientAddress);
        }
      }
    });

    return () => unsubscribe();
  }, [
    swapRequest?.id,
    currentUserInfo.uid,
    otherUserInfo.uid,
    isRequestedFromUser,
  ]);

  // Helper function to send shipment confirmed email
  const sendShipmentConfirmedEmail = async () => {
    try {
      // Send email to other party that shipment has been confirmed
      const response = await fetch("/api/email/shipment-confirmed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          swapRequest,
          confirmingUserUid: authUser.uid,
          trackingNumber: trackingNumber.trim() || null,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send shipment confirmed email");
      }
    } catch (error) {
      console.error("Error sending shipment confirmed email:", error);
    }
  };

  const handleConfirmShipment = async () => {
    if (isConfirmingShipment) return;

    try {
      setIsConfirmingShipment(true);

      // Call the cloud function
      const response = await fetch("/api/firebase/handle-confirm-shipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          swapRequestId: swapRequest.id,
          userUid: authUser.uid,
          trackingNumber: trackingNumber.trim() || null,
          messageId: message.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to confirm shipment");
      }

      // Update local state based on server response
      setIsCurrentUserShipped(true);

      // Update local tracking number if provided
      if (trackingNumber.trim()) {
        setCurrentUserTrackingNumber(trackingNumber.trim());
      }

      // Send shipment confirmed email
      await sendShipmentConfirmedEmail();

      if (result.data.swapCompleted) {
        toast.success("Swap completed! Both parties have shipped.");
      } else if (result.data.bothShipped) {
        toast.success("Both parties have shipped! Swap is being completed.");
      } else {
        toast.success("Shipment confirmed! Waiting for other party to ship.");
      }

      // Clear tracking number input
      setTrackingNumber("");
    } catch (error) {
      console.error("Error confirming shipment:", error);
      toast.error(
        error.message || "Error confirming shipment. Please try again."
      );
    } finally {
      setIsConfirmingShipment(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg p-3 sm:p-4 border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Truck className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-primary text-sm sm:text-base">
          Pending Shipment
        </h4>
      </div>

      {/* Shipping Address Section */}
      <div className="mb-4 p-3 bg-muted/40 rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h5 className="font-medium text-sm sm:text-base">Ship to:</h5>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground break-words ml-6">
          {recipientAddress || "Address not provided"}
        </p>
      </div>

      {/* Shipment Status Section */}
      <div className="mb-4">
        <h5 className="font-medium text-sm sm:text-base mb-3">
          Shipment Status
        </h5>

        {/* Status Cards - Stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Current User Status */}
          <div className="flex-1 p-3 border rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              Your shipment:
            </p>
            <Badge
              variant={isCurrentUserShipped ? "default" : "outline"}
              className="flex items-center gap-2 w-full sm:w-auto justify-center py-1 mb-2"
            >
              <Truck className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">
                {isCurrentUserShipped ? "Shipped" : "Not shipped yet"}
              </span>
            </Badge>

            {/* Show tracking number if available */}
            {isCurrentUserShipped && currentUserTrackingNumber && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-md">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Tracking:</p>
                  <p className="text-xs sm:text-sm font-mono break-all">
                    {currentUserTrackingNumber}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Other User Status */}
          <div className="flex-1 p-3 border rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              {otherUserInfo.username}&apos;s shipment:
            </p>
            <Badge
              variant={isOtherUserShipped ? "default" : "outline"}
              className="flex items-center gap-2 w-full sm:w-auto justify-center py-1 mb-2"
            >
              <Truck className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">
                {isOtherUserShipped ? "Shipped" : "Not shipped yet"}
              </span>
            </Badge>

            {/* Show tracking number if available */}
            {isOtherUserShipped && otherUserTrackingNumber && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-md">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Tracking:</p>
                  <p className="text-xs sm:text-sm font-mono break-all">
                    {otherUserTrackingNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Section */}
      {!isCurrentUserShipped && (
        <div className="space-y-3">
          <Input
            className="w-full text-base sm:text-sm" // Prevent zoom on iOS
            placeholder="Tracking number (optional)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <Button
            variant="default"
            className="w-full flex items-center justify-center gap-2 hover:cursor-pointer hover:bg-primary/80 shadow-md h-11 sm:h-10"
            onClick={handleConfirmShipment}
            disabled={isConfirmingShipment}
          >
            {isConfirmingShipment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            <span className="text-sm sm:text-base">
              {isConfirmingShipment ? "Confirming..." : "Confirm Shipment"}
            </span>
          </Button>
        </div>
      )}

      {/* Status Messages */}
      {isCurrentUserShipped && !isOtherUserShipped && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 text-center">
            ✅ You&apos;ve confirmed shipment. Waiting for{" "}
            {otherUserInfo.username} to ship.
          </p>
        </div>
      )}
    </div>
  );
};

export default PendingShipmentMessageCard;
