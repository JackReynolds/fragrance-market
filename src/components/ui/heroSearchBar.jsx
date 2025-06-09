"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const HeroSearchBar = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length > 0) {
      router.push(`/marketplace?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="flex justify-center sm:justify-start">
      <form
        onSubmit={handleSearchSubmit}
        className="relative w-full max-w-sm sm:max-w-md"
      >
        <input
          type="search"
          placeholder="Search by brand, name, or notes..."
          className="h-10 sm:h-12 w-full rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 pl-9 sm:pl-10 text-sm sm:text-base text-white placeholder:text-white/80 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search
          className="absolute right-2 sm:right-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 hover:cursor-pointer text-white/80"
          onClick={handleSearchSubmit}
        />
      </form>
    </div>
  );
};

export default HeroSearchBar;
