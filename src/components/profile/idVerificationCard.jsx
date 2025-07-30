"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ShieldCheck, Shield, AlertCircle } from "lucide-react";
import VeriffIDVerificationButton from "@/components/veriffIDVerificationButton";
import { useAuth } from "@/hooks/useAuth";
import { useUserDoc } from "@/hooks/useUserDoc";
import IdVerifiedBadge from "../ui/idVerifiedBadge";

const IDVerificationCard = () => {
  const { userDoc } = useUserDoc();
  const { authUser } = useAuth();

  const isVerified = userDoc.veriff?.decision === "approved";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isVerified ? "bg-green-100" : "bg-blue-100"
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Shield className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">ID Verification</CardTitle>
            <CardDescription className="text-sm mt-1">
              {isVerified
                ? "Your identity has been successfully verified"
                : "Verify your identity to build trust with other users"}
            </CardDescription>
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
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">
                    Verification Required
                  </p>
                  <p className="text-sm text-amber-700">
                    ID verification is required to sell fragrances on the
                    platform.
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
                  Verification is securely handled by <strong>Veriff</strong>,
                  an industry-leading identity verification provider.
                </p>
                <VeriffIDVerificationButton
                  authUser={authUser}
                  userDoc={userDoc}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IDVerificationCard;
