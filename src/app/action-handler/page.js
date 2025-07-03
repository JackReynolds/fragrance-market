"use client";

import React, { useEffect, useState } from "react";
import {
  getAuth,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ActionHandler = () => {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Processing your request...");
  const [mode, setMode] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResendModal, setShowResendModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const auth = getAuth();
  const router = useRouter();
  const { authUser } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const actionMode = searchParams.get("mode");
    const actionCode = searchParams.get("oobCode");

    if (!actionMode || !actionCode) {
      setStatus("error");
      setMessage("Invalid or missing verification parameters.");
      return;
    }

    setMode(actionMode);

    switch (actionMode) {
      case "verifyEmail":
        handleVerifyEmail(actionCode);
        break;
      case "resetPassword":
        handleVerifyPasswordResetCode(actionCode);
        break;
      default:
        setStatus("error");
        setMessage("Unsupported action type.");
        break;
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.displayName || "");
      setEmail(authUser.email || "");
    }
  }, [authUser]);

  const handleVerifyEmail = async (actionCode) => {
    try {
      setStatus("verifying");
      setMessage("Verifying your email address...");

      await applyActionCode(auth, actionCode);

      if (auth.currentUser) {
        await auth.currentUser.reload();
      }

      setStatus("success");
      setMessage("Your email has been verified successfully!");

      toast.success("Email verified! Welcome to The Fragrance Market.");
    } catch (error) {
      console.error("Email verification error:", error);
      setStatus("error");

      switch (error.code) {
        case "auth/expired-action-code":
          setMessage(
            "This verification link has expired. Please request a new one."
          );
          break;
        case "auth/invalid-action-code":
          setMessage(
            "This verification link is invalid or has already been used."
          );
          break;
        case "auth/user-disabled":
          setMessage("This account has been disabled. Please contact support.");
          break;
        default:
          setMessage(
            "Failed to verify email. Please try again or contact support."
          );
      }
    }
  };

  const handleVerifyPasswordResetCode = async (actionCode) => {
    try {
      setStatus("verifying");
      setMessage("Verifying password reset request...");

      const email = await verifyPasswordResetCode(auth, actionCode);
      setResetEmail(email);
      setStatus("success");
      setMessage("Verification successful. Please enter your new password.");
    } catch (error) {
      console.error("Password reset verification error:", error);
      setStatus("error");

      switch (error.code) {
        case "auth/expired-action-code":
          setMessage(
            "This password reset link has expired. Please request a new one."
          );
          break;
        case "auth/invalid-action-code":
          setMessage(
            "This password reset link is invalid or has already been used."
          );
          break;
        default:
          setMessage("Invalid password reset link. Please request a new one.");
      }
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const actionCode = searchParams.get("oobCode");

      await confirmPasswordReset(auth, actionCode, newPassword);

      toast.success("Password reset successfully!");
      router.push("/sign-in");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !email.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/email/verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Verification email sent! Please check your inbox and spam folder."
        );
        setShowResendModal(false);
        router.push("/");
      } else {
        throw new Error(data.error || "Failed to send verification email");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to send verification email. Please contact support.");
    } finally {
      setIsResending(false);
    }
  };

  const renderVerifyEmailContent = () => {
    if (status === "verifying") {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <CardTitle>Verifying Email</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (status === "success") {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Email Verified!</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {authUser ? (
              <Button onClick={() => router.push("/")} className="w-full">
                Continue to Marketplace
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/sign-in")}
                className="w-full"
              >
                Sign In to Continue
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    if (status === "error") {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Verification Failed</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={showResendModal} onOpenChange={setShowResendModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Send New Verification Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resend Verification Email</DialogTitle>
                  <DialogDescription>
                    We&apos;ll send a new verification email to your address.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowResendModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isResending}
                      className="flex-1"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Email"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Return to Home
            </Button>

            <Alert>
              <AlertDescription>
                Need help? Contact us at{" "}
                <a
                  href="mailto:support@thefragrancemarket.ie"
                  className="font-medium text-blue-600 hover:underline"
                >
                  support@thefragrancemarket.ie
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  };

  const renderPasswordResetContent = () => {
    if (status === "verifying") {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <CardTitle>Verifying Reset Link</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (status === "success") {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password for {resetEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            <Button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (status === "error") {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Reset Failed</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => router.push("/sign-in")} className="w-full">
              Back to Sign In
            </Button>
            <Alert>
              <AlertDescription>
                Need help? Contact us at{" "}
                <a
                  href="mailto:support@thefragrancemarket.ie"
                  className="font-medium text-blue-600 hover:underline"
                >
                  support@thefragrancemarket.ie
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {mode === "verifyEmail" && renderVerifyEmailContent()}
        {mode === "resetPassword" && renderPasswordResetContent()}
        {!mode && status === "error" && (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Invalid Request</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/")} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActionHandler;
