import * as authService from "../services/authService.js";

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
