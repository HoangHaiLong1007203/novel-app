import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js"; // chú ý đường dẫn đúng
import authMiddleware from "./middlewares/authMiddleware.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/api/ping", (req, res) => {
  res.json({ message: "Backend Express is running!" });
});
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "Bạn đã auth thành công!", user: req.user });
});

// Connect MongoDB & Start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

// ⚠️ đặt errorHandler **sau tất cả routes và middleware**
app.use(errorHandler);
