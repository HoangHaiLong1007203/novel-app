import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js"; // sửa đúng đường dẫn model User
import jwt from "jsonwebtoken";

dotenv.config();

const BASE_URL = "http://localhost:5000/api/auth";
const PROTECTED_URL = "http://localhost:5000/api/protected";

const randomEmail = (prefix) => `${prefix}_${Date.now()}@example.com`;

const testAuthAll = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected for test");

  // --- 1️⃣ Test Register ---
  const email = randomEmail("testuser");
  const registerPayload = {
    username: "testuser",
    email,
    password: "123456",
  };

  console.log("\n--- Test Register ---");
  try {
    const res = await axios.post(`${BASE_URL}/register`, registerPayload);
    console.log("Register thành công:", res.data);
  } catch (err) {
    console.log("Register lỗi:", err.response?.data || err.message);
  }

  // Test email đã tồn tại
  try {
    await axios.post(`${BASE_URL}/register`, registerPayload);
  } catch (err) {
    console.log("Lỗi như mong đợi (email tồn tại):", err.response?.data);
  }

  // --- 2️⃣ Test Login thường ---
  console.log("\n--- Test Login ---");
  let accessToken, refreshToken;
  try {
    const res = await axios.post(`${BASE_URL}/login`, {
      email,
      password: "123456",
    });
    console.log("Login thành công:", res.data);
    accessToken = res.data.accessToken;
    refreshToken = res.data.refreshToken;
  } catch (err) {
    console.log("Login lỗi:", err.response?.data || err.message);
  }

  // --- 2.1️⃣ Test Change Username ---
  console.log("\n--- Test Change Username ---");
  try {
    const res = await axios.put(`${BASE_URL}/change-username`, {
      newUsername: "newtestuser"
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("Change username thành công:", res.data);
  } catch (err) {
    console.log("Change username lỗi:", err.response?.data || err.message);
  }

  // --- 2.2️⃣ Test Change Password ---
  console.log("\n--- Test Change Password ---");
  try {
    const res = await axios.put(`${BASE_URL}/change-password`, {
      newPassword: "newpassword123"
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("Change password thành công:", res.data);
  } catch (err) {
    console.log("Change password lỗi:", err.response?.data || err.message);
  }

  // --- 3️⃣ Test Google Login ---
  console.log("\n--- Test Google Login ---");
  const googleEmail = randomEmail("googleuser");
  try {
    const res = await axios.post(`${BASE_URL}/google`, { email: googleEmail });
    console.log("Google login thành công:", res.data);
  } catch (err) {
    console.log("Google login lỗi:", err.response?.data || err.message);
  }

  // --- 4️⃣ Test Facebook Login ---
  console.log("\n--- Test Facebook Login ---");
  const fbEmail = randomEmail("fbuser");
  try {
    const res = await axios.post(`${BASE_URL}/facebook`, { email: fbEmail });
    console.log("Facebook login thành công:", res.data);
  } catch (err) {
    console.log("Facebook login lỗi:", err.response?.data || err.message);
  }

  // --- 5️⃣ Test Refresh Token ---
  console.log("\n--- Test Refresh Token ---");
  try {
    const res = await axios.post(`${BASE_URL}/refresh`, { token: refreshToken });
    console.log("Refresh token thành công:", res.data);
    accessToken = res.data.accessToken; // cập nhật accessToken mới
  } catch (err) {
    console.log("Refresh token lỗi:", err.response?.data || err.message);
  }

  // --- 6️⃣ Test Protected route ---
  console.log("\n--- Test Protected Route ---");
  try {
    const res = await axios.get(PROTECTED_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("Access protected route thành công:", res.data);
  } catch (err) {
    console.log("Protected route lỗi:", err.response?.data || err.message);
  }

  // --- 7️⃣ Test /me endpoint ---
  console.log("\n--- Test /me Endpoint ---");
  try {
    const res = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("/me thành công:", res.data);
  } catch (err) {
    console.log("/me lỗi:", err.response?.data || err.message);
  }

  // --- 8️⃣ Test /logout endpoint ---
  console.log("\n--- Test /logout Endpoint ---");
  try {
    const res = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("/logout thành công:", res.data);
  } catch (err) {
    console.log("/logout lỗi:", err.response?.data || err.message);
  }

  // --- Clean up: Xoá các user test ---
  await User.deleteMany({ email: { $in: [email, googleEmail, fbEmail] } });
  console.log("\n✅ Xoá tất cả user test xong");

  await mongoose.disconnect();
  console.log("✅ MongoDB disconnected, test hoàn tất");
};

testAuthAll();
