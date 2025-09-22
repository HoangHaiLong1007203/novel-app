import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createReadingProgress,
  getReadingProgress,
  getAllReadingProgress,
  updateReadingProgress,
  deleteReadingProgress
} from "../controllers/readingProgressController.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/reading-progress - Create or update reading progress
router.post("/", createReadingProgress);

// GET /api/reading-progress/:novelId - Get reading progress for a specific novel
router.get("/:novelId", getReadingProgress);

// GET /api/reading-progress - Get all reading progress for current user
router.get("/", getAllReadingProgress);

// PUT /api/reading-progress/:novelId - Update reading progress (mark multiple chapters as read)
router.put("/:novelId", updateReadingProgress);

// DELETE /api/reading-progress/:novelId - Delete reading progress for a novel
router.delete("/:novelId", deleteReadingProgress);

export default router;
