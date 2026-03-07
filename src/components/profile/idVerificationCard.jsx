"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ShieldCheck,
  Shield,
  AlertCircle,
  Lock,
  Loader2,
} from "lucide-react";
import IdentityVerificationButton from "@/components/identityVerificationButton";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import IdVerifiedBadge from "../ui/idVerifiedBadge";
import { resolveIdentityVerification } from "@/lib/identityVerification";

const IDVerificationCard = () => {
  const { profileDoc } = useProfileDoc();
  const { authUser } = useAuth();
  const verification = resolveIdentityVerification(profileDoc || {});
  const isVerified = verification.verified;

  const cardIcon = isVerified ? (
    <ShieldCheck className="h-5 w-5 text-green-600" />
  ) : verification.locked ? (
    <Lock className="h-5 w-5 text-red-600" />
  ) : verification.status === "processing" ? (
    <Loader2 className="h-5 w-5 text-sky-600" />
  ) : (
    <Shield className="h-5 w-5 text-gray-600" />
  );

  const cardToneClass = isVerified
    ? "bg-green-100"
    : verification.locked
      ? "bg-red-100"
      : verification.status === "processing"
        ? "bg-sky-100"
        : "bg-gray-100";

  const description = isVerified
    ? "Your identity has been successfully verified"
    : verification.locked
      ? "Your verification is locked. Please contact support."
      : verification.status === "processing"
        ? "Stripe Identity is reviewing your documents"
        : verification.status === "requires_input" ||
            verification.status === "canceled"
          ? "Your verification needs attention before it can be approved"
          : "Verify your identity to build trust with other users";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${cardToneClass}`}>{cardIcon}</div>
          <div>
            <CardTitle className="text-lg">ID Verification</CardTitle>
            <CardDescription className="text-sm mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isVerified ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <IdVerifiedBadge />
            <div>
              <p className="font-medium text-green-900">Identity Verified</p>
              <p className="text-sm text-green-700">
                You can now sell fragrances and have earned the ID Verified
                badge.
              </p>
            </div>
          </div>
        ) : verification.locked ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Verification Locked</p>
                <p className="text-sm text-red-700">
                  Your account needs manual support before verification can be
                  retried. Contact support@thefragrancemarket.com.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    {verification.status === "processing"
                      ? "Verification In Progress"
                      : verification.status === "requires_input" ||
                          verification.status === "canceled"
                        ? "Verification Needs Attention"
                        : "Verification Required"}
                  </p>
                  <p className="text-sm text-amber-700">
                    {verification.status === "processing"
                      ? "Stripe Identity is reviewing your verification. You can reopen the flow if prompted."
                      : verification.status === "requires_input" ||
                          verification.status === "canceled"
                        ? "Your last attempt needs more information before it can be approved."
                        : "ID verification is required to sell fragrances on the platform."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">
                  Benefits of verification:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Get the ID Verified badge on your profile
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Required for selling fragrances
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Build trust with other users
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-3">
                  Verification is securely handled by{" "}
                  <strong>Stripe Identity</strong>. We do not store your ID
                  documents on our servers.
                </p>
                <IdentityVerificationButton
                  authUser={authUser}
                  profileDoc={profileDoc}
                />
                {(verification.attemptsTotal > 0 ||
                  verification.lastErrorCode) && (
                  <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <span className="mr-4">
                      Attempts: <strong>{verification.attemptsTotal}</strong>
                    </span>
                    <span className="mr-4">
                      Retries left:{" "}
                      <strong>{verification.retriesRemainingNonFraud}</strong>
                    </span>
                    {verification.lastErrorCode ? (
                      <span>
                        Last issue: <strong>{verification.lastErrorCode}</strong>
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IDVerificationCard;
