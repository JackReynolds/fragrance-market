import React from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import Hero from "@/components/ui/hero";
import LatestListings from "@/components/ui/latestListings";
import HowItWorks from "@/components/ui/howItWorks";
import Testimonials from "@/components/ui/testimonials";
import FAQ from "@/components/ui/faq";
import PremiumBenefits from "@/components/premiumBenefits";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <main>
        <Hero />
        <LatestListings />
        <HowItWorks />
        <PremiumBenefits />
        <Testimonials />
        <FAQ />
      </main>
    </div>
  );
};

export default Home;
