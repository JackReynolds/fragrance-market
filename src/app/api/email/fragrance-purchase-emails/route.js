import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const buyerReceiptTemplateId = process.env.SENDGRID_BUYER_RECEIPT_TEMPLATE_ID;
const sellerNotificationTemplateId =
  process.env.SENDGRID_SELLER_NOTIFICATION_TEMPLATE_ID;
const fromEmail = "info@thefragrancemarket.com";

if (!apiKey || !buyerReceiptTemplateId || !sellerNotificationTemplateId) {
  console.warn("SendGrid not fully configured for purchase emails");
}

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

/**
 * Send buyer receipt email
 * Exported for direct use in webhooks
 */
export const sendBuyerReceiptEmail = async (order) => {
  if (!apiKey || !buyerReceiptTemplateId) {
    console.warn("SendGrid not configured for buyer receipts - skipping email");
    return;
  }
  const message = {
    to: order.shippingTo.email,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId: buyerReceiptTemplateId,
    dynamicTemplateData: {
      // Customer details
      buyerName: order.shippingTo.name,
      buyerEmail: order.shippingTo.email,

      // Order details
      orderNumber: order.orderNumber,
      orderId: order.orderId,
      orderDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),

      // Item details
      itemTitle: order.item.title,
      itemBrand: order.item.brand,
      itemFragrance: order.item.fragrance,
      itemSize: order.item.sizeInMl ? `${order.item.sizeInMl}ml` : null,
      itemAmountLeft: order.item.amountLeft
        ? `${order.item.amountLeft}%`
        : null,
      itemImage: order.item.imageURL,

      // Payment details
      totalAmount: (order.payment.totalAmount / 100).toFixed(2),
      currency: order.payment.currency.toUpperCase(),
      paymentMethod:
        order.payment.paymentMethod === "card"
          ? "Credit/Debit Card"
          : order.payment.paymentMethod,

      // Shipping details
      shippingName: order.shippingTo.name,
      shippingAddressLine1: order.shippingTo.addressLine1,
      shippingAddressLine2: order.shippingTo.addressLine2 || "",
      shippingCity: order.shippingTo.city,
      shippingState: order.shippingTo.state || "",
      shippingPostalCode: order.shippingTo.postalCode,
      shippingCountry: order.shippingTo.country,
      shippingPhone: order.shippingTo.phone || "",

      // Seller details (username only - buyer doesn't need full name)
      sellerName: order.seller.username,
      sellerUsername: order.seller.username,
    },
    subject: `Order Confirmation #${order.orderNumber} | The Fragrance Market`,
  };

  await sgMail.send(message);
  console.log(`✅ Buyer receipt sent to ${order.shippingTo.email}`);
};

/**
 * Send seller notification email
 * Exported for direct use in webhooks
 */
export const sendSellerNotificationEmail = async (order) => {
  if (!apiKey || !sellerNotificationTemplateId) {
    console.warn(
      "SendGrid not configured for seller notifications - skipping email"
    );
    return;
  }
  const message = {
    to: order.seller.email,
    from: { name: "The Fragrance Market", email: fromEmail },
    templateId: sellerNotificationTemplateId,
    dynamicTemplateData: {
      // Seller details
      sellerName: order.seller.username,
      sellerUsername: order.seller.username,

      // Order details
      orderNumber: order.orderNumber,
      orderId: order.orderId,
      orderDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),

      // Item details
      itemTitle: order.item.title,
      itemBrand: order.item.brand,
      itemFragrance: order.item.fragrance,
      itemSize: order.item.sizeInMl ? `${order.item.sizeInMl}ml` : null,
      itemAmountLeft: order.item.amountLeft
        ? `${order.item.amountLeft}%`
        : null,
      itemImage: order.item.imageURL,

      // Payment details (what seller receives)
      sellerAmount: (order.payment.sellerAmount / 100).toFixed(2),
      platformFee: (order.payment.platformFee / 100).toFixed(2),
      totalAmount: (order.payment.totalAmount / 100).toFixed(2),
      currency: order.payment.currency.toUpperCase(),

      // Buyer/Shipping details (for creating shipping label)
      recipientName: order.shippingTo.name,
      recipientEmail: order.shippingTo.email,
      recipientPhone: order.shippingTo.phone || "",
      shippingAddressLine1: order.shippingTo.addressLine1,
      shippingAddressLine2: order.shippingTo.addressLine2 || "",
      shippingCity: order.shippingTo.city,
      shippingState: order.shippingTo.state || "",
      shippingPostalCode: order.shippingTo.postalCode,
      shippingCountry: order.shippingTo.country,
      shippingCountryCode: order.shippingTo.countryCode,

      // Buyer details (use displayName for full name, username for reference)
      buyerName: order.buyer.displayName || order.buyer.username,
      buyerUsername: order.buyer.username,

      // Action links
      viewOrderUrl: "https://thefragrancemarket.com/my-profile",
      markAsShippedUrl: "https://thefragrancemarket.com/my-profile",
      contactSupportUrl: "https://thefragrancemarket.com/contact",
    },
    subject: `New Sale! Order #${order.orderNumber} | The Fragrance Market`,
  };

  await sgMail.send(message);
  console.log(`✅ Seller notification sent to ${order.seller.email}`);
};

/**
 * Send both purchase confirmation emails
 * Exported for direct use in webhooks
 */
export const sendPurchaseConfirmationEmails = async (order) => {
  console.log("Sending purchase confirmation emails...");

  // Send both emails
  const results = await Promise.allSettled([
    sendBuyerReceiptEmail(order),
    sendSellerNotificationEmail(order),
  ]);

  // Check results
  const buyerEmailResult = results[0];
  const sellerEmailResult = results[1];

  const errors = [];
  if (buyerEmailResult.status === "rejected") {
    console.error("Failed to send buyer receipt:", buyerEmailResult.reason);
    errors.push("buyer email failed");
  }
  if (sellerEmailResult.status === "rejected") {
    console.error(
      "Failed to send seller notification:",
      sellerEmailResult.reason
    );
    errors.push("seller email failed");
  }

  if (errors.length > 0) {
    throw new Error(`Email sending failed: ${errors.join(", ")}`);
  }

  console.log("✅ Both purchase confirmation emails sent successfully");
};

/**
 * POST endpoint for manual testing or external calls
 */
export async function POST(request) {
  try {
    const { order } = await request.json();

    if (!order) {
      return NextResponse.json(
        { error: "Missing order data" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (
      !order.shippingTo?.email ||
      !order.seller?.email ||
      !order.orderNumber
    ) {
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 }
      );
    }

    // Use the exported function
    await sendPurchaseConfirmationEmails(order);

    return NextResponse.json(
      {
        message: "Purchase confirmation emails sent successfully",
        buyerEmail: order.shippingTo.email,
        sellerEmail: order.seller.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Unable to send purchase confirmation emails" },
      { status: 500 }
    );
  }
}
