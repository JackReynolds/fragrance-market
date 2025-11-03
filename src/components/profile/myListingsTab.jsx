/* eslint-disable react/prop-types */
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import ListingCard from "@/components/listingCard";

export default function MyListingsTab({ userListings, router }) {
  return (
    <TabsContent value="listings" className="space-y-6">
      <h2 className="text-2xl font-bold">My Listings</h2>

      {userListings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold">No listings yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            You haven&apos;t created any listings yet. Start selling or swapping
            your fragrances today!
          </p>
          <Button onClick={() => router.push("/new-listing")}>
            Create Your First Listing
          </Button>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
            {userListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showUserInfo={false}
              />
            ))}
          </div>
        </div>
      )}
    </TabsContent>
  );
}
