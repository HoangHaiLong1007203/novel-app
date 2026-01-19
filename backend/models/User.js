import mongoose from "mongoose";

// Schema con cho từng provider
const providerSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ["local", "google", "facebook"] },
  providerId: { type: String }, // chỉ social login mới có providerId
});

const readerSettingsSchema = new mongoose.Schema(
  {
    fontSize: { type: Number, default: 16 },
    fontFamily: { type: String, default: "system" },
    backgroundColor: { type: String, default: "#ffffff" },
    lineHeight: { type: Number, default: 1.6 },
    theme: { type: String, enum: ["light", "dark", "sepia"], default: "light" },
  },
  { _id: false }
);

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountHolder: { type: String, default: "" },
  },
  { _id: false }
);

// Schema chính cho user
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // có thể trống nếu social login không có email
    password: { type: String }, // chỉ local login mới có

    // Mảng providers, mỗi provider lưu name + providerId (nếu có)
    providers: { type: [providerSchema], default: [{ name: "local" }] },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },

    // Số xu để mua chương
    coins: { type: Number, default: 0 },

    // Avatar URL
    avatarUrl: { type: String, default: "" },

    bankAccount: { type: bankAccountSchema, default: () => ({}) },

    unlockedChapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],

    readerSettings: { type: readerSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
