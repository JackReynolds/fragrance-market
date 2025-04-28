import React from "react";
import { Navigation } from "@/components/ui/navigation";
import { Hero } from "@/components/ui/hero";
import { FeaturedItems } from "@/components/ui/featuredItems";
import { HowItWorks } from "@/components/ui/howItWorks";
import { Testimonials } from "@/components/ui/testimonials";
import { Footer } from "@/components/ui/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main>
        <Hero />
        <FeaturedItems />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
