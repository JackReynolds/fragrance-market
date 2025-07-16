"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircleIcon,
  MessageCircleWarningIcon,
  Menu,
  User,
  LogOut,
  ShoppingBag,
  Repeat,
  HelpCircle,
  LogIn,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase.config";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useUserDoc } from "@/hooks/useUserDoc";

const Navigation = () => {
  const { authUser } = useAuth();
  const router = useRouter();
  const { userDoc } = useUserDoc();

  // State for window width with default value
  const [windowWidth, setWindowWidth] = useState(768); // Default to desktop size

  // useEffect to handle window width
  useEffect(() => {
    // Check if window exists (client-side only)
    if (typeof window !== "undefined") {
      // Set initial width
      setWindowWidth(window.innerWidth);

      // Optional: Add resize listener for responsive behavior
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  // assume userDoc.unreadCount is kept up-to-date by your Cloud Function
  const unreadCount = userDoc?.unreadMessagesCount || 0;
  const hasUnreadMessages = userDoc?.unreadMessagesCount > 0;

  const handleSignOut = () => {
    signOut(auth);
    toast.success("Signed out successfully");
  };

  // Navigation links configuration
  const navigationLinks = [
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: <ShoppingBag className="h-4 w-4 mr-2" />,
    },
    {
      href: "/new-listing",
      label: "Swap or Sell",
      icon: <Repeat className="h-4 w-4 mr-2" />,
    },
    {
      href: "/how-it-works",
      label: "How It Works",
      icon: <HelpCircle className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-6 h-16 flex items-center justify-between max-w-[2000px] mx-auto">
        {/* Left section - Logo */}
        <div
          className="flex items-center gap-2 hover:cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/the-fragrance-market-logo.png"
            alt="The Fragrance Market"
            width={windowWidth < 768 ? 40 : 60}
            height={windowWidth < 768 ? 40 : 60}
          />

          <p className="text-sm md:text-lg font-semibold">
            The Fragrance Market
          </p>
        </div>

        {/* Center section - Main Navigation (desktop) */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav className="flex items-center space-x-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right section - User navigation */}
        <div className="flex items-center">
          {/* Desktop user navigation */}
          {authUser ? (
            <div className="hidden md:flex items-center gap-5">
              <Link
                href="/inbox"
                className="flex text-sm items-center font-medium hover:cursor-pointer hover:text-primary/70 transition-colors"
              >
                Inbox
                {hasUnreadMessages && (
                  <span className="ml-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-1 hover:cursor-pointer">
                {userDoc?.profilePictureURL ? (
                  <Image
                    src={userDoc.profilePictureURL}
                    onClick={() => router.push("/my-profile")}
                    alt="Profile Picture"
                    width={32}
                    height={32}
                  />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                <Link
                  href="/my-profile"
                  className="flex text-sm items-center font-medium hover:cursor-pointer hover:text-primary/70 transition-colors"
                >
                  Profile
                </Link>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium hover:cursor-pointer hover:text-primary/70 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/sign-in"
                className="text-sm font-medium hover:text-primary/90 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button - Now on the very right */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden ml-4">
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="py-6">
                <nav className="flex flex-col space-y-4">
                  {navigationLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center py-2 px-3 rounded-md hover:bg-muted transition-colors"
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="my-2 border-t" />
                  {authUser ? (
                    <>
                      <SheetClose asChild>
                        <Link
                          href="/inbox"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-muted transition-colors"
                        >
                          {hasUnreadMessages ? (
                            <MessageCircleWarningIcon className="h-4 w-4 mr-2 text-red-500" />
                          ) : (
                            <MessageCircleIcon className="h-4 w-4 mr-2" />
                          )}
                          Inbox
                          {hasUnreadMessages && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              !
                            </span>
                          )}
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/my-profile"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-muted transition-colors"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                      </SheetClose>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center py-2 px-3 rounded-md hover:bg-muted transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Link
                          href="/sign-in"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-muted transition-colors"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/sign-up"
                          className="flex items-center py-2 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Sign Up
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
