"use client";

import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { app } from "@/firebase.config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Loader2, KeyRound } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const auth = getAuth(app);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Password reset error:", error);

      switch (error.code) {
        case "auth/user-not-found":
          setError("No account found with this email address");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/too-many-requests":
          setError("Too many requests. Please try again later");
          break;
        default:
          setError("Failed to send reset email. Please try again");
      }

      toast.error("Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Email Sent!</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Check your email inbox and spam folder. Click the link in the
                email to reset your password.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              onClick={() => router.push("/sign-in")}
              className="w-full hover:cursor-pointer"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
              className="w-full hover:cursor-pointer"
            >
              Send to Different Email
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section with Gradient */}
      <section
        style={{
          background:
            "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
        }}
        className="py-6 md:py-10"
      >
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold mb-4 text-white">
              Reset Your Password
            </h1>
            <p className="text-sm md:text-base text-white/90 max-w-md mx-auto">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <main className="flex-1 flex justify-center mt-5 py-4 px-4">
        <div className="w-full max-w-md">
          <Card className="border-border/40">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg md:text-xl font-bold text-center">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-center">
                No worries! Enter your email and we&apos;ll help you reset your
                password.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(""); // Clear error when typing
                    }}
                    className={error ? "border-destructive" : ""}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full hover:cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link
                    href="/sign-in"
                    className="text-primary underline hover:text-primary/90 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="text-primary underline hover:text-primary/90 font-medium"
                  >
                    Create one now
                  </Link>
                </p>
              </div>

              {/* Help Section */}
              <Alert>
                <AlertDescription className="text-xs text-center">
                  Having trouble? Contact us at{" "}
                  <a
                    href="mailto:support@thefragrancemarket.com"
                    className="font-medium text-primary hover:underline"
                  >
                    support@thefragrancemarket.com
                  </a>
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
