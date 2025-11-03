/* eslint-disable react/prop-types */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button.jsx";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
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
  Edit,
  Package,
  MessageSquare,
  Loader2,
  User,
  CheckCircle,
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
import { useProfileDoc } from "@/hooks/useProfileDoc";
import ManualAddressForm from "@/components/profile/manualAddressForm";
import GoogleLocationSearch from "@/components/googleLocationSearch";
import VerificationBadges from "@/components/ui/verificationBadges";
import DeleteAccountModal from "@/components/profile/deleteAccountModal";
import AccountTab from "@/components/profile/accountTab";
import MyListingsTab from "@/components/profile/myListingsTab";
import CompletedSwapsTab from "@/components/profile/completedSwapsTab";
import ReviewsTab from "@/components/profile/reviewsTab";

export default function Profile() {
  const { authUser, authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [userListings, setUserListings] = useState([]);
  const [completedSwaps, setCompletedSwaps] = useState([]);
  const [completedSwapsLoading, setCompletedSwapsLoading] = useState(true);
  const { profileDoc } = useProfileDoc();
  const [editingAddress, setEditingAddress] = useState(false);
  const [showEnterAddressManually, setShowEnterAddressManually] =
    useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    username: profileDoc?.username || "",
    bio: profileDoc?.bio || "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const getTimestampMillis = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    return 0;
  };

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

  useEffect(() => {
    if (!authUser?.uid) {
      setCompletedSwaps([]);
      setCompletedSwapsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchCompletedSwaps = async () => {
      setCompletedSwapsLoading(true);
      try {
        const swapsRef = collection(db, "completed_swaps");
        const swapsQuery = query(
          swapsRef,
          where("participants", "array-contains", authUser.uid)
        );
        const snapshot = await getDocs(swapsQuery);

        const fetchedSwaps = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        fetchedSwaps.sort(
          (a, b) =>
            getTimestampMillis(b.completedAt) -
            getTimestampMillis(a.completedAt)
        );

        if (isMounted) {
          setCompletedSwaps(fetchedSwaps);
        }
      } catch (error) {
        console.error("Error fetching completed swaps:", error);
        if (isMounted) {
          toast.error("Failed to load completed swaps");
        }
      } finally {
        if (isMounted) {
          setCompletedSwapsLoading(false);
        }
      }
    };

    fetchCompletedSwaps();

    return () => {
      isMounted = false;
    };
  }, [authUser?.uid]);

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
    accountType: profileDoc?.isPremium ? "Premium" : "Standard",
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

  // Function to save address to user document
  const saveAddressToFirestore = async (locationData) => {
    try {
      const response = await fetch("/api/firebase/handle-save-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userUid: authUser.uid,
          formattedAddress: locationData.formattedAddress,
          addressComponents: locationData.addressComponents,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save address");
      }

      return result;
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address. Please try again.");
      throw error;
    }
  };

  // Handle address form submission
  const handleSaveAddress = async (locationData) => {
    try {
      // Save to user document first
      await saveAddressToFirestore(locationData);

      // Update local state
      setFormattedAddress(locationData.formattedAddress);
      setEditingAddress(false);
      setShowEnterAddressManually(false);

      toast.success("Address saved!");
    } catch (error) {
      console.error("Error in handleSaveAddress:", error);
      toast.error("Failed to save address. Please try again.");
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      const { username, bio } = personalInfo;

      if (!username && !bio) {
        toast.error("No changes to save");
        return;
      }

      if (username === profileDoc?.username && bio === profileDoc?.bio) {
        toast.error("No changes to save");
        return;
      }

      // Update user document first
      const userRef = doc(db, "users", authUser.uid);
      await updateDoc(userRef, {
        username: username || profileDoc?.username,
        bio: bio || profileDoc?.bio,
        updatedAt: serverTimestamp(),
      });

      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error in handleSaveChanges:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Get ID token for authentication
      const idToken = await authUser.getIdToken();

      // Call delete account API
      const response = await fetch("/api/firebase/handle-delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        // Success! Account deleted
        setShowDeleteModal(false);
        toast.success("Your account has been deleted successfully. Goodbye!", {
          duration: 5000,
        });

        // Sign out and redirect to home page
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        // This shouldn't happen since we pre-checked, but handle it anyway
        toast.error(
          result.error || "Failed to delete account. Please try again."
        );
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(
        "An unexpected error occurred. Please try again or contact support."
      );
      setShowDeleteModal(false);
    }
  };

  let currency;

  switch (profileDoc?.countryCode) {
    case "US":
      currency = "USD";
      break;
    case "GB":
      currency = "GBP";
      break;
    default:
      currency = "EUR";
  }

  // Loading state
  if (authLoading || (!authUser && !profileDoc)) {
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
                      {profileDoc?.profilePictureURL ? (
                        <Image
                          src={profileDoc?.profilePictureURL}
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
                        {authUser?.displayName ||
                          profileDoc?.username ||
                          "User"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {authUser?.email}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Account Type
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {userStats.accountType}
                        </span>
                      </div>

                      {/* Email Verified */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Email Verified
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {authUser?.emailVerified ? "Yes" : "No"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rating</span>
                        <StarRating rating={userStats.rating} />
                      </div>

                      {/* Items sold */}
                      {profileDoc?.isPremium ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Items Sold
                          </span>
                          <span className="text-sm font-medium">
                            {userStats.itemsSold}
                          </span>
                        </div>
                      ) : null}

                      {/* Swap Count */}
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium`}>
                          Monthly Swap Count
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            profileDoc?.isPremium
                              ? "text-green-600"
                              : profileDoc?.monthlySwapCount === 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {profileDoc?.isPremium
                            ? "Unlimited"
                            : `${profileDoc?.monthlySwapCount || 0}/1 `}
                        </span>
                      </div>

                      <Separator className="my-3" />

                      <VerificationBadges profile={profileDoc} />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full hover:cursor-pointer shadow-md"
                      onClick={() => {
                        setActiveTab("account");
                        window.scrollTo(0, 0);
                      }}
                    >
                      Edit Profile
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full hover:cursor-pointer shadow-md"
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
                    className="w-full hover:cursor-pointer shadow-md mt-2"
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
                defaultValue="account"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <div className="flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center mb-6 gap-3 w-full">
                  {/* Full-width tabs for mobile, auto-width for desktop */}
                  <div className="w-full md:w-auto">
                    <TabsList className="w-full md:w-auto grid grid-cols-4 md:inline-flex h-auto">
                      <TabsTrigger
                        value="account"
                        className="px-2 py-3 md:px-4 hover:cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                      >
                        <Edit size={16} />
                        <span className="text-[10px] md:text-sm">Account</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="listings"
                        className="px-2 py-3 md:px-4 hover:cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                      >
                        <Package size={16} />
                        <span className="text-[10px] md:text-sm">Listings</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed-swaps"
                        className="px-2 py-3 md:px-4 hover:cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                      >
                        <CheckCircle size={16} />
                        <span className="text-[10px] md:text-sm">Swaps</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="reviews"
                        className="px-2 py-3 md:px-4 hover:cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                      >
                        <MessageSquare size={16} />
                        <span className="text-[10px] md:text-sm">Reviews</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <Button
                    className="hidden md:block hover:cursor-pointer hover:bg-primary/80 shadow-md flex-shrink-0"
                    onClick={() => router.push("/new-listing")}
                  >
                    Add New Listing
                  </Button>
                </div>

                {/* Listings */}
                <MyListingsTab userListings={userListings} router={router} />

                {/* Completed swaps */}
                <CompletedSwapsTab
                  completedSwaps={completedSwaps}
                  completedSwapsLoading={completedSwapsLoading}
                  authUser={authUser}
                  router={router}
                />

                {/* Reviews */}
                <ReviewsTab />

                {/* Account Settings */}
                <AccountTab
                  authUser={authUser}
                  profileDoc={profileDoc}
                  personalInfo={personalInfo}
                  setPersonalInfo={setPersonalInfo}
                  handleSaveChanges={handleSaveChanges}
                  editingAddress={editingAddress}
                  setEditingAddress={setEditingAddress}
                  formattedAddress={profileDoc?.formattedAddress || ""}
                  showEnterAddressManually={showEnterAddressManually}
                  setShowEnterAddressManually={setShowEnterAddressManually}
                  handleSaveAddress={handleSaveAddress}
                  setShowDeleteModal={setShowDeleteModal}
                />
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* <Footer /> */}

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        authUser={authUser}
      />
    </div>
  );
}
