import mongoose from "mongoose";

// Schema con cho từng provider
const providerSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ["local", "google", "facebook"] },
  providerId: { type: String }, // chỉ social login mới có providerId
});

// Schema chính cho user
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // có thể trống nếu social login không có email
    password: { type: String }, // chỉ local login mới có

    // Mảng providers, mỗi provider lưu name + providerId (nếu có)
    providers: { type: [providerSchema], default: [{ name: "local" }] },

    // Số xu để mua chương
    coins: { type: Number, default: 0 },

    // Avatar URL
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
