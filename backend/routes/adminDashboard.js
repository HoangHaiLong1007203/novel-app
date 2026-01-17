import { Router } from "express";
import {
  getDashboardOverview,
  getSummary,
  getActivities,
  getModerationQueue,
  getPaymentSummary,
  getTopNovels,
  getSystemHealth,
} from "../controllers/adminDashboardController.js";

const router = Router();

router.get("/", getDashboardOverview);
router.get("/summary", getSummary);
router.get("/activities", getActivities);
router.get("/moderation", getModerationQueue);
router.get("/payments", getPaymentSummary);
router.get("/top-novels", getTopNovels);
router.get("/system-health", getSystemHealth);

export default router;
