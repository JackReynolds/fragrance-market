"use client";

import React from "react";
import { useHits } from "react-instantsearch";
import CustomHit from "./customHit.jsx";
import { PropTypes } from "prop-types";
const ResultsGrid = ({ inputValue }) => {
  const { hits } = useHits();

  if (!inputValue.trim()) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      {hits.map((hit) => (
        <CustomHit key={hit.objectID} hit={hit} />
      ))}
    </div>
  );
};

ResultsGrid.propTypes = {
  inputValue: PropTypes.string.isRequired,
};

export default ResultsGrid;
