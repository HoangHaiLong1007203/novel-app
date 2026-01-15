import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireAdmin from "../middlewares/roleMiddleware.js";
import {
  createPaymentSession,
  confirmPayment,
  stripeWebhookHandler,
  listTransactions,
  listUserTransactions,
} from "../controllers/paymentController.js";

const router = express.Router();

// POST /api/payments/create - authenticated
router.post("/create", authMiddleware, createPaymentSession);

// POST /api/payments/confirm - authenticated
router.post("/confirm", authMiddleware, confirmPayment);

// POST /api/payments/webhook/stripe - Stripe webhook (raw body parsing handled in server.js)
router.post("/webhook/stripe", stripeWebhookHandler);

// GET /api/payments/transactions - admin only
router.get("/transactions", authMiddleware, requireAdmin, listTransactions);

// GET /api/payments/me - lấy lịch sử giao dịch của user (nạp + mua)
router.get("/me", authMiddleware, listUserTransactions);

export default router;
