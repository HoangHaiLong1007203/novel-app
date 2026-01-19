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


// Get reviews for a novel (public)
router.get("/novel/:novelId", getReviewsByNovel);

// Get replies for a specific review (public)
router.get("/:reviewId/replies", getReviewReplies);

// The following routes require authentication
router.use(authMiddleware);

// Create a new review
router.post("/", createReview);

// Reply to a review
router.post("/:reviewId/reply", replyToReview);

// Like/unlike a review
router.post("/:reviewId/like", likeReview);

// Update own review
router.put("/:reviewId", updateReview);

// Delete own review
router.delete("/:reviewId", deleteReview);

export default router;
