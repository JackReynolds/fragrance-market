"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { algoliasearch } from "algoliasearch";
import {
  InstantSearch,
  Configure,
  Hits,
  RefinementList,
  SortBy,
  Pagination,
  Stats,
} from "react-instantsearch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X } from "lucide-react";
import DebouncedSearchBox from "@/components/marketplace/debouncedSearchBox";
import ListingCard from "@/components/listingCard";

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
);

const MarketplaceContent = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const searchParams = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";

  return (
    <div className="flex-1 w-full">
      <InstantSearch
        searchClient={client}
        indexName="fragrances"
        initialUiState={{
          fragrances: {
            query: queryFromURL,
          },
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
        <div
          style={{
            background:
              "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
          }}
          className="py-6 md:py-12"
        >
          <div className="mx-auto px-3 sm:px-4">
            <h1 className=" text-xl sm:text-3xl md:text-4xl text-gray-100 font-bold text-center mb-4 sm:mb-6">
              Discover Fragrances
            </h1>
            <div className="max-w-2xl mx-auto">
              <DebouncedSearchBox
                placeholder="Search by name or brand..."
                debounceTime={500}
                defaultValue={queryFromURL}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Mobile filter button */}
          <div className="flex justify-between items-center mb-4 sm:mb-6 md:hidden">
            <Stats
              classNames={{
                root: "text-xs sm:text-sm text-muted-foreground",
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

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Filters sidebar */}
            <aside
              className={`
              ${
                showFilters
                  ? "fixed inset-0 z-50 bg-background p-4 sm:p-6"
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

              <div className="space-y-4 sm:space-y-6">
                {/* Listing Type Filter */}
                <div>
                  <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Listing Type
                  </h3>
                  <Tabs
                    value={listingTypeFilter}
                    onValueChange={(val) => setListingTypeFilter(val)}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger
                        value="all"
                        className="flex-1 text-xs sm:text-sm hover:cursor-pointer"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger
                        value="sell"
                        className="flex-1 text-xs sm:text-sm hover:cursor-pointer"
                      >
                        For Sale
                      </TabsTrigger>
                      <TabsTrigger
                        value="swap"
                        className="flex-1 text-xs sm:text-sm hover:cursor-pointer"
                      >
                        For Swap
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Separator />

                {/* Brand Filter */}
                <div>
                  <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Brands
                  </h3>
                  <RefinementList
                    attribute="brand"
                    limit={5}
                    showMore={true}
                    searchable={true}
                    classNames={{
                      item: "flex items-center align-center space-x-2 mb-2",
                      checkbox:
                        "mr-2 rounded border-gray-300 text-primary focus:ring-primary",
                      label: "text-xs sm:text-sm cursor-pointer",
                      count:
                        "ml-2 text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full",
                    }}
                  />
                </div>

                <Separator />

                {/* Country Filter */}
                <div>
                  <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Country
                  </h3>
                  <RefinementList
                    attribute="country"
                    limit={5}
                    showMore={true}
                    searchable={true}
                    classNames={{
                      item: "flex items-center align-center space-x-2 mb-2",
                      checkbox:
                        "mr-2 rounded border-gray-300 text-primary focus:ring-primary",
                      label: "text-xs sm:text-sm cursor-pointer",
                      count:
                        "ml-2 text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full",
                    }}
                  />
                </div>

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
            <div className="flex-1 min-w-0">
              {/* Sort and stats */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
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

              {/* Results grid - Optimized for mobile 2-column */}
              <div className="w-full">
                <Hits
                  hitComponent={ListingCard}
                  classNames={{
                    root: "w-full",
                    list: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4",
                    item: "max-w-72", // Removed min-width constraint
                  }}
                />
              </div>

              {/* Pagination */}
              <div className="mt-8 sm:mt-12 flex justify-center">
                <Pagination
                  classNames={{
                    root: "",
                    list: "flex space-x-1",
                    item: "inline-flex items-center justify-center rounded min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 bg-transparent text-xs sm:text-sm",
                    selectedItem:
                      "bg-primary text-primary-foreground font-medium",
                    disabledItem: "text-muted-foreground opacity-50",
                    link: "flex h-full w-full items-center justify-center rounded px-1 sm:px-2",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </InstantSearch>
    </div>
  );
};

const Marketplace = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center">
      {/* <Navigation /> */}
      <Suspense fallback={<div>Loading...</div>}>
        <MarketplaceContent />
      </Suspense>
      {/* <Footer /> */}
    </div>
  );
};

export default Marketplace;
