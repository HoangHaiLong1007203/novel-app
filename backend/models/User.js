import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // Với login thường sẽ có password (hash), login Google/FB có thể để trống
    password: { type: String },

    // Dùng để phân biệt cách đăng nhập
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    // ID từ Google/Facebook (nếu có)
    providerId: { type: String },

    // Số xu để mua chương
    coins: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
