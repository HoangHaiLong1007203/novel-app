import express from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  refreshToken, me, logout, uploadAvatar,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const upload = multer();
const router = express.Router();


// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.post("/refresh", refreshToken);
router.get("/me", authMiddleware, me);
router.post("/logout", authMiddleware, logout);
router.post("/upload-avatar", authMiddleware, upload.single("avatar"), uploadAvatar);

export default router;
