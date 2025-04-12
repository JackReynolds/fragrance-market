"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/Separator";
import { auth } from "../../firebase.config";
import { useAuth } from "@/hooks/useAuth";

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { authUser } = useAuth();

  // Redirect if user is already logged in
  if (authUser) {
    router.push("/profile");
    return null;
  }

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

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      toast.success("Signed in successfully");
      router.push("/profile");
    } catch (error) {
      console.error("Error signing in:", error);

      let errorMessage = "An error occurred during sign in";

      // Provide more user-friendly error messages
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      }

      setErrors({
        submit: errorMessage,
      });
      toast.error(errorMessage);
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
                src="/signin-image.jpg"
                alt="Fragrance collection"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent mix-blend-multiply" />
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
                <p className="text-lg mb-6">
                  Sign in to access your account and continue your fragrance
                  journey.
                </p>
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
                    <span>View your purchases</span>
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
                    <span>Manage your listings</span>
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
                    <span>Connect with collectors</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sign in form side */}
            <div className="w-full md:w-1/2 mx-auto max-w-md">
              <Card className="border-border/40">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          href="/forgot-password"
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
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
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Handle Google sign-in
                          toast.info("Google sign-in not implemented yet");
                        }}
                        className="bg-background"
                        type="button"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Handle Facebook sign-in
                          toast.info("Facebook sign-in not implemented yet");
                        }}
                        className="bg-background"
                        type="button"
                      >
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="#1877F2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9.37,5.51h3.644v3.29H9.37V24h-5.4V8.8H0V5.51H3.97V3.833C3.97,1.247,4.736,0,7.859,0H13.01v3.29H10.966c-1.557,0-1.596,0.581-1.596,1.667V5.51z" />
                        </svg>
                        Facebook
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-sm text-center">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/sign-up"
                      className="text-primary underline hover:text-primary/90 font-medium"
                    >
                      Sign up
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
