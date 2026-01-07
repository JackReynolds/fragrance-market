"use client";

/* eslint-disable react/prop-types */

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData } from "@/context/adminDataContext";
import DataTable from "@/components/admin/dataTable";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  Eye,
  XCircle,
  Clock,
  CheckCircle,
  Package,
  Truck,
  AlertCircle,
  RefreshCw,
  Crown,
  ShieldCheck,
  User,
  MessageSquare,
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import firestoreTimestampToDate from "@/utils/firestoreTimestampToDate";

export default function AdminSwapsPage() {
  const { authUser } = useAuth();
  const {
    swaps,
    swapsLoading: loading,
    swapsLastFetch,
    fetchSwaps,
    refreshSwaps,
  } = useAdminData();

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [swapToCancel, setSwapToCancel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  // Fetch messages when a swap is selected
  const fetchMessages = async (swapId) => {
    if (!authUser) return;

    setMessagesLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/admin/swaps/${swapId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleViewSwap = (swap) => {
    setSelectedSwap(swap);
    setViewDialogOpen(true);
    fetchMessages(swap.id);
  };

  const handleCancel = async (swapId) => {
    if (!authUser) return;

    setActionLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "cancel",
          collection: "swap_requests",
          documentId: swapId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        refreshSwaps();
        setCancelDialogOpen(false);
        setSwapToCancel(null);
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      console.error("Error cancelling swap:", error);
      toast.error("Failed to cancel swap request");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = firestoreTimestampToDate(timestamp);
    if (!date) return "—";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (timestamp) => {
    const date = firestoreTimestampToDate(timestamp);
    if (!date) return "—";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      swap_request: {
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        label: "Pending",
      },
      pending: {
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        label: "Pending",
      },
      swap_accepted: {
        icon: CheckCircle,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        label: "Accepted",
      },
      accepted: {
        icon: CheckCircle,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        label: "Accepted",
      },
      pending_shipment: {
        icon: Truck,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        label: "Awaiting Shipment",
      },
      shipped: {
        icon: Truck,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        label: "Shipped",
      },
      swap_completed: {
        icon: CheckCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        label: "Completed",
      },
      completed: {
        icon: CheckCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        label: "Completed",
      },
      cancelled: {
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
        label: "Cancelled",
      },
      rejected: {
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
        label: "Rejected",
      },
    };
    const {
      icon: Icon,
      color,
      bg,
      label,
    } = config[status] || {
      icon: AlertCircle,
      color: "text-muted-foreground",
      bg: "bg-muted",
      label: status || "Unknown",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${color}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  // Get message type label
  const getMessageTypeLabel = (type) => {
    const types = {
      swap_request: "Swap Request Sent",
      swap_accepted: "Swap Accepted",
      pending_shipment: "Shipping Details Confirmed",
      swap_completed: "Swap Completed",
    };
    return types[type] || null;
  };

  const columns = [
    {
      key: "offeredListing",
      label: "Offered",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
            {row.offeredListing?.imageURL ? (
              <Image
                src={row.offeredListing.imageURL}
                alt=""
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate max-w-[150px]">
              {row.offeredListing?.fragrance || "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              by {row.offeredBy?.username || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "arrow",
      label: "",
      render: () => (
        <ArrowLeftRight className="h-4 w-4 text-muted-foreground mx-2" />
      ),
    },
    {
      key: "requestedListing",
      label: "Requested",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
            {row.requestedListing?.imageURL ? (
              <Image
                src={row.requestedListing.imageURL}
                alt=""
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate max-w-[150px]">
              {row.requestedListing?.fragrance || "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              from {row.requestedFrom?.username || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const renderActions = (row) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleViewSwap(row)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {row.status !== "cancelled" &&
        row.status !== "swap_completed" &&
        row.status !== "completed" &&
        row.status !== "rejected" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => {
              setSwapToCancel(row);
              setCancelDialogOpen(true);
            }}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
    </>
  );

  // Format time ago for cache status
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // User card component
  const UserCard = ({ user, label, listing }) => (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
          {user?.profilePictureURL ? (
            <Image
              src={user.profilePictureURL}
              alt=""
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{user?.username || "—"}</p>
            {user?.isPremium && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500">
                <Crown className="h-2.5 w-2.5" />
              </span>
            )}
            {user?.isIdVerified && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
          {user?.rating > 0 && (
            <p className="text-xs text-muted-foreground">
              Rating: {user.rating}
            </p>
          )}
        </div>
      </div>

      {/* Listing Info */}
      <div className="flex items-start gap-3 pt-3 border-t border-border/50">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {listing?.imageURL ? (
            <Image
              src={listing.imageURL}
              alt=""
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{listing?.fragrance || "—"}</p>
          <p className="text-xs text-muted-foreground">
            {listing?.brand || "—"}
          </p>
          {listing?.amountLeft && (
            <p className="text-xs text-muted-foreground mt-1">
              {listing.amountLeft}% remaining
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            Swap Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage swap request transactions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-mono">
              {swaps.length} total
            </p>
            {swapsLastFetch && (
              <p className="text-xs text-muted-foreground">
                Updated {getTimeAgo(swapsLastFetch)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSwaps}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={swaps}
        columns={columns}
        searchKeys={[
          "offeredBy.username",
          "requestedFrom.username",
          "offeredListing.fragrance",
          "requestedListing.fragrance",
        ]}
        isLoading={loading}
        actions={renderActions}
        emptyMessage="No swap requests found"
      />

      {/* View Swap Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Swap Request Details
              {selectedSwap && getStatusBadge(selectedSwap.status)}
            </DialogTitle>
          </DialogHeader>
          {selectedSwap && (
            <div className="space-y-6">
              {/* The Two Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UserCard
                  user={selectedSwap.offeredBy}
                  label="Offering"
                  listing={selectedSwap.offeredListing}
                />
                <UserCard
                  user={selectedSwap.requestedFrom}
                  label="Requested From"
                  listing={selectedSwap.requestedListing}
                />
              </div>

              {/* Swap Timeline */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Timeline
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Request ID</p>
                    <p className="font-mono text-xs break-all">
                      {selectedSwap.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p>{formatDateTime(selectedSwap.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Last Updated
                    </p>
                    <p>{formatDateTime(selectedSwap.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Current Status
                    </p>
                    <p className="capitalize">
                      {selectedSwap.status?.replace(/_/g, " ") || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Messages (
                  {messages.length})
                </h4>
                <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading messages...
                      </span>
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages in this swap request
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const typeLabel = getMessageTypeLabel(message.type);
                        const isSystemMessage = !!typeLabel;

                        return (
                          <div
                            key={message.id}
                            className={`rounded-lg p-3 ${
                              isSystemMessage
                                ? "bg-primary/5 border border-primary/20"
                                : "bg-background border border-border"
                            }`}
                          >
                            {isSystemMessage ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">
                                  {typeLabel}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatDateTime(message.createdAt)}
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">
                                    {message.senderUsername || "Unknown"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(message.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm">{message.text}</p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/listings/${selectedSwap.offeredListing?.id}`,
                      "_blank"
                    )
                  }
                  disabled={!selectedSwap.offeredListing?.id}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Offered Listing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/listings/${selectedSwap.requestedListing?.id}`,
                      "_blank"
                    )
                  }
                  disabled={!selectedSwap.requestedListing?.id}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Requested Listing
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Swap Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this swap request? Both parties
              will be notified.
            </DialogDescription>
          </DialogHeader>
          {swapToCancel && (
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                  {swapToCancel.offeredListing?.imageURL && (
                    <Image
                      src={swapToCancel.offeredListing.imageURL}
                      alt=""
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {swapToCancel.offeredListing?.fragrance}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    offered by {swapToCancel.offeredBy?.username}
                  </p>
                </div>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground mx-2" />
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                  {swapToCancel.requestedListing?.imageURL && (
                    <Image
                      src={swapToCancel.requestedListing.imageURL}
                      alt=""
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {swapToCancel.requestedListing?.fragrance}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    from {swapToCancel.requestedFrom?.username}
                  </p>
                </div>
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">Current Status:</span>{" "}
                {getStatusBadge(swapToCancel.status)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setSwapToCancel(null);
              }}
            >
              Keep Active
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleCancel(swapToCancel?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? "Cancelling..." : "Cancel Swap Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
