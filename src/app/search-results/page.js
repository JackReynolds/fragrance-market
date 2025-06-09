"use client";

import React from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { algoliasearch } from "algoliasearch";
import { InstantSearch } from "react-instantsearch";
import dynamic from "next/dynamic";

// Dynamically import the components that use search params
const SearchContentWithParams = dynamic(
  () => import("@/components/search/searchContent"),
  {
    loading: () => (
      <div className="container mx-auto p-4 min-h-[400px] flex items-center justify-center">
        Loading search results...
      </div>
    ),
    ssr: false,
  }
);

const client = algoliasearch(
  process.env.ALGOLIA_SEARCH_APP_ID,
  process.env.ALGOLIA_SEARCH_API_KEY
);

const SearchResults = () => {
  return (
    <div>
      {/* <Navigation /> */}
      <InstantSearch searchClient={client} indexName="fragrances">
        <SearchContentWithParams />
      </InstantSearch>
      {/* <Footer /> */}
    </div>
  );
};

export default SearchResults;
