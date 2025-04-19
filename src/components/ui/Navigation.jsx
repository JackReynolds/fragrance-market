"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase.config";
import { toast } from "sonner";

export function Navigation() {
  const { authUser } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSignOut = () => {
    signOut(auth);
    toast.success("Signed out successfully");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length > 0) {
      router.push(`/search-results?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            {/* <Image
              src="/logo.svg"
              alt="Fragrance Market Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            /> */}
            <span className="ml-5 text-lg font-semibold">
              The Fragrance Market
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-primary/70 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/marketplace"
            className="text-sm font-medium hover:text-primary/70 transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/sell"
            className="text-sm font-medium hover:text-primary/70 transition-colors"
          >
            Sell/Swap
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm font-medium hover:text-primary/70 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/community"
            className="text-sm font-medium hover:text-primary/70 transition-colors"
          >
            Community
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <form
            className="relative hidden lg:flex items-center"
            onSubmit={handleSearchSubmit}
          >
            <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search fragrances..."
              className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          {authUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="text-sm font-medium hover:text-primary/70 transition-colors"
              >
                Profile
              </Link>
              <p
                className="text-sm font-medium hover:text-primary/70  transition-colors hover:cursor-pointer"
                onClick={handleSignOut}
              >
                Sign Out
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}
