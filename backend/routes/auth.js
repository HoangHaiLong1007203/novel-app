import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  refreshToken,
} from "../controllers/authController.js";

const router = express.Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.post("/refresh", refreshToken);

export default router;
