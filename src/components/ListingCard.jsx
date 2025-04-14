import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import PropTypes from "prop-types";
// Individual listing card component
const ListingCard = ({ listing, isFavorite, toggleFavorite }) => {
  const router = useRouter();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="relative aspect-[4/3]">
        <Image
          src={
            listing.imageURLs && listing.imageURLs.length > 0
              ? listing.imageURLs[0]
              : "/placeholder-image.jpg"
          }
          alt={listing.title}
          fill
          className="object-cover"
        />

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              listing.type === "sell"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {listing.type === "sell" ? "For Sale" : "For Swap"}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(listing.objectID);
          }}
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={18}
            className={
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            }
          />
        </button>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
        <div className="mt-1 text-sm text-muted-foreground">
          <p>{listing.brand}</p>
          <p>{listing.fragrance}</p>
        </div>

        {listing.ownerUsername && (
          <p className="mt-1 text-xs text-muted-foreground">
            Listed by: {listing.ownerUsername}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          {listing.type === "sell" ? (
            <span className="font-medium">
              €{listing.price?.toFixed(2) || "0.00"}
            </span>
          ) : (
            <span className="font-medium text-blue-600">Swap</span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/listings/${listing.objectID}`)}
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Add PropTypes validation
ListingCard.propTypes = {
  listing: PropTypes.object.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  toggleFavorite: PropTypes.func.isRequired,
};

export default ListingCard;
