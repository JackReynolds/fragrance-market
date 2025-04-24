"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { algoliasearch } from "algoliasearch";
import { InstantSearch } from "react-instantsearch";
import { Navigation } from "@/components/ui/Navigation.jsx";
import { Footer } from "@/components/ui/Footer.jsx";
import ResultsGrid from "@/components/search/ResultsGrid.jsx";
import CustomSearchBox from "@/components/search/CustomSearchBox.jsx";

// const client = algoliasearch(
//   process.env.ALGOLIA_SEARCH_APP_ID,
//   process.env.ALGOLIA_SEARCH_API_KEY
// );

const client = algoliasearch("75NLWY8V1I", "f67465d105e699ee778e9cf026c8ad22");

const SearchResults = () => {
  const searchParams = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(queryFromURL);

  // Optionally, you can update the search state as the URL changes.
  useEffect(() => {
    setInputValue(queryFromURL);
  }, [queryFromURL]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        <Navigation />
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
        <Footer />
      </div>
    </Suspense>
  );
};

export default SearchResults;
