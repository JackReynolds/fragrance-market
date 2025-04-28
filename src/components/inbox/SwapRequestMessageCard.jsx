import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button.jsx";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

const SwapRequestMessageCard = ({ message, authUser }) => {
  // Determine if current user is the one being requested from or the one who offered
  const isRequestedFromUser = message?.requestedFrom?.uid === authUser.uid;
  const isOfferedByUser = message?.offeredBy?.uid === authUser.uid;

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
      <div className="flex items-center justify-between mb-4">
        {/* Left side - Offered item */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            {isOfferedByUser ? "You're offering:" : "They're offering:"}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border">
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
              <p className="text-xs">{message.offeredBy.username}</p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="px-2">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Right side - Requested item */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            {isRequestedFromUser ? "Your fragrance:" : "They want:"}
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
              <p className="text-xs">{message.requestedFrom.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2 justify-end">
        {isRequestedFromUser ? (
          <>
            <Button size="sm" variant="destructive">
              Reject
            </Button>
            <Button size="sm">Accept</Button>
          </>
        ) : isOfferedByUser ? (
          <Button size="sm" variant="destructive">
            Cancel Request
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default SwapRequestMessageCard;
