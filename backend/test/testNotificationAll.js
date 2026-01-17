import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Novel from "../models/Novel.js";
import Chapter from "../models/Chapter.js";
import Notification from "../models/Notification.js";

dotenv.config();

const BASE = process.env.BASE_URL || 'https://localhost:5000';
const BASE_URL = `${BASE}/api/notifications`;
const AUTH_URL = `${BASE}/api/auth`;

const randomEmail = (prefix) => `${prefix}_${Date.now()}@example.com`;

const testNotificationAll = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected for notification test");

  let accessToken, userId, testNovelId, testChapterId, testNotifications = [];

  try {
    // --- Setup: Create test user, novel, chapter, and notifications ---
    const email = randomEmail("notificationuser");
    const userPayload = {
      username: "notificationtestuser",
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
      title: "Test Novel for Notification",
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

    // Create test chapter
    const testChapter = new Chapter({
      title: "Test Chapter 1",
      chapterNumber: 1,
      content: "Test content",
      novel: testNovelId
    });
    await testChapter.save();
    testChapterId = testChapter._id;
    console.log("✅ Test chapter created:", testChapterId);

    // Create test notifications
    const notification1 = new Notification({
      user: userId,
      title: "New Chapter Available",
      message: "Chapter 1 of Test Novel has been released",
      type: "new_chapter",
      relatedNovel: testNovelId,
      relatedChapter: testChapterId,
      isRead: false
    });
    await notification1.save();
    testNotifications.push(notification1._id);

    const notification2 = new Notification({
      user: userId,
      title: "System Update",
      message: "System maintenance completed",
      type: "system",
      isRead: false
    });
    await notification2.save();
    testNotifications.push(notification2._id);

    const notification3 = new Notification({
      user: userId,
      title: "Info Message",
      message: "Welcome to our platform",
      type: "info",
      isRead: true
    });
    await notification3.save();
    testNotifications.push(notification3._id);

    console.log("✅ Test notifications created:", testNotifications.length);

    // --- 1️⃣ Test Get User Notifications ---
    console.log("\n--- Test Get User Notifications ---");
    try {
      const res = await axios.get(`${BASE_URL}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Get notifications thành công:", res.data.notifications.length, "notifications");
      console.log("📊 Unread count:", res.data.unreadCount);
      console.log("📊 Pagination info:", res.data.pagination);
    } catch (err) {
      console.log("❌ Get notifications lỗi:", err.response?.data || err.message);
    }

    // Test with pagination
    try {
      const res = await axios.get(`${BASE_URL}?page=1&limit=2`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Get notifications with pagination thành công:", res.data.notifications.length, "notifications");
    } catch (err) {
      console.log("❌ Get notifications with pagination lỗi:", err.response?.data || err.message);
    }

    // Test filter by read status
    try {
      const res = await axios.get(`${BASE_URL}?isRead=false`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Get unread notifications thành công:", res.data.notifications.length, "notifications");
    } catch (err) {
      console.log("❌ Get unread notifications lỗi:", err.response?.data || err.message);
    }

    // --- 2️⃣ Test Mark Single Notification as Read ---
    console.log("\n--- Test Mark Single Notification as Read ---");
    try {
      const res = await axios.put(`${BASE_URL}/${testNotifications[0]}/read`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Mark single notification as read thành công:", res.data.message);
    } catch (err) {
      console.log("❌ Mark single notification as read lỗi:", err.response?.data || err.message);
    }

    // Test mark non-existent notification as read
    try {
      await axios.put(`${BASE_URL}/507f1f77bcf86cd799439011/read`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (notification không tồn tại):", err.response?.data.message);
    }

    // --- 3️⃣ Test Mark Multiple Notifications as Read ---
    console.log("\n--- Test Mark Multiple Notifications as Read ---");
    try {
      const res = await axios.put(`${BASE_URL}/mark-multiple-read`, {
        notificationIds: [testNotifications[1], testNotifications[2]]
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Mark multiple notifications as read thành công:", res.data.message);
    } catch (err) {
      console.log("❌ Mark multiple notifications as read lỗi:", err.response?.data || err.message);
    }

    // Test with empty array
    try {
      await axios.put(`${BASE_URL}/mark-multiple-read`, {
        notificationIds: []
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (empty array):", err.response?.data.message);
    }

    // --- 4️⃣ Test Mark All Notifications as Read ---
    console.log("\n--- Test Mark All Notifications as Read ---");
    try {
      const res = await axios.put(`${BASE_URL}/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Mark all notifications as read thành công:", res.data.message);
    } catch (err) {
      console.log("❌ Mark all notifications as read lỗi:", err.response?.data || err.message);
    }

    // --- 5️⃣ Test Get Notifications After Mark as Read ---
    console.log("\n--- Test Get Notifications After Mark as Read ---");
    try {
      const res = await axios.get(`${BASE_URL}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("✅ Get notifications after mark as read thành công:", res.data.notifications.length, "notifications");
      console.log("📊 Updated unread count:", res.data.unreadCount);
    } catch (err) {
      console.log("❌ Get notifications after mark as read lỗi:", err.response?.data || err.message);
    }

    // --- 6️⃣ Test Without Authentication ---
    console.log("\n--- Test Without Authentication ---");
    try {
      await axios.get(`${BASE_URL}`);
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (no auth):", err.response?.status);
    }

    try {
      await axios.put(`${BASE_URL}/${testNotifications[0]}/read`, {});
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (no auth):", err.response?.status);
    }

    try {
      await axios.put(`${BASE_URL}/mark-multiple-read`, { notificationIds: [] });
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (no auth):", err.response?.status);
    }

    try {
      await axios.put(`${BASE_URL}/mark-all-read`, {});
    } catch (err) {
      console.log("✅ Lỗi như mong đợi (no auth):", err.response?.status);
    }

    console.log("\n🎉 Tất cả test notification hoàn thành!");

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    // --- Cleanup ---
    await Notification.deleteMany({ _id: { $in: testNotifications } });
    await Chapter.findByIdAndDelete(testChapterId);
    await Novel.findByIdAndDelete(testNovelId);
    await User.findByIdAndDelete(userId);
    console.log("✅ Cleanup completed");

    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected, notification test hoàn thành");
  }
};

testNotificationAll();
