import express from "express";
import {
  createNovel,
  getNovels,
  getNovelById,
  updateNovel,
  deleteNovel,
} from "../controllers/novelController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { handleCoverUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Tạo truyện (chỉ user đăng nhập)
router.post("/", authMiddleware, handleCoverUpload, createNovel);

// Lấy danh sách truyện (có thể lọc)
router.get("/", getNovels);

// Lấy chi tiết truyện
router.get("/:id", getNovelById);

// Cập nhật truyện (chỉ poster)
router.put("/:id", authMiddleware, handleCoverUpload, updateNovel);

// Xóa truyện (chỉ poster)
router.delete("/:id", authMiddleware, deleteNovel);

export default router;
