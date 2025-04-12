import Image from "next/image";
import Link from "next/link";

// Sample featured items data (in a real app, this would come from a database/API)
const FEATURED_ITEMS = [
  {
    id: 1,
    name: "Tom Ford Oud Wood",
    price: 249.99,
    type: "Sale",
    image: "/fragrances/tom-ford-oud-wood.jpg",
    brand: "Tom Ford",
  },
  {
    id: 2,
    name: "Creed Aventus",
    price: 329.99,
    type: "Sale",
    image: "/fragrances/creed-aventus.jpg",
    brand: "Creed",
  },
  {
    id: 3,
    name: "Maison Francis Kurkdjian Baccarat Rouge 540",
    price: 299.99,
    type: "Swap",
    image: "/fragrances/baccarat-rouge-540.jpg",
    brand: "Maison Francis Kurkdjian",
  },
  {
    id: 4,
    name: "Dior Sauvage",
    price: 159.99,
    type: "Sale",
    image: "/fragrances/dior-sauvage.jpg",
    brand: "Dior",
  },
];

export function FeaturedItems() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between mb-10 md:flex-row">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Featured Fragrances
            </h2>
            <p className="mt-2 text-muted-foreground">
              Explore our curated selection of exclusive fragrances
            </p>
          </div>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline md:mt-0"
          >
            View all fragrances
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {FEATURED_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={`/marketplace/${item.id}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md"
            >
              <div className="aspect-[3/4] w-full relative bg-primary/5">
                <div className="absolute top-2 right-2 z-10">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.type === "Sale"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">{item.brand}</p>
                <h3 className="mt-1 font-medium line-clamp-1">{item.name}</h3>
                <p className="mt-2 font-semibold">${item.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
