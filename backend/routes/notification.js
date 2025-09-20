import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead
} from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET /api/notifications - Lấy danh sách thông báo
router.get("/", getUserNotifications);

// PUT /api/notifications/:notificationId/read - Đánh dấu đã đọc
router.put("/:notificationId/read", markAsRead);

// PUT /api/notifications/mark-multiple-read - Đánh dấu nhiều thông báo đã đọc
router.put("/mark-multiple-read", markMultipleAsRead);

// PUT /api/notifications/mark-all-read - Đánh dấu tất cả đã đọc
router.put("/mark-all-read", markAllAsRead);

export default router;
