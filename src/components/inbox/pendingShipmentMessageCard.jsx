/* eslint-disable react/prop-types */
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase.config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { toast } from "sonner";
const PendingShipmentMessageCard = ({ message, swapRequest, authUser }) => {
  const [trackingNumber, setTrackingNumber] = useState("");

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

  const [isCurrentUserShipped, setIsCurrentUserShipped] = useState(
    swapRequest?.shipmentStatus?.[currentUserInfo.uid] || false
  );
  const [isOtherUserShipped, setIsOtherUserShipped] = useState(
    swapRequest?.shipmentStatus?.[otherUserInfo.uid] || false
  );

  const handleConfirmShipment = async () => {
    // Update swap_request document with shipment confirmed and tracking number if provided
    const swapRequestRef = doc(db, "swap_requests", swapRequest.id);
    const updateData = {
      [`shipmentStatus.${currentUserInfo.uid}`]: true,
    };
    if (trackingNumber) {
      updateData[`shipmentStatus.${currentUserInfo.uid}.trackingNumber`] =
        trackingNumber;
    }

    try {
      await updateDoc(swapRequestRef, updateData);
      setIsCurrentUserShipped(true);

      // Check if other user has confirmed shipment
      if (isOtherUserShipped) {
        await updateDoc(swapRequestRef, { status: "swap_completed" });

        // Update message status to swap_completed
        await updateDoc(
          doc(db, "swap_requests", swapRequest.id, "messages", message.id),
          {
            status: "swap_completed",
          }
        );
      }

      toast.success("Shipment confirmed!");
    } catch (error) {
      console.error("Error confirming shipment:", error);
      toast.error("Error confirming shipment. Please try again.");
    }
  };

  return (
    <Card className="my-4">
      <CardContent className="p-4">
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
            >
              <Truck className="h-4 w-4" />
              <span>Confirm Shipment</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingShipmentMessageCard;
