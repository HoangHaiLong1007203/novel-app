import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireAdmin from "../middlewares/roleMiddleware.js";
import { listReports, updateReportStatus, createReport } from "../controllers/reportController.js";

const router = Router();

router.get("/admin", authMiddleware, requireAdmin, listReports);
router.patch("/admin/:reportId", authMiddleware, requireAdmin, updateReportStatus);
router.post("/", authMiddleware, createReport);

export default router;
