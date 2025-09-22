import express from "express";
import {
  createReview,
  getReviewsByNovel,
  replyToReview,
  likeReview,
  updateReview,
  deleteReview,
  getReviewReplies
} from "../controllers/reviewController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new review
router.post("/", createReview);

// Get reviews for a novel
router.get("/novel/:novelId", getReviewsByNovel);

// Reply to a review
router.post("/:reviewId/reply", replyToReview);

// Like/unlike a review
router.post("/:reviewId/like", likeReview);

// Update own review
router.put("/:reviewId", updateReview);

// Delete own review
router.delete("/:reviewId", deleteReview);

// Get replies for a specific review
router.get("/:reviewId/replies", getReviewReplies);

export default router;
