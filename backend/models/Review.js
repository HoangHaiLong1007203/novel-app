import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  novel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  content: { type: String }, // nội dung review
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);
