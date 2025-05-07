"use client";

/* eslint-disable react/prop-types */

import React from "react";
import { format } from "date-fns";

const StandardMessage = ({ message, authUser }) => {
  const isCurrentUserMessage = message.senderUid === authUser.uid;

  return (
    <div
      className={`max-w-[80%] rounded-lg p-3 ${
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
  );
};

export default StandardMessage;
