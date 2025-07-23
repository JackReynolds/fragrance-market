/* eslint-disable react/prop-types */

"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { db } from "@/firebase.config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Star,
  Package,
  MessageSquare,
  Mail,
  Medal,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Crown,
  MailCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ListingCard from "@/components/listingCard";
import CrownBadge from "@/components/ui/crownBadge";

const PublicUserProfile = () => {
  const router = useRouter();
  const params = useParams();
  const { authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!params.id) return;

      try {
        // Fetch user profile
        const userRef = doc(db, "users", params.id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const user = {
            id: userDoc.id,
            ...userDoc.data(),
            // Set defaults for missing fields
            emailVerified: userDoc.data().emailVerified || false,
            idVerified: userDoc.data().idVerified || false,
            isPremium: userDoc.data().isPremium || false,
            rating: userDoc.data().rating || 0,
          };
          setUserData(user);

          // Fetch user's listings
          fetchUserListings(params.id);

          // Fetch user's reviews
          fetchUserReviews(params.id);
        } else {
          toast.error("User not found");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Error loading user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [params.id, router]);

  // Fetch user's listings
  const fetchUserListings = async (userUid) => {
    try {
      const listingsRef = collection(db, "listings");
      const q = query(
        listingsRef,
        where("ownerUid", "==", userUid),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const listings = [];

      querySnapshot.forEach((doc) => {
        listings.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUserListings(listings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
    }
  };

  // Fetch user's reviews
  const fetchUserReviews = async (userId) => {
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("sellerId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const reviews = [];

      querySnapshot.forEach((doc) => {
        reviews.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUserReviews(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    }
  };

  // Display star rating component
  const StarRating = ({ rating }) => {
    if (!rating || rating === 0) return null;

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
        icon: <MailCheck size={24} className="mx-1 text-green-600" />,
        text: "Email Verified",
        className:
          "bg-gradient-to-r from-blue-500 to-blue-800 text-white font-semibold",
      },
      // Premium badge is gold gradient
      premium: {
        icon: <CrownBadge />,
        text: "Premium Member",
        className:
          "bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 font-semibold",
      },
    };

    const badge = badges[type];

    return (
      <div
        className={`inline-flex items-center rounded-full py-0.5 text-xs md:text-sm font-medium `}
      >
        {badge.icon}
        <span className="text-xs md:text-sm font-medium ml-3">
          {badge.text}
        </span>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* <Navigation /> */}
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading profile...</div>
        </main>
        {/* <Footer /> */}
      </div>
    );
  }

  // Not found
  if (!userData) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* <Navigation /> */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="mb-6 text-muted-foreground">
              The user profile you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Button onClick={() => router.push("/")}>Back to Home</Button>
          </div>
        </main>
        {/* <Footer /> */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* <Navigation /> */}

      <main className="flex-1 py-8 md:py-12">
        <div className="px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            {/* User profile sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Profile image */}
                    <div className="relative w-24 h-24 overflow-hidden rounded-full bg-primary/10">
                      {userData.profilePictureURL ? (
                        <Image
                          src={userData.profilePictureURL}
                          alt={userData.username || "User"}
                          fill
                          className="object-cover hover:cursor-pointer"
                          onClick={() => router.push(`/users/${userData.id}`)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-semibold text-primary">
                          {userData.username?.charAt(0) || "U"}
                        </div>
                      )}

                      {userData.isPremium && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1.5">
                          <Medal size={14} className="text-white" />
                        </div>
                      )}
                      {userData.isIdVerified && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1.5">
                          <ShieldCheck size={14} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* User name and info */}
                    <div className="text-center">
                      <h2 className="text-xl font-bold">
                        {userData.username || "User"}
                      </h2>
                      {userData.rating > 0 && (
                        <div className="flex justify-center mt-1">
                          <StarRating rating={userData.rating} />
                        </div>
                      )}
                    </div>

                    {/* User stats */}
                    <div className="w-full space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Member since
                        </span>
                        <span className="text-sm">
                          {userData.createdAt
                            ? new Date(
                                userData.createdAt.seconds * 1000
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                              })
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Listings</span>
                        <span className="text-sm font-medium">
                          {userListings.length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Reviews</span>
                        <span className="text-sm font-medium">
                          {userReviews.length}
                        </span>
                      </div>

                      <Separator className="my-3" />

                      {/* Verification badges */}
                      <div className="flex flex-col space-y-2">
                        <VerificationBadge
                          type="premium"
                          isVerified={userData.isPremium}
                        />
                        <VerificationBadge type="email" isVerified={true} />
                        <VerificationBadge
                          type="id"
                          isVerified={userData.isIdVerified}
                        />
                      </div>
                    </div>

                    {/* Contact button */}
                    {authUser && authUser.uid !== userData.id && (
                      <Button className="w-full">
                        <MessageSquare size={16} className="mr-2" />
                        Contact
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional user info card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Seller Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userData.bio ? (
                    <p className="text-sm">{userData.bio}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      This user hasn&apos;t added a bio yet.
                    </p>
                  )}

                  <div className="mt-4 text-sm space-y-2">
                    <div className="flex items-center">
                      <CalendarDays
                        size={16}
                        className="text-muted-foreground mr-2"
                      />
                      <span>
                        Joined{" "}
                        {userData.createdAt
                          ? new Date(
                              userData.createdAt.seconds * 1000
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                            })
                          : "N/A"}
                      </span>
                    </div>

                    {userData.location && (
                      <div className="flex items-center">
                        <MapPin
                          size={16}
                          className="text-muted-foreground mr-2"
                        />
                        <span>{userData.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content area with tabs */}
            <div>
              <Tabs
                defaultValue="listings"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <TabsList>
                    <TabsTrigger
                      value="listings"
                      className="px-4 hover:cursor-pointer"
                    >
                      <Package size={16} className="mr-2" />
                      Listings
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="px-4 hover:cursor-pointer"
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Reviews
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Listings tab */}
                <TabsContent value="listings" className="space-y-6">
                  <h2 className="text-2xl font-bold">
                    Listings by {userData.username}
                  </h2>

                  {userListings.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <h3 className="mb-2 text-lg font-semibold">
                        No active listings
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This user doesn&apos;t have any active listings at the
                        moment.
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center">
                      <div className="w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {userListings.map((listing) => (
                          <ListingCard key={listing.id} listing={listing} />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Reviews tab */}
                <TabsContent value="reviews" className="space-y-6">
                  <h2 className="text-2xl font-bold">
                    Reviews for {userData.username}
                  </h2>

                  {userData.rating > 0 && (
                    <div className="flex items-center space-x-4 p-4 bg-primary/5 rounded-lg mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">
                          {userData.rating.toFixed(1)}
                        </div>
                        <StarRating rating={userData.rating} />
                        <div className="text-sm text-muted-foreground mt-1">
                          {userReviews.length}{" "}
                          {userReviews.length === 1 ? "review" : "reviews"}
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-14" />
                      <div className="flex-1">
                        <div className="space-y-1">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = userReviews.filter(
                              (r) => Math.floor(r.rating) === star
                            ).length;
                            const percentage =
                              userReviews.length > 0
                                ? (count / userReviews.length) * 100
                                : 0;
                            return (
                              <div
                                key={star}
                                className="flex items-center text-sm"
                              >
                                <span className="w-5">{star}</span>
                                <Star
                                  size={12}
                                  className="mr-2 fill-yellow-400 text-yellow-400"
                                />
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="ml-2 w-10 text-xs">
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {userReviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <h3 className="mb-2 text-lg font-semibold">
                        No reviews yet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This user hasn&apos;t received any reviews yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userReviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between mb-2">
                              <div className="font-semibold">
                                {review.reviewerName || "Anonymous"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {review.createdAt
                                  ? new Date(
                                      review.createdAt.seconds * 1000
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </div>
                            </div>
                            <StarRating rating={review.rating} />
                            <p className="mt-2">{review.comment}</p>

                            {review.itemTitle && (
                              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                For: {review.itemTitle}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
};

export default PublicUserProfile;
