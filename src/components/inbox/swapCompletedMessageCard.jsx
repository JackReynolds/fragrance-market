"use client";

/* eslint-disable react/prop-types */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, PartyPopper, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import firestoreTimestampToDate from "@/utils/firestoreTimestampToDate";

const SwapCompletedMessageCard = ({ swapRequest }) => {
  return (
    <Card className="my-4 overflow-hidden border-green-200">
      <div className="bg-green-50 dark:bg-green-900/20 py-1 px-3">
        <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1">
          <Check className="h-4 w-4" /> Swap Completed
        </p>
      </div>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className="animate-bounce mb-2">
            <PartyPopper className="h-8 w-8 text-emerald-500" />
          </div>

          <h3 className="font-semibold text-lg mb-1">
            Swap Successfully Completed!
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Both parties have confirmed shipment and delivery.
          </p>

          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>
              Completed on{" "}
              {firestoreTimestampToDate(
                swapRequest.updatedAt
              ).toLocaleDateString()}
            </span>
          </div>

          <div
            className={cn(
              "w-full mt-4 py-3 px-4 rounded-md border border-dashed",
              "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
            )}
          >
            <p className="text-sm mb-2">
              This swap chat is now archived. You can still view the
              conversation history, but new messages can&apos;t be sent.
            </p>
            <p className="text-sm">
              10 days after the swap is completed, both parties will receive an
              automated email where you can review each other.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SwapCompletedMessageCard;
