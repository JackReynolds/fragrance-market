import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <section className="py-6 md:py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-xl md:text-3xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Everything you need to know about buying, selling, and swapping
            fragrances on our platform
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4"
          defaultValue="item-1"
        >
          <AccordionItem
            value="item-1"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              How does the fragrance swapping work?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Swapping fragrances is simple and secure on our platform:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Browse available fragrances and find one you&apos;d like
                </li>
                <li>
                  Send a swap request offering one of your listed fragrances
                </li>
                <li>The other user can accept or decline your offer</li>
                <li>Once accepted, both parties ship their fragrances</li>
                <li>Confirm receipt to complete the swap</li>
              </ol>
              <p className="mt-3">
                Our messaging system keeps you connected throughout the process
                to ensure smooth communication.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-2"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              How many swaps do I get as a standard user?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Standard users receive{" "}
                <strong className="text-foreground">
                  3 free swaps per month
                </strong>
                . This gives you plenty of opportunity to discover new
                fragrances and expand your collection.
              </p>
              <p>
                If you need more swaps, consider upgrading to our Premium
                membership for unlimited swapping and additional benefits.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-3"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              What are the benefits of becoming a Premium user?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Premium membership unlocks exclusive benefits:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Unlimited swaps</strong> -
                  No monthly limits
                </li>
                <li>
                  <strong className="text-foreground">Priority listings</strong>{" "}
                  - Your fragrances appear higher in search results
                </li>
                <li>
                  <strong className="text-foreground">
                    Advanced search filters
                  </strong>{" "}
                  - Find exactly what you&apos;re looking for
                </li>
                <li>
                  <strong className="text-foreground">Premium badge</strong> -
                  Stand out as a trusted member
                </li>
                <li>
                  <strong className="text-foreground">Early access</strong> - Be
                  first to see new listings
                </li>
                <li>
                  <strong className="text-foreground">
                    Lower selling fees
                  </strong>{" "}
                  - Keep more of your profits
                </li>
              </ul>
              <p className="mt-3">
                Premium members also receive priority customer support and
                exclusive access to special events.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-4"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              How can I trust this platform and other users?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Your safety and trust are our top priorities:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">ID Verification</strong> -
                  All users can verify their identity through our secure system
                </li>
                <li>
                  <strong className="text-foreground">User Reviews</strong> -
                  Build and check reputation through our rating system
                </li>
                <li>
                  <strong className="text-foreground">Secure Payments</strong> -
                  All transactions processed through encrypted Stripe
                  integration
                </li>
                <li>
                  <strong className="text-foreground">
                    Dispute Resolution
                  </strong>{" "}
                  - Our support team helps resolve any issues
                </li>
                <li>
                  <strong className="text-foreground">Verified Listings</strong>{" "}
                  - We monitor for authentic products and remove suspicious
                  content
                </li>
                <li>
                  <strong className="text-foreground">Safe Messaging</strong> -
                  Built-in chat system with content moderation
                </li>
              </ul>
              <p className="mt-3">
                Look for the verification badges next to usernames to identify
                trusted members of our community.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-5"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              How do I verify my ID and why should I?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                We use <strong className="text-foreground">Veriff</strong>, a
                leading identity verification service, to ensure platform
                security:
              </p>
              <div className="mb-4">
                <p className="font-medium text-foreground mb-2">
                  How to verify:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to your profile settings</li>
                  <li>Click &quot;Verify Identity&quot;</li>
                  <li>Follow the secure Veriff process (takes 2-3 minutes)</li>
                  <li>Upload a government-issued ID</li>
                  <li>Take a quick selfie for comparison</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">
                  Benefits of verification:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Gain trust from other users</li>
                  <li>Access to higher-value transactions</li>
                  <li>Priority in swap requests</li>
                  <li>Enhanced account security</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-6"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              How do I list my fragrance for sale or swap?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">Creating a listing is quick and easy:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Click &quot;New Listing&quot; from your dashboard</li>
                <li>Upload clear photos of your fragrance</li>
                <li>Enter details: brand, name, size, and condition</li>
                <li>Set your listing type (sale, swap, or both)</li>
                <li>Add your price or swap preferences</li>
                <li>Write a compelling description</li>
                <li>Publish and start receiving offers!</li>
              </ol>
              <p className="mt-3">
                <strong className="text-foreground">Pro tip:</strong>{" "}
                High-quality photos and detailed descriptions get more interest
                from potential buyers and swappers.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-7"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                We use <strong className="text-foreground">Stripe</strong> for
                secure payment processing, which supports:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  All major credit and debit cards (Visa, Mastercard, American
                  Express)
                </li>
                <li>Apple Pay and Google Pay</li>
                <li>Bank transfers (varies by country)</li>
                <li>Buy now, pay later services (where available)</li>
              </ul>
              <p className="mt-3">
                All payments are processed securely with industry-standard
                encryption. We never store your payment information on our
                servers.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-8"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              What happens if I receive a damaged or counterfeit fragrance?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                We take product authenticity and quality seriously:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">
                    Report immediately
                  </strong>{" "}
                  - Contact our support team within 48 hours of delivery
                </li>
                <li>
                  <strong className="text-foreground">Photo evidence</strong> -
                  Provide clear photos of any damage or authenticity concerns
                </li>
                <li>
                  <strong className="text-foreground">Investigation</strong> -
                  We&apos;ll review the case and may involve the seller
                </li>
                <li>
                  <strong className="text-foreground">Resolution</strong> -
                  Options include full refund, replacement, or partial refund
                </li>
              </ul>
              <p className="mt-3">
                For swaps, we&apos;ll work with both parties to ensure a fair
                resolution. Sellers with repeated authenticity issues may be
                removed from the platform.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-9"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              How do shipping and delivery work?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Shipping is handled between users with our guidance:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">
                    Seller responsibility
                  </strong>{" "}
                  - The seller arranges and pays for shipping (unless agreed
                  otherwise)
                </li>
                <li>
                  <strong className="text-foreground">Tracking required</strong>{" "}
                  - Always use tracked shipping services for protection
                </li>
                <li>
                  <strong className="text-foreground">
                    Insurance recommended
                  </strong>{" "}
                  - Consider insuring valuable fragrances
                </li>
                <li>
                  <strong className="text-foreground">Secure packaging</strong>{" "}
                  - We provide guidelines for safe fragrance shipping
                </li>
                <li>
                  <strong className="text-foreground">
                    Delivery confirmation
                  </strong>{" "}
                  - Buyers confirm receipt through our platform
                </li>
              </ul>
              <p className="mt-3">
                International shipping is supported, but check local customs
                regulations for fragrance imports/exports.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-10"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              Can I cancel a transaction after it&apos;s been accepted?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Cancellation policies depend on the transaction stage:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Before acceptance</strong>{" "}
                  - You can withdraw offers anytime
                </li>
                <li>
                  <strong className="text-foreground">
                    After acceptance, before shipping
                  </strong>{" "}
                  - Mutual agreement required for cancellation
                </li>
                <li>
                  <strong className="text-foreground">After shipping</strong> -
                  Cancellation becomes more complex; contact support
                </li>
                <li>
                  <strong className="text-foreground">
                    Emergency situations
                  </strong>{" "}
                  - We handle case-by-case with our support team
                </li>
              </ul>
              <p className="mt-3">
                <strong className="text-foreground">Note:</strong> Frequent
                cancellations may impact your reputation score. We encourage
                clear communication before confirming transactions.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions? We&apos;re here to help!
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
