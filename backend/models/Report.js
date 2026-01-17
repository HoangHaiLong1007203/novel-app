import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetType: {
      type: String,
      enum: ["novel", "chapter", "comment", "review", "user", "system"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetTitle: { type: String },
    targetSnippet: { type: String },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["spam", "abuse", "copyright", "nsfw", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
    },
    tags: [{ type: String }],
    notes: [{
      _id: false,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
    }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNote: { type: String },
    resolvedAt: { type: Date },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ targetType: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
