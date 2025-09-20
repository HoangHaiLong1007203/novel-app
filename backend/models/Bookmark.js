import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  novel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel", required: true },
}, {
  timestamps: true
});

// Compound index to ensure a user can only bookmark a novel once
bookmarkSchema.index({ user: 1, novel: 1 }, { unique: true });

export default mongoose.model("Bookmark", bookmarkSchema);
