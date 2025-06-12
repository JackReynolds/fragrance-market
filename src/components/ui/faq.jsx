import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
          {/* <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Frequently Asked Questions
          </p> */}
        </div>
        <Accordion
          type="single"
          collapsible
          className="w-full"
          defaultValue="item-1"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>How does the platform work?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Our platform makes buying, selling, and swapping fragrances
                simple and secure.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I list my fragrance?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                To list your fragrance, simply create an account, upload your
                fragrance details, and set your desired price. Our platform
                ensures a smooth and secure transaction process.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How do I buy a fragrance?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Buying a fragrance is straightforward. Browse our listings,
                select the fragrance you like, and complete the purchase
                process. Our secure payment system ensures a smooth and
                hassle-free transaction.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How do I sell my fragrance?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                To sell your fragrance, simply create an account, upload your
                fragrance details, and set your desired price. Our platform
                ensures a smooth and secure transaction process.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>How do I swap my fragrance?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Swapping a fragrance is straightforward. Browse our listings,
                select the fragrance you like, and complete the swap process.
                Our secure payment system ensures a smooth and hassle-free
                transaction.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>How do I buy a fragrance?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Buying a fragrance is straightforward. Browse our listings,
                select the fragrance you like, and complete the purchase
                process. Our secure payment system ensures a smooth and
                hassle-free transaction.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
