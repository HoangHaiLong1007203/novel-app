import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["new_chapter", "system", "info"], default: "info" },
  isRead: { type: Boolean, default: false },
  relatedNovel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel" },
  relatedChapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);
