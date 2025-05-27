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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Loader2 } from "lucide-react";
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

  // Real-time listener for swap request changes
  useEffect(() => {
    if (!swapRequest?.id) return;

    const swapRequestRef = doc(db, "swap_requests", swapRequest.id);
    const unsubscribe = onSnapshot(swapRequestRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const shipmentStatus = data.shipmentStatus || {};

        console.log("Shipment status update:", shipmentStatus); // Debug

        // Update both users' shipment status
        setIsCurrentUserShipped(!!shipmentStatus[currentUserInfo.uid]);
        setIsOtherUserShipped(!!shipmentStatus[otherUserInfo.uid]);
      }
    });

    return () => unsubscribe();
  }, [swapRequest?.id, currentUserInfo.uid, otherUserInfo.uid]);

  const handleConfirmShipment = async () => {
    if (isConfirmingShipment) return;

    try {
      setIsConfirmingShipment(true);

      // Call the cloud function
      const response = await fetch(
        "https://handleconfirmshipment-handleconfirmshipment-qwe4clieqa-nw.a.run.app",
        {
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
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to confirm shipment");
      }

      // Update local state based on server response
      setIsCurrentUserShipped(true);

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

  // Get the correct address to display
  const recipientAddress = isRequestedFromUser
    ? swapRequest.offeredBy?.formattedAddress
    : swapRequest.requestedFrom?.formattedAddress;

  return (
    <Card className="my-4">
      <CardContent className="p-4">
        {/* Section to show the required recipient address */}
        <div className="mb-4">
          <h4 className="font-semibold mb-3">Send your fragrance to:</h4>
          <p className="text-sm text-muted-foreground">
            {recipientAddress || "Address not provided"}
          </p>
        </div>

        <h4 className="font-semibold mb-3">Shipment Status</h4>

        <div className="flex justify-between gap-3 mb-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Your shipment:</p>
            <Badge
              variant={isCurrentUserShipped ? "default" : "outline"}
              className="flex items-center gap-1"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>
                {isCurrentUserShipped ? "Shipped" : "Not shipped yet"}
              </span>
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {otherUserInfo.username}&apos;s shipment:
            </p>
            <Badge
              variant={isOtherUserShipped ? "default" : "outline"}
              className="flex items-center gap-1"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>{isOtherUserShipped ? "Shipped" : "Not shipped yet"}</span>
            </Badge>
          </div>
        </div>

        {!isCurrentUserShipped && (
          <>
            <Input
              className="mb-3"
              placeholder="Tracking number (optional)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
            <Button
              variant="default"
              className="w-full flex items-center gap-2 hover:cursor-pointer hover:bg-primary/80"
              onClick={handleConfirmShipment}
              disabled={isConfirmingShipment}
            >
              {isConfirmingShipment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              <span>
                {isConfirmingShipment ? "Confirming..." : "Confirm Shipment"}
              </span>
            </Button>
          </>
        )}

        {isCurrentUserShipped && !isOtherUserShipped && (
          <div className="text-center p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-700">
              ✅ You&apos;ve confirmed shipment. Waiting for{" "}
              {otherUserInfo.username} to ship.
            </p>
          </div>
        )}

        {isCurrentUserShipped && isOtherUserShipped && (
          <div className="text-center p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              🎉 Both parties have shipped! Swap will be marked as completed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingShipmentMessageCard;
