"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/ui/navigation.jsx";
import { Footer } from "@/components/ui/footer.jsx";
import { algoliasearch } from "algoliasearch";
import { useSearchParams } from "next/navigation";
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  SortBy,
  Pagination,
  Stats,
  Configure,
  useSearchBox,
} from "react-instantsearch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Slider } from "@/components/ui/slider.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import Image from "next/image";
import Link from "next/link";
import {
  Filter,
  Search,
  ShoppingBag,
  Repeat,
  SlidersHorizontal,
  X,
  Heart,
} from "lucide-react";
import ListingHit from "@/components/marketplace/ListingHit";
import ListingCard from "@/components/ListingCard";
import DebouncedSearchBox from "@/components/marketplace/DebouncedSearchBox";
import { useAuth } from "@/hooks/useAuth";

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
);

// Wrapper component to pass authUser to ListingHit to check if user is logged in
const HitWrapper = ({ hit }) => {
  const { authUser } = useAuth();

  // Pass both hit and authUser to ListingHit
  return <ListingHit hit={hit} authUser={authUser} />;
};

const Marketplace = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";

  useEffect(() => {
    if (queryFromURL) {
      setSearchTerm(queryFromURL);
    }
  }, [queryFromURL]);

  // Create a simple routing state manager
  const simpleStateMapping = {
    stateToRoute(uiState) {
      const indexUiState = uiState.fragrances || {};
      return {
        q: indexUiState.query || "",
      };
    },
    routeToState(routeState) {
      return {
        fragrances: {
          query: routeState.q || "",
        },
      };
    },
  };

  return (
    <div className="min-h-screen flex flex-col justify-center">
      <Navigation />

      <div className="flex-1 w-full">
        <InstantSearch
          searchClient={client}
          indexName="fragrances"
          initialUiState={{
            fragrances: {
              query: queryFromURL,
            },
          }}
          routing={{
            stateMapping: simpleStateMapping,
          }}
        >
          <Configure
            hitsPerPage={12}
            filters={
              listingTypeFilter === "all"
                ? undefined
                : `type:"${listingTypeFilter}"`
            }
          />

          {/* Hero section with search */}
          <div className="bg-muted py-8 md:py-12">
            <div className=" mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
                Discover Fragrances
              </h1>
              <div className="max-w-2xl mx-auto">
                {/* Replace SearchBox with our debounced version */}
                <DebouncedSearchBox
                  placeholder="Search by name or brand..."
                  debounceTime={500}
                  defaultValue={queryFromURL}
                />
              </div>
            </div>
          </div>

          <div className=" mx-auto px-4 py-8">
            {/* Mobile filter button */}
            <div className="flex justify-between items-center mb-6 md:hidden">
              <Stats
                classNames={{
                  root: "text-sm text-muted-foreground",
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Filters sidebar */}
              <aside
                className={`
                ${
                  showFilters
                    ? "fixed inset-0 z-50 bg-background p-6"
                    : "hidden"
                } 
                md:block md:relative md:w-64 md:flex-shrink-0
              `}
              >
                {showFilters && (
                  <div className="flex justify-between items-center mb-4 md:hidden">
                    <h2 className="font-semibold">Filters</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Listing Type Filter */}
                  <div>
                    <h3 className="font-medium mb-3">Listing Type</h3>
                    <Tabs
                      value={listingTypeFilter}
                      onValueChange={(val) => setListingTypeFilter(val)}
                    >
                      <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="sell" className="flex-1">
                          For Sale
                        </TabsTrigger>
                        <TabsTrigger value="swap" className="flex-1">
                          For Swap
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <Separator />

                  {/* Brand Filter */}
                  <div>
                    <h3 className="font-medium mb-3">Brands</h3>
                    <RefinementList
                      attribute="brand"
                      limit={5}
                      showMore={true}
                      classNames={{
                        item: "flex items-center align-center space-x-2 mb-2",
                        checkbox:
                          "mr-2 rounded border-gray-300 text-primary focus:ring-primary",
                        label: "text-sm cursor-pointer",
                        count:
                          "ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full",
                      }}
                    />
                  </div>

                  <Separator />

                  {/* Country Filter */}
                  <div>
                    <h3 className="font-medium mb-3">Country</h3>
                    <RefinementList
                      attribute="country"
                      limit={5}
                      showMore={true}
                      classNames={{
                        item: "flex items-center align-center space-x-2 mb-2",
                        checkbox:
                          "mr-2 rounded border-gray-300 text-primary focus:ring-primary",
                        label: "text-sm cursor-pointer",
                        count:
                          "ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full",
                      }}
                    />
                  </div>

                  <Separator />

                  {showFilters && (
                    <div className="pt-4 md:hidden">
                      <Button
                        className="w-full"
                        onClick={() => setShowFilters(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main content */}
              <div className="flex-1">
                {/* Sort and stats */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div className="hidden md:block">
                    <Stats
                      classNames={{
                        root: "text-sm text-muted-foreground",
                      }}
                    />
                  </div>

                  <SortBy
                    items={[
                      { label: "Newest first", value: "fragrances" },
                      {
                        label: "Price: Low to high",
                        value: "fragrances_price_asc",
                      },
                      {
                        label: "Price: High to low",
                        value: "fragrances_price_desc",
                      },
                    ]}
                    classNames={{
                      root: "w-full sm:w-auto",
                    }}
                  />
                </div>

                {/* Results grid */}
                <div className="flex justify-center">
                  <Hits
                    hitComponent={HitWrapper}
                    classNames={{
                      root: "",
                      list: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
                    }}
                  />
                </div>

                {/* Pagination */}
                <div className="mt-12 flex justify-center">
                  <Pagination
                    classNames={{
                      root: "",
                      list: "flex space-x-1",
                      item: "inline-flex items-center justify-center rounded min-w-[32px] h-8 bg-transparent",
                      selectedItem:
                        "bg-primary text-primary-foreground font-medium",
                      disabledItem: "text-muted-foreground opacity-50",
                      link: "flex h-full w-full items-center justify-center rounded px-2",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </InstantSearch>
      </div>

      <Footer />
    </div>
  );
};

export default Marketplace;
