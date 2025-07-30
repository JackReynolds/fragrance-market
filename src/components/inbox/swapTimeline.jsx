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

    // If we're at the final stage, mark it as completed instead of current
    if (stageIndex <= currentIndex) return "completed";
    return "upcoming";
  };

  // Calculate progress percentage
  const getCurrentStageIndex = () => {
    return stages.findIndex((s) => s.key === currentStatus);
  };

  const progressPercentage = () => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex === -1) return 0;
    // For 3 stages: 0%, 50%, 100%
    return (currentIndex / (stages.length - 1)) * 100;
  };

  return (
    <div className={`bg-muted/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-muted -z-10" />

        {/* Progress bar fill */}
        <div
          className="absolute top-4 left-8 h-0.5 bg-primary transition-all duration-500 ease-in-out -z-10"
          style={{
            width: `calc((100% - 4rem) * ${progressPercentage() / 100})`,
          }}
        />

        {stages.map((stage, index) => {
          const status = getStageStatus(stage.key);
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className="flex flex-col items-center relative"
            >
              {/* Icon circle */}
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                ${
                  status === "completed"
                    ? "bg-primary border-primary text-white"
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
                  status === "completed"
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
