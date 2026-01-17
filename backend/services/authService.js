import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/jwt.js";
import AppError from "../middlewares/errorHandler.js"; // import AppError
import Novel from "../models/Novel.js";
import { normalizeText } from "../utils/normalize.js";
import axios from "axios";

// Register
export const register = async ({ username, email, password }) => {
  // Validate inputs
  if (!username || !email || !password) {
    throw new AppError("Username, email và password là bắt buộc", 400);
  }

  try {
    // check username trước
    const existingUsername = await User.findOne({ username });
    if (existingUsername) throw new AppError("Username đã tồn tại", 400);

    // check email
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

// Google login - verifies id_token from client (preferred) or falls back to email
export const loginWithGoogle = async ({ idToken, email }) => {
  try {
    if (!idToken && !email) throw new AppError("Missing idToken or email", 400);

    let verifiedEmail = email;
    let providerId = null;

    if (idToken) {
      // Verify token with Google's tokeninfo endpoint
      const resp = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
        params: { id_token: idToken },
      });
      const data = resp.data;
      // If GOOGLE_CLIENT_ID is set, ensure audience matches
      if (process.env.GOOGLE_CLIENT_ID && data.aud && data.aud !== process.env.GOOGLE_CLIENT_ID) {
        throw new AppError("Invalid Google token audience", 401);
      }
      verifiedEmail = data.email;
      providerId = data.sub;
    }

    let user = await User.findOne({ email: verifiedEmail, "providers.name": "google" });
    if (!user) {
      user = await User.create({
        username: verifiedEmail.split("@")[0],
        email: verifiedEmail,
        providers: [{ name: "google", providerId }],
      });
    } else {
      // ensure providerId is stored if available
      if (providerId && !user.providers.some((p) => p.name === "google" && p.providerId)) {
        user.providers = user.providers.map((p) => (p.name === "google" ? { ...p, providerId: p.providerId || providerId } : p));
        await user.save();
      }
    }

    return {
      accessToken: generateAccessToken({ userId: user._id }),
      refreshToken: generateRefreshToken({ userId: user._id }),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Google login failed: " + err.message, 500);
  }
};

// Facebook login - verifies access token from client (preferred) or falls back to email
export const loginWithFacebook = async ({ accessToken, email }) => {
  try {
    if (!accessToken && !email) throw new AppError("Missing accessToken or email", 400);

    let verifiedEmail = email;
    let providerId = null;

    if (accessToken) {
      // If app credentials present, validate token with debug_token
      if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
        const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
        const debugResp = await axios.get(`https://graph.facebook.com/debug_token`, {
          params: { input_token: accessToken, access_token: appToken },
        });
        const dbg = debugResp.data.data;
        if (!dbg || dbg.app_id !== process.env.FACEBOOK_APP_ID || !dbg.is_valid) {
          throw new AppError("Invalid Facebook access token", 401);
        }
      }

      // Fetch user profile to get email and id
      const resp = await axios.get(`https://graph.facebook.com/me`, {
        params: { access_token: accessToken, fields: "id,email" },
      });
      const data = resp.data;
      verifiedEmail = data.email;
      providerId = data.id;
    }

    let user = await User.findOne({ email: verifiedEmail, "providers.name": "facebook" });
    if (!user) {
      user = await User.create({
        username: (verifiedEmail || `fb_${providerId}`).split("@")[0],
        email: verifiedEmail,
        providers: [{ name: "facebook", providerId }],
      });
    } else {
      if (providerId && !user.providers.some((p) => p.name === "facebook" && p.providerId)) {
        user.providers = user.providers.map((p) => (p.name === "facebook" ? { ...p, providerId: p.providerId || providerId } : p));
        await user.save();
      }
    }

    return {
      accessToken: generateAccessToken({ userId: user._id }),
      refreshToken: generateRefreshToken({ userId: user._id }),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Facebook login failed: " + err.message, 500);
  }
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

  // Also update any Novel documents that reference this user as the author
  try {
    await Novel.updateMany(
      { authorUser: userId, type: "sáng tác" },
      { $set: { author: trimmedUsername, authorNormalized: normalizeText(trimmedUsername) } }
    );
  } catch (err) {
    // Log and continue; username change itself succeeded. Do not block the user.
    console.error("Failed to update novels' author fields after username change:", err);
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
