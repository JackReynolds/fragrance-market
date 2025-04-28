import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  ShoppingBag,
  Repeat,
  Star,
  CheckCircle,
  Shield,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import getCountryFlagEmoji from "@/utils/getCountryFlagEmoji";

// Hit component to display each listing
const ListingHit = ({ hit, authUser }) => {
  return (
    <Link href={`/listings/${hit.objectID}`}>
      <Card className="h-full max-w-82 hover:shadow-md transition-shadow duration-200">
        <div className="relative w-full h-86">
          <Image
            src={hit.imageURLs[0] || "/fragrance-placeholder.jpg"}
            alt={hit.title}
            fill
            className="object-fit rounded-t-lg"
          />
          {/* {authUser && authUser.uid !== hit.ownerUid && (
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log("clicked");
                }}
                className="h-8 w-8 rounded-full bg-white/80 hover:bg-white hover:cursor-pointer"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          )} */}
          {hit.type && (
            <div className="absolute top-2 left-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  hit.type === "sell"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {hit.type === "sell" ? (
                  <ShoppingBag className="mr-1 h-3 w-3" />
                ) : (
                  <Repeat className="mr-1 h-3 w-3" />
                )}
                {hit.type === "sell" ? "For Sale" : "For Swap"}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                {hit.brand}
              </p>
              <p className="text-sm text-muted-foreground">
                {hit.amountLeft}% full
              </p>
            </div>
            <h3 className="font-semibold truncate">{hit.title}</h3>
            {hit.price && hit.type === "sell" && (
              <p className="text-lg font-bold mt-1">€{hit.price.toFixed(2)}</p>
            )}

            <div className="flex mt-2 gap-2">
              <p className="text-sm text-muted-foreground">
                {hit.ownerUsername}
              </p>
              <p>
                {hit.ownerIsPremium ? (
                  <Star className="w-5 h-5 text-yellow-500" />
                ) : null}
              </p>
              <p>
                {hit.ownerIsIdVerified ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : null}
              </p>
            </div>
            <div className="mt-2 flex items-center text-sm ">
              <span>
                {getCountryFlagEmoji(hit.countryCode) + " " + hit.country ||
                  "Location not specified"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingHit;
