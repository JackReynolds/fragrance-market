"use client";
/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { toast } from "sonner";
import getCountryFlagEmoji from "@/utils/getCountryFlagEmoji";
import formatCurrency from "@/utils/formatCurrency";
import ListingTypeBadge from "@/components/ui/listingTypeBadge";
import PremiumBadge from "./ui/premiumBadge";
import IdVerifiedBadge from "./ui/idVerifiedBadge";

const ListingCard = ({
  listing,
  hit,
  showUserInfo = true,
  showFavoriteButton = true,
  onFavoriteChange = null,
}) => {
  const router = useRouter();
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();

  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Use either listing or hit (for Algolia compatibility)
  const data = listing || hit;

  // Guard clause - return null if no data
  if (!data) {
    return null;
  }

  // Normalize ID (handle both Algolia listings and Firestore docs)
  const id = data.objectID || data.id;
  const listingIdentifier = data.slug || id;

  // Check if current user owns this listing
  const isOwnListing = authUser?.uid === data.ownerUid;

  // Check if listing is swapped or sold
  const isSwapped = data.status === "swapped";
  const isSold = data.status === "sold";

  // Determine if we should show the favorite button (hide for swapped or sold)
  const shouldShowFavorite =
    showFavoriteButton && authUser && !isOwnListing && !isSwapped && !isSold;

  // Check if listing is favorited
  useEffect(() => {
    if (id) {
      const favourites = profileDoc?.favourites || [];
      setIsFavorited(favourites.includes(id));
    }
  }, [profileDoc?.favourites, id]);

  // Handle clicks on card
  const handleCardClick = (e) => {
    router.push(`/listings/${listingIdentifier}`);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent card click

    if (!authUser) {
      toast.error("Please sign in to save favourites");
      router.push("/sign-in");
      return;
    }

    if (isOwnListing) {
      toast.info("You can't favourite your own listing");
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const idToken = await authUser.getIdToken();
      const response = await fetch("/api/firebase/handle-add-to-favourites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          listingId: id,
          action: isFavorited ? "remove" : "add",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update favourites");
      }

      setIsFavorited(result.isFavorited);
      toast.success(result.message);

      // Call callback if provided (useful for favourites page to update list)
      if (onFavoriteChange) {
        onFavoriteChange(id, result.isFavorited);
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
      toast.error("Failed to update favourites");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <Card className="h-full hover:shadow-lg hover:cursor-pointer transition-all duration-200 overflow-hidden group w-full relative flex flex-col">
      {/* Image Section - Responsive aspect ratio */}
      <div className="relative max-h-[300px] aspect-[4/5] w-full overflow-hidden">
        <Image
          src={data.imageURLs[0] || "/fragrance-placeholder.jpg"}
          alt={`${data.fragrance} - ${data.brand}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-contain transition-transform duration-300 group-hover:scale-105 ${
            isSwapped || isSold ? "opacity-60 grayscale-[30%]" : ""
          }`}
          onClick={handleCardClick}
        />

        {/* Swapped Overlay - Only show if listing is swapped */}
        {isSwapped && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 flex items-center justify-center pointer-events-none">
            <div
              className="backdrop-blur-sm text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg transform -rotate-3"
              style={{ backgroundColor: "#1E7C62" }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-bold text-sm sm:text-lg tracking-wide">
                  SWAPPED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sold Overlay - Only show if listing is sold */}
        {isSold && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 flex items-center justify-center pointer-events-none">
            <div
              className="backdrop-blur-sm text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg transform rotate-2"
              style={{ backgroundColor: "#F5B900" }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-bold text-sm sm:text-lg tracking-wide">
                  SOLD
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Listing Type Badge - Responsive sizing */}
        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3">
          <div className="scale-75 sm:scale-100 origin-top-left">
            <ListingTypeBadge type={data.type} />
          </div>
        </div>

        {/* Amount Left Badge - Responsive sizing - Hide if swapped or sold */}
        {!isSwapped && !isSold && (
          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3">
            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-200/70 text-black backdrop-blur-sm">
              {data.amountLeft}% full
            </span>
          </div>
        )}

        {/* Favorite Heart Button - Top Right, below amount badge */}
        {shouldShowFavorite && (
          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className="absolute top-10 right-1.5 sm:top-14 sm:right-3 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-all hover:scale-110 disabled:opacity-50 z-10 hover:cursor-pointer"
            aria-label={
              isFavorited ? "Remove from favourites" : "Add to favourites"
            }
          >
            <Heart
              className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                isFavorited
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600 hover:text-red-500"
              }`}
            />
          </button>
        )}
      </div>

      {/* Content Section - Flex grow to fill remaining space */}
      <CardContent
        className={`p-2 sm:p-4 pb-12 sm:pb-14 flex flex-col flex-grow ${
          isSwapped || isSold ? "opacity-75" : ""
        }`}
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

          {/* Fragrance Name - Responsive sizing */}
          <h3 className="font-semibold text-xs sm:text-sm md:text-base leading-tight line-clamp-2 mb-2 sm:mb-3">
            {data.fragrance}
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
  );
};

export default ListingCard;
