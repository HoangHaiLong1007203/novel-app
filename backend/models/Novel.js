import mongoose from "mongoose";

const novelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleNormalized: { type: String },
  author: { type: String, required: true },
  authorNormalized: { type: String },
  authorUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true, enum: ["sáng tác", "dịch/đăng lại"] },
  description: String,
  genres: [String],
  status: { type: String, enum: ["còn tiếp", "tạm ngưng", "hoàn thành"], default: "còn tiếp" },
  coverImageUrl: { type: String, default: "/default-cover.jpg" },
  views: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }, // cập nhật sau từ review
}, { timestamps: true });

// Indexes to speed up normalized searches. Mongoose will create these indexes
// when connected (if autoIndex is enabled). We keep both normalized indexes
// and the existing schema fields intact (do not change user-facing literals).
novelSchema.index({ titleNormalized: 1 });
novelSchema.index({ authorNormalized: 1 });


export default mongoose.model("Novel", novelSchema);
