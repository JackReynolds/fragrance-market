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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SellerAccountStatus = ({ userDoc }) => {
  const { authUser } = useAuth();
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(true);
  const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
  const [creatingStripeAccount, setCreatingStripeAccount] = useState(false);

  const STATUS_CODES = {
    TRANSFERS_ENABLED: 1,
    REQUIREMENTS_DUE: 2,
    ONBOARDING_NOT_COMPLETE: 3,
    TRANSFERS_DISABLED: 4,
    NO_STRIPE_ACCOUNT: 5,
  };

  const generateStatusMessage = (statusCode) => {
    switch (statusCode) {
      case 1:
        return "Onboarding complete and Stripe details up to date";
      case 2:
        return "Stripe requirements due. Complete these to avoid disruptions in transfers.";
      case 3:
        return "Onboarding not complete. Complete the process to enable payments.";
      case 4:
        return "Transfers are disabled. This could be due to overdue requirements or other issues.";
      default:
        return "Please contact support for assistance.";
    }
  };

  useEffect(() => {
    if (!authUser) {
      setLoadingStripeStatus(false);
      return;
    }

    if (userDoc?.stripeAccountStatus) {
      setStripeAccountStatus({
        status: userDoc.stripeAccountStatus.statusCode,
        message: generateStatusMessage(userDoc.stripeAccountStatus.statusCode),
        actionURL: null,
      });
      setLoadingStripeStatus(false);
    } else if (userDoc?.stripeAccountId) {
      // If we have a stripeAccountId but no cached status, fetch it
      fetchStripeStatus();
    } else {
      // No Stripe account at all
      setStripeAccountStatus({
        status: STATUS_CODES.NO_STRIPE_ACCOUNT,
        message: "No Stripe account found",
        actionURL: null,
      });
      setLoadingStripeStatus(false);
    }
  }, [userDoc, authUser]);

  const fetchStripeStatus = async () => {
    if (!authUser) return;

    setLoadingStripeStatus(true);
    try {
      const response = await fetch("/api/stripe/check-stripe-account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: authUser.uid }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Stripe account status");
      }

      const data = await response.json();
      setStripeAccountStatus({
        status: data.status,
        message: data.message,
        actionURL: data.actionURL,
      });
    } catch (error) {
      console.error("Error fetching Stripe account status:", error);
      toast.error("Failed to fetch Stripe account status.");
      // Set a fallback state so loading stops
      setStripeAccountStatus({
        status: STATUS_CODES.NO_STRIPE_ACCOUNT,
        message: "Unable to load account status",
        actionURL: null,
      });
    } finally {
      setLoadingStripeStatus(false);
    }
  };

  const handleStripeOnboarding = async () => {
    if (!authUser) return;

    setCreatingStripeAccount(true);
    try {
      const response = await fetch(
        "/api/stripe/create-stripe-account-and-link",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: authUser.uid,
            accountType: "express",
            email: authUser.email,
          }),
        }
      );

      const data = await response.json();
      if (data.actionURL) {
        window.open(data.actionURL, "_blank");
      }
    } catch (error) {
      console.error("Error creating Stripe account:", error);
      toast.error("Failed to create Stripe account");
    } finally {
      setCreatingStripeAccount(false);
    }
  };

  const getStripeStatusColor = () => {
    switch (stripeAccountStatus?.status) {
      case STATUS_CODES.TRANSFERS_ENABLED:
        return "bg-green-100 text-green-800";
      case STATUS_CODES.REQUIREMENTS_DUE:
        return "bg-yellow-100 text-yellow-800";
      case STATUS_CODES.ONBOARDING_NOT_COMPLETE:
        return "bg-blue-100 text-blue-800";
      case STATUS_CODES.TRANSFERS_DISABLED:
        return "bg-red-100 text-red-800";
      case STATUS_CODES.NO_STRIPE_ACCOUNT:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStripeActionButtonText = () => {
    switch (stripeAccountStatus?.status) {
      case STATUS_CODES.TRANSFERS_ENABLED:
        return "Manage Stripe Account";
      case STATUS_CODES.REQUIREMENTS_DUE:
        return "Complete Requirements";
      case STATUS_CODES.ONBOARDING_NOT_COMPLETE:
        return "Complete Onboarding";
      case STATUS_CODES.TRANSFERS_DISABLED:
        return "Resolve Issues";
      case STATUS_CODES.NO_STRIPE_ACCOUNT:
        return "Create Stripe Account";
      default:
        return "Manage Stripe Account";
    }
  };

  const handleStripeAction = () => {
    if (stripeAccountStatus?.status === STATUS_CODES.NO_STRIPE_ACCOUNT) {
      handleStripeOnboarding();
    } else if (stripeAccountStatus?.actionURL) {
      window.open(stripeAccountStatus.actionURL, "_blank");
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
                {renderStripeStatus()}
              </span>
            </div>

            <div className="p-3 bg-muted/40 rounded-md">
              <p className="text-sm">{stripeAccountStatus.message}</p>
            </div>

            <Button
              className="hover:cursor-pointer hover:bg-primary/80 shadow-md"
              onClick={handleStripeAction}
              disabled={creatingStripeAccount}
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
              className="hover:cursor-pointer shadow-md mt-2 block"
              onClick={fetchStripeStatus}
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
              onClick={fetchStripeStatus}
              className="hover:cursor-pointer shadow-md mt-2"
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
