"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { algoliasearch } from "algoliasearch";
import { Navigation } from "@/components/ui/Navigation";
import { Footer } from "@/components/ui/Footer";
import { debounce } from "@/utils/debounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ListingCard from "@/components/ListingCard";

// Initialize Algolia client
const client = algoliasearch("75NLWY8V1I", "f67465d105e699ee778e9cf026c8ad22");

const SearchResults = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser } = useAuth();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useCallback(
    debounce(
      (q, pageNum, lat, lng, radiusMeters) => {
        performSearch(q, pageNum, lat, lng, radiusMeters);
      },
      500 // 500ms delay
    ),
    []
  );

  // 3) Whenever relevant state changes, call debouncedSearch
  useEffect(() => {
    debouncedSearch(query, page);
  }, [query, page, debouncedSearch]);

  const performSearch = async (q, pageNum) => {
    setIsLoading(true);

    try {
      const searchParams = {
        page: pageNum,
        hitsPerPage: 16,
        filters: "isActive:true",
      };

      // Search for "test"
      const { results } = await client.search({
        requests: [
          {
            indexName: "fragrances",
            query: q,
          },
        ],
      });

      console.log(results);

      // const searchClient = client.initSearch();
      //   const response = await client.searchSingleIndex({
      //     indexName: "fragrances",
      //     query: q,
      //   });

      //const results = await client.searchSingleIndex(q, searchParams);
      // const { hits, nbPages } = await client.search(q || "", searchParams);
      //   const hitsWithAddedId = hits.map((hit) => ({
      //     ...hit,
      //     id: hit.objectID,
      //   }));
      //   if (pageNum === 0) {
      //     setSearchResults(hitsWithAddedId);
      //   } else {
      //     setSearchResults((prev) => [...prev, ...hitsWithAddedId]);
      //   }
      // setTotalPages(nbPages);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Something went wrong with the search");
    } finally {
      setIsLoading(false);
    }
  };

  // "Show More" for pagination
  const handleShowMore = () => {
    if (page < totalPages - 1) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <div className="flex flex-col">
      <Navigation />
      {/* Search Bar */}
      <div className="flex gap-3 justify-center items-center w-2/3 mx-auto my-3">
        <form
          onSubmit={() => performSearch(searchTerm, page)}
          className="w-full"
        >
          <Input
            className="text-sm flex-grow"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            placeholder="Search listings..."
          />
        </form>

        {/* Search Icon */}
        <Search
          className="w-4 h-4 hover:cursor-pointer"
          onClick={() => performSearch(searchTerm, page)}
        />
      </div>
      {/* Search Results */}
      <div className="flex flex-col items-center justify-center">
        {searchResults.map((result) => (
          <ListingCard key={result.id} listing={result} />
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default SearchResults;
