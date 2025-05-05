// src/components/inbox/SwapRequestsList.jsx
"use client";

/* eslint-disable react/prop-types */

import React from "react";
import Image from "next/image";
import { format } from "date-fns";

export default function SwapRequestsList({
  requests,
  selectedId,
  onSelectRequest,
  currentUserId,
}) {
  // Get the other person in the conversation
  const getOtherParty = (request) => {
    if (request.offeredBy.uid === currentUserId) {
      return {
        username: request.requestedFrom.username,
        uid: request.requestedFrom.uid,
        // Use placeholder for now
        profilePictureURL:
          request.requestedFrom.profilePictureURL ||
          "/profilePicturePlaceholder.png",
      };
    } else {
      return {
        username: request.offeredBy.username,
        uid: request.offeredBy.uid,
        // Use placeholder for now
        profilePictureURL:
          request.offeredBy.profilePictureURL ||
          "/profilePicturePlaceholder.png",
      };
    }
  };

  // Render the status of the request
  const renderRequestStatus = (status) => {
    switch (status) {
      case "swap_request":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            Pending
          </span>
        );
      case "swap_accepted":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
            Accepted
          </span>
        );
      case "swap_rejected":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case "pending_shipment":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
            Pending Shipment
          </span>
        );

      default:
        return (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // Get what to display as the request title
  const getRequestTitle = (request) => {
    if (request.offeredBy.uid === currentUserId) {
      return `Your ${request.offeredListing.title} for ${request.requestedListing.title}`;
    } else {
      return `${request.offeredListing.title} for your ${request.requestedListing.title}`;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h2 className="font-medium">Conversations</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <ul className="divide-y">
            {requests.map((request) => {
              const otherParty = getOtherParty(request);
              const requestTitle = getRequestTitle(request);
              const isSelected = selectedId === request.id;

              return (
                <li
                  key={request.id}
                  onClick={() => onSelectRequest(request)}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                    isSelected ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={
                          otherParty?.profilePictureURL ||
                          "/profilePictureURL.png"
                        }
                        alt={otherParty.username}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {otherParty.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {requestTitle}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        {renderRequestStatus(request.status)}
                        <span className="text-xs text-muted-foreground">
                          {request.updatedAt
                            ? format(request.updatedAt.toDate(), "MMM d")
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
