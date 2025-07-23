"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer
      style={{
        background:
          "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
      }}
      className="text-gray-50 border-t border-border"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/the-fragrance-market-logo.png"
                alt="Fragrance Market Logo"
                width={50}
                height={50}
              />
              <span className="text-lg font-semibold">
                The Fragrance Market
              </span>
            </Link>
            <p className="text-sm text-gray-100">
              The exclusive marketplace for fragrance enthusiasts, collectors,
              and sellers.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-100">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/marketplace"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Browse All
                </Link>
              </li>
              <li>
                <Link
                  href="/new-arrivals"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/trending"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link
                  href="/discounts"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Discounts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-100">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/signin"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/sell"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Sell/Swap
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-100">
              The Fragrance Market
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/premium"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Premium
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-100 hover:text-gray-300 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-100">
              Subscribe
            </h4>
            <p className="text-sm text-gray-100">
              Get the latest news and updates directly to your inbox.
            </p>

            <div className="flex max-w-sm flex-col space-y-2">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Subscribe
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <a
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <p className="text-sm text-gray-100">
            &copy; {new Date().getFullYear()} The Fragrance Market. All rights
            reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <Link
              href="/privacy"
              className="text-gray-100 hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-gray-100 hover:text-gray-300 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-gray-100 hover:text-gray-300 transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
