import express from "express";
import { getChapterById, getChapterAccess, purchaseChapter, giftChapter } from "../controllers/chapterController.js";
import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Lấy chi tiết chapter theo ID (không cần novelId)
router.get("/:chapterId", optionalAuth, getChapterById);

// Lấy URL nội dung chương (public hoặc presigned)
router.get("/:chapterId/access", optionalAuth, getChapterAccess);

// Mua chương bị khóa
router.post("/:chapterId/purchase", authMiddleware, purchaseChapter);

// Tặng xu cho người đăng truyện
router.post("/:chapterId/gift", authMiddleware, giftChapter);

export default router;
