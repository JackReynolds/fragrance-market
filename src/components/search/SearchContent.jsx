"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CustomSearchBox from "@/components/search/CustomSearchBox.jsx";
import ResultsGrid from "@/components/search/ResultsGrid.jsx";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(queryFromURL);

  // Update search state as URL changes
  useEffect(() => {
    setInputValue(queryFromURL);
  }, [queryFromURL]);

  return (
    <div className="container mx-auto p-4">
      <div className="relative">
        <CustomSearchBox
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
      </div>
      <ResultsGrid inputValue={inputValue} />
    </div>
  );
}
