import mongoose from "mongoose";

const nominationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dateKey: { type: String, required: true },
    used: { type: Number, default: 0 },
  },
  { timestamps: true }
);

nominationLogSchema.index({ user: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("NominationLog", nominationLogSchema);
