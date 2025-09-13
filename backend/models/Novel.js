import mongoose from "mongoose";

const novelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: String,
  genres: [String],
  views: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }, // cập nhật sau từ review
}, { timestamps: true });

export default mongoose.model("Novel", novelSchema);
