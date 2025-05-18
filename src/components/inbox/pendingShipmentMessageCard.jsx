/* eslint-disable react/prop-types */
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase.config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { toast } from "sonner";
const PendingShipmentMessageCard = ({ message, swapRequest, authUser }) => {
  const [trackingNumber, setTrackingNumber] = useState("");

  // Get user info from message
  const isRequestedFromUser = message?.requestedFrom?.uid === authUser.uid;

  // Determine current user and other party
  const currentUserInfo = isRequestedFromUser
    ? message.requestedFrom
    : message.offeredBy;
  const otherUserInfo = isRequestedFromUser
    ? message.offeredBy
    : message.requestedFrom;

  const [isCurrentUserShipped, setIsCurrentUserShipped] = useState(
    message?.shipmentStatus?.[currentUserInfo.uid] || false
  );
  const [isOtherUserShipped, setIsOtherUserShipped] = useState(
    message?.shipmentStatus?.[otherUserInfo.uid] || false
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

    // update message with shipment status and tracking number
    await updateDoc(
      doc(db, "swap_requests", swapRequest.id, "messages", message.id),
      {
        ...updateData,
        createdAt: serverTimestamp(),
        readBy: [authUser.uid],
      }
    );

    try {
      await updateDoc(swapRequestRef, updateData);
      setIsCurrentUserShipped(true);

      // Check if other user has confirmed shipment
      if (isOtherUserShipped) {
        // Both users have confirmed shipment, so we can mark the swap as completed
        await updateDoc(swapRequestRef, { status: "swap_completed" });

        // Update message type to swap_completed
        await updateDoc(
          doc(db, "swap_requests", swapRequest.id, "messages", message.id),
          {
            type: "swap_completed",
            completedAt: serverTimestamp(),
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
        {/* Section to show the required recipient address */}
        <div className="mb-4">
          <h4 className="font-semibold mb-3">Send your fragrance to:</h4>
          <p className="text-sm text-muted-foreground">
            {
              swapRequest?.[
                currentUserInfo.uid === message.requestedFrom.uid
                  ? "requestedFrom"
                  : "offeredBy"
              ]?.formattedAddress
            }
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
