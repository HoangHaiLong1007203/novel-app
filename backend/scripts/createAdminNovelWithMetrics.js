import "dotenv/config";
import axios from "axios";
import mongoose from "mongoose";
import Novel from "../models/Novel.js";

const RAW_BASE = process.env.BASE_URL || "http://localhost:5000";
const BASE_URL = RAW_BASE.replace(/\/+$/, "").endsWith("/api")
  ? RAW_BASE.replace(/\/+$/, "")
  : `${RAW_BASE.replace(/\/+$/, "")}/api`;

// Admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "adminpassword";

// ====== NHẬP THÔNG TIN TRUYỆN MỚI TẠI ĐÂY ======
// Để trống và điền lại trước khi chạy script.
const NOVEL_PAYLOAD = {
  title: "Toàn chức pháp sư",
  description: "",
  genres: "Huyền Huyễn", // ví dụ: "fantasy,action"
  type: "dịch/đăng lại", // "sáng tác" | "dịch/đăng lại"
  status: "hoàn thành", // "còn tiếp" | "tạm ngưng" | "hoàn thành"
  author: "Loạn", // chỉ bắt buộc khi type = "dịch/đăng lại"
};

// ====== NHẬP CHỈ SỐ ======
const TARGET_VIEWS = 891; // số lượt đọc
const TARGET_NOMINATION_COUNT = 262; // số đề cử

const ensureFilled = (value, label) => {
  if (!value || !String(value).trim()) {
    throw new Error(`Thiếu ${label}. Vui lòng điền vào trước khi chạy script.`);
  }
};

const validatePayload = () => {
  ensureFilled(NOVEL_PAYLOAD.title, "title");
  ensureFilled(NOVEL_PAYLOAD.type, "type");

  if (!["sáng tác", "dịch/đăng lại"].includes(NOVEL_PAYLOAD.type)) {
    throw new Error("type phải là 'sáng tác' hoặc 'dịch/đăng lại'.");
  }

  if (NOVEL_PAYLOAD.type === "dịch/đăng lại") {
    ensureFilled(NOVEL_PAYLOAD.author, "author");
  }

  if (TARGET_VIEWS < 0 || TARGET_NOMINATION_COUNT < 0) {
    throw new Error("views và nominationCount phải >= 0.");
  }
};

const main = async () => {
  validatePayload();

  if (!process.env.MONGO_URI) {
    throw new Error("Thiếu MONGO_URI trong backend/.env");
  }

  console.log("🔐 Đăng nhập admin...");
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  const accessToken = loginRes.data?.accessToken;
  if (!accessToken) {
    throw new Error("Không lấy được accessToken từ /auth/login");
  }

  console.log("📘 Tạo truyện mới (không ảnh bìa)...");
  const createRes = await axios.post(`${BASE_URL}/novels`, NOVEL_PAYLOAD, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const novelId = createRes.data?.novel?._id;
  if (!novelId) {
    throw new Error("Không lấy được novelId sau khi tạo truyện");
  }

  console.log("🧮 Cập nhật views/nominationCount trực tiếp trong DB...");
  await mongoose.connect(process.env.MONGO_URI);
  const updated = await Novel.findByIdAndUpdate(
    novelId,
    { $set: { views: TARGET_VIEWS, nominationCount: TARGET_NOMINATION_COUNT } },
    { new: true }
  );

  console.log("✅ Hoàn tất:", {
    id: updated?._id?.toString(),
    title: updated?.title,
    views: updated?.views,
    nominationCount: updated?.nominationCount,
  });
};

main()
  .catch((err) => {
    console.error("❌ Lỗi:", err.response?.data || err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });
