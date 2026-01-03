"use client";
/* eslint-disable react/prop-types */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, ShieldCheck, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

const SaleTermsWarningModal = ({
  isOpen,
  onClose,
  onSubmitAnyway,
  matchedTerms = [],
}) => {
  const router = useRouter();

  const handleLearnAboutPremium = () => {
    router.push("/premium");
  };

  const handleSubmitAnyway = () => {
    onSubmitAnyway();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left text-xl">
                Sale Activity Detected
              </DialogTitle>
              <DialogDescription className="text-left mt-1">
                Our system has detected language that suggests you may be trying
                to sell this fragrance.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Detected Terms */}
        {matchedTerms.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">
              Detected terms:
            </p>
            <div className="flex flex-wrap gap-2">
              {matchedTerms.map((term, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Premium Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
            <Crown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Premium Members Can Sell</p>
              <p className="text-xs text-muted-foreground mt-1">
                Selling fragrances is exclusively available to Premium members
                who have completed ID verification. This ensures trust and
                safety across our marketplace.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
            <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Why We Check</p>
              <p className="text-xs text-muted-foreground mt-1">
                We review listings to maintain a fair marketplace. This protects
                both buyers and sellers by ensuring all sales go through our
                secure payment system.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
          <Eye className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Manual Review Notice
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If you submit this listing anyway, it will be subject to manual
              review by The Fragrance Market team. Listings found to violate our
              policies may be removed, and repeated violations could result in
              account suspension.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={handleSubmitAnyway}
            className="order-2 sm:order-1 hover:cursor-pointer"
          >
            Submit Anyway
          </Button>
          <Button
            onClick={handleLearnAboutPremium}
            className="order-1 sm:order-2 hover:cursor-pointer gap-2"
          >
            <Crown className="h-4 w-4" />
            Learn About Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaleTermsWarningModal;
