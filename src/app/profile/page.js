"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/ui/Navigation";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Separator } from "@/components/ui/Separator";
import {
  Star,
  Shield,
  Check,
  X,
  Edit,
  Eye,
  Package,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";

// Sample data for now - in a real app, this would come from your database
const SAMPLE_LISTINGS = [
  {
    id: "1",
    title: "Tom Ford Oud Wood",
    price: 189.99,
    image: "/fragrances/tom-ford-oud-wood.jpg",
    type: "Sale",
    condition: "New",
    createdAt: "2023-08-15",
  },
  {
    id: "2",
    title: "Creed Aventus",
    price: 249.99,
    image: "/fragrances/creed-aventus.jpg",
    type: "Swap",
    condition: "Used - 90% Full",
    createdAt: "2023-09-02",
  },
  {
    id: "3",
    title: "Maison Francis Kurkdjian Baccarat Rouge 540",
    price: 215.0,
    image: "/fragrances/baccarat-rouge-540.jpg",
    type: "Sale",
    condition: "New - Sealed",
    createdAt: "2023-10-10",
  },
];

const SAMPLE_REVIEWS = [
  {
    id: "1",
    rating: 5,
    reviewer: "Emily K.",
    comment: "Great seller, fast shipping and product exactly as described!",
    date: "2023-09-15",
  },
  {
    id: "2",
    rating: 4,
    reviewer: "Michael T.",
    comment: "Good communication, item arrived in good condition.",
    date: "2023-10-05",
  },
  {
    id: "3",
    rating: 5,
    reviewer: "Sarah L.",
    comment: "Excellent packaging and fast delivery. Would buy from again!",
    date: "2023-11-12",
  },
];

export default function Profile() {
  const { authUser, authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/sign-in");
    }
  }, [authUser, authLoading, router]);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser && authUser.uid) {
        try {
          const userDocRef = doc(db, "users", authUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            console.error("No user document found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setUserDataLoading(false);
        }
      }
    };

    if (authUser) {
      fetchUserData();
    }
  }, [authUser]);

  // Loading state
  if (authLoading || (authUser && userDataLoading)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading profile...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not authenticated
  if (!authUser) {
    return null; // The useEffect will redirect
  }

  // Sample stats - in a real app, these would come from your database
  const userStats = {
    itemsSold: 15,
    rating: 4.8,
    status: "Premium",
    isEmailVerified: authUser.emailVerified,
    isIdVerified: true,
  };

  // Display star rating
  const StarRating = ({ rating }) => {
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
  const VerificationBadge = ({ isVerified, label }) => {
    return (
      <div className="flex items-center gap-1.5">
        {isVerified ? (
          <div className="flex items-center text-green-600">
            <Check size={16} className="mr-1" />
            <span className="text-sm">{label} Verified</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-600">
            <X size={16} className="mr-1" />
            <span className="text-sm">{label} Not Verified</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <main className="flex-1 py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar with user info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-24 h-24 overflow-hidden rounded-full bg-primary/10">
                      {userData?.profileImage ? (
                        <Image
                          src={userData.profileImage}
                          alt={authUser.displayName || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-semibold text-primary">
                          {(
                            authUser.displayName ||
                            userData?.username ||
                            "U"
                          ).charAt(0)}
                        </div>
                      )}
                      <button className="absolute bottom-0 right-0 rounded-full bg-primary p-1 text-white shadow-sm">
                        <Edit size={14} />
                      </button>
                    </div>

                    <div className="text-center">
                      <h2 className="text-xl font-bold">
                        {authUser.displayName || userData?.username || "User"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {authUser.email}
                      </p>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {userStats.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rating</span>
                        <StarRating rating={userStats.rating} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Items Sold</span>
                        <span className="text-sm font-medium">
                          {userStats.itemsSold}
                        </span>
                      </div>

                      <Separator className="my-3" />

                      <div className="space-y-2">
                        <VerificationBadge
                          isVerified={userStats.isEmailVerified}
                          label="Email"
                        />
                        <VerificationBadge
                          isVerified={userStats.isIdVerified}
                          label="ID"
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setActiveTab("account");
                        window.scrollTo(0, 0);
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    <span className="text-sm">
                      Last login: {new Date().toLocaleDateString()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() =>
                      toast.info("Password reset feature coming soon!")
                    }
                  >
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main content with tabs */}
            <div>
              <Tabs
                defaultValue="profile"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger value="profile" className="px-4">
                      <Package size={16} className="mr-2" />
                      My Listings
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="px-4">
                      <MessageSquare size={16} className="mr-2" />
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger value="account" className="px-4">
                      <Edit size={16} className="mr-2" />
                      Account
                    </TabsTrigger>
                  </TabsList>

                  <Button onClick={() => router.push("/new-listing")}>
                    Add New Listing
                  </Button>
                </div>

                <TabsContent value="profile" className="space-y-6">
                  <h2 className="text-2xl font-bold">My Listings</h2>

                  {SAMPLE_LISTINGS.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <h3 className="mb-2 text-lg font-semibold">
                        No listings yet
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        You haven't created any listings yet. Start selling or
                        swapping your fragrances today!
                      </p>
                      <Button onClick={() => router.push("/new-listing")}>
                        Create Your First Listing
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {SAMPLE_LISTINGS.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden">
                          <div className="aspect-[4/3] relative">
                            <Image
                              src={listing.image}
                              alt={listing.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  listing.type === "Sale"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {listing.type}
                              </span>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold line-clamp-1">
                              {listing.title}
                            </h3>
                            <div className="mt-1 mb-3 text-sm text-muted-foreground">
                              <p>{listing.condition}</p>
                              <p>Posted: {listing.createdAt}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                ${listing.price.toFixed(2)}
                              </span>
                              <Button variant="outline" size="sm">
                                <Eye size={14} className="mr-1" />
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <h2 className="text-2xl font-bold">Reviews</h2>

                  <div className="flex items-center space-x-4 p-4 bg-primary/5 rounded-lg mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {userStats.rating.toFixed(1)}
                      </div>
                      <StarRating rating={userStats.rating} />
                      <div className="text-sm text-muted-foreground mt-1">
                        {SAMPLE_REVIEWS.length} reviews
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-14" />
                    <div className="flex-1">
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = SAMPLE_REVIEWS.filter(
                            (r) => Math.floor(r.rating) === star
                          ).length;
                          const percentage =
                            (count / SAMPLE_REVIEWS.length) * 100;
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

                  <div className="space-y-4">
                    {SAMPLE_REVIEWS.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between mb-2">
                            <div className="font-semibold">
                              {review.reviewer}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {review.date}
                            </div>
                          </div>
                          <StarRating rating={review.rating} />
                          <p className="mt-2">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="account" className="space-y-6">
                  <h2 className="text-2xl font-bold">Account Settings</h2>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="display-name">Display Name</Label>
                        <Input
                          id="display-name"
                          defaultValue={
                            authUser.displayName || userData?.username || ""
                          }
                          placeholder="Your display name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          defaultValue={authUser.email}
                          disabled
                        />
                        {!userStats.isEmailVerified && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() =>
                              toast.info("Verification email sent!")
                            }
                          >
                            Verify Email
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          defaultValue={userData?.phoneNumber || ""}
                          placeholder="Your phone number"
                        />
                      </div>

                      <Button
                        className="mt-2"
                        onClick={() =>
                          toast.success("Profile updated successfully!")
                        }
                      >
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Password</CardTitle>
                      <CardDescription>Change your password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>

                      <Button
                        className="mt-2"
                        onClick={() =>
                          toast.success("Password updated successfully!")
                        }
                      >
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ID Verification</CardTitle>
                      <CardDescription>
                        Verify your identity to build trust with other users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userStats.isIdVerified ? (
                        <div className="flex items-center text-green-600">
                          <Shield className="mr-2" size={20} />
                          <div>
                            <p className="font-medium">ID Verified</p>
                            <p className="text-sm text-muted-foreground">
                              Your identity has been verified
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm">
                            Verify your identity to get a verification badge and
                            build trust with other users on the platform.
                          </p>
                          <Button
                            onClick={() =>
                              toast.info("ID verification coming soon!")
                            }
                          >
                            Start Verification
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-destructive">
                        Danger Zone
                      </CardTitle>
                      <CardDescription>
                        Actions to delete or deactivate your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border border-dashed border-destructive/50 p-4">
                        <h4 className="font-semibold text-destructive">
                          Delete Account
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          This will permanently delete your account and all
                          associated data.
                        </p>
                        <Button
                          variant="destructive"
                          className="mt-4"
                          onClick={() =>
                            toast.error(
                              "Account deletion is disabled in this demo"
                            )
                          }
                        >
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
