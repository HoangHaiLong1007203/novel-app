import express from "express";
import { getChapterById, getChapterAccess, purchaseChapter } from "../controllers/chapterController.js";
import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Lấy chi tiết chapter theo ID (không cần novelId)
router.get("/:chapterId", optionalAuth, getChapterById);

// Lấy URL nội dung chương (public hoặc presigned)
router.get("/:chapterId/access", optionalAuth, getChapterAccess);

// Mua chương bị khóa
router.post("/:chapterId/purchase", authMiddleware, purchaseChapter);

export default router;
