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
