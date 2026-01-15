import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import novelRoutes from "./routes/novel.js";
import chapterRoutes from "./routes/chapterAccess.js";
import bookmarkRoutes from "./routes/bookmark.js";
import notificationRoutes from "./routes/notification.js";
import commentRoutes from "./routes/comment.js";
import reviewRoutes from "./routes/review.js";
import readingProgressRoutes from "./routes/readingProgress.js";
import paymentRoutes from "./routes/payment.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authMiddleware from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith("/api/payments/webhook/stripe")) {
        req.rawBody = buf;
      }
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/novels", novelRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reading-progress", readingProgressRoutes);
app.use("/api/payments", paymentRoutes);

// Test route
app.get("/api/ping", (req, res) => {
  res.json({ message: "Backend Express is running!" });
});
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "Bạn đã auth thành công!", user: req.user });
});

// Error handler
app.use(errorHandler);

// Connect MongoDB & Start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
