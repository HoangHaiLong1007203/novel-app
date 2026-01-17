import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Novel",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: function() {
        // Rating is required only for top-level reviews (no parentReview)
        return !this.parentReview;
      },
    },
    content: {
      type: String,
      trim: true,
    },
    parentReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    editCount: {
      type: Number,
      default: 0,
    },
    lastEditedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.virtual('repliesCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'parentReview',
  count: true,
  match: { isDeleted: false }
});

// Instance method to check if review is liked by user
reviewSchema.methods.isLikedByUser = function(userId) {
  if (!userId) return false;
  return this.likes.some(id => id.toString() === userId.toString());
};

// Static method to get top-level reviews with pagination and sorting
reviewSchema.statics.getTopLevelReviews = function(novelId, options = {}) {
  const { page = 1, limit = 10, sort = 'newest' } = options;
  const skip = (page - 1) * limit;

  let sortOption = { createdAt: -1 }; // default newest first
  if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'highest') {
    sortOption = { rating: -1, createdAt: -1 };
  } else if (sort === 'lowest') {
    sortOption = { rating: 1, createdAt: -1 };
  }

  return this.find({
    novel: novelId,
    parentReview: null,
    isDeleted: false
  })
  .populate('user', 'username avatarUrl')
  // populate the virtual repliesCount so list responses include child counts
  .populate('repliesCount')
  .sort(sortOption)
  .skip(skip)
  .limit(limit)
  .exec();
};

// Static method to get replies for a review
reviewSchema.statics.getReplies = function(reviewId, options = {}) {
  const { page = 1, limit = 5, sort = 'oldest' } = options;
  const skip = (page - 1) * limit;

  let sortOption = { createdAt: 1 }; // default oldest first
  if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  }

  return this.find({
    parentReview: reviewId,
    isDeleted: false
  })
  .populate('user', 'username avatarUrl')
  .sort(sortOption)
  .skip(skip)
  .limit(limit)
  .exec();
};

// Instance method to toggle like status
reviewSchema.methods.toggleLike = function(userId) {
  const userIdStr = userId.toString();
  const likeIndex = this.likes.findIndex(id => id.toString() === userIdStr);

  if (likeIndex > -1) {
    // User already liked, remove like
    this.likes.splice(likeIndex, 1);
    return false; // was liked, now unliked
  } else {
    // User hasn't liked, add like
    this.likes.push(userId);
    return true; // was not liked, now liked
  }
};

// Instance method to edit review content
reviewSchema.methods.edit = function(newContent) {
  if (this.content !== newContent.trim()) {
    this.content = newContent.trim();
    this.editCount += 1;
    this.lastEditedAt = new Date();
  }
  return this;
};

// Instance method to soft delete review
reviewSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this;
};

reviewSchema.index({ novel: 1, createdAt: -1 });
reviewSchema.index({ parentReview: 1, createdAt: 1 });
reviewSchema.index({ user: 1, createdAt: -1 });
// Ensure a user can create only one top-level review per novel.
// Use a partial unique index so replies (which have parentReview set) are not constrained.
reviewSchema.index({ novel: 1, user: 1 }, { unique: true, partialFilterExpression: { parentReview: null } });
reviewSchema.index({ novel: 1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
