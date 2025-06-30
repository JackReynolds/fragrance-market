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
import {
  ShoppingBag,
  Repeat,
  ShieldCheck,
  Crown,
  User,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import getCountryFlagEmoji from "@/utils/getCountryFlagEmoji";
import formatCurrency from "@/utils/formatCurrency";

// Both listing and hit are used for Algolia compatibility as hit is used for Algolia search results
const ListingCard = ({
  listing,
  hit,
  isFavorite = false,
  toggleFavorite = null,
  showUserInfo = true,
}) => {
  const router = useRouter();

  // Use either listing or hit (for Algolia compatibility)
  const data = listing || hit;

  // Guard clause - return null if no data
  if (!data) {
    return null;
  }

  // Normalize ID (handle both Algolia listings and Firestore docs)
  const id = data.objectID || data.id;

  // Handle clicks on card
  const handleCardClick = (e) => {
    router.push(`/listings/${id}`);
  };

  return (
    <TooltipProvider>
      <Card className="h-full hover:shadow-lg hover:cursor-pointer transition-all duration-200 overflow-hidden group max-w-86">
        {/* Image Section - Changed to shorter aspect ratio */}
        <div className="relative aspect-[4/5] w-full overflow-hidden max-h-82">
          <Image
            src={data.imageURLs[0] || "/fragrance-placeholder.jpg"}
            alt={data.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-fit transition-transform duration-300 group-hover:scale-105"
            onClick={handleCardClick}
          />

          {/* Listing Type Badge */}
          {data.type && (
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm ${
                  data.type === "sell"
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                }`}
              >
                {data.type === "sell" ? (
                  <ShoppingBag className="mr-1 h-3 w-3" />
                ) : (
                  <Repeat className="mr-1 h-3 w-3" />
                )}
                {data.type === "sell" ? "Sale" : "Swap"}
              </span>
            </div>
          )}

          {/* Amount Left Badge */}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200/70 text-black backdrop-blur-sm">
              {data.amountLeft}% full
            </span>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3" onClick={handleCardClick}>
          {/* Brand Row */}
          <div>
            <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {data.brand}
            </p>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm md:text-base leading-tight line-clamp-2 mb-5">
            {data.title}
          </h3>

          {/* Price Row */}
          {data.price && data.type === "sell" && (
            <div>
              <p className="text-lg md:text-xl font-bold text-emerald-600">
                {formatCurrency(data.price, data.currency || "EUR")}
              </p>
            </div>
          )}

          {/* User Info Section */}
          {showUserInfo && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {/* User Row */}
              <div className="flex items-center justify-between mt-2 mb-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {data.ownerProfilePictureURL ? (
                      <Image
                        src={data.ownerProfilePictureURL}
                        alt={data.ownerUsername}
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                        <User size={14} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Username */}
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {data.ownerUsername}
                  </p>
                </div>

                {/* Badges with Tooltips */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {data.ownerIsPremium && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-7 h-7 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center cursor-help">
                          <Crown className="w-4 h-4 text-yellow-900" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Premium Member</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {data.ownerIsIdVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-7 h-7 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center cursor-help">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>ID Verified</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Location Row */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>
                  {data?.countryCode && getCountryFlagEmoji(data.countryCode)}
                </span>
                <span className="truncate">
                  {data?.country || "Location not specified"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ListingCard;
