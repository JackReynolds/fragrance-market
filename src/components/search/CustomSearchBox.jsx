"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useSearchBox } from "react-instantsearch";
import { debounce } from "@/utils/debounce";
import { Input } from "@/components/ui/input";

const CustomSearchBox = ({ inputValue, setInputValue }) => {
  const { refine } = useSearchBox();
  const isFirstRender = useRef(true);

  // Run refine only on the first render to apply the URL query immediately.
  useEffect(() => {
    if (isFirstRender.current) {
      refine(inputValue);
      isFirstRender.current = false;
    }
    // Don't include refine(inputValue) here for subsequent updates.
  }, [inputValue, refine]);

  // Create a debounced version of refine with a 2000ms delay.
  const debouncedRefine = useCallback(
    debounce((value) => {
      refine(value);
    }, 300),
    [refine]
  );

  const onChange = (e) => {
    const value = e.currentTarget.value;
    setInputValue(value);
    // Only call the debounced function here so that refine is delayed.
    debouncedRefine(value);
  };

  return (
    <Input
      type="text"
      placeholder="Search fragrances..."
      value={inputValue}
      onChange={onChange}
      className="w-full border border-gray-300 rounded-md py-2 px-4"
    />
  );
};

export default CustomSearchBox;
