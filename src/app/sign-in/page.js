"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    if (authUser) {
      router.push("/my-profile");
    }
  }, [authUser, router]);

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
      router.push("/my-profile");
    } catch (error) {
      console.error("Error signing in:", error);

      let errorMessage = "An error occurred during sign in";

      // Provide more user-friendly error messages
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
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
              {/* <Image
                src="/signin-image.jpg"
                alt="Fragrance collection"
                fill
                className="object-cover"
              /> */}
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

      {/* <Footer /> */}
    </div>
  );
}
