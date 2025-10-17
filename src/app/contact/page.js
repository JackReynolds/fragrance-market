"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  HelpCircle,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import GoPremiumButton from "@/components/goPremiumButton";
import { useAuth } from "@/hooks/useAuth";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { Crown } from "lucide-react";
import PremiumBadge from "@/components/ui/premiumBadge";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    inquiryType: "",
    message: "",
  });

  const { authUser } = useAuth();
  const { profileDoc } = useProfileDoc();

  const isPremium = profileDoc?.isPremium || false;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      inquiryType: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.message ||
      !formData.inquiryType
    ) {
      toast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      // TODO: Replace with actual API route when ready
      const response = await fetch("/api/email/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          isPremium: isPremium,
          userUid: authUser?.uid || null,
        }),
      });

      if (response.ok) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          inquiryType: "",
          message: "",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section
        style={{
          background:
            "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
        }}
        className="py-8 md:py-12"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-white/10 rounded-full p-4 mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-100 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-gray-100 md:text-lg max-w-[700px] mx-auto">
              Have questions about The Fragrance Market? We&apos;re here to help
              with swaps, purchases, account issues, and everything
              fragrance-related.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-6 md:mt-5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
                <p className="text-muted-foreground text-sm">
                  Get instant answers to your questions
                </p>
                <Button variant="outline" className="mt-4" size="sm">
                  Start Chat
                </Button>
              </CardContent>
            </Card> */}

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                <p className="text-muted-foreground text-sm">
                  We typically respond within 24 hours
                </p>
                <p className="text-primary text-sm mt-2 font-medium">
                  info@fragrancemarket.com
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Help Center</h3>
                <p className="text-muted-foreground text-sm">
                  Browse our comprehensive FAQ
                </p>
                <Link href="/faq">
                  <Button
                    variant="outline"
                    className="mt-4 hover:cursor-pointer"
                    size="sm"
                  >
                    View FAQ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  <p className="text-muted-foreground">
                    Fill out the form below and we&apos;ll get back to you as
                    soon as possible.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Type of Inquiry *</Label>
                      <Select
                        value={formData.inquiryType}
                        onValueChange={handleSelectChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select the type of inquiry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="swap-issue">Swap Issue</SelectItem>
                          <SelectItem value="payment-problem">
                            Payment Problem
                          </SelectItem>
                          <SelectItem value="account-support">
                            Account Support
                          </SelectItem>
                          <SelectItem value="verification-help">
                            ID Verification Help
                          </SelectItem>
                          <SelectItem value="technical-issue">
                            Technical Issue
                          </SelectItem>
                          <SelectItem value="report-user">
                            Report a User
                          </SelectItem>
                          <SelectItem value="billing-question">
                            Billing Question
                          </SelectItem>
                          <SelectItem value="premium-inquiry">
                            Premium Membership
                          </SelectItem>
                          <SelectItem value="business-inquiry">
                            Business Inquiry
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Provide detailed information about your inquiry..."
                        className="min-h-[120px]"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90 hover:cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        info@fragrancemarket.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Response Time</p>
                      {isPremium ? (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-green-600 font-medium">
                            12-24 hours (Priority)
                          </p>
                          <Crown className="h-4 w-4 text-amber-500" />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Within 48 hours
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Support Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Monday - Friday: 9AM - 6PM GMT
                      </p>
                      {isPremium ? (
                        <p className="text-sm text-green-600 font-medium">
                          Weekend: Extended support available ✓
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Weekend: Limited support
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Quick Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Common Issues:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• How to verify your ID</li>
                      <li>• Swap request problems</li>
                      <li>• Payment and billing questions</li>
                      <li>• Account recovery</li>
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:cursor-pointer"
                  >
                    Browse Help Articles
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Support Card - Different content based on user status */}
              {isPremium ? (
                // Show premium benefits card for premium users
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="bg-amber-100 rounded-full p-2">
                        <PremiumBadge />
                      </div>
                      <h4 className="font-semibold text-lg">Premium Support</h4>
                    </div>

                    <div className="bg-white/60 rounded-lg p-4 mb-4 border border-amber-200">
                      <p className="text-sm font-medium text-amber-900 mb-2">
                        ✨ You have Premium Support Access
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1.5">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Priority Response:</strong> 12-24 hour
                            response time during business hours
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Dedicated Support:</strong> Your inquiries
                            are escalated to senior team members
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Weekend Support:</strong> Extended support
                            on weekends
                          </span>
                        </li>
                      </ul>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Your premium status is automatically detected. No need to
                      mention it in your inquiry.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                // Show upgrade prompt for non-premium users
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Premium Support</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Premium members get priority support with faster response
                      times and dedicated assistance.
                    </p>
                    <GoPremiumButton />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="max-w-2xl mx-auto text-center border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="bg-amber-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Urgent Issues?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                For urgent matters like payment disputes, security concerns, or
                account compromise, please mark your inquiry as
                &quot;urgent&quot; and we&apos;ll prioritize your request.
              </p>
              <p className="text-xs text-muted-foreground">
                For emergencies outside business hours, responses may be delayed
                until the next business day.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
