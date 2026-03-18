"use client";
/* eslint-disable react/prop-types */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MODAL_COPY = {
  cancel: {
    title: "Cancel Swap Request",
    description:
      "Are you sure you want to cancel this swap request? Cancellations are monitored.",
    label: "Reason for cancellation (optional)",
    placeholder:
      "Let the other user know why you're cancelling this swap request...",
    confirmLabel: "Cancel Swap",
    submittingLabel: "Cancelling...",
    errorLabel: "Failed to cancel swap request",
  },
  decline: {
    title: "Decline Swap Request",
    description:
      "You can optionally let the other user know why you’re declining this swap request.",
    label: "Reason for declining (optional)",
    placeholder:
      "Let the other user know why you don't want to proceed with this swap...",
    confirmLabel: "Decline Swap",
    submittingLabel: "Declining...",
    errorLabel: "Failed to decline swap request",
  },
};

const CancelSwapRequestModal = ({
  isOpen,
  onClose,
  onConfirm,
  swapRequest,
  mode = "cancel",
  isLoading = false,
}) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalCopy = MODAL_COPY[mode] || MODAL_COPY.cancel;

  const handleCancel = async () => {
    if (isSubmitting || isLoading) return;

    try {
      setIsSubmitting(true);
      await onConfirm(message.trim());
      setMessage("");
    } catch (error) {
      console.error(`Error ${mode}ing swap:`, error);
      toast.error(modalCopy.errorLabel);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isLoading) return;
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">{modalCopy.title}</DialogTitle>
              <DialogDescription className="text-left mt-1">
                {modalCopy.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Swap Details Summary */}
        {swapRequest && (
          <div className="my-4 bg-muted/40 rounded-md">
            <p className="text-sm font-medium mb-2">Swap Request:</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">
                {swapRequest.offeredListing?.fragrance}
              </span>{" "}
              for{" "}
              <span className="font-medium">
                {swapRequest.requestedListing?.fragrance}
              </span>
            </p>
          </div>
        )}

        {/* Optional Message */}
        <div className="space-y-2">
          <label htmlFor="cancel-message" className="text-sm font-medium">
            {modalCopy.label}
          </label>
          <Textarea
            id="cancel-message"
            placeholder={modalCopy.placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] resize-none mt-2"
            maxLength={500}
            disabled={isSubmitting || isLoading}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/500 characters
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            className="hover:bg-accent hover:cursor-pointer"
          >
            Keep Swap
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || isLoading}
            className="hover:bg-destructive/90 hover:cursor-pointer"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {modalCopy.submittingLabel}
              </>
            ) : (
              modalCopy.confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSwapRequestModal;
