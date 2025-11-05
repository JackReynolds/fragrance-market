/* eslint-disable react/prop-types */
"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Package, MapPin, DollarSign, User } from "lucide-react";
import formatCurrency from "@/utils/formatCurrency";

export default function SalesTab({ sales, salesLoading, authUser, router }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "payment_completed":
        return "bg-green-100 text-green-800";
      case "awaiting_shipment":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "payment_completed":
        return "Payment Completed";
      case "awaiting_shipment":
        return "Awaiting Shipment";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <TabsContent value="sales" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Sales</h2>
        <p className="text-sm text-muted-foreground">
          {sales.length} {sales.length === 1 ? "sale" : "sales"}
        </p>
      </div>

      {salesLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mb-2 text-lg font-semibold">No sales yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            You haven&apos;t sold any items yet. Create a listing to get
            started!
          </p>
          <Button
            onClick={() => router.push("/new-listing")}
            className="hover:cursor-pointer"
          >
            Create Listing
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((order) => {
            const buyer = order.buyer;
            const item = order.item;
            const payment = order.payment;
            const shippingTo = order.shippingTo;

            return (
              <Card key={order.orderId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <CardDescription>
                        Sold on{" "}
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleDateString()
                          : "Unknown date"}
                      </CardDescription>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Item Details */}
                  <div className="flex gap-4">
                    {item?.imageURL && (
                      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.imageURL}
                          alt={item.title || "Item"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{item?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item?.brand} - {item?.fragrance}
                      </p>
                      {item?.amountLeft && (
                        <p className="text-sm text-muted-foreground">
                          {item.amountLeft}% full
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Buyer Information (for internal reference) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      <span>Buyer Profile</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Username:</span>{" "}
                        {buyer?.displayName || buyer?.username || "Unknown"}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-sm hover:cursor-pointer"
                        onClick={() => router.push(`/users/${buyer?.uid}`)}
                      >
                        View buyer profile →
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Shipping Information (CRITICAL - for fulfillment) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      <span>Ship To (use this for shipping label)</span>
                    </div>
                    {shippingTo ? (
                      <div className="pl-6 space-y-1">
                        <p className="text-sm font-medium">{shippingTo.name}</p>
                        {shippingTo.email && (
                          <p className="text-sm text-muted-foreground">
                            Email: {shippingTo.email}
                          </p>
                        )}
                        {shippingTo.phone && (
                          <p className="text-sm text-muted-foreground">
                            Phone: {shippingTo.phone}
                          </p>
                        )}
                        <div className="pt-2">
                          <p className="text-sm text-muted-foreground">
                            {shippingTo.addressLine1}
                          </p>
                          {shippingTo.addressLine2 && (
                            <p className="text-sm text-muted-foreground">
                              {shippingTo.addressLine2}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {shippingTo.city}
                            {shippingTo.state && `, ${shippingTo.state}`}{" "}
                            {shippingTo.postalCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {shippingTo.country}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="pl-6 text-sm text-muted-foreground">
                        No shipping address provided
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Payment Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="h-4 w-4" />
                      <span>Payment Details</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Total amount:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            payment?.totalAmount / 100,
                            payment?.currency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Platform fee:</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(
                            payment?.platformFee / 100,
                            payment?.currency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                        <span>Your earnings:</span>
                        <span className="text-green-600">
                          {formatCurrency(
                            payment?.sellerAmount / 100,
                            payment?.currency
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        Payment method: {payment?.paymentMethod || "card"}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Tracking */}
                  {order.shipping?.trackingNumber && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Package className="h-4 w-4" />
                          <span>Tracking Information</span>
                        </div>
                        <div className="pl-6 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Carrier:</span>{" "}
                            {order.shipping.carrier || "Not specified"}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Tracking #:</span>{" "}
                            {order.shipping.trackingNumber}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:cursor-pointer"
                      onClick={() => router.push(`/orders/${order.orderId}`)}
                    >
                      View Full Details
                    </Button>
                    {order.status === "payment_completed" && (
                      <Button
                        variant="default"
                        size="sm"
                        className="hover:cursor-pointer"
                        onClick={() =>
                          router.push(`/orders/${order.orderId}/ship`)
                        }
                      >
                        Add Tracking Number
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </TabsContent>
  );
}
