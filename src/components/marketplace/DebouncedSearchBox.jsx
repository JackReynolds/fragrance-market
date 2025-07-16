/* eslint-disable react/prop-types */

"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchBox } from "react-instantsearch";
import { Search, X } from "lucide-react";

// Custom debounced search box component
const DebouncedSearchBox = ({
  placeholder,
  debounceTime = 500,
  defaultValue = "",
}) => {
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);
  const timerRef = useRef(null);

  // Update the input value when the query changes
  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
      refine(defaultValue);
    }
  }, [defaultValue, refine]);

  // Handle input changes with debounce
  const onChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear the existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set a new timer
    timerRef.current = setTimeout(() => {
      refine(value);
    }, debounceTime);
  };

  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Handle reset
  const onReset = () => {
    setInputValue("");
    refine("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={onChange}
          placeholder={placeholder}
          className="text-sm md:text-base w-full py-3 pl-10 pr-10 bg-white border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        {inputValue && (
          <button
            onClick={onReset}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DebouncedSearchBox;
