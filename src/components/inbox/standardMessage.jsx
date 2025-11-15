"use client";

/* eslint-disable react/prop-types */

import React from "react";
import { format } from "date-fns";
import Image from "next/image";
import profilePicturePlaceholder from "/public/profilePicturePlaceholder.png";

const StandardMessage = ({ message, authUser, swapRequest }) => {
  const isCurrentUserMessage = message.senderUid === authUser.uid;

  const otherUserInfo = isCurrentUserMessage
    ? swapRequest.requestedFrom
    : swapRequest.offeredBy;

  const profilePictureURL =
    otherUserInfo.profilePictureURL || profilePicturePlaceholder;

  return (
    <div className="flex items-center gap-2 max-w-[80%]">
      {isCurrentUserMessage ? null : (
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <Image
            src={profilePictureURL}
            alt="Profile Picture"
            width={28}
            height={28}
            className="rounded-full"
          />
        </div>
      )}
      <div
        className={`rounded-lg p-3 ${
          isCurrentUserMessage
            ? "bg-primary text-white rounded-tr-none"
            : "bg-muted rounded-tl-none"
        }`}
      >
        <p>{message.text}</p>
        <p
          className={`text-xs mt-1 ${
            isCurrentUserMessage
              ? "text-primary-foreground/70"
              : "text-muted-foreground"
          }`}
        >
          {message.createdAt
            ? format(
                message.createdAt instanceof Date
                  ? message.createdAt
                  : message.createdAt.toDate(),
                "h:mm a"
              )
            : ""}
        </p>
      </div>
    </div>
  );
};

export default StandardMessage;
