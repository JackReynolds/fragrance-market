"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { useRouter } from "next/navigation";
import { db } from "@/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ListingCard from "@/components/listingCard"; // ✅ Reuse!

const FavouritesPage = () => {
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();
  const router = useRouter();
  const [favouriteListings, setFavouriteListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavouriteListings = async () => {
      if (!authUser) {
        router.push("/sign-in");
        return;
      }

      if (!profileDoc) {
        return;
      }

      setIsLoading(true);
      try {
        const favourites = profileDoc.favourites || [];

        if (favourites.length === 0) {
          setFavouriteListings([]);
          setIsLoading(false);
          return;
        }

        // Fetch all favourite listings
        const listingPromises = favourites.map(async (listingId) => {
          try {
            const listingRef = doc(db, "listings", listingId);
            const listingDoc = await getDoc(listingRef);
            if (listingDoc.exists()) {
              return {
                id: listingDoc.id,
                ...listingDoc.data(),
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching listing ${listingId}:`, error);
            return null;
          }
        });

        const listings = await Promise.all(listingPromises);
        const validListings = listings.filter((listing) => listing !== null);
        setFavouriteListings(validListings);
      } catch (error) {
        console.error("Error fetching favourite listings:", error);
        toast.error("Failed to load favourites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavouriteListings();
  }, [authUser, profileDoc, router]);

  // ✅ Callback when favorite is toggled (removes from list)
  const handleFavoriteChange = (listingId, isFavorited) => {
    if (!isFavorited) {
      // Removed from favorites, update local state
      setFavouriteListings((prev) =>
        prev.filter((listing) => listing.id !== listingId)
      );
    }
  };

  if (!authUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary fill-current" />
            <h1 className="text-3xl font-bold">My Favourites</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            {favouriteListings.length}{" "}
            {favouriteListings.length === 1 ? "listing" : "listings"} saved
          </p>
        </div>

        {/* Listings Grid */}
        {favouriteListings.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Heart className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">No favourites yet</h2>
              <p className="text-muted-foreground max-w-md">
                Start exploring the marketplace and save your favourite listings
                here for easy access.
              </p>
              <Button
                onClick={() => router.push("/marketplace")}
                className="mt-4 hover:cursor-pointer"
              >
                Browse Marketplace
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favouriteListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showUserInfo={true}
                showFavoriteButton={true}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavouritesPage;
