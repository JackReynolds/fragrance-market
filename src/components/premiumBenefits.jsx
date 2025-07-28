import React from "react";
import {
  Repeat,
  ShoppingBag,
  ArrowUp,
  MessageSquare,
  Medal,
} from "lucide-react";
import PremiumBadge from "@/components/ui/premiumBadge";
import PremiumMembershipWideCard from "@/components/premiumMembershipWideCard";

const PremiumBenefits = () => {
  return (
    <section className="py-8 md:py-16 bg-gray-50">
      <div className="px-4 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xl md:text-3xl font-bold mb-6">
              Premium Benefits
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <Repeat className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg mb-1">
                    Unlimited Swaps
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    No monthly limits. Swap as many fragrances as you want,
                    whenever you want.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg mb-1">
                    Sell Your Collection
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    List fragrances for sale with secure payments through our
                    platform.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  <PremiumBadge
                    outerWidth="8"
                    outerHeight="8"
                    crownWidth="5"
                    crownHeight="5"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg mb-1">
                    Premium Badge
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Stand out with a premium badge on your profile and listings.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <ArrowUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg mb-1">
                    Priority Search Ranking
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Your listings will appear higher in search results.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg mb-1">
                    Discord Community
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Join our exclusive community of fragrance enthusiasts to
                    discuss trends and find rare items.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <Medal className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg mb-1">
                    Priority Support
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Get fast responses to your questions and priority assistance
                    with any issues.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <PremiumMembershipWideCard />
        </div>
      </div>
    </section>
  );
};

export default PremiumBenefits;
