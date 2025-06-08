"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase.config.js";
import ListingCard from "@/components/listingCard";

export function LatestListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestListings = async () => {
      try {
        const listingsQuery = query(
          collection(db, "listings"),
          orderBy("createdAt", "desc"),
          limit(8)
        );

        const listingsSnapshot = await getDocs(listingsQuery);
        const listingsData = listingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setListings(listingsData);
      } catch (error) {
        console.error("Error fetching latest listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestListings();
  }, []);

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between mb-10 md:flex-row">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Latest Fragrances
            </h2>
            <p className="mt-2 text-muted-foreground">
              Explore our newest fragrance listings
            </p>
          </div>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline md:mt-0"
          >
            View all fragrances
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-lg bg-gray-200 animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
