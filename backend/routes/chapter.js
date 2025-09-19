import express from "express";
import {
  createChapter,
  getChaptersByNovel,
  getChapterById,
  updateChapter,
  deleteChapter,
} from "../controllers/chapterController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });

// Tạo chapter (chỉ poster của truyện)
router.post("/", authMiddleware, createChapter);

// Lấy danh sách chapter của truyện
router.get("/", getChaptersByNovel);

// Lấy chi tiết chapter
router.get("/:chapterId", getChapterById);

// Cập nhật chapter (chỉ poster của truyện)
router.put("/:chapterId", authMiddleware, updateChapter);

// Xóa chapter (chỉ poster của truyện)
router.delete("/:chapterId", authMiddleware, deleteChapter);

export default router;
