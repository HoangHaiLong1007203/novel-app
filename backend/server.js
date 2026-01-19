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
import genreRoutes from "./routes/genre.js";
import adminDashboardRoutes from "./routes/adminDashboard.js";
import adminUserRoutes from "./routes/adminUsers.js";
import reportRoutes from "./routes/report.js";
import requireAdmin from "./middlewares/roleMiddleware.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authMiddleware from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
import fs from "fs";
import path from "path";
import https from "https";

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
app.use("/api/genres", genreRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/dashboard", authMiddleware, requireAdmin, adminDashboardRoutes);
app.use("/api/admin/users", authMiddleware, requireAdmin, adminUserRoutes);

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
  // Optional HTTPS support for local development
  const useHttpsEnv = String(process.env.USE_HTTPS || "").toLowerCase() === "true";

  // Allow explicit env paths for certs (preferred) or fall back to candidate locations
  const envCertPath = process.env.SSL_CERT_PATH || process.env.SSL_CERT;
  const envKeyPath = process.env.SSL_KEY_PATH || process.env.SSL_KEY;

  const candidateCertPaths = [
    envCertPath,
    path.resolve(process.cwd(), "localhost.pem"),
    path.resolve(process.cwd(), "../localhost.pem"),
  ].filter(Boolean);
  const candidateKeyPaths = [
    envKeyPath,
    path.resolve(process.cwd(), "localhost-key.pem"),
    path.resolve(process.cwd(), "../localhost-key.pem"),
  ].filter(Boolean);

  let certPath = null;
  let keyPath = null;
  for (const p of candidateCertPaths) {
    if (p && fs.existsSync(p)) {
      certPath = p;
      break;
    }
  }
  for (const p of candidateKeyPaths) {
    if (p && fs.existsSync(p)) {
      keyPath = p;
      break;
    }
  }

  const haveCerts = Boolean(certPath && keyPath);

  if (useHttpsEnv) {
    if (!haveCerts) {
      console.warn(
        "HTTPS requested (USE_HTTPS=true) but certificates not found in candidate locations:\n",
        candidateCertPaths,
        candidateKeyPaths
      );
      console.warn(
        "Falling back to HTTP. To enable HTTPS, set SSL_CERT_PATH/SSL_KEY_PATH or place cert/key at project root."
      );
    } else {
      try {
        const cert = fs.readFileSync(certPath);
        const key = fs.readFileSync(keyPath);
        const server = https.createServer({ key, cert }, app);
        server.listen(PORT, () =>
          console.log(
            `🚀 HTTPS server running at https://localhost:${PORT} (cert: ${certPath}, key: ${keyPath})`
          )
        );
        return;
      } catch (err) {
        console.error("Failed to start HTTPS server:", err);
        console.warn("Falling back to HTTP.");
      }
    }
  } else if (haveCerts) {
    console.log(
      `ℹ️  Certificates found but USE_HTTPS=false; starting HTTP instead (cert: ${certPath}, key: ${keyPath}).`
    );
  }

  const host = process.env.HOST || "localhost";
  app.listen(PORT, () => console.log(`🚀 Server running at http://${host}:${PORT}`));
});
