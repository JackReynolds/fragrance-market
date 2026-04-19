"use client";

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { Loader2, RefreshCcw, ShieldCheck, Link2 } from "lucide-react";

function getDiscordUiState(profileDoc) {
  const discord = profileDoc?.discord || {};
  const accessStatus = discord.accessStatus || "inactive";
  const hasSyncError = Boolean(discord.lastError) || accessStatus === "error";

  if (!profileDoc?.isPremium) {
    return {
      badge: discord.userId ? "Linked" : "Premium only",
      title: discord.userId
        ? "Discord is linked to your account"
        : "Connect Discord when you upgrade",
      description: discord.userId
        ? "Your Discord account is ready for future premium access."
        : "Premium members can link Discord to receive server access automatically.",
      canConnect: false,
      canSync: false,
      syncLabel: "Retry Discord Access",
    };
  }

  if (!discord.userId) {
    return {
      badge: "Connect Discord",
      title: "Connect Discord to activate server access",
      description:
        "Link your Discord account to activate premium server access. Don't have Discord yet? Create an account first, then come back and connect it here.",
      canConnect: true,
      canSync: false,
      syncLabel: "Retry Discord Access",
    };
  }

  if (hasSyncError) {
    return {
      badge: "Action needed",
      title: "Discord access needs attention",
      description:
        "Your Discord account is linked, but server access could not be activated. Retry the sync here.",
      canConnect: false,
      canSync: true,
      syncLabel: "Retry Discord Access",
    };
  }

  if (accessStatus === "active") {
    return {
      badge: "Discord active",
      title: "Your premium Discord access is active",
      description:
        "Your Discord account is linked and active for The Fragrance Market premium server.",
      canConnect: false,
      canSync: false,
      syncLabel: "Retry Discord Access",
    };
  }

  return {
    badge: "Ready to sync",
    title: "Finish activating Discord access",
    description:
      "Your Discord account is linked. If server access is not active yet, run the sync again here.",
    canConnect: false,
    canSync: true,
    syncLabel: "Sync Discord Access",
  };
}

const PremiumDiscordAccessCard = ({ returnTo = "/premium/welcome", compact = false }) => {
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const uiState = useMemo(() => getDiscordUiState(profileDoc), [profileDoc]);

  useEffect(() => {
    const discordStatus = searchParams.get("discord");
    const discordMessage = searchParams.get("discordMessage");

    if (!discordStatus) {
      return;
    }

    if (discordStatus === "error") {
      toast.error(discordMessage || "Unable to connect Discord.");
    } else {
      toast.success(discordMessage || "Discord updated successfully.");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("discord");
    nextParams.delete("discordMessage");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [pathname, router, searchParams]);

  const handleConnectDiscord = async () => {
    setIsConnecting(true);

    try {
      if (!authUser) {
        toast.error("Please sign in to continue");
        return;
      }

      const idToken = await authUser.getIdToken();
      const response = await fetch("/api/discord/connect-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ returnTo }),
      });

      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Unable to start Discord connection");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Error connecting Discord:", error);
      toast.error(error.message || "Unable to start Discord connection.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncAccess = async () => {
    setIsSyncing(true);

    try {
      if (!authUser) {
        toast.error("Please sign in to continue");
        return;
      }

      const idToken = await authUser.getIdToken();
      const response = await fetch("/api/discord/sync-access", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to sync Discord access");
      }

      toast.success(
        data?.accessStatus === "active"
          ? "Discord access is active."
          : "Discord access sync completed."
      );
    } catch (error) {
      console.error("Error syncing Discord access:", error);
      toast.error(error.message || "Unable to sync Discord access.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className={compact ? "border-primary/20 bg-primary/5" : ""}>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">Premium Discord Access</CardTitle>
            <CardDescription>{uiState.title}</CardDescription>
          </div>
          <Badge variant="outline">{uiState.badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{uiState.description}</p>

        {profileDoc?.discord?.lastError ? (
          <p className="text-sm text-destructive">{profileDoc.discord.lastError}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {uiState.canConnect ? (
            <Button
              className="shadow-md"
              onClick={handleConnectDiscord}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Connect Discord
            </Button>
          ) : null}

          {uiState.canSync ? (
            <Button
              variant="outline"
              className="shadow-md"
              onClick={handleSyncAccess}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {uiState.syncLabel}
            </Button>
          ) : null}

          {!uiState.canConnect && !uiState.canSync ? (
            <div className="inline-flex items-center text-sm text-muted-foreground">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Premium Discord access is managed automatically from your subscription status.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

PremiumDiscordAccessCard.propTypes = {
  returnTo: PropTypes.string,
  compact: PropTypes.bool,
};

export default PremiumDiscordAccessCard;
