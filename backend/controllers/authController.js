import * as authService from "../services/authService.js";
import { uploadToCloudinary } from "../services/uploadService.js";
import User from "../models/User.js";
import AppError from "../middlewares/errorHandler.js";

export const registerUser = async (req, res, next) => {
  try {
    const tokens = await authService.register(req.body);
    res.status(201).json(tokens);
  } catch (err) {
    next(err); // chuyển lỗi lên errorHandler
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const tokens = await authService.login(req.body);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const tokens = await authService.loginWithGoogle(req.body);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

export const facebookLogin = async (req, res, next) => {
  try {
    const tokens = await authService.loginWithFacebook(req.body);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.body.token);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.userId);
    res.json(user);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Internal Server Error", 500));
    }
  }
};

export const logout = async (req, res, next) => {
  try {
    const result = await authService.logoutUser();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    // Upload to Cloudinary
    const avatarUrl = await uploadToCloudinary(req.file.buffer);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatarUrl },
      { new: true }
    ).select("-password");

    res.json({ message: "Avatar uploaded successfully", user });
  } catch (error) {
    next(error);
  }
};

export const changeUsername = async (req, res, next) => {
  try {
    const { newUsername } = req.body;
    const user = await authService.changeUsername(req.user.userId, newUsername);
    res.json({ message: "Username changed successfully", user });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await authService.changePassword(req.user.userId, newPassword);
    res.json({ message: "Password changed successfully", user });
  } catch (err) {
    next(err);
  }
};

export const checkUsername = async (req, res, next) => {
  try {
    const username = req.query.username;
    if (!username || typeof username !== "string") {
      return res.json({ available: false });
    }
    const trimmed = username.trim();
    if (trimmed.length === 0) return res.json({ available: false });
    const existing = await User.findOne({ username: trimmed });
    return res.json({ available: !existing });
  } catch (err) {
    next(err);
  }
};

export const getReaderSettings = async (req, res, next) => {
  try {
    const settings = await authService.getReaderSettings(req.user.userId);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateReaderSettings = async (req, res, next) => {
  try {
    const settings = await authService.updateReaderSettings(req.user.userId, req.body);
    res.json({ message: "Reader settings updated", settings });
  } catch (error) {
    next(error);
  }
};

export const updateBankAccount = async (req, res, next) => {
  try {
    const { bankName, accountNumber, accountHolder } = req.body || {};
    const trimmedBankName = typeof bankName === "string" ? bankName.trim() : "";
    const trimmedAccountNumber = typeof accountNumber === "string" ? accountNumber.trim() : "";
    const trimmedAccountHolder = typeof accountHolder === "string" ? accountHolder.trim() : "";

    const isAllEmpty = !trimmedBankName && !trimmedAccountNumber && !trimmedAccountHolder;
    if (!isAllEmpty && (!trimmedBankName || !trimmedAccountNumber || !trimmedAccountHolder)) {
      throw new AppError("Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng", 400);
    }

    const update = isAllEmpty
      ? { bankAccount: { bankName: "", accountNumber: "", accountHolder: "" } }
      : { bankAccount: { bankName: trimmedBankName, accountNumber: trimmedAccountNumber, accountHolder: trimmedAccountHolder } };

    const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true }).select("-password");
    if (!user) {
      throw new AppError("User không tồn tại", 404);
    }
    res.json({ message: "Đã cập nhật tài khoản ngân hàng", user });
  } catch (error) {
    next(error);
  }
};
