"use client";
/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  XCircle,
  Clock,
  Package,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, authUser }) => {
  const [confirmText, setConfirmText] = useState("");
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [blockDetails, setBlockDetails] = useState(null);

  // Check eligibility when modal opens
  useEffect(() => {
    if (isOpen && authUser) {
      checkEligibility();
    } else {
      // Reset state when modal closes
      setConfirmText("");
      setIsCheckingEligibility(true);
      setEligible(false);
      setBlockReason(null);
      setBlockDetails(null);
    }
  }, [isOpen, authUser]);

  const checkEligibility = async () => {
    setIsCheckingEligibility(true);
    try {
      const idToken = await authUser.getIdToken();

      const response = await fetch(
        "/api/firebase/check-delete-account-eligibility",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const result = await response.json();

      if (result.eligible) {
        setEligible(true);
        setIsPremium(result.isPremium);
        setBlockReason(null);
        setBlockDetails(null);
      } else {
        setEligible(false);
        setBlockReason(result.blockReason);
        setBlockDetails({
          count: result.count,
          earliestDeletionDate: result.earliestDeletionDate,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setEligible(false);
      setBlockReason("error");
      setBlockDetails({
        error:
          "Failed to check account status. Please try again or contact support.",
      });
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleConfirm = async () => {
    if (confirmText !== "DELETE" || !eligible) return;

    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("");
      onClose();
    }
  };

  // Get icon based on block reason
  const getBlockIcon = () => {
    switch (blockReason) {
      case "active_swaps":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "recent_swaps":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "active_listings":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "connected_account":
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  // Get title based on state
  const getTitle = () => {
    if (isCheckingEligibility) return "Delete Account";
    if (!eligible) return "Cannot Delete Account";
    return "Delete Account";
  };

  // Get description based on block reason
  const getBlockDescription = () => {
    switch (blockReason) {
      case "active_swaps":
        return {
          title: "You have active swap requests",
          description: `You currently have ${blockDetails?.count} active swap request(s) that must be completed or cancelled before deleting your account. Please go to your inbox to manage these swaps.`,
        };
      case "recent_swaps":
        return {
          title: "Recent swap activity detected",
          description: `You completed a swap within the last 30 days. For fraud protection, you can delete your account after ${blockDetails?.earliestDeletionDate}. This ensures both parties have time to resolve any issues.`,
        };
      case "active_listings":
        return {
          title: "You have active listings",
          description: `You currently have ${blockDetails?.count} active listing(s). Please delete all your listings from the "My Listings" tab before deleting your account.`,
        };
      case "connected_account":
        return {
          title: "Active seller account detected",
          description:
            "You have an active Stripe seller account. Please contact our support team to properly close your seller account before deleting your user account.",
        };
      default:
        return {
          title: "Unable to process request",
          description:
            blockDetails?.error ||
            "An error occurred while checking your account. Please try again or contact support.",
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isCheckingEligibility ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : !eligible ? (
              getBlockIcon()
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {isCheckingEligibility
              ? "Checking your account status..."
              : !eligible
              ? "Your account cannot be deleted at this time."
              : "This action cannot be undone. Please read carefully."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {isCheckingEligibility ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !eligible ? (
            /* Blocked State */
            <>
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {getBlockDescription().title}
                    </p>
                    <p className="text-sm">
                      {getBlockDescription().description}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action suggestions */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">What you can do:</p>
                <ul className="text-sm space-y-1 ml-4">
                  {blockReason === "active_swaps" && (
                    <li className="list-disc">
                      Go to your Inbox and complete or cancel active swap
                      requests
                    </li>
                  )}
                  {blockReason === "recent_swaps" && (
                    <li className="list-disc">
                      Wait until {blockDetails?.earliestDeletionDate} to delete
                      your account
                    </li>
                  )}
                  {blockReason === "active_listings" && (
                    <li className="list-disc">
                      Go to &quot;My Listings&quot; tab and delete all your
                      listings
                    </li>
                  )}
                  {blockReason === "connected_account" && (
                    <li className="list-disc">
                      Contact support at support@thefragrancemarket.com
                    </li>
                  )}
                  {blockReason === "error" && (
                    <>
                      <li className="list-disc">Try again in a few moments</li>
                      <li className="list-disc">
                        Contact support if the issue persists
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </>
          ) : (
            /* Eligible - Show Warning and Confirmation */
            <>
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently delete your
                  account
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm">
                <p className="font-semibold">This action will:</p>
                <ul className="space-y-2 ml-4">
                  {isPremium && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>
                        <strong>Cancel your premium subscription</strong>{" "}
                        immediately
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>
                      <strong>Delete all your data</strong> including profile,
                      history, and messages
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>
                      <strong>Remove your account permanently</strong> - this
                      cannot be undone
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <span className="font-mono font-bold">DELETE</span> to
                  confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="font-mono"
                  autoComplete="off"
                  disabled={isDeleting}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!eligible || isCheckingEligibility ? (
            <Button
              onClick={handleClose}
              className="w-full sm:w-auto hover:cursor-pointer"
              disabled={isCheckingEligibility}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={confirmText !== "DELETE" || isDeleting}
                className="hover:cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account Permanently"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountModal;
