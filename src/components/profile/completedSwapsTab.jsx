/* eslint-disable react/prop-types */
"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function CompletedSwapsTab({
  completedSwaps,
  completedSwapsLoading,
  authUser,
  router,
}) {
  return (
    <TabsContent value="completed-swaps" className="space-y-6">
      <h2 className="text-2xl font-bold">Completed Swaps</h2>

      {completedSwapsLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : completedSwaps.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold">No completed swaps yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            You haven&apos;t completed any swaps yet. Start swapping your
            fragrances today!
          </p>
          <Button onClick={() => router.push("/marketplace")}>
            Browse Marketplace
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {completedSwaps.map((swap) => {
            // Determine if current user is the one who offered or requested
            const isOfferer = swap.offeredBy?.uid === authUser.uid;

            // Get the other user
            const otherUser = isOfferer ? swap.requestedFrom : swap.offeredBy;

            // Get listings - ONLY use basic listing data (not snapshots for privacy)
            // Snapshots contain full listing details including sensitive information
            const myListing = isOfferer
              ? swap.offeredListing
              : swap.requestedListing;

            const theirListing = isOfferer
              ? swap.requestedListing
              : swap.offeredListing;

            // Get image - basic listings use imageURL (singular)
            const myImage = myListing?.imageURL;
            const theirImage = theirListing?.imageURL;

            // Get tracking numbers
            const myTrackingNumber = swap.trackingNumbers?.[authUser.uid];
            const theirTrackingNumber = swap.trackingNumbers?.[otherUser?.uid];

            return (
              <Card key={swap.id}>
                <CardContent className="p-6">
                  {/* Swap Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Swap with{" "}
                        {otherUser?.displayName ||
                          otherUser?.username ||
                          "Unknown User"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Completed on{" "}
                        {swap.completedAt?.toDate?.().toLocaleDateString() ||
                          "Unknown date"}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Completed
                    </span>
                  </div>

                  <Separator className="my-4" />

                  {/* Swap Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Your Fragrance */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        You Sent
                      </h4>
                      <div className="flex gap-3 items-center">
                        {myImage && (
                          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={myImage}
                              alt={myListing?.title || "Fragrance"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {myListing?.title || "Unknown Fragrance"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {myListing?.brand || "Unknown Brand"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {myListing?.fragrance || ""}
                          </p>
                          {myTrackingNumber && (
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                              Tracking: {myTrackingNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Their Fragrance */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        You Received
                      </h4>
                      <div className="flex gap-3 items-center">
                        {theirImage && (
                          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={theirImage}
                              alt={theirListing?.title || "Fragrance"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {theirListing?.title || "Unknown Fragrance"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {theirListing?.brand || "Unknown Brand"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {theirListing?.fragrance || ""}
                          </p>
                          {theirTrackingNumber && (
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                              Tracking: {theirTrackingNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optional: View Details Button */}
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/users/${otherUser?.uid}`)}
                      className="w-full md:w-auto hover:cursor-pointer"
                    >
                      View {otherUser?.displayName || "User"}&apos;s Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rating Summary - Optional: Keep if you implement reviews later */}
      {completedSwaps.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Future: Leave Reviews</CardTitle>
            <CardDescription>
              Review functionality coming soon! You&apos;ll be able to rate your
              swap partners.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </TabsContent>
  );
}
