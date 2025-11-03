import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY
);
const endpointSecret =
  process.env.STRIPE_PAYMENT_WEBHOOK_SECRET ||
  process.env.STRIPE_TEST_WEBHOOK_SECRET;

export const runtime = "nodejs";

export async function POST(request) {
  console.log("PAYMENT WEBHOOK HIT! Timestamp:", new Date().toISOString());

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`Event type: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Handling payment_intent.succeeded");
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        console.log("Handling payment_intent.payment_failed");
        await handlePaymentFailed(event.data.object);
        break;

      case "payment_intent.canceled":
        console.log("Handling payment_intent.canceled");
        await handlePaymentCanceled(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("Webhook error:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 * This is the main function that processes completed purchases
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log("Processing successful payment:", paymentIntent.id);

  const metadata = paymentIntent.metadata || {};
  const {
    listingId,
    buyerUid,
    buyerName,
    buyerEmail,
    ownerUid,
    type,
    title,
    brand,
    fragrance,
  } = metadata;

  // Validate this is a fragrance purchase
  if (type !== "fragrance_purchase") {
    console.log("Not a fragrance purchase, skipping");
    return;
  }

  // Validate required metadata
  if (!listingId || !buyerUid || !ownerUid) {
    console.error("Missing required metadata:", metadata);
    throw new Error("Invalid payment metadata");
  }

  try {
    // Use Firestore transaction for atomicity
    await db.runTransaction(async (transaction) => {
      // 1. Get the listing
      const listingRef = db.collection("listings").doc(listingId);
      const listingDoc = await transaction.get(listingRef);

      if (!listingDoc.exists) {
        throw new Error(`Listing ${listingId} not found`);
      }

      const listing = listingDoc.data();

      // Verify listing is still available (race condition check)
      if (listing.status === "sold") {
        console.warn(`Listing ${listingId} already marked as sold`);
        // Don't throw - payment already succeeded, just log
        return;
      }

      // 2. Get buyer and seller profiles
      const buyerRef = db.collection("profiles").doc(buyerUid);
      const sellerRef = db.collection("profiles").doc(ownerUid);

      const [buyerDoc, sellerDoc] = await Promise.all([
        transaction.get(buyerRef),
        transaction.get(sellerRef),
      ]);

      if (!buyerDoc.exists || !sellerDoc.exists) {
        throw new Error("Buyer or seller profile not found");
      }

      const buyer = buyerDoc.data();
      const seller = sellerDoc.data();

      // 3. Parse shipping address from metadata or Stripe shipping object
      let shippingAddress = null;
      try {
        if (metadata.shippingAddress) {
          shippingAddress = JSON.parse(metadata.shippingAddress);
        }
      } catch (e) {
        console.warn("Failed to parse shipping address from metadata:", e);
      }

      // Fallback to Stripe shipping object
      if (!shippingAddress && paymentIntent.shipping) {
        shippingAddress = {
          formattedAddress: `${paymentIntent.shipping.address.line1}, ${paymentIntent.shipping.address.city}, ${paymentIntent.shipping.address.state} ${paymentIntent.shipping.address.postal_code}, ${paymentIntent.shipping.address.country}`,
          addressComponents: {
            streetAddress: paymentIntent.shipping.address.line1,
            city: paymentIntent.shipping.address.city,
            state: paymentIntent.shipping.address.state,
            postalCode: paymentIntent.shipping.address.postal_code,
            country: paymentIntent.shipping.address.country,
            countryCode: paymentIntent.shipping.address.country,
          },
        };
      }

      // 4. Calculate amounts
      const totalAmount = paymentIntent.amount; // in cents
      const currency = paymentIntent.currency;
      const platformFee = paymentIntent.application_fee_amount || 0; // ← Use Stripe's value
      const sellerAmount = totalAmount - platformFee;

      // 5. Create order record
      const orderRef = db.collection("orders").doc();
      const orderData = {
        orderId: orderRef.id,
        orderNumber: `ORD-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,

        // Top-level UIDs for easy querying (like completed_swaps.participants)
        participants: [buyerUid, ownerUid],
        buyerUid: buyerUid,
        sellerUid: ownerUid,

        // Listing details
        listingId: listingId,
        listing: {
          title: listing.title,
          brand: listing.brand,
          fragrance: listing.fragrance,
          amountLeft: listing.amountLeft,
          imageURL: listing.imageURLs?.[0] || null,
          size: listing.size || null,
          sizeUnit: listing.sizeUnit || null,
          type: listing.type || "sell",
        },

        // Buyer details
        buyer: {
          uid: buyerUid,
          username: buyer.username || buyerName || "Unknown",
          displayName:
            buyer.displayName || buyer.username || buyerName || "Unknown",
          email: buyer.email || buyerEmail,
          profilePictureURL: buyer.profilePictureURL || null,
        },

        // Seller details
        seller: {
          uid: ownerUid,
          username: seller.username || "Unknown",
          displayName: seller.displayName || seller.username || "Unknown",
          email: seller.email,
          profilePictureURL: seller.profilePictureURL || null,
        },

        // Shipping details
        shippingAddress: shippingAddress,

        // Payment details
        payment: {
          totalAmount: totalAmount,
          currency: currency,
          platformFee: platformFee,
          sellerAmount: sellerAmount,
          stripePaymentIntentId: paymentIntent.id,
          paymentStatus: paymentIntent.status,
          paymentMethod: paymentIntent.payment_method_types?.[0] || "card",
        },

        // Shipping tracking (for later updates)
        shipping: {
          trackingNumber: null,
          carrier: null,
          shippedAt: null,
          deliveredAt: null,
          estimatedDelivery: null,
        },

        // Order status
        status: "payment_completed", // Next: awaiting_shipment
        orderHistory: [
          {
            status: "payment_completed",
            timestamp: Timestamp.now(), // Use Timestamp.now() for arrays (serverTimestamp not allowed in arrays)
            note: "Payment successfully processed",
          },
        ],

        // Timestamps
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(orderRef, orderData);

      // 6. Update listing status to sold
      transaction.update(listingRef, {
        status: "sold",
        soldAt: FieldValue.serverTimestamp(),
        soldTo: buyerUid,
        orderId: orderRef.id,
        salePrice: totalAmount,
        saleCurrency: currency,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 7. Update user stats
      transaction.update(buyerRef, {
        purchaseCount: FieldValue.increment(1),
        totalSpent: FieldValue.increment(totalAmount),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(sellerRef, {
        saleCount: FieldValue.increment(1),
        totalEarnings: FieldValue.increment(sellerAmount),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`Order ${orderRef.id} created successfully`);

      return { orderRef, orderData, buyer, seller };
    });

    // After transaction completes, send emails (non-critical, don't fail webhook)
    try {
      await sendOrderConfirmationEmails(listingId, buyerUid, paymentIntent.id);
    } catch (emailError) {
      console.error("Failed to send emails:", emailError);
      // Don't throw - email failure shouldn't fail the webhook
    }

    console.log(`Payment processing complete for ${paymentIntent.id}`);
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.log("Payment failed:", paymentIntent.id);

  const metadata = paymentIntent.metadata || {};
  const { listingId, buyerUid, buyerEmail } = metadata;

  if (!buyerUid) {
    console.log("No buyer UID, skipping");
    return;
  }

  try {
    // Create failed payment record for tracking
    const failedPaymentRef = db.collection("failed_payments").doc();
    await failedPaymentRef.set({
      paymentIntentId: paymentIntent.id,
      listingId: listingId || null,
      buyerUid: buyerUid,
      buyerEmail: buyerEmail || null,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failureReason: paymentIntent.last_payment_error?.message || "Unknown",
      failureCode: paymentIntent.last_payment_error?.code || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`Failed payment recorded: ${failedPaymentRef.id}`);

    // TODO: Send failure notification email to buyer
    // await sendPaymentFailedEmail(buyerEmail, failureReason);
  } catch (error) {
    console.error("Error handling failed payment:", error);
    // Don't throw - this is not critical
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent) {
  console.log("Payment canceled:", paymentIntent.id);

  const metadata = paymentIntent.metadata || {};
  const { listingId, buyerUid } = metadata;

  // Just log for now - cancellations are usually intentional
  console.log(`Payment canceled for listing ${listingId} by buyer ${buyerUid}`);
}

/**
 * Send order confirmation emails to buyer and seller
 * This is a placeholder - implement with SendGrid later
 */
async function sendOrderConfirmationEmails(
  listingId,
  buyerUid,
  paymentIntentId
) {
  console.log("Preparing to send order confirmation emails...");

  try {
    // Get order details
    const orderQuery = await db
      .collection("orders")
      .where("listingId", "==", listingId)
      .where("buyer.uid", "==", buyerUid)
      .where("payment.stripePaymentIntentId", "==", paymentIntentId)
      .limit(1)
      .get();

    if (orderQuery.empty) {
      console.error("Order not found for email");
      return;
    }

    const order = orderQuery.docs[0].data();

    // Send buyer receipt
    await sendBuyerReceipt(order);

    // Send seller notification
    await sendSellerNotification(order);

    console.log("Order confirmation emails sent");
  } catch (error) {
    console.error("Failed to send confirmation emails:", error);
    throw error;
  }
}

/**
 * Send purchase receipt to buyer
 * TODO: Implement with SendGrid
 */
async function sendBuyerReceipt(order) {
  console.log(`[TODO] Send buyer receipt to: ${order.buyer.email}`);

  // Placeholder for SendGrid implementation
  const emailData = {
    to: order.buyer.email,
    template: "buyer_receipt",
    data: {
      buyerName: order.buyer.username,
      orderNumber: order.orderNumber,
      itemTitle: order.listing.title,
      itemBrand: order.listing.brand,
      amount: (order.payment.totalAmount / 100).toFixed(2),
      currency: order.payment.currency.toUpperCase(),
      shippingAddress: order.shippingAddress?.formattedAddress,
      sellerName: order.seller.username,
      orderDate: new Date().toLocaleDateString(),
    },
  };

  console.log("Buyer email data prepared:", emailData);

  // TODO: Implement actual SendGrid call
  // await sendEmail(emailData);
}

/**
 * Send sale notification to seller
 * TODO: Implement with SendGrid
 */
async function sendSellerNotification(order) {
  console.log(`[TODO] Send seller notification to: ${order.seller.email}`);

  // Placeholder for SendGrid implementation
  const emailData = {
    to: order.seller.email,
    template: "seller_notification",
    data: {
      sellerName: order.seller.username,
      orderNumber: order.orderNumber,
      itemTitle: order.listing.title,
      amount: (order.payment.sellerAmount / 100).toFixed(2),
      currency: order.payment.currency.toUpperCase(),
      buyerName: order.buyer.username,
      shippingAddress: order.shippingAddress?.formattedAddress,
      orderDate: new Date().toLocaleDateString(),
    },
  };

  console.log("Seller email data prepared:", emailData);

  // TODO: Implement actual SendGrid call
  // await sendEmail(emailData);
}
