"use client";

/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase.config";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import formatCurrency from "@/utils/formatCurrency";
import ListingTypeBadge from "@/components/ui/listingTypeBadge";
import { Skeleton } from "@/components/ui/skeleton";

const OwnersOtherFragrances = ({ ownerUid, currentListingId }) => {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOwnerListings = async () => {
      if (!ownerUid) return;

      try {
        setIsLoading(true);
        const listingsRef = collection(db, "listings");
        const q = query(
          listingsRef,
          where("ownerUid", "==", ownerUid),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(6)
        );

        const querySnapshot = await getDocs(q);
        const ownerListings = [];

        querySnapshot.forEach((doc) => {
          const listingData = {
            id: doc.id,
            ...doc.data(),
          };
          // Exclude the current listing being viewed
          if (listingData.id !== currentListingId) {
            ownerListings.push(listingData);
          }
        });

        setListings(ownerListings);
      } catch (error) {
        console.error("Error fetching owner listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerListings();
  }, [ownerUid, currentListingId]);

  const handleListingClick = (listing) => {
    // Use slug if available, otherwise fall back to ID
    const identifier = listing.slug || listing.id;
    router.push(`/listings/${identifier}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No other active listings from this owner
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        {listings.length} other listing{listings.length !== 1 ? "s" : ""} by
        this owner
      </div>

      <Carousel
        className="w-full"
        opts={{
          align: "start",
          loop: listings.length > 1,
        }}
      >
        <CarouselContent>
          {listings.map((listing) => (
            <CarouselItem key={listing.id}>
              <Card
                className="hover:shadow-lg hover:cursor-pointer transition-all duration-200 overflow-hidden group"
                onClick={() => handleListingClick(listing)}
              >
                {/* Image Section */}
                <div className="relative aspect-[4/5] max-h-[250px] w-full ">
                  <Image
                    src={listing.imageURLs?.[0] || "/fragrance-placeholder.jpg"}
                    alt={listing.title}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="350px"
                  />

                  {/* Listing Type Badge */}
                  <div className="absolute top-2 left-2">
                    <div className="scale-75 origin-top-left">
                      <ListingTypeBadge type={listing.type} />
                    </div>
                  </div>

                  {/* Amount Left Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-200/70 text-black backdrop-blur-sm">
                      {listing.amountLeft}% full
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <CardContent className="p-3 space-y-2">
                  {/* Brand */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide line-clamp-1">
                    {listing.brand}
                  </p>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {listing.title}
                  </h3>

                  {/* Price */}
                  {listing.price && listing.type === "sell" && (
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(listing.price, listing.currency || "EUR")}
                    </p>
                  )}

                  {/* Date Listed */}
                  <p className="text-xs text-muted-foreground">
                    Listed{" "}
                    {listing.createdAt
                      ? new Date(
                          listing.createdAt.seconds * 1000
                        ).toLocaleDateString()
                      : "Recently"}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation - Only show if more than 1 listing */}
        {listings.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default OwnersOtherFragrances;
