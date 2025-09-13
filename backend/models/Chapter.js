import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  novel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
  price: { type: Number, default: 0 }, // số xu để mở nếu locked
}, { timestamps: true });

export default mongoose.model("Chapter", chapterSchema);
