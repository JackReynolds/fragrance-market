/* eslint-disable react/prop-types */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Zap } from "lucide-react";
import GoPremiumModal from "./goPremiumModal";

const SwapCountExceededButton = ({ profileDoc, authUser, className }) => {
  const [showModal, setShowModal] = useState(false);

  // Check if user has exceeded their monthly swap limit
  const hasExceededLimit =
    profileDoc && !profileDoc.isPremium && profileDoc.monthlySwapCount >= 1;

  if (!hasExceededLimit) return null;

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        disabled={true}
        className={`relative overflow-hidden bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 text-amber-800 hover:from-amber-200 hover:to-orange-200 transition-all duration-300 ${className}`}
        size="lg"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <Crown className="absolute top-1 right-1 w-6 h-6 text-amber-600" />
          <Lock className="absolute bottom-1 left-1 w-4 h-4 text-amber-600" />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span className="font-medium">Monthly Swap Limit Reached</span>
          <div className="ml-2 px-2 py-1 bg-amber-200 rounded-full">
            <span className="text-xs font-bold">
              {profileDoc?.monthlySwapCount}/1
            </span>
          </div>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
      </Button>

      <div className="mt-2 text-center">
        <Button
          onClick={() => setShowModal(true)}
          variant="link"
          className="text-primary hover:text-primary/80 text-sm p-0 h-auto font-medium"
        >
          <Zap className="w-3 h-3 mr-1" />
          Upgrade to Premium for unlimited swaps
        </Button>
      </div>

      <GoPremiumModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        profileDoc={profileDoc}
        authUser={authUser}
        trigger="swap_limit"
      />
    </>
  );
};

export default SwapCountExceededButton;
