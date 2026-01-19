import express from "express";
import {
  createComment,
  getCommentsByNovel,
  getCommentById,
  replyToComment,
  likeComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new comment (requires authentication)
router.post("/", authMiddleware, createComment);

// Get comments by novel (public, but can check user likes if authenticated)
router.get("/novel/:novelId", getCommentsByNovel);

// Get comment detail (public)
router.get("/:commentId", optionalAuth, getCommentById);

// Reply to a comment (requires authentication)
router.post("/:commentId/reply", authMiddleware, replyToComment);

// Like/unlike a comment (requires authentication)
router.post("/:commentId/like", authMiddleware, likeComment);

// Update own comment (requires authentication)
router.put("/:commentId", authMiddleware, updateComment);

// Delete own comment (requires authentication)
router.delete("/:commentId", authMiddleware, deleteComment);

export default router;
