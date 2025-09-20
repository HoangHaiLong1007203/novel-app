import express from "express";
import { addBookmark, removeBookmark, getUserBookmarks } from "../controllers/bookmarkController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// POST /api/bookmarks/:novelId - Thêm bookmark
router.post("/:novelId", addBookmark);

// DELETE /api/bookmarks/:novelId - Bỏ bookmark
router.delete("/:novelId", removeBookmark);

// GET /api/bookmarks - Lấy danh sách bookmark của user
router.get("/", getUserBookmarks);

export default router;
