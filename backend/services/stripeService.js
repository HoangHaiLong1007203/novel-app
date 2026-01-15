import Stripe from "stripe";
import AppError from "../middlewares/errorHandler.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripeClient = null;

if (STRIPE_SECRET_KEY) {
  const clientOptions = {};
  if (process.env.STRIPE_API_VERSION) {
    clientOptions.apiVersion = process.env.STRIPE_API_VERSION;
  }
  // If no API version provided via env, let the Stripe library use its default
  stripeClient = new Stripe(STRIPE_SECRET_KEY, clientOptions);
}

const ensureStripeClient = () => {
  if (!stripeClient) {
    throw new AppError("Stripe secret key chưa được cấu hình", 500);
  }
  return stripeClient;
};

export const createCheckoutSession = async ({
  amountVnd,
  successUrl,
  cancelUrl,
  metadata,
  customerEmail,
}) => {
  if (!Number.isFinite(amountVnd) || amountVnd <= 0) {
    throw new AppError("Số tiền Stripe không hợp lệ", 400);
  }
  if (!successUrl || !cancelUrl) {
    throw new AppError("Thiếu URL chuyển hướng cho Stripe", 400);
  }

  const stripe = ensureStripeClient();
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "vnd",
          unit_amount: Math.round(amountVnd),
          product_data: {
            name: "Nạp xu Novel App",
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    customer_email: customerEmail,
  });
};

export const retrieveCheckoutSession = async (sessionId) => {
  if (!sessionId) {
    throw new AppError("Thiếu sessionId để kiểm tra thanh toán", 400);
  }
  const stripe = ensureStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
};

export const retrievePaymentIntent = async (paymentIntentId) => {
  if (!paymentIntentId) {
    throw new AppError("Thiếu paymentIntentId", 400);
  }
  const stripe = ensureStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

export const constructWebhookEvent = (payloadBuffer, signatureHeader) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError("Stripe webhook secret chưa cấu hình", 400);
  }
  if (!payloadBuffer || !signatureHeader) {
    throw new AppError("Thiếu payload hoặc chữ ký Stripe", 400);
  }
  const stripe = ensureStripeClient();
  return stripe.webhooks.constructEvent(payloadBuffer, signatureHeader, webhookSecret);
};

export const hasStripeWebhookSecret = () => Boolean(process.env.STRIPE_WEBHOOK_SECRET);
