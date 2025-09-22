import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Novel",
      required: true,
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // For replies - reference to parent comment
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // Array of user IDs who liked this comment
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Track edit history
    editCount: {
      type: Number,
      default: 0,
    },
    lastEditedAt: {
      type: Date,
      default: null,
    },
    // Soft delete
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

// Virtual for replies count
commentSchema.virtual('repliesCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true,
  match: { isDeleted: false }
});

// Virtual for checking if user liked the comment
commentSchema.virtual('isLikedByUser').get(function(userId) {
  if (!userId) return false;
  return this.likes.some(id => id.toString() === userId.toString());
});

// Index for better query performance
commentSchema.index({ novel: 1, createdAt: -1 });
commentSchema.index({ chapter: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
