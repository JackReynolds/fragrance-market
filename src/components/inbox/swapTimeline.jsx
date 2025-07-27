/* eslint-disable react/prop-types */

"use client";

import React from "react";
import { Check, Package } from "lucide-react";

const SwapTimeline = ({ swapRequest, className = "" }) => {
  const stages = [
    {
      key: "swap_accepted",
      label: "Swap Accepted",
      icon: Check,
    },
    {
      key: "pending_shipment",
      label: "Shipping Details Confirmed",
      icon: Package,
    },
    {
      key: "swap_completed",
      label: "Fragrance Shipped",
      icon: Check,
    },
  ];

  const currentStatus = swapRequest?.status;

  const getStageStatus = (stageKey) => {
    const currentIndex = stages.findIndex((s) => s.key === currentStatus);
    const stageIndex = stages.findIndex((s) => s.key === stageKey);

    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className={`bg-muted/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-muted -z-10" />

        {stages.map((stage, index) => {
          const status = getStageStatus(stage.key);
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className="flex flex-col items-center relative"
            >
              {/* Progress bar fill */}
              {index > 0 && status === "completed" && (
                <div
                  className="absolute top-4 right-1/2 w-full h-0.5 bg-primary -z-10"
                  style={{
                    right: `calc(50% + ${
                      ((stages.length - index) * 100) / stages.length
                    }%)`,
                  }}
                />
              )}

              {/* Icon circle */}
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                ${
                  status === "completed"
                    ? "bg-primary border-primary text-white"
                    : status === "current"
                    ? "bg-white border-primary text-primary"
                    : "bg-muted border-muted-foreground/30 text-muted-foreground"
                }
              `}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Label */}
              <span
                className={`
                text-xs mt-2 text-center max-w-24
                ${
                  status === "completed" || status === "current"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              `}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SwapTimeline;
