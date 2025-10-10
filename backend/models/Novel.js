import mongoose from "mongoose";

const novelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
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

export default mongoose.model("Novel", novelSchema);
