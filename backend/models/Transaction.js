import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["topup", "purchase"], // nạp xu, mua chương
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    amountVnd: { type: Number },
    currency: { type: String, default: "VND" },
    provider: {
      type: String,
      enum: ["stripe", "vnpay", "system", null],
      default: null,
    },
    providerSessionId: { type: String },
    providerRef: { type: String },
    orderCode: { type: String },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: function () {
        return this.type === "purchase";
      },
    },
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Novel",
      required: function () {
        return this.type === "purchase";
      },
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending", "canceled"],
      default: "pending",
    },
    statusReason: { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ provider: 1, providerSessionId: 1 });
transactionSchema.index({ type: 1, status: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
