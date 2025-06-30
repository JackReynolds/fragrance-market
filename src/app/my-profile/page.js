/* eslint-disable react/prop-types */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
  Star,
  Shield,
  Check,
  X,
  Edit,
  Eye,
  Package,
  MessageSquare,
  Loader2,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUserDoc } from "@/hooks/useUserDoc";
import ManualAddressForm from "@/components/profile/manualAddressForm";
import GoogleLocationSearch from "@/components/googleLocationSearch";
import ListingCard from "@/components/listingCard";
import GoPremiumButton from "@/components/goPremiumButton";

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
  const [activeTab, setActiveTab] = useState("profile");
  const [userListings, setUserListings] = useState([]);
  const { userDoc } = useUserDoc(authUser?.uid);
  const [editingAddress, setEditingAddress] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState(
    userDoc?.formattedAddress || ""
  );
  const [showEnterAddressManually, setShowEnterAddressManually] =
    useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);
  const [creatingStripeAccount, setCreatingStripeAccount] = useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/sign-in");
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    if (authUser) {
      fetchUserListings();
    }
  }, [authUser]);

  // Load Cloudinary widget script
  useEffect(() => {
    loadCloudinaryScript(() => {});
  }, []);

  // Add Cloudinary functions from new-listing page
  const loadCloudinaryScript = (callback) => {
    const existingScript = document.getElementById("cloudinaryWidgetScript");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.id = "cloudinaryWidgetScript";
      document.body.appendChild(script);
      script.onload = () => {
        if (callback) callback();
      };
    } else if (callback) {
      callback();
    }
  };

  const cloudName = "prodcloudinary";
  const uploadPreset = "fragrance-market";

  const openProfilePictureUploadWidget = () => {
    setUploadingProfilePicture(true);
    window.cloudinary
      .createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          multiple: false,
          maxFiles: 1,
          sources: ["local", "camera"],
          folder: "fragrance-market/profile-pictures",
          context: {
            alt: "profile_picture",
            caption: "Profile picture uploaded on Fragrance Market",
          },
          resourceType: "image",
          cropping: true,
          croppingAspectRatio: 1,
          croppingShowDimensions: true,
        },
        async (error, result) => {
          if (!error && result && result.event === "success") {
            try {
              const newProfilePictureURL = result.info.secure_url;

              // 1. Update user document first
              const userRef = doc(db, "users", authUser.uid);
              await updateDoc(userRef, {
                profilePictureURL: newProfilePictureURL,
              });

              // 2. Update all user's listings in background (don't block UI)
              updateUserListingsProfilePicture(
                authUser.uid,
                newProfilePictureURL
              );

              toast.success("Profile picture updated successfully!");
            } catch (updateError) {
              console.error("Error updating profile picture:", updateError);
              toast.error(
                "Failed to update profile picture. Please try again."
              );
            }
          } else if (error) {
            console.error("Cloudinary upload error:", error);
            toast.error("Failed to upload profile picture. Please try again.");
          }
          setUploadingProfilePicture(false);
        }
      )
      .open();
  };

  // Background function to update listings
  const updateUserListingsProfilePicture = async (
    userUid,
    newProfilePictureURL
  ) => {
    try {
      // Get all user's listings
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, where("ownerUid", "==", userUid));
      const querySnapshot = await getDocs(q);

      // Update all listings in batch (more efficient)
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, {
          ownerProfilePictureURL: newProfilePictureURL,
          profilePictureUpdatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(
        `Updated ${querySnapshot.size} listings with new profile picture`
      );
    } catch (error) {
      console.error("Error updating listings profile pictures:", error);
      // Don't show error to user since this is background operation
      // Could implement retry logic here
    }
  };

  // Function to fetch users listings
  const fetchUserListings = async () => {
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef, where("ownerUid", "==", authUser.uid));
    const querySnapshot = await getDocs(q);
    const listings = [];
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    setUserListings(listings);
  };

  // Sample stats - in a real app, these would come from your database
  const userStats = {
    itemsSold: 15,
    rating: 4.8,
    status: "Premium",
    isEmailVerified: authUser?.emailVerified,
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

  // Save address to firestore
  const saveAddressToFirestore = async (locationData) => {
    const userRef = doc(db, "users", authUser.uid);
    await updateDoc(userRef, {
      formattedAddress: locationData.formattedAddress,
      addressComponents: locationData.addressComponents,
    });
  };

  const handleSaveAddress = (locationData) => {
    setFormattedAddress(locationData.formattedAddress);
    setEditingAddress(false);
    setShowEnterAddressManually(false);
    saveAddressToFirestore(locationData);
    console.log(locationData);
    toast.success("Address updated!");
  };

  const getStripeActionButtonText = () => {
    if (!stripeStatus) return "Loading...";

    switch (stripeStatus.actionRequired) {
      case "create_account":
        return "Set Up Seller Account";
      case "complete_onboarding":
        return "Complete Setup";
      case "complete_requirements":
        return "Complete Requirements";
      case "manage_account":
        return "Manage Account";
      case "wait_verification":
        return "Under Review";
      default:
        return "Contact Support";
    }
  };

  const getStripeStatusColor = () => {
    if (!stripeStatus) return "bg-gray-100 text-gray-700";

    switch (stripeStatus.status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "requirements_due":
      case "past_due":
        return "bg-red-100 text-red-700";
      case "incomplete":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Loading state
  if (authLoading || (!authUser && !userDoc)) {
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

  return (
    <div className="flex min-h-screen flex-col">
      {/* <Navigation /> */}

      <main className="flex-1 py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar with user info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-24 h-24 overflow-hidden rounded-full bg-primary/10">
                      {userDoc?.profilePictureURL ? (
                        <Image
                          src={userDoc?.profilePictureURL}
                          alt={authUser?.displayName || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-semibold text-primary">
                          <User size={36} />
                        </div>
                      )}
                      <button
                        className="absolute bottom-3 right-3 rounded-full bg-primary p-1 text-white shadow-sm hover:cursor-pointer disabled:opacity-50"
                        onClick={openProfilePictureUploadWidget}
                        disabled={uploadingProfilePicture}
                      >
                        {uploadingProfilePicture ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Edit size={14} />
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <h2 className="text-xl font-bold">
                        {authUser?.displayName || userDoc?.username || "User"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {authUser?.email}
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
                      className="w-full hover:cursor-pointer"
                      onClick={() => {
                        setActiveTab("account");
                        window.scrollTo(0, 0);
                      }}
                    >
                      Edit Profile
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full hover:cursor-pointer"
                      onClick={openProfilePictureUploadWidget}
                      disabled={uploadingProfilePicture}
                    >
                      {uploadingProfilePicture ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Change Profile Picture"
                      )}
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
                    className="w-full text-xs hover:cursor-pointer"
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
                <div className="flex justify-center md:justify-between items-center mb-6 gap-3">
                  <TabsList>
                    <TabsTrigger
                      value="profile"
                      className="px-4 hover:cursor-pointer"
                    >
                      <Package size={16} className="mr-2 " />
                      My Listings
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="px-4 hover:cursor-pointer"
                    >
                      <MessageSquare size={16} className="mr-2 " />
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger
                      value="account"
                      className="px-4 hover:cursor-pointer"
                    >
                      <Edit size={16} className="mr-2 " />
                      Account
                    </TabsTrigger>
                  </TabsList>

                  <Button
                    className="hidden md:block hover:cursor-pointer hover:bg-primary/80"
                    onClick={() => router.push("/new-listing")}
                  >
                    Add New Listing
                  </Button>
                </div>

                <TabsContent value="profile" className="space-y-6">
                  <h2 className="text-2xl font-bold">My Listings</h2>

                  {userListings.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <h3 className="mb-2 text-lg font-semibold">
                        No listings yet
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        You haven&apos;t created any listings yet. Start selling
                        or swapping your fragrances today!
                      </p>
                      <Button onClick={() => router.push("/new-listing")}>
                        Create Your First Listing
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="w-full grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {userListings &&
                          userListings.map((listing) => (
                            <ListingCard
                              key={listing.id}
                              listing={listing}
                              showUserInfo={false}
                            />
                          ))}
                      </div>
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
                            authUser?.displayName || userDoc?.username || ""
                          }
                          placeholder="Your display name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          defaultValue={authUser?.email}
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
                          defaultValue={userDoc?.phoneNumber || ""}
                          placeholder="Your phone number"
                        />
                      </div>

                      <Button
                        className="mt-2 hover:cursor-pointer hover:bg-primary/80"
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
                      <CardTitle className="text-lg">
                        Premium Account Subscription:{" "}
                        {userDoc?.isPremium ? (
                          <span className="text-primary">Active</span>
                        ) : (
                          <span className="text-destructive">Inactive</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Manage your premium account subscription
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="w-3/5 md:w-2/5 lg:w-1/4 2xl:w-1/5">
                      {userDoc?.isPremium ? (
                        <Button
                          className="w-full hover:cursor-pointer hover:bg-primary/80"
                          onClick={() =>
                            router.push(
                              `https://billing.stripe.com/p/login/test_eVq6oHdpleEngED1wQbMQ00?prefilled_email=${authUser?.email}`
                            )
                          }
                        >
                          Manage Subscription
                        </Button>
                      ) : (
                        <GoPremiumButton />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Address Information
                      </CardTitle>
                      <CardDescription>
                        Update your address information to be used for shipping
                        your fragrances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="formattedAddress">Address</Label>
                        {!editingAddress ? (
                          <div className="flex items-center gap-2">
                            <Input
                              id="formattedAddress"
                              value={formattedAddress}
                              disabled
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAddress(true)}
                            >
                              Change
                            </Button>
                          </div>
                        ) : showEnterAddressManually ? (
                          <ManualAddressForm
                            onSave={(data) => {
                              handleSaveAddress(data);
                            }}
                            onCancel={() => setShowEnterAddressManually(false)}
                          />
                        ) : (
                          <div>
                            <GoogleLocationSearch
                              defaultValue={formattedAddress}
                              onSelect={(locationData) => {
                                handleSaveAddress(locationData);
                              }}
                            />
                            <div className="flex items-center mt-4 gap-2">
                              <Button
                                variant="destructive"
                                className="hover:cursor-pointer hover:bg-destructive/80"
                                onClick={() => setEditingAddress(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="hover:cursor-pointer hover:bg-primary/80"
                                onClick={() =>
                                  setShowEnterAddressManually(true)
                                }
                              >
                                Enter address manually
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
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
                        className="mt-2 hover:cursor-pointer hover:bg-primary/80"
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
                          <ShieldCheck className="mr-2" size={20} />
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

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Seller Account</CardTitle>
                      <CardDescription>
                        Manage your seller account to receive payments from
                        sales
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loadingStripeStatus ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-pulse text-sm">
                            Checking account status...
                          </div>
                        </div>
                      ) : stripeStatus ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStripeStatusColor()}`}
                            >
                              {stripeStatus.status
                                .replace("_", " ")
                                .toUpperCase()}
                            </span>
                          </div>

                          <div className="p-3 bg-muted/40 rounded-md">
                            <p className="text-sm">{stripeStatus.message}</p>

                            {stripeStatus.canReceivePayments && (
                              <div className="flex items-center text-green-600 mt-2">
                                <Check size={16} className="mr-1" />
                                <span className="text-sm">
                                  Ready to receive payments
                                </span>
                              </div>
                            )}

                            {stripeStatus.details?.requirementsCounts && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {stripeStatus.details.requirementsCounts
                                  .currentlyDue > 0 && (
                                  <p>
                                    •{" "}
                                    {
                                      stripeStatus.details.requirementsCounts
                                        .currentlyDue
                                    }{" "}
                                    requirement(s) due now
                                  </p>
                                )}
                                {stripeStatus.details.requirementsCounts
                                  .pastDue > 0 && (
                                  <p className="text-red-600">
                                    •{" "}
                                    {
                                      stripeStatus.details.requirementsCounts
                                        .pastDue
                                    }{" "}
                                    past due requirement(s)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full hover:cursor-pointer hover:bg-primary/80"
                            onClick={handleStripeAction}
                            disabled={
                              creatingStripeAccount ||
                              stripeStatus.actionRequired ===
                                "wait_verification"
                            }
                          >
                            {creatingStripeAccount ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              getStripeActionButtonText()
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            // onClick={checkStripeAccountStatus}
                            disabled={loadingStripeStatus}
                          >
                            Refresh Status
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            Unable to load account status
                          </p>
                          <Button
                            variant="outline"
                            // onClick={checkStripeAccountStatus}
                          >
                            Try Again
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
                          className="mt-4 hover:cursor-pointer hover:bg-destructive/80"
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

      {/* <Footer /> */}
    </div>
  );
}
