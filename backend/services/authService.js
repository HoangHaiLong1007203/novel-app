import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/jwt.js";
import AppError from "../middlewares/errorHandler.js"; // import AppError

// Register
export const register = async ({ username, email, password }) => {
  // Validate inputs
  if (!username || !email || !password) {
    throw new AppError("Username, email và password là bắt buộc", 400);
  }

  try {
    // check email trước
    const existingUser = await User.findOne({ email, "providers.name": "local" });
    if (existingUser) throw new AppError("Email đã tồn tại", 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      providers: [{ name: "local" }],
    });

    return {
      accessToken: generateAccessToken({ userId: newUser._id }),
      refreshToken: generateRefreshToken({ userId: newUser._id }),
    };
  } catch (err) {
    // nếu có lỗi khi hash, find, hoặc create thì sẽ không tạo user
    if (err instanceof AppError) throw err;
    throw new AppError("Đăng ký thất bại: " + err.message, 500);
  }
};

// Login thường
export const login = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email, "providers.name": "local" });
    if (!user || !user.password) throw new AppError("Sai email hoặc mật khẩu", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Sai email hoặc mật khẩu", 401);

    return {
      accessToken: generateAccessToken({ userId: user._id }),
      refreshToken: generateRefreshToken({ userId: user._id }),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Đăng nhập thất bại: " + err.message, 500);
  }
};

// Google login
export const loginWithGoogle = async ({ email }) => {
  let user = await User.findOne({ email, "providers.name": "google" });
  if (!user) {
    user = await User.create({
      username: email.split("@")[0],
      email,
      providers: [{ name: "google" }],
    });
  }
  return {
    accessToken: generateAccessToken({ userId: user._id }),
    refreshToken: generateRefreshToken({ userId: user._id }),
  };
};

// Facebook login
export const loginWithFacebook = async ({ email }) => {
  let user = await User.findOne({ email, "providers.name": "facebook" });
  if (!user) {
    user = await User.create({
      username: email.split("@")[0],
      email,
      providers: [{ name: "facebook" }],
    });
  }
  return {
    accessToken: generateAccessToken({ userId: user._id }),
    refreshToken: generateRefreshToken({ userId: user._id }),
  };
};

// Refresh token
export const refresh = async (token) => {
  try {
    const decoded = verifyToken(token, process.env.REFRESH_TOKEN_SECRET);
    return {
      accessToken: generateAccessToken({ userId: decoded.userId }),
      refreshToken: generateRefreshToken({ userId: decoded.userId }),
    };
  } catch {
    throw new AppError("Refresh token không hợp lệ", 401);
  }
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

export const logoutUser = async () => {
  // Stateless logout: chỉ để client xóa token
  return { message: "Logged out successfully" };
};

// Validate username: trim spaces, check uniqueness
export const changeUsername = async (userId, newUsername) => {
  if (!newUsername || typeof newUsername !== "string") {
    throw new AppError("Username không hợp lệ", 400);
  }
  const trimmedUsername = newUsername.trim();
  if (trimmedUsername.length === 0) {
    throw new AppError("Username không được để trống", 400);
  }
  // Check trùng username (case sensitive, tiếng Việt có dấu)
  const existingUser = await User.findOne({ username: trimmedUsername, _id: { $ne: userId } });
  if (existingUser) {
    throw new AppError("Username đã tồn tại", 400);
  }
  // Update username
  const updatedUser = await User.findByIdAndUpdate(userId, { username: trimmedUsername }, { new: true }).select("-password");
  if (!updatedUser) {
    throw new AppError("User không tồn tại", 404);
  }
  return updatedUser;
};

// Validate password: min 6, max 128, có ít nhất 1 chữ và 1 số, không dấu cách
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]{6,128}$/;

export const changePassword = async (userId, newPassword) => {
  if (!newPassword || typeof newPassword !== "string") {
    throw new AppError("Password không hợp lệ", 400);
  }
  if (newPassword.length < 6 || newPassword.length > 128) {
    throw new AppError("Password phải từ 6 đến 128 ký tự", 400);
  }
  if (!passwordRegex.test(newPassword)) {
    throw new AppError("Password phải bao gồm ít nhất một chữ cái và một số, không có dấu cách", 400);
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  // Update password
  const updatedUser = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true }).select("-password");
  if (!updatedUser) {
    throw new AppError("User không tồn tại", 404);
  }
  return updatedUser;
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

const colorHexRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const allowedThemes = ["light", "dark", "sepia"];
const allowedFonts = ["Literata", "Space Grotesk", "Be Vietnam Pro", "Merriweather", "system"];

const sanitizeReaderSettingsPayload = (payload = {}) => {
  const sanitized = {};
  if (payload.fontSize !== undefined) {
    const size = Number(payload.fontSize);
    if (!Number.isNaN(size)) {
      sanitized.fontSize = clamp(size, 12, 28);
    }
  }
  if (payload.lineHeight !== undefined) {
    const lineHeight = Number(payload.lineHeight);
    if (!Number.isNaN(lineHeight)) {
      sanitized.lineHeight = clamp(lineHeight, 1.2, 2.4);
    }
  }
  if (payload.fontFamily && allowedFonts.includes(payload.fontFamily)) {
    sanitized.fontFamily = payload.fontFamily;
  }
  if (payload.theme && allowedThemes.includes(payload.theme)) {
    sanitized.theme = payload.theme;
  }
  if (payload.backgroundColor && typeof payload.backgroundColor === "string") {
    if (colorHexRegex.test(payload.backgroundColor)) {
      sanitized.backgroundColor = payload.backgroundColor;
    }
  }
  return sanitized;
};

export const getReaderSettings = async (userId) => {
  const user = await User.findById(userId).select("readerSettings");
  if (!user) {
    throw new AppError("User không tồn tại", 404);
  }
  return user.readerSettings || {};
};

export const updateReaderSettings = async (userId, payload) => {
  const sanitized = sanitizeReaderSettingsPayload(payload);
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User không tồn tại", 404);
  }
  const current = user.readerSettings ? user.readerSettings.toObject?.() || user.readerSettings : {};
  user.readerSettings = { ...current, ...sanitized };
  await user.save();
  return user.readerSettings;
};
