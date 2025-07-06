/* eslint-disable react/prop-types */
import React from "react";
import { ShoppingBag, Repeat } from "lucide-react";

const ListingTypeBadge = ({ type }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm ${
        type === "sell"
          ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black"
          : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
      }`}
    >
      {type === "sell" ? (
        <ShoppingBag className="mr-1 h-3 w-3" />
      ) : (
        <Repeat className="mr-1 h-3 w-3" />
      )}
      {type === "sell" ? "Sale" : "Swap"}
    </span>
  );
};

export default ListingTypeBadge;
