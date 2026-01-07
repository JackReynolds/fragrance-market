"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData } from "@/context/adminDataContext";
import DataTable from "@/components/admin/dataTable";
import { Button } from "@/components/ui/button";
import {
  Package,
  Eye,
  Ban,
  Trash2,
  CheckCircle,
  ExternalLink,
  ArrowLeftRight,
  DollarSign,
  Tag,
  User,
  MapPin,
  Droplets,
  FileText,
  Crown,
  ShieldCheck,
  ImageIcon,
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

export default function AdminListingsPage() {
  const { authUser } = useAuth();
  const {
    listings,
    listingsLoading: loading,
    listingsLastFetch,
    fetchListings,
    refreshListings,
  } = useAdminData();

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [listingToToggle, setListingToToggle] = useState(null);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleAction = async (action, listingId) => {
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
          collection: "listings",
          documentId: listingId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        refreshListings();
        setDeleteDialogOpen(false);
        setListingToDelete(null);
        setDisableDialogOpen(false);
        setListingToToggle(null);
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

  const formatPrice = (price) => {
    if (!price) return "—";
    return `£${parseFloat(price).toFixed(2)}`;
  };

  const getListingTypeBadge = (type) => {
    const config = {
      swap: {
        icon: ArrowLeftRight,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      sale: {
        icon: DollarSign,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      both: { icon: Tag, color: "text-purple-500", bg: "bg-purple-500/10" },
    };
    const { icon: Icon, color, bg } = config[type] || config.both;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${color}`}
      >
        <Icon className="h-3 w-3" />
        {type?.charAt(0).toUpperCase() + type?.slice(1) || "Unknown"}
      </span>
    );
  };

  const columns = [
    {
      key: "imageURLs",
      label: "",
      render: (row) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {row.imageURLs?.[0] ? (
            <Image
              src={row.imageURLs[0]}
              alt=""
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "fragrance",
      label: "Fragrance",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.fragrance || "—"}</p>
          <p className="text-xs text-muted-foreground">{row.brand || "—"}</p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => getListingTypeBadge(row.type),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm">
          {row.type === "swap" ? "Swap only" : formatPrice(row.price)}
        </span>
      ),
    },
    {
      key: "ownerUsername",
      label: "Owner",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.ownerUsername || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {firestoreTimestampToDate(row.createdAt)?.toLocaleString()}
        </span>
      ),
    },
    {
      key: "disabled",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            row.disabled
              ? "bg-red-500/10 text-red-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          {row.disabled ? (
            <>
              <Ban className="h-3 w-3" /> Disabled
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
          setSelectedListing(row);
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
          setListingToToggle(row);
          setDisableDialogOpen(true);
        }}
      >
        <Ban
          className={`h-4 w-4 ${
            row.disabled ? "text-emerald-500" : "text-amber-500"
          }`}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => {
          setListingToDelete(row);
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
            <Package className="h-6 w-6" />
            Listings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage marketplace listings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-mono">
              {listings.length} total
            </p>
            {listingsLastFetch && (
              <p className="text-xs text-muted-foreground">
                Updated {getTimeAgo(listingsLastFetch)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshListings}
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
        data={listings}
        columns={columns}
        searchKeys={["fragrance", "brand", "ownerUsername", "description"]}
        isLoading={loading}
        actions={renderActions}
        emptyMessage="No listings found"
      />

      {/* View Listing Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-6">
              {/* Header with main image and title */}
              <div className="flex gap-4">
                <div className="w-28 h-28 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {selectedListing.imageURLs?.[0] ? (
                    <Image
                      src={selectedListing.imageURLs[0]}
                      alt=""
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xl">
                    {selectedListing.fragrance}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedListing.brand}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {getListingTypeBadge(selectedListing.type)}
                    {selectedListing.disabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                        <Ban className="h-3 w-3" /> Disabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  {selectedListing.type !== "swap" &&
                    selectedListing.priceCents && (
                      <p className="text-2xl font-bold mt-2">
                        £{(selectedListing.priceCents / 100).toFixed(2)}
                      </p>
                    )}
                </div>
              </div>

              {/* Image Gallery */}
              {selectedListing.imageURLs?.length > 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Images (
                    {selectedListing.imageURLs.length})
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedListing.imageURLs.map((url, index) => (
                      <div
                        key={index}
                        className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0"
                      >
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fragrance Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="h-4 w-4" /> Fragrance Details
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Size</p>
                    <p className="font-medium">
                      {selectedListing.sizeInMl
                        ? `${selectedListing.sizeInMl}ml`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Amount Left</p>
                    <p className="font-medium">
                      {selectedListing.amountLeft !== undefined
                        ? `${selectedListing.amountLeft}%`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedListing.country || "—"}
                      {selectedListing.countryCode &&
                        ` (${selectedListing.countryCode})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Listing Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Listing Info
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Listing ID</p>
                    <p className="font-mono text-xs break-all">
                      {selectedListing.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Slug</p>
                    <p className="font-mono text-xs break-all">
                      {selectedListing.slug || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Title</p>
                    <p>{selectedListing.title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="capitalize">
                      {selectedListing.status || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p>
                      {firestoreTimestampToDate(
                        selectedListing.createdAt
                      )?.toLocaleString() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Updated</p>
                    <p>
                      {firestoreTimestampToDate(
                        selectedListing.updatedAt
                      )?.toLocaleString() || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Swap Preferences (if swap type) */}
              {(selectedListing.type === "swap" ||
                selectedListing.type === "both") &&
                selectedListing.swapPreferences && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" /> Swap Preferences
                    </h4>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-sm">
                        {selectedListing.swapPreferences}
                      </p>
                    </div>
                  </div>
                )}

              {/* Description */}
              {selectedListing.description && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Description
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedListing.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Owner Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4" /> Owner
                </h4>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {selectedListing.ownerProfilePictureURL ? (
                        <Image
                          src={selectedListing.ownerProfilePictureURL}
                          alt=""
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">
                          {selectedListing.ownerUsername || "—"}
                        </p>
                        {selectedListing.ownerIsPremium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                            <Crown className="h-3 w-3" /> Premium
                          </span>
                        )}
                        {selectedListing.ownerIsIdVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        UID: {selectedListing.ownerUid || "—"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/users/${selectedListing.ownerUsername}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    window.open(`/listings/${selectedListing.slug}`, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Listing
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable/Enable Confirmation Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {listingToToggle?.disabled ? "Enable Listing" : "Disable Listing"}
            </DialogTitle>
            <DialogDescription>
              {listingToToggle?.disabled
                ? "This will make the listing visible again on the marketplace."
                : "This will hide the listing from the marketplace. The owner will still be able to see it in their profile."}
            </DialogDescription>
          </DialogHeader>
          {listingToToggle && (
            <div className="py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Fragrance:</span>{" "}
                <span className="font-medium">{listingToToggle.fragrance}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Owner:</span>{" "}
                <span className="font-medium">
                  {listingToToggle.ownerUsername}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Current Status:</span>{" "}
                <span className="font-medium">
                  {listingToToggle.disabled ? "Disabled" : "Active"}
                </span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisableDialogOpen(false);
                setListingToToggle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={listingToToggle?.disabled ? "default" : "destructive"}
              onClick={() =>
                handleAction(
                  listingToToggle?.disabled ? "enable" : "disable",
                  listingToToggle?.id
                )
              }
              disabled={actionLoading}
            >
              {actionLoading
                ? "Processing..."
                : listingToToggle?.disabled
                ? "Enable Listing"
                : "Disable Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot
              be undone and will permanently remove the listing.
            </DialogDescription>
          </DialogHeader>
          {listingToDelete && (
            <div className="py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Fragrance:</span>{" "}
                <span className="font-medium">{listingToDelete.fragrance}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Owner:</span>{" "}
                <span className="font-medium">
                  {listingToDelete.ownerUsername}
                </span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setListingToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction("delete", listingToDelete?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
