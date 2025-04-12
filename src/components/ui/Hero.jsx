import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { shimmer, toBase64 } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative w-full h-[600px] sm:h-[700px] flex items-center overflow-hidden">
      {/* Hero background image */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full bg-gradient-to-r from-black/60 to-transparent bg-primary/5">
          <Image
            src="/hero-background.jpg"
            alt="Luxury fragrance bottles"
            fill
            className="object-cover object-center mix-blend-overlay opacity-75"
            priority
          />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-white">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Discover, Swap, and Sell Fragrances
          </h1>
          <p className="mb-8 text-lg sm:text-xl text-white/90">
            Join our exclusive marketplace for fragrance enthusiasts. Find rare
            scents, connect with collectors, and trade with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="hover:cursor-pointer hover:bg-primary/60 py-6">
              Browse Fragrances
            </Button>
            <Button
              variant={"secondary"}
              className={"hover:cursor-pointer py-6"}
            >
              Join the Community
            </Button>
          </div>

          {/* Integrated search box */}
          <div className="relative mt-10 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by brand, name, or notes..."
              className="h-12 w-full rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-10 text-white placeholder:text-white/60 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
