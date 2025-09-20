import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import FormData from "form-data";

dotenv.config();

const BASE_URL = "http://localhost:5000/api/auth";

const randomEmail = (prefix) => `${prefix}_${Date.now()}@example.com`;

const testUploadAvatar = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected for test");

  // Register and login to get token
  const email = randomEmail("testuser");
  const registerPayload = {
    username: "testuser",
    email,
    password: "123456",
  };

  console.log("\n--- Register and Login ---");
  let accessToken;
  try {
    await axios.post(`${BASE_URL}/register`, registerPayload);
    const res = await axios.post(`${BASE_URL}/login`, {
      email,
      password: "123456",
    });
    accessToken = res.data.accessToken;
    console.log("Login thành công, token:", accessToken);
  } catch (err) {
    console.log("Login lỗi:", err.response?.data || err.message);
    return;
  }

  // Create a dummy image file
  const dummyImagePath = path.join(process.cwd(), "dummy-avatar.png");
  // Create a simple 1x1 pixel PNG (base64 encoded small image)
  const dummyImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  );
  fs.writeFileSync(dummyImagePath, dummyImageBuffer);

  console.log("\n--- Test Upload Avatar - Happy Path ---");
  let stream;
  try {
    stream = fs.createReadStream(dummyImagePath);
    const formData = new FormData();
    formData.append("avatar", stream, "avatar.png");

    const res = await axios.post(`${BASE_URL}/upload-avatar`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
    });
    console.log("Upload avatar thành công:", res.data);

    // Verify avatarUrl updated in DB
    const userInDb = await User.findOne({ email });
    if (userInDb.avatarUrl && userInDb.avatarUrl === res.data.user.avatarUrl) {
      console.log("✅ avatarUrl được cập nhật trong database");
    } else {
      console.error("❌ avatarUrl không được cập nhật đúng trong database");
    }

    // Verify response structure
    if (res.data.message && res.data.user && res.data.user.avatarUrl) {
      console.log("✅ Response có cấu trúc đúng");
    } else {
      console.error("❌ Response không có cấu trúc đúng");
    }
  } catch (err) {
    console.log("Upload avatar lỗi:", err.response?.data || err.message);
  } finally {
    if (stream) {
      stream.destroy();
    }
  }

  console.log("\n--- Test Upload Avatar - No File ---");
  try {
    const formData = new FormData();
    const res = await axios.post(`${BASE_URL}/upload-avatar`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
    });
    console.error("❌ Upload không có file nhưng không bị lỗi");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log("✅ Upload không có file trả về lỗi 400 như mong đợi");
    } else {
      console.error("❌ Upload không có file trả về lỗi không đúng:", err.response?.data || err.message);
    }
  }

  console.log("\n--- Test Upload Avatar - Invalid Token ---");
  let invalidTokenStream;
  try {
    invalidTokenStream = fs.createReadStream(dummyImagePath);
    const formData = new FormData();
    formData.append("avatar", invalidTokenStream, "avatar.png");

    const res = await axios.post(`${BASE_URL}/upload-avatar`, formData, {
      headers: {
        Authorization: `Bearer invalidtoken`,
        ...formData.getHeaders(),
      },
    });
    console.error("❌ Upload với token không hợp lệ nhưng không bị lỗi");
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log("✅ Upload với token không hợp lệ trả về lỗi 401 như mong đợi");
    } else {
      console.error("❌ Upload với token không hợp lệ trả về lỗi không đúng:", err.response?.data || err.message);
    }
  } finally {
    if (invalidTokenStream) {
      invalidTokenStream.destroy();
    }
  }

  console.log("\n--- Test Upload Avatar - Invalid File Type ---");
  try {
    const invalidFilePath = path.join(process.cwd(), "dummy-text.txt");
    fs.writeFileSync(invalidFilePath, "This is not an image");

    const formData = new FormData();
    formData.append("avatar", fs.createReadStream(invalidFilePath), "dummy-text.txt");

    const res = await axios.post(`${BASE_URL}/upload-avatar`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });
    console.error("❌ Upload file không phải ảnh nhưng không bị lỗi");
    fs.unlinkSync(invalidFilePath);
  } catch (err) {
    console.log("✅ Upload file không phải ảnh trả về lỗi như mong đợi:", err.response?.data || err.message);
    // Clean up invalid file if it was created
    try {
      fs.unlinkSync(path.join(process.cwd(), "dummy-text.txt"));
    } catch (e) {
      // Ignore if file doesn't exist
    }
  }

  // Clean up
  fs.unlinkSync(dummyImagePath);
  await User.deleteMany({ email });
  console.log("\n✅ Clean up done");

  await mongoose.disconnect();
  console.log("✅ Test hoàn tất");
};

testUploadAvatar();
