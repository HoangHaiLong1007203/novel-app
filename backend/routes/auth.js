import express from "express";
import { 
  registerUser, 
  loginUser, 
  googleLogin, 
  facebookLogin 
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Đăng ký / login thông thường
router.post("/register", registerUser);
router.post("/login", loginUser);

// Login bằng OAuth
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);

router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

export default router;
