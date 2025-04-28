"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase.config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Navigation } from "@/components/ui/navigation.jsx";
import { Footer } from "@/components/ui/footer.jsx";
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
  DollarSign,
  Sparkles,
  EuroIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { useUserDoc } from "@/hooks/useUserDoc";
const NewListing = () => {
  const { authUser, authLoading } = useAuth();
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { userDoc } = useUserDoc();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "sell",
    description: "",
    price: "",
    amount: "100",
    brand: "",
    fragrance: "",
    swapPreferences: "",
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      toast.error("Please sign in to create a listing");
      router.push("/sign-in");
    }
  }, [authUser, authLoading]);

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
          maxFiles: 5 - imageFiles.length,
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
            setImageFiles((prevFiles) => [...prevFiles, result.info]);
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
    setImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
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

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    }

    if (!formData.fragrance.trim()) {
      newErrors.fragrance = "Fragrance name is required";
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

    setIsLoading(true);

    console.log(userDoc);

    try {
      // Create the listing object
      const listingData = {
        title: formData.title.trim(),
        type: formData.type,
        description: formData.description.trim(),
        price: formData.type === "sell" ? parseFloat(formData.price) : null,
        amountLeft: formData.amount,
        brand: formData.brand.trim(),
        fragrance: formData.fragrance.trim(),
        swapPreferences:
          formData.type === "swap" ? formData.swapPreferences.trim() : null,
        imageURLs: imageURLs,
        createdAt: serverTimestamp(),
        ownerUid: authUser.uid,
        ownerIsPremium: userDoc?.isPremium,
        ownerIsIdVerified: userDoc?.isIdVerified,
        ownerUsername: authUser.displayName || "Anonymous User",
        status: "active",
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "listings"), listingData);

      toast.success("Listing created successfully!");
      router.push(`/listings/${docRef.id}`);
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not authenticated
  if (!authUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <main className="flex justify-center py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
              <p className="text-muted-foreground">
                Share your fragrance with the community. Provide clear details
                to attract interested buyers or swappers.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Enter the details about your fragrance listing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Listing Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="E.g., 'Tom Ford Oud Wood 50ml' or 'Creed Aventus Full Bottle'"
                        value={formData.title}
                        onChange={handleChange}
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">
                          {errors.title}
                        </p>
                      )}
                    </div>

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
                      Upload clear photos of your fragrance. Show the bottle,
                      box, fill level, and batch code if possible.
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
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={isLoading ? "px-8" : "cursor-pointer px-8"}
                  >
                    {isLoading ? "Creating Listing..." : "Create Listing"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewListing;
