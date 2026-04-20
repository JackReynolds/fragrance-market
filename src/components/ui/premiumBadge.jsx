/* eslint-disable react/prop-types */

import React from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const PremiumBadge = ({
  outerWidth = "8",
  outerHeight = "8",
  crownWidth = "5",
  crownHeight = "5",
  size = "default",
  className,
  showGlow = true,
  animated = true,
  showPopup = false,
  showTooltip,
}) => {
  const shouldShowPopup =
    typeof showTooltip === "boolean" ? showTooltip : showPopup;

  const sizeClasses = {
    sm: {
      outer: "w-6 h-6",
      crown: "w-3 h-3",
    },
    default: {
      outer: `w-${outerWidth} h-${outerHeight}`,
      crown: `w-${crownWidth} h-${crownHeight}`,
    },
    lg: {
      outer: "w-12 h-12",
      crown: "w-8 h-8",
    },
    xl: {
      outer: "w-16 h-16",
      crown: "w-10 h-10",
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.default;

  const badgeContent = (
    <div className="relative">
      {/* Glow effect */}
      {showGlow && (
        <div
        className={cn(
          currentSize.outer,
          "absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 blur-sm opacity-75",
          animated && "animate-pulse"
        )}
      />
      )}

      {/* Main badge */}
      <div
        className={cn(
          currentSize.outer,
          "relative flex items-center justify-center rounded-full border-2 border-yellow-200 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-lg",
          shouldShowPopup && "cursor-help",
          animated && "hover:scale-110 transition-transform duration-200",
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-t before:from-transparent before:to-white/20",
          className
        )}
      >
        <Crown
          className={cn(
            currentSize.crown,
            "text-amber-800 drop-shadow-sm relative z-10"
          )}
        />

        {/* Shine effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent",
            animated && "animate-pulse"
          )}
        />
      </div>
    </div>
  );

  if (!shouldShowPopup) {
    return badgeContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-gradient-to-r from-yellow-600 to-amber-700 text-white border-amber-300 max-w-56"
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Crown className="h-3 w-3" />
            <span className="font-semibold">Premium Member</span>
          </div>
          <div className="text-xs opacity-90">
            Unlimited swaps, unlimited listings, and access to selling
            features.
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default PremiumBadge;
