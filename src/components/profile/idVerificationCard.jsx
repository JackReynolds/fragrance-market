"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import VeriffIDVerificationButton from "@/components/veriffIDVerificationButton";
import { useAuth } from "@/hooks/useAuth";
import { useUserDoc } from "@/hooks/useUserDoc";

const IDVerificationCard = () => {
  const { userDoc } = useUserDoc();
  const { authUser } = useAuth();

  return (
    <>
      {/* ID Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ID Verification</CardTitle>

          {userDoc?.idVerified ? null : (
            <>
              <CardDescription>
                Verify your identity to get a verification badge and build trust
                with other users on the platform.
              </CardDescription>
              <CardDescription>
                * ID verification is required to sell fragrances.
              </CardDescription>
              <p className="text-sm">
                ID Verification is handled by the industry-leading provider,{" "}
                <strong>Veriff.</strong>
              </p>
            </>
          )}
        </CardHeader>
        <CardContent>
          {userDoc.veriff?.decision === "approved" ? (
            <div className="flex items-center text-green-600">
              <ShieldCheck className="mr-2" size={20} />
              <div>
                <p className="font-medium">ID Verified</p>
                <p className="text-sm text-muted-foreground">
                  Your identity has been verified.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <VeriffIDVerificationButton
                authUser={authUser}
                userDoc={userDoc}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default IDVerificationCard;
