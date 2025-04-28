"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { app, db } from "../../firebase.config";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { Navigation } from "@/components/ui/Navigation";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import getCountryFlagEmoji from "@/utils/getCountryFlagEmoji";

// List of countries with names and ISO codes
const countries = [
  { name: "Austria", code: "AT" },
  { name: "Belgium", code: "BE" },
  { name: "Bulgaria", code: "BG" },
  { name: "Croatia", code: "HR" },
  { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" },
  { name: "Denmark", code: "DK" },
  { name: "Estonia", code: "EE" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "Germany", code: "DE" },
  { name: "Greece", code: "GR" },
  { name: "Hungary", code: "HU" },
  { name: "Ireland", code: "IE" },
  { name: "Italy", code: "IT" },
  { name: "Latvia", code: "LV" },
  { name: "Lithuania", code: "LT" },
  { name: "Luxembourg", code: "LU" },
  { name: "Malta", code: "MT" },
  { name: "Netherlands", code: "NL" },
  { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Romania", code: "RO" },
  { name: "Slovakia", code: "SK" },
  { name: "Slovenia", code: "SI" },
  { name: "Spain", code: "ES" },
  { name: "Sweden", code: "SE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  // Add more countries as needed
];

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    country: "",
    countryCode: "",
  });
  const router = useRouter();

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const auth = getAuth(app);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (auth.currentUser) {
      router.push("/");
      toast.info("You are already logged in");
    }
  }, [auth.currentUser, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleCountrySelect = (country) => {
    setFormData((prev) => ({
      ...prev,
      country: country.name,
      countryCode: country.code,
    }));

    // Clear country error if it exists
    if (errors.country) {
      setErrors((prev) => ({
        ...prev,
        country: undefined,
      }));
    }

    setOpen(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms and conditions";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trim fields before validation
    const trimmedData = {
      email: formData.email.trim(),
      password: formData.password.trim(),
      username: formData.username.trim(),
      confirmPassword: formData.confirmPassword.trim(),
    };

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.username });

      await setDoc(doc(db, "users", user.uid), {
        username: formData.username,
        usernameLowercase: formData.username.toLowerCase(),
        email: trimmedData.email,
        country: formData.country,
        countryCode: formData.countryCode,
        isPremium: false,
        isIdVerified: false,
        createdAt: serverTimestamp(),
      });

      console.log("User registered successfully", formData);
      toast.success("You have successfully created an account");
      router.push("/");
    } catch (error) {
      console.error("Error during registration:", error);
      setErrors({
        submit: error.message || "An error occurred during registration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-start gap-8 md:gap-16">
            {/* Image/Background side */}
            <div className="hidden md:block md:w-1/2 bg-primary/5 rounded-lg relative min-h-[600px] overflow-hidden">
              <Image
                src="/signup-image.jpg"
                alt="Fragrance collection"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent mix-blend-multiply" />
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">
                  Join Our Fragrance Community
                </h2>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Buy and sell rare fragrances</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Connect with other enthusiasts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Secure authentication & transactions</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sign up form side */}
            <div className="w-full md:w-1/2 mx-auto max-w-md">
              <Card className="border-border/40">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold">
                    Create an account
                  </CardTitle>
                  <CardDescription>
                    Enter your details to create your account with The Fragrance
                    Marketplace
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="JohnDoe123"
                        value={formData.username}
                        onChange={handleChange}
                        className={errors.username ? "border-destructive" : ""}
                      />
                      {errors.username && (
                        <p className="text-sm text-destructive">
                          {errors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              "w-full justify-between",
                              !formData.country && "text-muted-foreground",
                              errors.country && "border-destructive"
                            )}
                          >
                            {formData.country
                              ? formData.country
                              : "Select country..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countries.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={() =>
                                      handleCountrySelect(country)
                                    }
                                  >
                                    <span className="mr-2">
                                      {getCountryFlagEmoji(country.code)}
                                    </span>
                                    {country.name}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.countryCode === country.code
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {errors.country && (
                        <p className="text-sm text-destructive">
                          {errors.country}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? "border-destructive" : ""}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={
                          errors.confirmPassword ? "border-destructive" : ""
                        }
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="agreeTerms"
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleChange}
                          className="hover:cursor-pointer"
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              agreeTerms: checked,
                            }));
                          }}
                        />
                        <label
                          htmlFor="agreeTerms"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the{" "}
                          <Link
                            href="/terms"
                            className="text-primary underline hover:text-primary/90"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            className="text-primary underline hover:text-primary/90"
                          >
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                      {errors.agreeTerms && (
                        <p className="text-sm text-destructive">
                          {errors.agreeTerms}
                        </p>
                      )}
                    </div>

                    {errors.submit && (
                      <p className="text-sm text-destructive">
                        {errors.submit}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full hover:cursor-pointer"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs text-center text-muted-foreground">
                    By clicking Create Account, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="underline hover:text-primary"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="underline hover:text-primary"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                  <p className="text-sm text-center">
                    Already have an account?{" "}
                    <Link
                      href="/sign-in"
                      className="text-primary underline hover:text-primary/90 font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
