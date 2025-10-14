"use client";
/* eslint-disable react/prop-types */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import getCountryFlagEmoji from "@/utils/getCountryFlagEmoji";
import formatCurrency from "@/utils/formatCurrency";
import ListingTypeBadge from "@/components/ui/listingTypeBadge";
import PremiumBadge from "./ui/premiumBadge";
import IdVerifiedBadge from "./ui/idVerifiedBadge";

// Both listing and hit are used for Algolia compatibility as hit is used for Algolia search results
const ListingCard = ({ listing, hit, showUserInfo = true }) => {
  const router = useRouter();

  // Use either listing or hit (for Algolia compatibility)
  const data = listing || hit;

  // Guard clause - return null if no data
  if (!data) {
    return null;
  }

  // Normalize ID (handle both Algolia listings and Firestore docs)
  const id = data.objectID || data.id;

  // Use slug if available, otherwise fall back to ID (for old listings)
  const listingIdentifier = data.slug || id;

  // Handle clicks on card
  const handleCardClick = (e) => {
    router.push(`/listings/${listingIdentifier}`);
  };

  return (
    <TooltipProvider>
      <Card className="h-full hover:shadow-lg hover:cursor-pointer transition-all duration-200 overflow-hidden group w-full relative flex flex-col">
        {/* Image Section - Responsive aspect ratio */}
        <div className="relative max-h-[300px] aspect-[4/5] w-full overflow-hidden">
          <Image
            src={data.imageURLs[0] || "/fragrance-placeholder.jpg"}
            alt={data.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            onClick={handleCardClick}
          />

          {/* Listing Type Badge - Responsive sizing */}
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3">
            <div className="scale-75 sm:scale-100 origin-top-left">
              <ListingTypeBadge type={data.type} />
            </div>
          </div>

          {/* Amount Left Badge - Responsive sizing */}
          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3">
            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-200/70 text-black backdrop-blur-sm">
              {data.amountLeft}% full
            </span>
          </div>
        </div>

        {/* Content Section - Flex grow to fill remaining space */}
        <CardContent
          className="p-2 sm:p-4 pb-12 sm:pb-14 flex flex-col flex-grow"
          onClick={handleCardClick}
        >
          {/* Top content section */}
          <div className="flex-grow">
            {/* Brand Row */}
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide line-clamp-1">
                {data.brand}
              </p>
            </div>

            {/* Title - Responsive sizing */}
            <h3 className="font-semibold text-xs sm:text-sm md:text-base leading-tight line-clamp-2 mb-2 sm:mb-3">
              {data.title}
            </h3>

            {/* Price Row - Responsive sizing */}
            {data.price && data.type === "sell" && (
              <div className="mb-2 sm:mb-3">
                <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-600">
                  {formatCurrency(data.price, data.currency || "EUR")}
                </p>
              </div>
            )}
          </div>

          {/* User Info Section - Always at bottom */}
          {showUserInfo && (
            <div className="mt-auto space-y-1 sm:space-y-2 pt-1 sm:pt-2 border-t border-gray-100">
              {/* User Row - Compact on mobile */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                  {/* Profile Picture - Responsive sizing */}
                  <div className="flex-shrink-0">
                    {data.ownerProfilePictureURL ? (
                      <Image
                        src={data.ownerProfilePictureURL}
                        alt={data.ownerUsername}
                        width={16}
                        height={16}
                        className="w-4 h-4 sm:w-6 sm:h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-4 sm:w-6 sm:h-6 bg-muted rounded-full flex items-center justify-center">
                        <User
                          size={10}
                          className="sm:w-3.5 sm:h-3.5 text-muted-foreground"
                        />
                      </div>
                    )}
                  </div>

                  {/* Username - Responsive sizing */}
                  <p className="text-[10px] sm:text-sm font-medium text-gray-700 truncate">
                    {data.ownerUsername}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-shrink-0">
                  {data.ownerIsPremium ? (
                    <PremiumBadge
                      outerWidth="6"
                      outerHeight="6"
                      crownWidth="4"
                      crownHeight="4"
                    />
                  ) : null}

                  {data.ownerIsIdVerified ? (
                    <IdVerifiedBadge
                      outerWidth="6"
                      outerHeight="6"
                      shieldWidth="4"
                      shieldHeight="4"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Country positioned absolutely at bottom left with proper spacing */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex items-center gap-1 text-[10px] sm:text-sm text-gray-700 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-gray-200 z-10">
          <span className="text-xs sm:text-sm">
            {data?.countryCode && getCountryFlagEmoji(data.countryCode)}
          </span>
          <span className="">{data?.country || "Unknown"}</span>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default ListingCard;
