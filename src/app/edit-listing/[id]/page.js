"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/firebase.config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { isSlug } from "@/utils/generateSlug";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import {
  Camera,
  Upload,
  PlusCircle,
  Trash2,
  EuroIcon,
  Sparkles,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

const EditListing = () => {
  const { authUser, authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id;

  // const [imageFiles, setImageFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // const [listingData, setListingData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: "sell",
    description: "",
    price: "",
    amount: "100",
    brand: "",
    fragrance: "",
    size: "",
    swapPreferences: "",
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      toast.error("Please sign in to edit a listing");
      router.push("/sign-in");
    }
  }, [authUser, authLoading, router]);

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      if (!authUser || !listingId) return;

      try {
        let listingSnap;
        let actualListingId;

        // Check if listingId is a slug or a UID
        if (isSlug(listingId)) {
          // It's a slug - query by slug field
          const { collection, query, where, getDocs } = await import(
            "firebase/firestore"
          );
          const listingsRef = collection(db, "listings");
          const q = query(listingsRef, where("slug", "==", listingId));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            listingSnap = querySnapshot.docs[0];
            actualListingId = listingSnap.id;
          }
        } else {
          // It's a UID - query by document ID (backwards compatibility)
          const listingRef = doc(db, "listings", listingId);
          listingSnap = await getDoc(listingRef);
          actualListingId = listingId;
        }

        if (!listingSnap || !listingSnap.exists()) {
          setNotFound(true);
          toast.error("Listing not found");
          return;
        }

        const data = listingSnap.data();

        // Check if the current user is the owner of the listing
        if (data.ownerUid !== authUser.uid) {
          setNotAuthorized(true);
          toast.error("You don't have permission to edit this listing");
          return;
        }

        // Populate form data
        setFormData({
          type: data.type || "sell",
          description: data.description || "",
          price: data.price?.toString() || "",
          amount: data.amountLeft?.toString() || "100",
          brand: data.brand || "",
          fragrance: data.fragrance || "",
          size: data.sizeInMl?.toString() || "",
          swapPreferences: data.swapPreferences || "",
        });

        // Set images
        setImageURLs(data.imageURLs || []);
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error("Failed to load listing details");
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchListing();
    }
  }, [authUser, listingId, router]);

  // Load Cloudinary widget script
  useEffect(() => {
    loadCloudinaryScript(() => {});
  }, []);

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

  const openUploadWidget = () => {
    window.cloudinary
      .createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          multiple: true,
          maxFiles: 5 - imageURLs.length,
          sources: ["local", "camera"],
          folder: "fragrance-market/listings",
          context: {
            alt: "user_uploaded_image",
            caption: "Uploaded on Fragrance Market",
          },
          resourceType: "image",
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            setImageURLs((prevUrls) => [...prevUrls, result.info.secure_url]);
          } else if (error) {
            console.error("Cloudinary upload error:", error);
            toast.error("Failed to upload image. Please try again.");
          }
        }
      )
      .open();
  };

  const removeImage = (index) => {
    setImageURLs((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    }

    if (!formData.fragrance.trim()) {
      newErrors.fragrance = "Fragrance name is required";
    }

    const sizeNum = Number(formData.size);
    if (
      !formData.size ||
      !Number.isFinite(sizeNum) ||
      sizeNum < 1 ||
      sizeNum > 500
    ) {
      newErrors.size = "Please enter a valid bottle size (1-500ml)";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (
      formData.type === "sell" &&
      (!formData.price ||
        isNaN(parseFloat(formData.price)) ||
        parseFloat(formData.price) <= 0)
    ) {
      newErrors.price = "Valid price is required for items for sale";
    }

    if (imageURLs.length === 0) {
      newErrors.images = "At least one image is required";
    }

    if (formData.type === "swap" && !formData.swapPreferences.trim()) {
      newErrors.swapPreferences =
        "Please specify what you're looking to swap for";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Scroll to the first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    setIsSaving(true);

    try {
      // Auto-generate title from fragrance and brand
      const generatedTitle = `${formData.fragrance.trim()} - ${formData.brand.trim()}`;

      // Update the listing object
      const updatedListingData = {
        title: generatedTitle,
        type: formData.type,
        description: formData.description.trim(),
        price: formData.type === "sell" ? parseFloat(formData.price) : null,
        amountLeft: formData.amount,
        brand: formData.brand.trim(),
        fragrance: formData.fragrance.trim(),
        sizeInMl: Number(formData.size),
        swapPreferences:
          formData.type === "swap" ? formData.swapPreferences.trim() : null,
        imageURLs: imageURLs,
        updatedAt: serverTimestamp(),
      };

      // Update in Firestore
      const listingRef = doc(db, "listings", listingId);
      await updateDoc(listingRef, updatedListingData);

      toast.success("Listing updated successfully!");
      router.push(`/listings/${listingId}`);
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle redirect cases
  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The listing you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Not Authorized</h1>
            <p className="text-muted-foreground mb-6">
              You don&apos;t have permission to edit this listing.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* <Navigation /> */}
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <div className="text-xl">Loading listing details...</div>
          </div>
        </main>
        {/* <Footer /> */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* <Navigation /> */}

      <main className="flex justify-center py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Edit Listing</h1>
              <p className="text-muted-foreground">
                Update your fragrance listing details and images.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Update the details about your fragrance listing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand/House</Label>
                        <Input
                          id="brand"
                          name="brand"
                          placeholder="E.g., Tom Ford, Creed, Dior"
                          value={formData.brand}
                          onChange={handleChange}
                          className={errors.brand ? "border-destructive" : ""}
                        />
                        {errors.brand && (
                          <p className="text-sm text-destructive">
                            {errors.brand}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fragrance">Fragrance Name</Label>
                        <Input
                          id="fragrance"
                          name="fragrance"
                          placeholder="E.g., Oud Wood, Aventus, Sauvage"
                          value={formData.fragrance}
                          onChange={handleChange}
                          className={
                            errors.fragrance ? "border-destructive" : ""
                          }
                        />
                        {errors.fragrance && (
                          <p className="text-sm text-destructive">
                            {errors.fragrance}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Bottle Size (ml)</Label>
                      <Input
                        id="size"
                        name="size"
                        type="number"
                        min="1"
                        max="500"
                        placeholder="E.g., 50, 100, 125"
                        value={formData.size}
                        onChange={handleChange}
                        className={errors.size ? "border-destructive" : ""}
                      />
                      {errors.size && (
                        <p className="text-sm text-destructive">
                          {errors.size}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your fragrance - include details like batch code, year of production, storage conditions, etc."
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className={
                          errors.description ? "border-destructive" : ""
                        }
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="type">Listing Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            handleSelectChange("type", value)
                          }
                        >
                          <SelectTrigger
                            id="type"
                            className={errors.type ? "border-destructive" : ""}
                          >
                            <SelectValue placeholder="Select listing type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sell">
                              <div className="flex items-center">
                                <EuroIcon className="mr-2 h-4 w-4" />
                                <span>Sell</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="swap">
                              <div className="flex items-center">
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>Swap</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.type && (
                          <p className="text-sm text-destructive">
                            {errors.type}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount Left</Label>
                        <Select
                          value={formData.amount}
                          onValueChange={(value) =>
                            handleSelectChange("amount", value)
                          }
                        >
                          <SelectTrigger
                            id="amount"
                            className={
                              errors.amount ? "border-destructive" : ""
                            }
                          >
                            <SelectValue placeholder="Select amount left" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">
                              100% (Full/Unused)
                            </SelectItem>
                            <SelectItem value="99">
                              99% (Tested only)
                            </SelectItem>
                            <SelectItem value="95">
                              95% (Few sprays used)
                            </SelectItem>
                            <SelectItem value="90">90%</SelectItem>
                            <SelectItem value="85">85%</SelectItem>
                            <SelectItem value="80">80%</SelectItem>
                            <SelectItem value="75">75%</SelectItem>
                            <SelectItem value="70">70%</SelectItem>
                            <SelectItem value="60">60%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="40">40%</SelectItem>
                            <SelectItem value="30">30%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="10">10% or less</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.amount && (
                          <p className="text-sm text-destructive">
                            {errors.amount}
                          </p>
                        )}
                      </div>
                    </div>

                    {formData.type === "sell" && (
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (EUR)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            €
                          </span>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={handleChange}
                            className={`pl-8 ${
                              errors.price ? "border-destructive" : ""
                            }`}
                          />
                        </div>
                        {errors.price && (
                          <p className="text-sm text-destructive">
                            {errors.price}
                          </p>
                        )}
                      </div>
                    )}

                    {formData.type === "swap" && (
                      <div className="space-y-2">
                        <Label htmlFor="swapPreferences">
                          What are you looking to swap for?
                        </Label>
                        <Textarea
                          id="swapPreferences"
                          name="swapPreferences"
                          placeholder="Describe the fragrances you're interested in swapping for - brands, specific fragrances, etc."
                          rows={3}
                          value={formData.swapPreferences}
                          onChange={handleChange}
                          className={
                            errors.swapPreferences ? "border-destructive" : ""
                          }
                        />
                        {errors.swapPreferences && (
                          <p className="text-sm text-destructive">
                            {errors.swapPreferences}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                    <CardDescription>
                      Update photos of your fragrance. Show the bottle, box,
                      fill level, and batch code if possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {imageURLs.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {imageURLs.map((url, index) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-md overflow-hidden border bg-muted"
                            >
                              <Image
                                src={url}
                                alt={`Listing image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full text-destructive hover:bg-white"
                                aria-label="Remove image"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}

                          {imageURLs.length < 5 && (
                            <button
                              type="button"
                              onClick={openUploadWidget}
                              className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-md aspect-square text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                              <PlusCircle className="mb-2" />
                              <span>Add More</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-md text-center">
                          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                          <h3 className="font-medium mb-1">Upload Images</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Drag and drop or click to upload (max 5 images)
                          </p>
                          <Button
                            type="button"
                            onClick={openUploadWidget}
                            className="flex items-center hover:cursor-pointer hover:bg-primary/80"
                          >
                            <Camera className="mr-2 h-4 w-4" /> Select Images
                          </Button>
                          {errors.images && (
                            <p className="text-sm text-destructive mt-4">
                              {errors.images}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className={isSaving ? "px-8" : "cursor-pointer px-8"}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
};

export default EditListing;
