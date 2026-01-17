import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Novel from "../models/Novel.js";
import Bookmark from "../models/Bookmark.js";

dotenv.config();

const BASE = process.env.BASE_URL || 'https://localhost:5000';
const BASE_URL = `${BASE}/api/bookmarks`;
const AUTH_URL = `${BASE}/api/auth`;

const randomEmail = (prefix) => `${prefix}_${Date.now()}@example.com`;

const testBookmarkAll = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected for bookmark test");

  let accessToken, userId, testNovelId;

  try {
    // --- Setup: Create test user and novel ---
    const email = randomEmail("bookmarkuser");
    const userPayload = {
      username: "bookmarktestuser",
      email,
      password: "123456",
    };

    // Register user
    const registerRes = await axios.post(`${AUTH_URL}/register`, userPayload);
    console.log("✅ Test user registered successfully");
    accessToken = registerRes.data.accessToken;

    // Get userId from database instead of JWT
    const testUser = await User.findOne({ email });
    userId = testUser._id;
    console.log("✅ Test user ID from database:", userId);

    // Login to get fresh token
    const loginRes = await axios.post(`${AUTH_URL}/login`, {
      email,
      password: "123456",
    });
    accessToken = loginRes.data.accessToken;
    console.log("✅ Test user logged in");

    // Create test novel with correct schema
    const testNovel = new Novel({
      title: "Test Novel for Bookmark",
      author: userId,
      poster: userId,
      type: "sáng tác",
      description: "Test description",
      genres: ["Test"],
      status: "còn tiếp",
      coverImageUrl: "test.jpg"
    });
    await testNovel.save();
    testNovelId = testNovel._id;
    console.log("✅ Test novel created:", testNovelId);

    // --- 1️⃣ Test Add Bookmark ---
    console.log("\n--- Test Add Bookmark ---");
    try {
      const res = await axios.post(`${BASE_URL}/${testNovelId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Add bookmark thành công:", res.data.message);
    } catch (err) {
      console.log("❌ Add bookmark lỗi:", err.response?.data || err.message);
    }

    // Test add bookmark for non-existent novel
    try {
      await axios.post(`${BASE_URL}/507f1f77bcf86cd799439011`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (novel không tồn tại):", err.response?.data.message);
    }

    // Test add duplicate bookmark
    try {
      await axios.post(`${BASE_URL}/${testNovelId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (duplicate bookmark):", err.response?.data.message);
    }

    // --- 2️⃣ Test Get User Bookmarks ---
    console.log("\n--- Test Get User Bookmarks ---");
    try {
      const res = await axios.get(`${BASE_URL}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Get bookmarks thành công:", res.data.bookmarks.length, "bookmarks");
      console.log("📊 Pagination info:", res.data.pagination);
    } catch (err) {
      console.log("❌ Get bookmarks lỗi:", err.response?.data || err.message);
    }

    // Test with pagination
    try {
      const res = await axios.get(`${BASE_URL}?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Get bookmarks with pagination thành công:", res.data.bookmarks.length, "bookmarks");
    } catch (err) {
      console.log("❌ Get bookmarks with pagination lỗi:", err.response?.data || err.message);
    }

    // --- 3️⃣ Test Remove Bookmark ---
    console.log("\n--- Test Remove Bookmark ---");
    try {
      const res = await axios.delete(`${BASE_URL}/${testNovelId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Remove bookmark thành công:", res.data.message);
    } catch (err) {
      console.log("❌ Remove bookmark lỗi:", err.response?.data || err.message);
    }

    // Test remove non-existent bookmark
    try {
      await axios.delete(`${BASE_URL}/${testNovelId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (bookmark không tồn tại):", err.response?.data.message);
    }

    // --- 4️⃣ Test Get Bookmarks After Removal ---
    console.log("\n--- Test Get Bookmarks After Removal ---");
    try {
      const res = await axios.get(`${BASE_URL}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Get bookmarks after removal thành công:", res.data.bookmarks.length, "bookmarks");
    } catch (err) {
      console.log("❌ Get bookmarks after removal lỗi:", err.response?.data || err.message);
    }

    // --- 5️⃣ Test Without Authentication ---
    console.log("\n--- Test Without Authentication ---");
    try {
      await axios.post(`${BASE_URL}/${testNovelId}`, {});
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (no auth):", err.response?.status);
    }

    try {
      await axios.get(`${BASE_URL}`);
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (no auth):", err.response?.status);
    }

    try {
      await axios.delete(`${BASE_URL}/${testNovelId}`);
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (no auth):", err.response?.status);
    }

    console.log("\n🎉 Tất cả test bookmark hoàn thành!");

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    // --- Cleanup ---
    await Bookmark.deleteMany({ user: userId });
    await Novel.findByIdAndDelete(testNovelId);
    await User.findByIdAndDelete(userId);
    console.log("✅ Cleanup completed");

    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected, bookmark test hoàn tất");
  }
};

testBookmarkAll();
