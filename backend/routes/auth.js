import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  refreshToken, me, logout, uploadAvatar,
  changeUsername,
  changePassword,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { handleUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();


// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.post("/refresh", refreshToken);
router.get("/me", authMiddleware, me);
router.post("/logout", authMiddleware, logout);
router.post("/upload-avatar", authMiddleware, handleUpload, uploadAvatar);

router.put("/change-username", authMiddleware, changeUsername);
router.put("/change-password", authMiddleware, changePassword);

export default router;
