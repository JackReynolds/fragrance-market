/* eslint-disable react/prop-types */

import React from "react";
import { Star } from "lucide-react";
import PremiumBadge from "./premiumBadge";
import IdVerifiedBadge from "./idVerifiedBadge";
import { cn } from "@/lib/utils";

const VerificationBadges = ({
  user,
  layout = "vertical",
  size = "default",
  showLabels = true,
  className,
}) => {
  console.log("user", user);

  const badges = [
    {
      key: "premium",
      condition: user?.isPremium,
      component: (
        <div className="flex items-center gap-2">
          <PremiumBadge size={size === "sm" ? "sm" : "default"} />
          {showLabels && (
            <span className="text-sm font-semibold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
              Premium Member
            </span>
          )}
        </div>
      ),
      priority: 1,
    },
    {
      key: "id",
      condition: user?.isIdVerified || user?.idVerified,
      component: (
        <div className="flex items-center gap-2">
          <IdVerifiedBadge size={size === "sm" ? "sm" : "default"} />
          {showLabels && (
            <span className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              ID Verified
            </span>
          )}
        </div>
      ),
      priority: 2,
    },
    {
      key: "rating",
      condition: user?.rating && user.rating > 4.0,
      component: (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "relative bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-200",
              "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-t before:from-transparent before:to-white/20",
              size === "sm" ? "w-6 h-6" : "w-8 h-8"
            )}
          >
            <Star
              className={cn(
                "text-purple-800 fill-purple-800 drop-shadow-sm relative z-10",
                size === "sm" ? "w-3 h-3" : "w-5 h-5"
              )}
            />
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
          </div>
          {showLabels && (
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              Top Rated
            </span>
          )}
        </div>
      ),
      priority: 3,
    },
  ];

  const activeBadges = badges
    .filter((badge) => badge.condition)
    .sort((a, b) => a.priority - b.priority);

  if (activeBadges.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-3",
        layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {activeBadges.map((badge) => (
        <div key={badge.key} className="relative">
          {badge.component}
        </div>
      ))}
    </div>
  );
};

export default VerificationBadges;
