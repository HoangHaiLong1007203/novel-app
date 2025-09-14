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
      required: true,
    },
    content: {
      type: String,
      trim: true, // xóa khoảng trắng thừa
    },
  },
  { timestamps: true }
);

// 🔒 mỗi user chỉ được review 1 lần cho 1 novel
reviewSchema.index({ novel: 1, user: 1 }, { unique: true });

// ⚡ tối ưu query lấy review theo novel
reviewSchema.index({ novel: 1 });

const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
