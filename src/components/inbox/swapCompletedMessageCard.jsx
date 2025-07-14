"use client";

/* eslint-disable react/prop-types */

import React from "react";
import { Check, PartyPopper, Clock, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import firestoreTimestampToDate from "@/utils/firestoreTimestampToDate";

const SwapCompletedMessageCard = ({ swapRequest, authUser }) => {
  // Determine current user and other party
  const isRequestedFromUser = swapRequest.requestedFrom?.uid === authUser.uid;
  const currentUserInfo = isRequestedFromUser
    ? swapRequest.requestedFrom
    : swapRequest.offeredBy;
  const otherUserInfo = isRequestedFromUser
    ? swapRequest.offeredBy
    : swapRequest.requestedFrom;

  // Get confirmation timestamps
  const currentUserConfirmation =
    swapRequest.confirmationTimestamps?.[currentUserInfo.uid];
  const otherUserConfirmation =
    swapRequest.confirmationTimestamps?.[otherUserInfo.uid];

  // Get tracking numbers
  const currentUserTracking =
    swapRequest.trackingNumbers?.[currentUserInfo.uid];
  const otherUserTracking = swapRequest.trackingNumbers?.[otherUserInfo.uid];

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg border border-green-200 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 dark:bg-green-900/20 py-2 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Swap Completed
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4">
        {/* Celebration Section */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="animate-bounce mb-2">
            <PartyPopper className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-lg sm:text-xl mb-1">
            Swap Successfully Completed!
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Both parties have confirmed shipment and delivery.
          </p>

          {/* Completion Date */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>
              Completed on{" "}
              {firestoreTimestampToDate(
                swapRequest.updatedAt
              ).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="mb-4">
          <h5 className="font-medium text-sm sm:text-base mb-3">
            Shipment Details
          </h5>

          {/* Shipment Cards - Stack on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Current User Shipment */}
            <div className="flex-1 p-3 border rounded-lg bg-green-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Your Shipment</p>
              </div>

              {currentUserConfirmation && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground">
                    Confirmed shipment:
                  </p>
                  <p className="text-xs sm:text-sm font-medium">
                    {firestoreTimestampToDate(
                      currentUserConfirmation
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {currentUserTracking ? (
                <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
                  <Package className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Tracking number:
                    </p>
                    <p className="text-xs sm:text-sm font-mono break-all">
                      {currentUserTracking}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No tracking number provided
                  </p>
                </div>
              )}
            </div>

            {/* Other User Shipment */}
            <div className="flex-1 p-3 border rounded-lg bg-blue-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium">
                  {otherUserInfo.username}&apos;s Shipment
                </p>
              </div>

              {otherUserConfirmation && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground">
                    Confirmed shipment:
                  </p>
                  <p className="text-xs sm:text-sm font-medium">
                    {firestoreTimestampToDate(
                      otherUserConfirmation
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {otherUserTracking ? (
                <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
                  <Package className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Tracking number:
                    </p>
                    <p className="text-xs sm:text-sm font-mono break-all">
                      {otherUserTracking}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No tracking number provided
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {/* <div className="mb-4 p-3 bg-muted/20 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">
                Total Participants
              </p>
              <p className="text-lg font-semibold">2</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Items Exchanged</p>
              <p className="text-lg font-semibold">2</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Completion Time</p>
              <p className="text-lg font-semibold">
                {swapRequest.createdAt && swapRequest.updatedAt
                  ? `${Math.ceil(
                      (firestoreTimestampToDate(swapRequest.updatedAt) -
                        firestoreTimestampToDate(swapRequest.createdAt)) /
                        (1000 * 60 * 60 * 24)
                    )} days`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div> */}

        {/* Archive Notice */}
        <div
          className={cn(
            "w-full p-3 sm:p-4 rounded-md border border-dashed",
            "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
          )}
        >
          <div className="flex items-start gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Chat Archived</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                This swap chat is now archived. You can still view the
                conversation history, but new messages can&apos;t be sent.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                10 days after the swap is completed, both parties will receive
                an automated email where you can review each other.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapCompletedMessageCard;
