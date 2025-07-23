/* eslint-disable react/prop-types */

import React from "react";
import { ShieldCheck, Mail, Crown, Star } from "lucide-react";
import CrownBadge from "./crownBadge";
import { cn } from "@/lib/utils";

const VerificationBadges = ({
  user,
  layout = "vertical",
  size = "default",
  showLabels = true,
  className,
}) => {
  const badges = [
    {
      key: "premium",
      condition: user?.isPremium,
      component: (
        <div className="flex items-center gap-2">
          <CrownBadge size={size === "sm" ? "sm" : "default"} />
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
      condition: user?.isIdVerified,
      component: (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md">
          <ShieldCheck
            className={cn("text-white", size === "sm" ? "w-3 h-3" : "w-4 h-4")}
          />
          {showLabels && (
            <span
              className={cn(
                "text-white font-medium",
                size === "sm" ? "text-xs" : "text-sm"
              )}
            >
              ID Verified
            </span>
          )}
        </div>
      ),
      priority: 2,
    },
    {
      key: "email",
      condition: user?.emailVerified,
      component: (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-md">
          <Mail
            className={cn("text-white", size === "sm" ? "w-3 h-3" : "w-4 h-4")}
          />
          {showLabels && (
            <span
              className={cn(
                "text-white font-medium",
                size === "sm" ? "text-xs" : "text-sm"
              )}
            >
              Email Verified
            </span>
          )}
        </div>
      ),
      priority: 3,
    },
    {
      key: "rating",
      condition: user?.rating && user.rating > 4.0,
      component: (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 shadow-md">
          <Star
            className={cn(
              "text-white fill-white",
              size === "sm" ? "w-3 h-3" : "w-4 h-4"
            )}
          />
          {showLabels && (
            <span
              className={cn(
                "text-white font-medium",
                size === "sm" ? "text-xs" : "text-sm"
              )}
            >
              Top Rated
            </span>
          )}
        </div>
      ),
      priority: 4,
    },
  ];

  const activeBadges = badges
    .filter((badge) => badge.condition)
    .sort((a, b) => a.priority - b.priority);

  if (activeBadges.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-2",
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
