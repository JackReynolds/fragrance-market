"use client";

import { React, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData } from "@/context/adminDataContext";
import DataTable from "@/components/admin/dataTable";
import { Button } from "@/components/ui/button";
import {
  Users,
  Eye,
  Ban,
  Trash2,
  CheckCircle,
  Crown,
  ShieldCheck,
  ExternalLink,
  MapPin,
  CreditCard,
  ArrowLeftRight,
  ShoppingBag,
  Heart,
  Mail,
  FileText,
  RefreshCw,
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

export default function AdminUsersPage() {
  const { authUser } = useAuth();
  const {
    users,
    usersLoading: loading,
    usersLastFetch,
    fetchUsers,
    refreshUsers,
  } = useAdminData();

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (action, userId) => {
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
          action,
          collection: "profiles",
          documentId: userId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        refreshUsers(); // Refresh the list
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        setSuspendDialogOpen(false);
        setUserToToggle(null);
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "profilePictureURL",
      label: "",
      render: (row) => (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {row.profilePictureURL ? (
            <Image
              src={row.profilePictureURL}
              alt=""
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "username",
      label: "Username",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.username || "—"}</span>
          {row.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
          {row.isIdVerified && (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.email || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {firestoreTimestampToDate(row.createdAt)?.toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "suspended",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            row.suspended
              ? "bg-red-500/10 text-red-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          {row.suspended ? (
            <>
              <Ban className="h-3 w-3" /> Suspended
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3" /> Active
            </>
          )}
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
        onClick={() => {
          setSelectedUser(row);
          setViewDialogOpen(true);
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setUserToToggle(row);
          setSuspendDialogOpen(true);
        }}
      >
        <Ban
          className={`h-4 w-4 ${
            row.suspended ? "text-emerald-500" : "text-amber-500"
          }`}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => {
          setUserToDelete(row);
          setDeleteDialogOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-mono">
              {users.length} total
            </p>
            {usersLastFetch && (
              <p className="text-xs text-muted-foreground">
                Updated {getTimeAgo(usersLastFetch)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshUsers}
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
        data={users}
        columns={columns}
        searchKeys={["username", "email", "firstName", "lastName"]}
        isLoading={loading}
        actions={renderActions}
        emptyMessage="No users found"
      />

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Header with profile picture */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {selectedUser.profilePictureURL ? (
                    <Image
                      src={selectedUser.profilePictureURL}
                      alt=""
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Users className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-xl">
                      {selectedUser.username || "No username"}
                    </p>
                    {selectedUser.isPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                        <Crown className="h-3 w-3" /> Premium
                      </span>
                    )}
                    {selectedUser.isIdVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {selectedUser.suspended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                        <Ban className="h-3 w-3" /> Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedUser.email}
                  </p>
                  {selectedUser.bio && (
                    <p className="text-sm mt-2 text-muted-foreground italic">
                      &quot;{selectedUser.bio}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Info Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Basic Info
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-muted-foreground text-xs">User ID</p>
                    <p className="font-mono text-xs break-all">
                      {selectedUser.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Joined</p>
                    <p>
                      {firestoreTimestampToDate(
                        selectedUser.createdAt
                      )?.toLocaleDateString() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Last Updated
                    </p>
                    <p>
                      {firestoreTimestampToDate(
                        selectedUser.updatedAt
                      )?.toLocaleDateString() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Country</p>
                    <p>
                      {selectedUser.country || "—"}{" "}
                      {selectedUser.countryCode
                        ? `(${selectedUser.countryCode})`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              {selectedUser.formattedAddress && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">{selectedUser.formattedAddress}</p>
                    {selectedUser.addressComponents && (
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Street</p>
                          <p>
                            {selectedUser.addressComponents.streetAddress ||
                              "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">City</p>
                          <p>{selectedUser.addressComponents.city || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">State</p>
                          <p>{selectedUser.addressComponents.state || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Postal Code</p>
                          <p>
                            {selectedUser.addressComponents.postalCode || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Country</p>
                          <p>{selectedUser.addressComponents.country || "—"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Stats */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" /> Activity
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <ArrowLeftRight className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold">
                      {selectedUser.swapCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Swaps</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <ShoppingBag className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                    <p className="text-2xl font-bold">
                      {selectedUser.saleCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Sales</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Heart className="h-5 w-5 mx-auto text-red-500 mb-1" />
                    <p className="text-2xl font-bold">
                      {selectedUser.favourites?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Favourites</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Mail className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-2xl font-bold">
                      {selectedUser.unreadMessageCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Unread</p>
                  </div>
                </div>
              </div>

              {/* Subscription Section (if premium) */}
              {selectedUser.isPremium && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Subscription
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="capitalize font-medium">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            selectedUser.subscriptionStatus === "active"
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }`}
                        >
                          {selectedUser.subscriptionStatus || "—"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Current Period Ends
                      </p>
                      <p>
                        {firestoreTimestampToDate(
                          selectedUser.subscriptionCurrentPeriodEnd
                        )?.toLocaleDateString() || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Stripe Customer ID
                      </p>
                      <p className="font-mono text-xs">
                        {selectedUser.stripeCustomerId || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Subscription ID
                      </p>
                      <p className="font-mono text-xs truncate">
                        {selectedUser.stripeSubscriptionId || "—"}
                      </p>
                    </div>
                    {selectedUser.subscriptionCancelAtPeriodEnd && (
                      <div className="col-span-2">
                        <p className="text-amber-500 text-xs font-medium">
                          ⚠️ Cancels at period end
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Veriff Verification Section (if verified) */}
              {selectedUser.veriff && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> ID Verification (Veriff)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Decision</p>
                      <p className="capitalize font-medium">
                        <span
                          className={`${
                            selectedUser.veriff.decision === "approved"
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {selectedUser.veriff.decision || "—"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="capitalize">
                        {selectedUser.veriff.status || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Verification Date
                      </p>
                      <p>
                        {firestoreTimestampToDate(
                          selectedUser.veriff.lastVerificationDate
                        )?.toLocaleDateString() || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Attempts</p>
                      <p>{selectedUser.veriff.verificationAttempts || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Session ID
                      </p>
                      <p className="font-mono text-xs truncate">
                        {selectedUser.veriff.sessionId || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Event Type
                      </p>
                      <p className="capitalize">
                        {selectedUser.veriff.eventType || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    window.open(`/users/${selectedUser.username}`, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend/Unsuspend Confirmation Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userToToggle?.suspended ? "Unsuspend User" : "Suspend User"}
            </DialogTitle>
            <DialogDescription>
              {userToToggle?.suspended
                ? "This will restore the user's access to their account and allow them to use the platform again."
                : "This will prevent the user from logging in or using the platform. Their listings will remain but be hidden."}
            </DialogDescription>
          </DialogHeader>
          {userToToggle && (
            <div className="py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Username:</span>{" "}
                <span className="font-medium">{userToToggle.username}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{userToToggle.email}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Current Status:</span>{" "}
                <span className="font-medium">
                  {userToToggle.suspended ? "Suspended" : "Active"}
                </span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false);
                setUserToToggle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={userToToggle?.suspended ? "default" : "destructive"}
              onClick={() =>
                handleAction(
                  userToToggle?.suspended ? "unsuspend" : "suspend",
                  userToToggle?.id
                )
              }
              disabled={actionLoading}
            >
              {actionLoading
                ? "Processing..."
                : userToToggle?.suspended
                ? "Unsuspend User"
                : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user account? This action
              cannot be undone and will permanently remove all associated data.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Username:</span>{" "}
                <span className="font-medium">{userToDelete.username}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{userToDelete.email}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction("delete", userToDelete?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
