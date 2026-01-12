import express from "express";
import {
  createChapter,
  getChaptersByNovel,
  getChapterById,
  updateChapter,
  deleteChapter,
} from "../controllers/chapterController.js";
import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";
import { handleDocUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router({ mergeParams: true });

// Tạo chapter (chỉ poster của truyện)
router.post("/", authMiddleware, handleDocUpload, createChapter);

// Lấy danh sách chapter của truyện
router.get("/", getChaptersByNovel);

// Lấy chi tiết chapter (optional auth để biết quyền truy cập)
router.get("/:chapterId", optionalAuth, getChapterById);

// Cập nhật chapter (chỉ poster của truyện)
router.put("/:chapterId", authMiddleware, handleDocUpload, updateChapter);

// Xóa chapter (chỉ poster của truyện)
router.delete("/:chapterId", authMiddleware, deleteChapter);

export default router;
