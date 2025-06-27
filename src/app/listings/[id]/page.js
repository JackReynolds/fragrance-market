/* eslint-disable react/prop-types */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
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
  MessageCircle,
  Heart,
  ShoppingBag,
  Mail,
  ShieldCheck,
  Loader2,
  Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { collection, getDocs, query, where } from "firebase/firestore";
import SwapOfferModal from "@/components/listing/swapOfferModal.jsx";
import { useUserDoc } from "@/hooks/useUserDoc.js";
import formatCurrency from "@/utils/formatCurrency";

const ListingDetailPage = () => {
  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBuyNow, setIsLoadingBuyNow] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isCheckingListings, setIsCheckingListings] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { authUser } = useAuth();
  const { userDoc } = useUserDoc();

  // Fetch listing data
  useEffect(() => {
    const fetchListingData = async () => {
      if (!params.id) return;

      try {
        const listingRef = doc(db, "listings", params.id);
        const listingDoc = await getDoc(listingRef);

        if (listingDoc.exists()) {
          const listingData = {
            id: listingDoc.id,
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

  // Check if current user is the owner
  const isOwner =
    authUser?.uid && listing?.ownerUid && authUser.uid === listing.ownerUid;

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
    if (!isOwner || !listing) return;

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

  // Verification badge component
  const VerificationBadge = ({ type, isVerified }) => {
    if (!isVerified) return null;

    const badges = {
      // ID badge is dark green and gradient
      id: {
        icon: <ShieldCheck size={16} className="mr-1" />,
        text: "ID Verified",
        className:
          "bg-gradient-to-r from-emerald-600 to-emerald-800 text-gray-100 font-semibold",
      },
      email: {
        icon: <Mail size={16} className="mr-1" />,
        text: "Email Verified",
        className:
          "bg-gradient-to-r from-blue-500 to-blue-800 text-white font-semibold",
      },
      // Premium badge is gold gradient
      premium: {
        icon: <Crown size={16} className="mr-1" />,
        text: "Premium Member",
        className:
          "bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 font-semibold",
      },
    };

    const badge = badges[type];

    return (
      <div
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs md:text-sm font-medium ${badge.className}`}
      >
        {badge.icon}
        {badge.text}
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
    if (!userDoc?.email) {
      toast.error("Please complete your profile with an email address");
      return;
    }

    try {
      setIsLoadingBuyNow(true);
      // Create checkout session
      const response = await fetch(
        "https://createbuycheckoutsession-createbuycheckoutsession-qwe4clieqa-nw.a.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listingId: listing.id,
            buyerUid: authUser.uid,
            buyerEmail: userDoc.email,
            successUrl: `${window.location.origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: window.location.href,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = result.data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error(error.message || "Failed to initiate purchase");
    } finally {
      setIsLoadingBuyNow(false);
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

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
            {/* Main content area */}
            <div className="space-y-8">
              {/* Image gallery */}
              <div className="space-y-4 flex justify-center">
                <div className="relative h-72 md:h-120 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {listing.imageURLs && listing.imageURLs.length > 0 ? (
                    <Image
                      src={listing.imageURLs[activeImageIndex]}
                      alt={listing.title}
                      fill
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                      No image available
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {listing.imageURLs && listing.imageURLs.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {listing.imageURLs.map((image, index) => (
                      <button
                        key={index}
                        className={`relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 overflow-hidden rounded-md ${
                          activeImageIndex === index
                            ? "ring-2 ring-primary"
                            : "ring-1 ring-muted"
                        }`}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <Image
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Listing info */}
              <div>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold md:text-3xl">
                    {listing.title}
                  </h1>
                  <div className="flex space-x-3">
                    {isOwner ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleShare}
                          title="Share listing"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            router.push(`/edit-listing/${listing.id}`)
                          }
                          title="Edit listing"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            listing.status === "active" ? "outline" : "default"
                          }
                          size="icon"
                          onClick={toggleListingStatus}
                          title={
                            listing.status === "active"
                              ? "Deactivate listing"
                              : "Activate listing"
                          }
                        >
                          {listing.status === "active" ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="hover:cursor-pointer"
                          onClick={handleShare}
                          title="Share listing"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="hover:cursor-pointer"
                          title="Add to favorites"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                {listing.status === "inactive" && (
                  <div className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Inactive Listing
                  </div>
                )}

                {/* Price and type */}
                <div className="mt-4 flex items-center justify-between">
                  {listing.type === "sell" ? (
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(listing.price || 0, listing.currency)}
                    </div>
                  ) : (
                    <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      For Swap
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    {listing.amountLeft}% full
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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

              {/* Call to action */}
              {!isOwner && (
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  {listing.type === "sell" ? (
                    <Button
                      className="flex-1 py-2 hover:cursor-pointer hover:bg-primary/80"
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
                    <Button
                      className="flex-1 py-2 hover:cursor-pointer hover:bg-primary/80"
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
                  <Button
                    variant="outline"
                    className="flex-1 py-2 hover:cursor-pointer"
                    size="lg"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Contact Seller
                  </Button>
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
                          onClick={() => router.push(`/users/${owner.uid}`)}
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
                          router.push(`/users/${listing.ownerUid}`)
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
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-col gap-2">
                      <VerificationBadge
                        type="premium"
                        isVerified={owner?.isPremium}
                      />
                      <VerificationBadge
                        type="email"
                        isVerified={owner?.emailVerified}
                      />
                      <VerificationBadge
                        type="id"
                        isVerified={owner?.isIdVerified}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/users/${listing.ownerUid}`}
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
                  <CardTitle className="text-base">Similar Listings</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-sm text-muted-foreground">
                    More listings by this seller coming soon...
                  </p>
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
          userDoc={userDoc}
          targetListing={listing}
          targetOwner={owner}
        />
      )}
    </div>
  );
};

export default ListingDetailPage;
