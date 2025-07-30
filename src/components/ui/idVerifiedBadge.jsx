/* eslint-disable react/prop-types */

import React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const IdVerifiedBadge = ({
  outerWidth = "8",
  outerHeight = "8",
  shieldWidth = "5",
  shieldHeight = "5",
  size = "default",
  className,
  showGlow = true,
  animated = true,
  showTooltip = true,
}) => {
  const sizeClasses = {
    sm: {
      outer: "w-6 h-6",
      shield: "w-3 h-3",
    },
    default: {
      outer: `w-${outerWidth} h-${outerHeight}`,
      shield: `w-${shieldWidth} h-${shieldHeight}`,
    },
    lg: {
      outer: "w-12 h-12",
      shield: "w-8 h-8",
    },
    xl: {
      outer: "w-16 h-16",
      shield: "w-10 h-10",
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
            "absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full blur-sm opacity-75",
            animated && "animate-pulse"
          )}
        />
      )}

      {/* Main badge */}
      <div
        className={cn(
          currentSize.outer,
          "relative bg-gradient-to-br from-emerald-300 via-emerald-400 to-green-500 rounded-full flex items-center justify-center cursor-help shadow-lg border-2 border-emerald-200",
          animated && "hover:scale-110 transition-transform duration-200",
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-t before:from-transparent before:to-white/20",
          className
        )}
      >
        <ShieldCheck
          className={cn(
            currentSize.shield,
            "text-emerald-800 drop-shadow-sm relative z-10"
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

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-gradient-to-r from-emerald-700 to-green-800 text-white border-emerald-300 max-w-56"
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShieldCheck className="h-3 w-3" />
            <span className="font-semibold">ID Verified</span>
          </div>
          <div className="text-xs opacity-90 pb-1">
            Identity verified through third party verification service Veriff.
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default IdVerifiedBadge;
