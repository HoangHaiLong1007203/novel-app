import Review from "../models/Review.js";
import Novel from "../models/Novel.js";
import User from "../models/User.js";
import ReadingProgress from "../models/ReadingProgress.js";
import Chapter from "../models/Chapter.js";
import AppError from "../middlewares/errorHandler.js";

// Create a new review
export const createReview = async (req, res, next) => {
  try {
    const { novelId, rating, content } = req.body;
    const userId = req.user.userId;

    if (!novelId || !rating) {
      return next(new AppError("Novel ID và rating là bắt buộc", 400));
    }

    if (rating < 1 || rating > 5) {
      return next(new AppError("Rating phải từ 1 đến 5", 400));
    }

    // Verify novel exists
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    // Check if user already reviewed this novel
    const existingReview = await Review.findOne({
      novel: novelId,
      user: userId,
      isDeleted: false
    });

    if (existingReview) {
      return next(new AppError("Bạn đã đánh giá truyện này rồi", 400));
    }

    // Check reading progress (80% requirement)
    const readingProgress = await ReadingProgress.findOne({
      user: userId,
      novel: novelId
    });

    if (!readingProgress || !readingProgress.canReview) {
      return next(new AppError("Bạn cần đọc ít nhất 80% chương của truyện để đánh giá", 403));
    }

    // Create review
    const review = new Review({
      novel: novelId,
      user: userId,
      rating: rating,
      content: content ? content.trim() : ""
    });

    await review.save();

    // Update novel's average rating
    await updateNovelAverageRating(novelId);

    // Populate user info for response
    await review.populate('user', 'username avatarUrl');

    res.status(201).json({
      message: "Đánh giá đã được tạo thành công",
      review
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews by novel with pagination and sorting
export const getReviewsByNovel = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const userId = req.user?.userId; // Optional for checking likes

    if (!novelId) {
      return next(new AppError("Novel ID là bắt buộc", 400));
    }

    // Verify novel exists
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get top-level reviews
    const reviews = await Review.getTopLevelReviews(novelId, {
      page: pageNum,
      limit: limitNum,
      sort: sort
    });

    // Add like status for current user
    const reviewsWithLikeStatus = reviews.map(review => {
      const reviewObj = review.toObject();
      reviewObj.isLikedByCurrentUser = userId ? review.isLikedByUser(userId) : false;
      return reviewObj;
    });

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      novel: novelId,
      parentReview: null,
      isDeleted: false
    });

    res.json({
      reviews: reviewsWithLikeStatus,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalReviews / limitNum),
        totalReviews: totalReviews,
        hasNextPage: pageNum * limitNum < totalReviews,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reply to a review
export const replyToReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Validation - chỉ cần reviewId và content cho reply
    if (!reviewId || !content) {
      return next(new AppError("Review ID và content là bắt buộc", 400));
    }

    // Verify parent review exists
    const parentReview = await Review.findById(reviewId);
    if (!parentReview || parentReview.isDeleted) {
      return next(new AppError("Đánh giá gốc không tồn tại", 404));
    }

    // Tạo reply (không cần rating, không cần kiểm tra reading progress)
    const reply = new Review({
      novel: parentReview.novel,
      user: userId,
      content: content.trim(),
      parentReview: reviewId
    });

    await reply.save();

    // Update novel's average rating (chỉ cập nhật khi có review mới, không phải reply)
    await updateNovelAverageRating(parentReview.novel);

    // Populate user info for response
    await reply.populate('user', 'username avatarUrl');

    res.status(201).json({
      message: "Trả lời đánh giá đã được tạo thành công",
      reply
    });
  } catch (error) {
    console.error('Error in replyToReview:', error);
    next(error);
  }
};

// Like/unlike a review
export const likeReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const review = await Review.findById(reviewId);
    if (!review || review.isDeleted) {
      return next(new AppError("Đánh giá không tồn tại", 404));
    }

    const wasLiked = review.toggleLike(userId);
    await review.save();

    res.json({
      message: wasLiked ? "Đã thích đánh giá" : "Đã bỏ thích đánh giá",
      likesCount: review.likes.length,
      isLiked: wasLiked
    });
  } catch (error) {
    next(error);
  }
};

// Update own review
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.userId;

    if (!rating && !content) {
      return next(new AppError("Rating hoặc content là bắt buộc", 400));
    }

    if (rating && (rating < 1 || rating > 5)) {
      return next(new AppError("Rating phải từ 1 đến 5", 400));
    }

    const review = await Review.findById(reviewId);
    if (!review || review.isDeleted) {
      return next(new AppError("Đánh giá không tồn tại", 404));
    }

    if (review.user.toString() !== userId) {
      return next(new AppError("Bạn không có quyền chỉnh sửa đánh giá này", 403));
    }

    // Update fields if provided
    if (rating) review.rating = rating;
    if (content !== undefined) {
      review.edit(content);
    }

    await review.save();

    // Update novel's average rating
    await updateNovelAverageRating(review.novel);

    res.json({
      message: "Đánh giá đã được cập nhật",
      review
    });
  } catch (error) {
    next(error);
  }
};

// Delete own review (soft delete)
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const review = await Review.findById(reviewId);
    if (!review || review.isDeleted) {
      return next(new AppError("Đánh giá không tồn tại", 404));
    }

    if (review.user.toString() !== userId) {
      return next(new AppError("Bạn không có quyền xóa đánh giá này", 403));
    }

    await review.softDelete();

    // Update novel's average rating
    await updateNovelAverageRating(review.novel);

    res.json({
      message: "Đánh giá đã được xóa"
    });
  } catch (error) {
    next(error);
  }
};

// Get replies for a specific review
export const getReviewReplies = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { page = 1, limit = 5, sort = 'oldest' } = req.query;
    const userId = req.user?.userId;

    const review = await Review.findById(reviewId);
    if (!review || review.isDeleted) {
      return next(new AppError("Đánh giá không tồn tại", 404));
    }

    const replies = await Review.getReplies(reviewId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort
    });

    // Add like status for current user
    const repliesWithLikeStatus = replies.map(reply => {
      const replyObj = reply.toObject();
      replyObj.isLikedByCurrentUser = userId ? reply.isLikedByUser(userId) : false;
      return replyObj;
    });

    res.json({
      replies: repliesWithLikeStatus,
      reviewId: reviewId
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update novel's average rating
const updateNovelAverageRating = async (novelId) => {
  try {
    const reviews = await Review.find({
      novel: novelId,
      isDeleted: false,
      parentReview: null // Only count top-level reviews
    });

    if (reviews.length === 0) {
      await Novel.findByIdAndUpdate(novelId, { averageRating: 0 });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal

    await Novel.findByIdAndUpdate(novelId, { averageRating: averageRating });
  } catch (error) {
    console.error('Error updating novel average rating:', error);
  }
};
