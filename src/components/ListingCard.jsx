"use client";
/* eslint-disable react/prop-types */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Repeat, ShieldCheck, Crown, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import getCountryFlagEmoji from "@/utils/getCountryFlagEmoji";

const ListingCard = ({
  listing,
  isFavorite = false,
  toggleFavorite = null,
  showViewButton = false,
}) => {
  const router = useRouter();

  // Normalize ID (handle both Algolia listings and Firestore docs)
  const id = listing.objectID || listing.id;

  // Handle clicks on card
  const handleCardClick = (e) => {
    if (!showViewButton) {
      router.push(`/listings/${id}`);
    }
  };

  return (
    <Card
      className="h-full max-w-82 hover:shadow-md hover:cursor-pointer transition-shadow duration-200"
      onClick={handleCardClick}
    >
      <div className="relative w-full h-86">
        <Image
          src={listing.imageURLs[0] || "/fragrance-placeholder.jpg"}
          alt={listing.title}
          fill
          className="object-fit rounded-t-lg"
        />
        {/* {authUser && authUser.uid !== hit.ownerUid && (
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log("clicked");
                }}
                className="h-8 w-8 rounded-full bg-white/80 hover:bg-white hover:cursor-pointer"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          )} */}
        {listing.type && (
          <div className="absolute top-2 left-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                listing.type === "sell"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {listing.type === "sell" ? (
                <ShoppingBag className="mr-1 h-3 w-3" />
              ) : (
                <Repeat className="mr-1 h-3 w-3" />
              )}
              {listing.type === "sell" ? "For Sale" : "For Swap"}
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              {listing.brand}
            </p>
            <p className="text-sm text-muted-foreground">
              {listing.amountLeft}% full
            </p>
          </div>
          <h3 className="font-semibold truncate">{listing.title}</h3>
          {listing.price && listing.type === "sell" && (
            <p className="text-lg font-bold mt-1">
              €{listing.price.toFixed(2)}
            </p>
          )}

          <div className="flex mt-2 gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {listing.ownerProfilePictureURL ? (
                  <Image
                    src={listing.ownerProfilePictureURL}
                    alt={listing.ownerUsername}
                    width={20}
                    height={20}
                  />
                ) : (
                  <User
                    size={24}
                    className="text-muted-foreground bg-muted rounded-full p-1"
                  />
                )}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {listing.ownerUsername}
            </p>
            <p>
              {listing.ownerIsPremium ? (
                <Crown className="w-5 h-5 text-yellow-500" />
              ) : null}
            </p>
            <p>
              {listing.ownerIsIdVerified ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : null}
            </p>
          </div>
          <div className="mt-2 flex items-center text-sm ">
            <span>
              {getCountryFlagEmoji(listing?.countryCode) +
                " " +
                listing?.country || "Location not specified"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingCard;
