import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <section className="py-6 md:py-10 bg-gradient-to-b from-background to-muted/20">
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
              What can I do as a standard (free) user?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Standard users get access to essential features to start their
                fragrance journey:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">
                    Up to 3 active listings
                  </strong>{" "}
                  - List your fragrances for swapping
                </li>
                <li>
                  <strong className="text-foreground">1 swap per month</strong>{" "}
                  - Trade with other community members
                </li>
                <li>
                  <strong className="text-foreground">
                    Browse &amp; message
                  </strong>{" "}
                  - Explore listings and communicate with sellers
                </li>
              </ul>
              <p className="mt-3">
                Want to sell fragrances, get unlimited swaps, and unlock premium
                features? Consider upgrading to Premium membership.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-3"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              What are the benefits of becoming a Premium member?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                Premium membership unlocks the full potential of The Fragrance
                Market:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">
                    Unlimited listings
                  </strong>{" "}
                  - Create as many listings as you want (standard: 3 max)
                </li>
                <li>
                  <strong className="text-foreground">Unlimited swaps</strong> -
                  Trade freely with no monthly limits (standard: 1/month)
                </li>
                <li>
                  <strong className="text-foreground">Sell fragrances</strong> -
                  Monetize your collection with secure Stripe payments (5% fee)
                </li>
                <li>
                  <strong className="text-foreground">
                    Priority search ranking
                  </strong>{" "}
                  - Your listings appear higher in search results
                </li>
                <li>
                  <strong className="text-foreground">Premium badge</strong> -
                  Stand out with a verified badge on your profile and listings
                </li>
                <li>
                  <strong className="text-foreground">ID verification</strong> -
                  Access to verify your identity through Veriff for added trust
                </li>
                <li>
                  <strong className="text-foreground">Exclusive Discord</strong>{" "}
                  - Join our premium community for insider tips and deals
                </li>
                <li>
                  <strong className="text-foreground">Priority support</strong>{" "}
                  - Get faster responses from our dedicated support team
                </li>
                <li>
                  <strong className="text-foreground">Early access</strong> - Be
                  first to try new features and exclusive beta releases
                </li>
              </ul>
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
                Trust and safety are built into every aspect of The Fragrance
                Market:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">
                    ID Verification (Premium)
                  </strong>{" "}
                  - Premium members can verify their identity through Veriff, a
                  global leader in identity verification
                </li>
                <li>
                  <strong className="text-foreground">
                    Swap &amp; Transaction History
                  </strong>{" "}
                  - View each user&apos;s completed swap count to gauge their
                  experience
                </li>
                <li>
                  <strong className="text-foreground">Secure Payments</strong> -
                  All purchases processed through Stripe with bank-level
                  encryption
                </li>
                <li>
                  <strong className="text-foreground">Premium Badge</strong> -
                  Easily identify committed community members
                </li>
                <li>
                  <strong className="text-foreground">
                    Built-in Messaging
                  </strong>{" "}
                  - Communicate directly within the platform for full
                  transparency
                </li>
                <li>
                  <strong className="text-foreground">Dispute Support</strong> -
                  Our team is available to help resolve any transaction issues
                </li>
              </ul>
              <p className="mt-3">
                Look for the{" "}
                <strong className="text-foreground">Premium badge</strong> and{" "}
                <strong className="text-foreground">ID Verified badge</strong>{" "}
                next to usernames to identify the most trusted members of our
                community.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-5"
            className="border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left hover:no-underline py-6">
              How does ID verification work?
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
              <p className="mb-3">
                ID verification is an{" "}
                <strong className="text-foreground">
                  exclusive Premium member benefit
                </strong>{" "}
                that allows you to verify your identity and build trust within
                the community.
              </p>
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground mb-2">
                  Powered by Veriff - Global Leader in Identity Verification
                </p>
                <p className="text-sm">
                  We partner with{" "}
                  <strong className="text-foreground">Veriff</strong>, a
                  world-leading identity verification provider trusted by
                  companies like Bolt, Wise, and Blockchain.com. Veriff has
                  verified over 100 million people across 190+ countries,
                  ensuring the highest standards of security and fraud
                  prevention.
                </p>
              </div>
              <div className="mb-4">
                <p className="font-medium text-foreground mb-2">
                  How to get verified (Premium members):
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to your Account Settings</li>
                  <li>Click &quot;Verify Identity&quot;</li>
                  <li>
                    Follow the secure Veriff process (takes approximately 2-3
                    minutes)
                  </li>
                  <li>
                    Upload a government-issued ID (passport, driving licence, or
                    national ID)
                  </li>
                  <li>Take a quick selfie for biometric comparison</li>
                  <li>
                    Receive your verified badge once approved (typically within
                    minutes)
                  </li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">
                  Why get verified?
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Display a trusted{" "}
                    <strong className="text-foreground">verified badge</strong>{" "}
                    on your profile
                  </li>
                  <li>Build instant trust with buyers and swap partners</li>
                  <li>
                    Stand out as a legitimate, verified member of the community
                  </li>
                  <li>Increase your chances of successful transactions</li>
                </ul>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Your personal data is handled securely by Veriff in compliance
                with GDPR and global privacy standards. We never store your ID
                documents on our servers.
              </p>
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
                <li>Click &quot;New Listing&quot; from the navigation</li>
                <li>
                  Upload clear photos of your fragrance (front, back, and batch
                  code)
                </li>
                <li>Select the brand and enter the fragrance name</li>
                <li>Enter the bottle size in ml and percentage remaining</li>
                <li>
                  Choose your listing type:{" "}
                  <strong className="text-foreground">Swap</strong> (all users)
                  or <strong className="text-foreground">Sell</strong> (Premium
                  only)
                </li>
                <li>Add swap preferences or set your price</li>
                <li>Write a detailed description</li>
                <li>Publish and start receiving offers!</li>
              </ol>
              <p className="mt-3">
                <strong className="text-foreground">Pro tip:</strong>{" "}
                High-quality photos showing the fill level, batch code, and any
                wear get significantly more interest from buyers and swappers.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Standard users can have up to 3 active listings. Premium members
                get unlimited listings.
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
                Shipping arrangements depend on the transaction type:
              </p>
              <div className="mb-4">
                <p className="font-medium text-foreground mb-2">For Swaps:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Both parties are responsible for shipping their own
                    fragrance
                  </li>
                  <li>
                    Exchange addresses securely through our platform after
                    accepting
                  </li>
                  <li>Add tracking numbers to keep each other updated</li>
                  <li>Confirm receipt to complete the swap</li>
                </ul>
              </div>
              <div className="mb-4">
                <p className="font-medium text-foreground mb-2">For Sales:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Seller arranges and pays for shipping</li>
                  <li>Buyer provides shipping address during checkout</li>
                  <li>Seller adds tracking number for the buyer to follow</li>
                </ul>
              </div>
              <p className="mb-3">
                <strong className="text-foreground">Important tips:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Always use tracked shipping services</li>
                <li>Consider insurance for valuable fragrances</li>
                <li>Package securely to prevent leaks or damage</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                International shipping is supported. Check your local customs
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
