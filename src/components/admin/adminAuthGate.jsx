"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";

const ADMIN_UID = "LLnA54zGzgTGnGtkQSIQy9svcTJ2";

export default function AdminAuthGate({ children }) {
  const { authUser, authLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser || authUser.uid !== ADMIN_UID) {
        router.replace("/");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [authUser, authLoading, router]);

  if (authLoading) {
    return (
      <div className="dark fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="dark fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground font-mono">
            Access Denied
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

