"use client";

/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

const SellerAccountStatus = ({ userDoc }) => {
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(true);
  const [stripeAccountStatus, setStripeAccountStatus] = useState(null);

  const STATUS_CODES = {
    TRANSFERS_ENABLED: 1,
    REQUIREMENTS_DUE: 2,
    ONBOARDING_NOT_COMPLETE: 3,
    TRANSFERS_DISABLED: 4,
    NO_STRIPE_ACCOUNT: 5,
  };

  useEffect(() => {
    if (userDoc?.stripeAccountStatus) {
      setStripeAccountStatus({
        status: userDoc.stripeAccountStatus.statusCode,
        message: generateStatusMessage(userDoc.stripeAccountStatus),
        actionURL: null,
      });
    } else if (userDoc?.stripeAccountId) {
      // Fallback: only call API if we have no cached status
      setStripeAccountStatus({
        status: STATUS_CODES.NO_STRIPE_ACCOUNT,
        message: "No Stripe account found",
        actionURL: null,
      });
    }
  }, [userDoc]);

  const fetchStripeStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://checkstripeaccountstatus-checkstripeaccountstatus-iz3msmwhcq-nw.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: authUser.uid }),
        }
      );
      if (!response.ok)
        throw new Error("Failed to fetch Stripe account status");
      const data = await response.json();
      setStripeAccountStatus({
        status: data.status,
        message: data.message,
        actionURL: data.actionURL,
      });
    } catch (error) {
      console.error("Error fetching Stripe account status:", error);
      toast.error("Failed to fetch Stripe account status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeOnboarding = async () => {
    if (!authUser) return;
    const body = JSON.stringify({
      uid: authUser.uid,
      accountType: "express",
      email: authUser.email,
    });
    try {
      setIsLoading(true);
      const response = await fetch(
        "/api/stripe/create-stripe-account-and-link",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );
      const data = await response.json();
      window.open(data.actionURL, "_blank");
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const renderStripeStatus = () => {
    switch (stripeAccountStatus?.status) {
      case STATUS_CODES.TRANSFERS_ENABLED:
        return "Transfers Enabled";
      case STATUS_CODES.REQUIREMENTS_DUE:
        return "Complete Stripe Requirements";
      case STATUS_CODES.ONBOARDING_NOT_COMPLETE:
        return "Complete Stripe Onboarding";
      case STATUS_CODES.TRANSFERS_DISABLED:
        return "Transfers Disabled - Resolve Issues";
      case STATUS_CODES.NO_STRIPE_ACCOUNT:
        return "No Stripe Account";
      default:
        return "Unknown Stripe Status - Please Contact Support";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Seller Account</CardTitle>
        <CardDescription>
          Manage your seller account to receive payments from sales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingStripeStatus ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-pulse text-sm">
              Checking account status...
            </div>
          </div>
        ) : stripeAccountStatus ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStripeStatusColor()}`}
              >
                {stripeAccountStatus.status.replace("_", " ").toUpperCase()}
              </span>
            </div>

            <div className="p-3 bg-muted/40 rounded-md">
              <p className="text-sm">{stripeAccountStatus.message}</p>

              {stripeAccountStatus.canReceivePayments && (
                <div className="flex items-center text-green-600 mt-2">
                  <Check size={16} className="mr-1" />
                  <span className="text-sm">Ready to receive payments</span>
                </div>
              )}

              {stripeAccountStatus.details?.requirementsCounts && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {stripeAccountStatus.details.requirementsCounts.currentlyDue >
                    0 && (
                    <p>
                      •{" "}
                      {
                        stripeAccountStatus.details.requirementsCounts
                          .currentlyDue
                      }{" "}
                      requirement(s) due now
                    </p>
                  )}
                  {stripeAccountStatus.details.requirementsCounts.pastDue >
                    0 && (
                    <p className="text-red-600">
                      • {stripeAccountStatus.details.requirementsCounts.pastDue}{" "}
                      past due requirement(s)
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full hover:cursor-pointer hover:bg-primary/80"
              onClick={handleStripeAction}
              disabled={
                creatingStripeAccount ||
                stripeAccountStatus.actionRequired === "wait_verification"
              }
            >
              {creatingStripeAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                getStripeActionButtonText()
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="hover:cursor-pointer shadow-md mt-2"
              // onClick={checkStripeAccountStatus}
              disabled={loadingStripeStatus}
            >
              Refresh Status
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load account status
            </p>
            <Button
              variant="outline"
              // onClick={checkStripeAccountStatus}
              className=" hover:cursor-pointer shadow-md mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerAccountStatus;
