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
    const existingUser = await User.findOne({ email, provider: "local" });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      provider: "local",
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
    const user = await User.findOne({ email, provider: "local" });
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

    if (!email) {
      return res.status(400).json({ message: "Token Google không hợp lệ" });
    }

    let user = await User.findOne({ email, provider: "google" });
    if (!user) {
      user = await User.create({
        email,
        username: name,
        provider: "google",
        providerId: sub,
        password: "",
      });
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
  const { accessToken, userID } = req.body;
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${userID}?fields=id,name,email&access_token=${accessToken}`
    );
    const { email, name, id } = response.data;

    if (!email) {
      return res.status(400).json({ message: "Token Facebook không hợp lệ" });
    }

    let user = await User.findOne({ email, provider: "facebook" });
    if (!user) {
      user = await User.create({
        email,
        username: name,
        provider: "facebook",
        providerId: id,
        password: "",
      });
    }

    res.json({
      message: "Đăng nhập Facebook thành công",
      token: createToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.response?.data || err.message });
  }
};
