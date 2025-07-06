/* eslint-disable react/prop-types */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const GoPremiumButton = ({ authUser, currency }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const createCheckoutSession = async () => {
    setIsLoading(true);
    try {
      if (!authUser) {
        toast.error("Please sign in to continue");
        router.push("/sign-in");
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userUid: authUser.uid,
          email: authUser.email,
          successUrl: `${window.location.origin}/`,
          cancelUrl: `${window.location.origin}/how-it-works`,
          currency: currency,
        }),
      });

      if (!response.ok) throw new Error("Failed to create checkout session");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <Button
        onClick={createCheckoutSession}
        className="w-full hover:cursor-pointer hover:bg-primary/80 shadow-md max-w-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          "Go Premium"
        )}
      </Button>
    </div>
  );
};

export default GoPremiumButton;
