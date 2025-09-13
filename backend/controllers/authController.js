import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

// Helper tạo JWT
const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// -------------------- Đăng ký --------------------
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({
      email,
      "providers.name": "local",
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      providers: [{ name: "local" }],
    });

    res
      .status(201)
      .json({ message: "Đăng ký thành công", token: createToken(newUser._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------- Login thường --------------------
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      email,
      "providers.name": "local",
    });
    if (!user || !user.password) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    res.json({
      message: "Đăng nhập thành công",
      token: createToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------- Login Google --------------------
export const googleLogin = async (req, res) => {
  const { tokenId } = req.body;
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenId}`
    );
    const { email, name, sub } = response.data;

    if (!sub) {
      return res.status(400).json({ message: "Token Google không hợp lệ" });
    }

    // Tìm user theo email trước
    let user = email ? await User.findOne({ email }) : null;

    if (!user) {
      // Tạo user mới nếu chưa có
      user = await User.create({
        email: email || "",
        username: name || "Google User",
        providers: [{ name: "google", providerId: sub }],
        password: "",
      });
    } else {
      // Kiểm tra xem provider Google đã tồn tại chưa, nếu chưa thì thêm
      const hasGoogle = user.providers.some((p) => p.name === "google");
      if (!hasGoogle) {
        user.providers.push({ name: "google", providerId: sub });
        await user.save();
      }
    }

    res.json({
      message: "Đăng nhập Google thành công",
      token: createToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.response?.data || err.message });
  }
};

// -------------------- Login Facebook --------------------
export const facebookLogin = async (req, res) => {
  const { accessToken } = req.body;
  try {
    // Dùng "me" để lấy id, name, email
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );
    const { email, name, id } = response.data;

    if (!id) {
      return res.status(400).json({ message: "Token Facebook không hợp lệ" });
    }

    // Tìm user theo email trước
    let user = email ? await User.findOne({ email }) : null;

    if (!user) {
      // Tạo user mới nếu chưa có
      user = await User.create({
        email: email || "",
        username: name || "Facebook User",
        providers: [{ name: "facebook", providerId: id }],
        password: "",
      });
    } else {
      // Kiểm tra xem provider Facebook đã tồn tại chưa, nếu chưa thì thêm
      const hasFacebook = user.providers.some((p) => p.name === "facebook");
      if (!hasFacebook) {
        user.providers.push({ name: "facebook", providerId: id });
        await user.save();
      }
    }

    res.json({
      message: "Đăng nhập Facebook thành công",
      token: createToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.response?.data || err.message });
  }
};
