import React from "react";
import { Navigation } from "@/components/ui/Navigation";
import { Hero } from "@/components/ui/Hero";
import { FeaturedItems } from "@/components/ui/FeaturedItems";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { Testimonials } from "@/components/ui/Testimonials";
import { Footer } from "@/components/ui/Footer";

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
