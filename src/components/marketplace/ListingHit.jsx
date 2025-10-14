/* eslint-disable react/prop-types */
"use client";

import React from "react";
import ListingCard from "@/components/listingCard";

/**
 * Wrapper component for Algolia search hits
 * Passes the hit data to the ListingCard component
 */
const ListingHit = ({ hit }) => {
  return <ListingCard hit={hit} />;
};

export default ListingHit;
