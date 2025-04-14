import React from "react";
import Link from "next/link";
import { Highlight } from "react-instantsearch";
import { ShieldCheck, Star, UserCircle } from "lucide-react"; // Example icons from lucide-react

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};
const CustomHit = ({ hit }) => {
  return (
    <Link href={`/listings/${hit.objectID}`} className="block">
      <div className="border rounded-md overflow-hidden hover:shadow-md">
        <img
          src={hit.imageURLs[0]}
          alt={hit.title}
          className="w-full h-72 object-fit"
        />
        <div className="p-2">
          <div className="mb-3">
            <Highlight attribute="title" hit={hit} />
          </div>
          <div className="flex justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-800">
                <Highlight attribute="fragrance" hit={hit} />
              </h2>
              <p className="text-sm text-gray-600">
                <Highlight attribute="brand" hit={hit} />
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">
                {hit.type === "sell" ? "For Sale" : "For Swap"}
              </p>
              {hit.type === "sell" && (
                <p className="text-sm text-gray-600">
                  {formatCurrency(hit.price)}
                </p>
              )}
            </div>
          </div>
          {/* Owner details */}
          <div className="flex items-center mt-2 space-x-2">
            {/* Optionally display owner's profile picture if available */}
            {hit.ownerProfilePicture && (
              <img
                src={hit.ownerProfilePicture}
                alt={hit.ownerUsername}
                className="w-6 h-6 rounded-full"
              />
            )}
            {/* Fallback icon if no profile picture is provided */}
            {!hit.ownerProfilePicture && (
              <UserCircle className="w-6 h-6 text-gray-400" />
            )}
            <span className="text-sm text-gray-700">{hit.ownerUsername}</span>
            {hit.ownerIsIdVerified && (
              <ShieldCheck
                className="w-5 h-5 text-green-700"
                title="ID Verified"
              />
            )}
            {hit.ownerIsPremium && (
              <Star className="w-5 h-5 text-yellow-500" title="Premium User" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CustomHit;
