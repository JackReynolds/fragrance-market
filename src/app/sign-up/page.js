"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { app } from "../../firebase.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CountrySelect from "@/components/countrySelect";
import { cn } from "@/lib/utils";

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

  const auth = getAuth(app);
  const passwordsFilled =
    formData.password.length > 0 && formData.confirmPassword.length > 0;
  const passwordsMatch =
    passwordsFilled && formData.password === formData.confirmPassword;
  const hasPasswordValidationError =
    Boolean(errors.password) || Boolean(errors.confirmPassword);
  const passwordFeedbackClass = passwordsFilled
    ? passwordsMatch && !hasPasswordValidationError
      ? "border-emerald-500 focus-visible:ring-emerald-500"
      : !passwordsMatch
      ? "border-red-500 focus-visible:ring-red-500"
      : ""
    : "";

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (auth.currentUser) {
      router.push("/");
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

  // Function to check if username is already taken
  const checkUsernameAvailability = async (username) => {
    const response = await fetch(`/api/firebase/check-username-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to check username availability"
      );
    }

    const data = await response.json();
    return data.isAvailable;
  };

  const handleCountryChange = (countryName, countryCode) => {
    setFormData((prev) => ({
      ...prev,
      country: countryName,
      countryCode: countryCode,
    }));

    // Clear country error if it exists
    if (errors.country) {
      setErrors((prev) => ({
        ...prev,
        country: undefined,
      }));
    }
  };

  const validate = async () => {
    const newErrors = {};

    // Check if username is empty FIRST
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else {
      // Then check the pattern
      const usernamePattern = /^[a-zA-Z0-9_-]+$/;
      if (!usernamePattern.test(formData.username.trim())) {
        newErrors.username =
          "Username can only contain letters, numbers, hyphens, and underscores";
      } else {
        // Finally check availability (only if pattern is valid)
        try {
          const isAvailable = await checkUsernameAvailability(
            formData.username.trim()
          );
          if (!isAvailable) {
            newErrors.username = "Username is already taken";
          }
        } catch (error) {
          console.error("Username availability check failed:", error);
          newErrors.username = "Could not verify username availability";
        }
      }
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

  // Function to send verification email
  const sendVerificationEmail = async (username, email) => {
    const response = await fetch("/api/email/verification-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Verification email error:", errorData);
      throw new Error(errorData.error || "Failed to send verification email");
    }

    return response.json();
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

    setIsLoading(true);

    try {
      const validationErrors = await validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.username });

      // Call Firebase function to create Firestore user document
      const response = await fetch("/api/firebase/create-new-user-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email,
          uid: user.uid,
          country: formData.country,
          countryCode: formData.countryCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user account");
      }

      // Send verification email
      await sendVerificationEmail(formData.username, formData.email);

      toast.success("Account created successfully");
      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);

      // Handle specific Firebase Auth errors
      let errorMessage = "Registration failed";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* <Navigation /> */}

      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-start gap-8 md:gap-16">
            {/* Image/Background side */}
            <div
              className="hidden md:block md:w-1/2 bg-primary/5 rounded-lg relative min-h-[600px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
              }}
            >
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
                    <span>Swap your fragrances with other users</span>
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
                    <span>Buy and sell fragrances</span>
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
                      <CountrySelect
                        value={formData.country}
                        countryCode={formData.countryCode}
                        onChange={handleCountryChange}
                        hasError={!!errors.country}
                        placeholder="Select country..."
                      />
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
                        className={cn(
                          errors.password && "border-destructive",
                          passwordFeedbackClass &&
                            !errors.password &&
                            passwordFeedbackClass
                        )}
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
                        className={cn(
                          errors.confirmPassword && "border-destructive",
                          passwordFeedbackClass &&
                            !errors.confirmPassword &&
                            passwordFeedbackClass
                        )}
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
                      disabled={isLoading || !formData.agreeTerms}
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

      {/* <Footer /> */}
    </div>
  );
}
