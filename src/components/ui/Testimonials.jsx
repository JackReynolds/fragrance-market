"use client";
import React from "react";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "I found rare fragrances I couldn't find anywhere else. The verification process makes me feel safe when trading.",
    author: "Emily K.",
    role: "Collector",
    avatar: "/avatars/avatar-1.jpg",
  },
  {
    quote:
      "The platform made selling my unused fragrances so easy. I've connected with buyers who truly appreciate my collection.",
    author: "Michael T.",
    role: "Seller",
    avatar: "/avatars/avatar-2.jpg",
  },
  {
    quote:
      "As a fragrance enthusiast, this marketplace has transformed how I discover new scents. The community is wonderful!",
    author: "Sophia L.",
    role: "Enthusiast",
    avatar: "/avatars/avatar-3.jpg",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            What Our Community Says
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of fragrance enthusiasts who have found their perfect
            scents.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col p-6 rounded-lg border border-border bg-card"
            >
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary/60"
                >
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                </svg>
              </div>
              <p className="mb-4 flex-grow">{testimonial.quote}</p>
              <div className="flex items-center">
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 bg-primary/10">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
