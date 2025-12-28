/* eslint-disable react/prop-types */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { isSlug } from "@/utils/generateSlug";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import { toast } from "sonner";
import {
  ChevronLeft,
  Star,
  Share2,
  Edit,
  Eye,
  EyeOff,
  ArrowLeft,
  Heart,
  ShoppingBag,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { collection, getDocs, query, where } from "firebase/firestore";
import SwapOfferModal from "@/components/listing/swapOfferModal.jsx";
import { useProfileDoc } from "@/hooks/useProfileDoc.js";
import formatCurrency from "@/utils/formatCurrency";
import ListingTypeBadge from "@/components/ui/listingTypeBadge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import SwapCountExceededButton from "@/components/ui/swapCountExceededButton";
import VerificationBadges from "@/components/ui/verificationBadges";
import OwnersOtherFragrances from "@/components/listing/ownersOtherFragrances.jsx";

const ListingDetailPage = () => {
  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBuyNow, setIsLoadingBuyNow] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isCheckingListings, setIsCheckingListings] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();

  // Fetch listing data
  useEffect(() => {
    const fetchListingData = async () => {
      if (!params.id) return;

      try {
        let listingDoc;
        let listingId;

        // Check if params.id is a slug or a UID
        if (isSlug(params.id)) {
          // It's a slug - query by slug field
          const { collection, query, where, getDocs } = await import(
            "firebase/firestore"
          );
          const listingsRef = collection(db, "listings");
          const q = query(listingsRef, where("slug", "==", params.id));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            listingDoc = querySnapshot.docs[0];
            listingId = listingDoc.id;
          }
        } else {
          // It's a UID - query by document ID (backwards compatibility)
          const listingRef = doc(db, "listings", params.id);
          listingDoc = await getDoc(listingRef);
          listingId = params.id;
        }

        if (listingDoc && listingDoc.exists()) {
          const listingData = {
            id: listingId,
            ...listingDoc.data(),
          };
          setListing(listingData);

          // Fetch owner data
          if (listingData.ownerUid) {
            const ownerRef = doc(db, "users", listingData.ownerUid);
            const ownerDoc = await getDoc(ownerRef);

            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              // Set default values for verification fields if they don't exist
              setOwner({
                uid: ownerDoc.id,
                ...ownerData,
                emailVerified: ownerData.emailVerified || false,
                isIdVerified: ownerData.isIdVerified || false,
                isPremium: ownerData.isPremium || false,
                rating: ownerData.rating || "N/A",
              });
            }
          }
        } else {
          toast.error("Listing not found");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error("Error loading listing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingData();
  }, [params.id, router]);

  // Add useEffect to check if listing is favourited
  useEffect(() => {
    if (profileDoc?.favourites && listing?.id) {
      setIsFavourited(profileDoc.favourites.includes(listing.id));
    }
  }, [profileDoc, listing?.id]);

  // Check if current user is the owner
  const isOwner =
    authUser?.uid && listing?.ownerUid && authUser.uid === listing.ownerUid;

  const isSwapped = listing?.status === "swapped";
  const isSold = listing?.status === "sold";

  // Handle sharing listing
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  // Toggle listing active status
  const toggleListingStatus = async () => {
    if (!isOwner || !listing || isSwapped || isSold) return;

    // Don't allow status changes for swapped or sold listings
    if (isSwapped) {
      toast.error("Swapped listings cannot be modified");
      return;
    }

    if (isSold) {
      toast.error("Sold listings cannot be modified");
      return;
    }

    const newStatus = listing.status === "active" ? "inactive" : "active";

    try {
      const listingRef = doc(db, "listings", listing.id);
      await updateDoc(listingRef, { status: newStatus });

      setListing((prev) => ({ ...prev, status: newStatus }));

      toast.success(
        `Listing ${newStatus === "active" ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Error updating listing status:", error);
      toast.error("Failed to update listing status");
    }
  };

  // Display star rating component
  const StarRating = ({ rating }) => {
    if (rating === "N/A") return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Check if user has listings for swap
  const checkUserListings = async () => {
    if (!authUser) {
      toast.error("Please sign in to offer swaps");
      return false;
    }

    setIsCheckingListings(true);
    try {
      const listingsRef = collection(db, "listings");
      const q = query(
        listingsRef,
        where("ownerUid", "==", authUser?.uid),
        where("type", "==", "swap"),
        where("status", "==", "active")
      );

      const querySnapshot = await getDocs(q);
      const hasListings = !querySnapshot.empty;
      return hasListings;
    } catch (error) {
      console.error("Error checking listings:", error);
      return false;
    } finally {
      setIsCheckingListings(false);
    }
  };

  // Handle offer swap button click
  const handleOfferSwap = async () => {
    if (!authUser) {
      toast.warning("Please sign in to offer swaps");
      return;
    }

    const hasListings = await checkUserListings();
    if (!hasListings) {
      toast.error("You need to add a fragrance to swap first");
      return;
    }

    setIsSwapModalOpen(true);
  };

  // Handle buy now button click
  const handleBuyNow = async () => {
    // Not required for now
    if (!authUser) {
      toast.error("Please sign in to make a purchase");
      return;
    }

    // if (!profileDoc?.email) {
    //   toast.error("Email address required. Please update your profile.");
    //   return;
    // }

    // if (!profileDoc?.email) {
    //   toast.error("Email address required. Please update your profile.");
    //   return;
    // }

    // Navigate to custom checkout page
    router.push(`/checkout?listingId=${listing.id}`);
  };

  // Handle delete listing
  const handleDeleteListing = async () => {
    try {
      if (!isOwner || !listing || isSwapped || isSold) return;

      if (isSwapped) {
        toast.error(
          "Swapped listings cannot be deleted. They are kept as transaction records."
        );
        return;
      }

      if (isSold) {
        toast.error(
          "Sold listings cannot be deleted. They are kept as transaction records."
        );
        return;
      }

      if (!authUser) {
        toast.error("Please sign in");
        return;
      }

      setIsDeleting(true);

      const idToken = await authUser.getIdToken();
      const response = await fetch("/api/firebase/delete-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to delete listing");
      }

      toast.success("Listing deleted");
      router.push("/my-profile");
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error(error.message || "Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  // Add handler function
  const handleToggleFavourite = async () => {
    if (!authUser) {
      toast.error("Please sign in to save favourites");
      router.push("/sign-in");
      return;
    }

    setIsTogglingFavourite(true);
    try {
      const idToken = await authUser.getIdToken();
      const response = await fetch("/api/firebase/handle-add-to-favourites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          action: isFavourited ? "remove" : "add",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update favourites");
      }

      setIsFavourited(result.isFavourited);
      toast.success(result.message);
    } catch (error) {
      console.error("Error toggling favourite:", error);
      toast.error("Failed to update favourites");
    } finally {
      setIsTogglingFavourite(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* <Navigation /> */}
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading listing...</div>
        </main>
        {/* <Footer /> */}
      </div>
    );
  }

  // Not found
  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* <Navigation /> */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The listing you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </main>
        {/* <Footer /> */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* <Navigation /> */}

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium mb-6 hover:cursor-pointer hover:font-semibold"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </button>

          {/* ADD SWAPPED BANNER - Show prominently at the top */}
          {isSwapped && (
            <div
              className="mb-6 rounded-lg border-2 p-4"
              style={{ borderColor: "#1E7C62", backgroundColor: "#E8F5F1" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6"
                    style={{ color: "#1E7C62" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: "#0F4C3A" }}>
                    This listing has been swapped
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#155C49" }}>
                    {isOwner ? (
                      <>
                        This fragrance was swapped on{" "}
                        {listing.swappedAt
                          ? new Date(
                              listing.swappedAt.seconds * 1000
                            ).toLocaleDateString()
                          : "an unknown date"}
                        . Swapped listings are kept as transaction records and
                        cannot be edited or deleted.
                        {listing.swappedWithUserUid && (
                          <span>
                            {" "}
                            <Link
                              href={`/users/${listing.swappedWithUserUid}`}
                              className="underline font-medium"
                              style={{ color: "inherit" }}
                              onMouseEnter={(e) =>
                                (e.target.style.color = "#0F4C3A")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.color = "inherit")
                              }
                            >
                              View swap partner
                            </Link>
                          </span>
                        )}
                      </>
                    ) : (
                      "This fragrance has been swapped and is no longer available."
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ADD SOLD BANNER - Show prominently at the top */}
          {isSold && (
            <div
              className="mb-6 rounded-lg border-2 p-4"
              style={{ borderColor: "#F5B900", backgroundColor: "#FEF7E0" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6"
                    style={{ color: "#F5B900" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: "#8B6F00" }}>
                    This listing has been sold
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#A38400" }}>
                    {isOwner ? (
                      <>
                        This fragrance was sold on{" "}
                        {listing.soldAt
                          ? new Date(
                              listing.soldAt.seconds * 1000
                            ).toLocaleDateString()
                          : "an unknown date"}
                        . Sold listings are kept as transaction records and
                        cannot be edited or deleted.
                        {listing.soldTo && (
                          <span>
                            {" "}
                            <Link
                              href={`/users/${listing.soldTo}`}
                              className="underline font-medium"
                              style={{ color: "inherit" }}
                              onMouseEnter={(e) =>
                                (e.target.style.color = "#8B6F00")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.color = "inherit")
                              }
                            >
                              View buyer
                            </Link>
                          </span>
                        )}
                      </>
                    ) : (
                      "This fragrance has been sold and is no longer available."
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
            {/* Main content area */}
            <div className="space-y-8">
              {/* Image Carousel */}
              <div className="space-y-4 flex justify-center">
                <Carousel className="w-full max-w-2xl">
                  <CarouselContent>
                    {listing.imageURLs && listing.imageURLs.length > 0 ? (
                      listing.imageURLs.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="relative h-72 md:h-120 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={image}
                              alt={`${listing.fragrance} - ${
                                listing.brand
                              } - Image ${index + 1}`}
                              fill
                              className="object-contain"
                              priority={index === 0}
                            />
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem>
                        <div className="relative h-72 md:h-120 aspect-[4/3] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                          <div className="text-muted-foreground">
                            No image available
                          </div>
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {listing.imageURLs && listing.imageURLs.length > 1 && (
                    <>
                      <CarouselPrevious />
                      <CarouselNext />
                    </>
                  )}
                </Carousel>
              </div>

              {/* Listing info */}
              <div>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold md:text-3xl">
                    {listing.fragrance} - {listing.brand}
                  </h1>

                  {/* Button Logic: Show NO buttons if swapped or sold */}
                  {!isSwapped && !isSold && (
                    <div className="flex space-x-2 sm:space-x-3">
                      {isOwner ? (
                        <>
                          {/* Owner buttons: Share, Edit, Activate/Deactivate, Delete */}
                          <Button
                            variant="outline"
                            onClick={handleShare}
                            title="Share listing"
                            className="hover:cursor-pointer px-2 sm:px-3"
                            size="sm"
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:ml-1 sm:inline">
                              Share
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(`/edit-listing/${listing.id}`)
                            }
                            title="Edit listing"
                            className="hover:cursor-pointer px-2 sm:px-3"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:ml-1 sm:inline">
                              Edit
                            </span>
                          </Button>
                          <Button
                            variant={
                              listing.status === "active"
                                ? "outline"
                                : "default"
                            }
                            onClick={toggleListingStatus}
                            title={
                              listing.status === "active"
                                ? "Deactivate listing"
                                : "Activate listing"
                            }
                            className="hover:cursor-pointer px-2 sm:px-3"
                            size="sm"
                          >
                            {listing.status === "active" ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                <span className="hidden sm:ml-1 sm:inline">
                                  Deactivate
                                </span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:ml-2 sm:inline">
                                  Activate
                                </span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteListing}
                            title="Delete listing"
                            className="hover:cursor-pointer px-2 sm:px-3"
                            disabled={isDeleting}
                            size="sm"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:ml-1 sm:inline">
                                  Deleting...
                                </span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Non-owner buttons: Share, Favourite */}
                          <Button
                            variant="outline"
                            className="hover:cursor-pointer px-2 sm:px-3"
                            onClick={handleShare}
                            title="Share listing"
                            size="sm"
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:ml-1 sm:inline">
                              Share
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            className="hover:cursor-pointer px-2 sm:px-3"
                            onClick={handleToggleFavourite}
                            title={
                              isFavourited
                                ? "Remove from favourites"
                                : "Add to favourites"
                            }
                            disabled={isTogglingFavourite}
                            size="sm"
                          >
                            {isTogglingFavourite ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart
                                className={`h-4 w-4 ${
                                  isFavourited
                                    ? "fill-current text-red-500"
                                    : ""
                                }`}
                              />
                            )}
                            <span className="hidden sm:ml-1 sm:inline">
                              {isFavourited ? "Unfavourite" : "Favourite"}
                            </span>
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Update Status badges to include swapped and sold status */}
                {listing.status === "inactive" && !isSwapped && !isSold && (
                  <div className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Inactive Listing
                  </div>
                )}

                {isSwapped && (
                  <div
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "#E8F5F1", color: "#1E7C62" }}
                  >
                    ✓ Swapped
                  </div>
                )}

                {isSold && (
                  <div
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "#FEF7E0", color: "#F5B900" }}
                  >
                    ✓ Sold
                  </div>
                )}

                {/* Price and type */}
                <div className="mt-4 flex items-center justify-between">
                  {listing.type === "sell" ? (
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(listing.price || 0, listing.currency)}
                    </div>
                  ) : (
                    <ListingTypeBadge type={listing.type} />
                  )}

                  <div className="text-sm text-muted-foreground">
                    {listing.amountLeft}% full
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Brand
                    </h3>
                    <p className="mt-1 font-medium">{listing.brand}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Fragrance
                    </h3>
                    <p className="mt-1 font-medium">{listing.fragrance}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Size
                    </h3>
                    <p className="mt-1 font-medium">
                      {listing.sizeInMl ? `${listing.sizeInMl}ml` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Listed
                    </h3>
                    <p className="mt-1 font-medium">
                      {listing.createdAt
                        ? new Date(
                            listing.createdAt.seconds * 1000
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Type
                    </h3>
                    <p className="mt-1 font-medium capitalize">
                      {listing.type}
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Tabs for description and swap preferences */}
                <Tabs defaultValue="description" className="mt-6">
                  <TabsList>
                    <TabsTrigger
                      className="hover:cursor-pointer"
                      value="description"
                    >
                      Description
                    </TabsTrigger>
                    {listing.type === "swap" && (
                      <TabsTrigger
                        value="swap-preferences"
                        className="hover:cursor-pointer"
                      >
                        Swap Preferences
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="description" className="mt-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line">
                        {listing.description}
                      </p>
                    </div>
                  </TabsContent>
                  {listing.type === "swap" && (
                    <TabsContent value="swap-preferences" className="mt-4">
                      <div className="prose prose-sm max-w-none">
                        <h3 className="text-lg font-medium mb-2">
                          What I&apos;m Looking For
                        </h3>
                        <p className="whitespace-pre-line">
                          {listing.swapPreferences}
                        </p>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>

              {/* Call to action - Hide for swapped or sold listings */}
              {!isOwner && !isSwapped && !isSold && (
                <div className="mt-8 space-y-4">
                  {listing.type === "sell" ? (
                    <Button
                      className="py-2 hover:cursor-pointer hover:bg-primary/80"
                      size="lg"
                      onClick={handleBuyNow}
                      disabled={isLoadingBuyNow}
                    >
                      {isLoadingBuyNow ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="mr-2 h-4 w-4" /> Buy Now
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      {/* Check if user has exceeded swap count */}
                      {profileDoc &&
                      !profileDoc?.isPremium &&
                      profileDoc?.monthlySwapCount >= 1 ? (
                        <SwapCountExceededButton
                          profileDoc={profileDoc}
                          authUser={authUser}
                          className="w-full"
                        />
                      ) : (
                        <Button
                          className="py-2 hover:cursor-pointer hover:bg-primary/80 shadow-md"
                          size="lg"
                          onClick={handleOfferSwap}
                          disabled={isCheckingListings}
                        >
                          {isCheckingListings ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <Share2 className="mr-2 h-4 w-4" /> Offer Swap
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar with seller info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Owner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-primary/10">
                      {owner?.profilePictureURL ? (
                        <Image
                          src={owner.profilePictureURL}
                          alt={owner.username || "Seller"}
                          fill
                          className="object-cover hover:cursor-pointer"
                          onClick={() =>
                            router.push(`/users/${owner.username || owner.uid}`)
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-semibold text-primary">
                          {owner?.username?.charAt(0) || "S"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3
                        className="font-medium hover:font-semibold hover:cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/users/${owner?.username || listing.ownerUid}`
                          )
                        }
                      >
                        {owner?.username ||
                          listing.userDisplayName ||
                          "Anonymous"}
                      </h3>
                      {owner?.rating && <StarRating rating={owner.rating} />}
                    </div>
                  </div>

                  {/* Verification badges */}
                  <div className="ml-2 mt-2">
                    <VerificationBadges user={owner} />
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/users/${owner?.username || listing.ownerUid}`}
                      className="text-sm text-primary hover:cursor-pointer hover:font-semibold"
                    >
                      View Profile
                    </Link>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-3">
                  <div className="flex justify-between w-full text-sm">
                    <div>Member since</div>
                    <div className="font-medium">
                      {owner?.createdAt
                        ? new Date(
                            owner.createdAt.seconds * 1000
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })
                        : "N/A"}
                    </div>
                  </div>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    More from this owner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OwnersOtherFragrances
                    ownerUid={listing?.ownerUid}
                    currentListingId={listing?.id}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Safety Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="mr-2 mt-0.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
                      <span>Always verify the authenticity of products</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-0.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
                      <span>Use secure payment methods only</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-0.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
                      <span>Meet in public places for exchanges</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-0.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
                      <span>Report suspicious listings</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* <Footer /> */}

      {/* Swap Offer Modal */}
      {authUser && listing && (
        <SwapOfferModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          currentUser={authUser}
          requestedListing={listing}
          requestedFrom={owner}
        />
      )}
    </div>
  );
};

export default ListingDetailPage;
