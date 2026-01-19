import express from "express";
import {
  createNovel,
  getNovels,
  getNovelById,
  updateNovel,
  deleteNovel,
  searchNovels,
  getNominationStatus,
  nominateNovel,
} from "../controllers/novelController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { handleCoverUpload } from "../middlewares/uploadMiddleware.js";
import chapterRouter from "./chapter.js";

const router = express.Router();

// Tạo truyện (chỉ user đăng nhập)
router.post("/", authMiddleware, handleCoverUpload, createNovel);

// Tìm kiếm truyện
router.get("/search", searchNovels);

// Lấy danh sách truyện (có thể lọc)
router.get("/", getNovels);

// Trạng thái đề cử trong ngày
router.get("/:id/nomination-status", authMiddleware, getNominationStatus);

// Đề cử truyện
router.post("/:id/nominate", authMiddleware, nominateNovel);

// Lấy chi tiết truyện
router.get("/:id", getNovelById);

// Cập nhật truyện (chỉ poster)
router.put("/:id", authMiddleware, handleCoverUpload, updateNovel);

// Xóa truyện (chỉ poster)
router.delete("/:id", authMiddleware, deleteNovel);

// Routes cho chapters
router.use("/:novelId/chapters", chapterRouter);

export default router;
