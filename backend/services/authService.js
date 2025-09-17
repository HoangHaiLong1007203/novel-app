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