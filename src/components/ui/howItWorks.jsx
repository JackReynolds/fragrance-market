"use client";

import { ShieldCheck, PackageOpen, Repeat } from "lucide-react";
import * as React from "react";

const steps = [
  {
    icon: ShieldCheck,
    title: "Join & Verify",
    description:
      "Sign up and get verified for a secure experience. Our verification process ensures trust among all members.",
  },
  {
    icon: PackageOpen,
    title: "List & Explore",
    description:
      "Easily list your fragrances or browse curated listings from collectors worldwide.",
  },
  {
    icon: Repeat,
    title: "Trade & Enjoy",
    description:
      "Swap or sell with ease, backed by our secure platform with buyer and seller protection.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform makes buying, selling, and swapping fragrances simple
            and secure.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-medium">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="/how-it-works"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
