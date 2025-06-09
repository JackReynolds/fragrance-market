"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const GoPremiumButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { authUser } = useAuth();
  const router = useRouter();

  const createCheckoutSession = async () => {
    setIsLoading(true);
    try {
      if (!authUser) {
        toast.error("Please sign in to continue");
        router.push("/sign-in");
        return;
      }

      const response = await fetch(
        "https://createbillingcheckoutsession-createbillingcheckou-qwe4clieqa-nw.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userUid: authUser.uid,
            email: authUser.email,
            successUrl: `${window.location.origin}/subscription/success`,
            cancelUrl: `${window.location.origin}/how-it-works`,
          }),
        }
      );

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
    <Button
      onClick={createCheckoutSession}
      className="w-full hover:cursor-pointer hover:bg-primary/80"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        "Go Premium"
      )}
    </Button>
  );
};

export default GoPremiumButton;
