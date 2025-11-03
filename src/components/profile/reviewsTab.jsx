/* eslint-disable react/prop-types */
"use client";
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";

export default function ReviewsTab() {
  return (
    <TabsContent value="reviews" className="space-y-6">
      <h2 className="text-2xl font-bold">Reviews</h2>

      <div className="rounded-lg border border-dashed p-8 text-center">
        <MessageSquare
          size={48}
          className="mx-auto mb-4 text-muted-foreground"
        />
        <h3 className="mb-2 text-lg font-semibold">No reviews yet</h3>
        <p className="text-sm text-muted-foreground">
          You haven&apos;t received any reviews yet. Complete swaps to start
          building your reputation!
        </p>
      </div>
    </TabsContent>
  );
}
