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
import { Loader2, MailCheck, RefreshCcw, ShieldCheck, Link2 } from "lucide-react";

function getDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  return null;
}

function getDiscordUiState(profileDoc) {
  const discord = profileDoc?.discord || {};
  const inviteExpiresAt = getDateValue(discord.lastInviteExpiresAt);
  const inviteIsFresh = inviteExpiresAt ? inviteExpiresAt.getTime() > Date.now() : false;

  if (!profileDoc?.isPremium) {
    return {
      badge: discord.userId ? "Linked" : "Not linked",
      title: discord.userId
        ? "Discord is linked to your account"
        : "Connect Discord when you upgrade",
      description: discord.userId
        ? "Your Discord account is ready for future premium access."
        : "Premium members can link Discord to receive server access automatically.",
      canConnect: !discord.userId,
      canResend: false,
    };
  }

  if (!discord.userId) {
    return {
      badge: "Connect Discord",
      title: "Connect Discord to activate server access",
      description:
        "Link your Discord account and we will provision premium access and email your 7-day invite automatically.",
      canConnect: true,
      canResend: false,
    };
  }

  if (inviteIsFresh) {
    return {
      badge: "Invite emailed",
      title: "Your Discord invite is on the way",
      description:
        "We emailed your current 7-day invite link. If it expires, you can resend a fresh one here.",
      canConnect: false,
      canResend: true,
      inviteExpiresAt,
    };
  }

  return {
    badge: "Discord access active",
    title: "Your premium Discord access is active",
    description:
      "Your Discord account is linked. You can resend a fresh invite email any time if you need it again.",
    canConnect: false,
    canResend: true,
    inviteExpiresAt,
  };
}

const PremiumDiscordAccessCard = ({ returnTo = "/premium/welcome", compact = false }) => {
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isResending, setIsResending] = useState(false);

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

  const handleResendInvite = async () => {
    setIsResending(true);

    try {
      if (!authUser) {
        toast.error("Please sign in to continue");
        return;
      }

      const idToken = await authUser.getIdToken();
      const response = await fetch("/api/discord/resend-invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to resend Discord invite");
      }

      toast.success("A fresh Discord invite email has been sent.");
    } catch (error) {
      console.error("Error resending Discord invite:", error);
      toast.error(error.message || "Unable to resend Discord invite.");
    } finally {
      setIsResending(false);
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

        {uiState.inviteExpiresAt ? (
          <p className="text-xs text-muted-foreground">
            Latest invite expires on{" "}
            {uiState.inviteExpiresAt.toLocaleString("en-IE", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>
        ) : null}

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

          {uiState.canResend ? (
            <Button
              variant={uiState.badge === "Invite emailed" ? "outline" : "default"}
              className="shadow-md"
              onClick={handleResendInvite}
              disabled={isResending}
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : uiState.badge === "Invite emailed" ? (
                <RefreshCcw className="mr-2 h-4 w-4" />
              ) : (
                <MailCheck className="mr-2 h-4 w-4" />
              )}
              Resend Invite
            </Button>
          ) : null}

          {!uiState.canConnect && !uiState.canResend ? (
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
