"use client";

import React, { Suspense } from "react";
import { Navigation } from "@/components/ui/Navigation.jsx";
import { Footer } from "@/components/ui/Footer.jsx";
import { algoliasearch } from "algoliasearch";

const client = algoliasearch("75NLWY8V1I", "f67465d105e699ee778e9cf026c8ad22");

// Create a separate component for the search functionality
function SearchContent() {
  // Move these imports and hooks inside the component that's wrapped by Suspense
  const { useSearchParams } = require("next/navigation");
  const { useState, useEffect } = React;
  const {
    default: ResultsGrid,
  } = require("@/components/search/ResultsGrid.jsx");
  const {
    default: CustomSearchBox,
  } = require("@/components/search/CustomSearchBox.jsx");
  const { InstantSearch } = require("react-instantsearch");

  const searchParams = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(queryFromURL);

  // Optionally, you can update the search state as the URL changes.
  useEffect(() => {
    setInputValue(queryFromURL);
  }, [queryFromURL]);

  return (
    <div className="container mx-auto p-4">
      <InstantSearch searchClient={client} indexName="fragrances">
        <div className="relative">
          <CustomSearchBox
            inputValue={inputValue}
            setInputValue={setInputValue}
          />
        </div>
        <ResultsGrid inputValue={inputValue} />
      </InstantSearch>
    </div>
  );
}

const SearchResults = () => {
  return (
    <div>
      <Navigation />
      <Suspense
        fallback={
          <div className="container mx-auto p-4 min-h-[400px] flex items-center justify-center">
            Loading search results...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
};

export default SearchResults;
