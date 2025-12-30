# Copilot / AI agent instructions for novel-app (Bilingual)

Important: this file is bilingual (English + Tiếng Việt). The codebase contains Vietnamese user-facing literals — DO NOT change those string literals in code. Examples to preserve exactly: `sáng tác`, `dịch/đăng lại`, `còn tiếp`, `tạm ngưng`, `hoàn thành`, and messages like `Truyện đã được tạo thành công`, `Không có token`.

---

## Big picture (what runs where)
- Backend: `backend/` — Node.js (ESM) Express server using Mongoose/MongoDB. Entry: `backend/server.js`. DB connector: `backend/config/db.js`.
- Frontend: `frontend2/` — Next.js (app-dir, TypeScript) + Capacitor. API client: `frontend2/src/lib/api.ts`.

## High-level architecture & data flow
- Frontend calls backend REST endpoints under `/api/*` (e.g. `/api/novels`, `/api/auth`). See `frontend2/src/lib/api.ts` for base URL (reads `NEXT_PUBLIC_API_URL`, falls back to `http://localhost:5000`).
- Backend pattern: routes -> controllers -> models. Example: `backend/routes/novel.js` -> `backend/controllers/novelController.js` -> `backend/models/Novel.js`.
- Lightweight GET handlers use plain Mongoose queries; complex list endpoints use aggregation pipelines to compute derived fields (chapterCount, averageRating, commentsCount). See `getNovels` in `novelController.js`.

## Auth, uploads, errors (cross-cutting)
- Auth: JWT-based. Tokens created/verified via `backend/utils/jwt.js`. Protected routes use `backend/middlewares/authMiddleware.js` which expects `Authorization: Bearer <token>` and sets `req.user`.
- Uploads: `backend/middlewares/uploadMiddleware.js` uses multer in-memory; controllers expect `req.file.buffer` and call `backend/services/uploadService.js` (Cloudinary) to upload.
- Errors: controllers call `next(new AppError(...))`; central handler is `backend/middlewares/errorHandler.js`. Preserve the `AppError` pattern and HTTP status codes.

## Conventions & patterns to follow
- Keep the routes/controllers/models layout. Add routes under `backend/routes`, implement logic in `backend/controllers`, and update `backend/models` schemas for data shape.
- Preserve Vietnamese enum literals in models (exact strings). Example: `Novel.type` uses `"sáng tác"` and `"dịch/đăng lại"`.
- Pagination: endpoints accept `page` and `limit`; controllers compute skip and return `pagination` when used (see `getNovels`).
- Use `.populate("poster", "username")` when returning novel lists so frontend can display poster username.
- For derived fields (chapterCount, averageRating, commentsCount) prefer aggregation pipelines in controllers rather than client-side computation.

## Developer workflows / commands (Windows / pwsh)
- Backend (dev):
```powershell
cd backend
npm install
npm run dev   # nodemon server.js
```
- Frontend (dev):
```powershell
cd frontend2
npm install
npm run dev   # runs gen:ui watcher + next dev
```
- Frontend build:
```powershell
cd frontend2
npm run build
```
- Backend tests/scripts (run directly or via package scripts):
```powershell
cd backend
npm run test:review  # runs node test/testReviewAll.js
```

## Files to open first
- `backend/server.js` — routing and middleware registration.
- `backend/config/db.js` — DB connection and env expectations (`MONGO_URI`).
- `backend/controllers/*` — business logic and aggregation examples.
- `backend/models/*` — schema enums and required string literals.
- `frontend2/src/lib/api.ts` — axios instance and token interceptor.

## Env & external deps
- Backend env: `MONGO_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, Cloudinary creds. Check your local `.env`.
- Frontend: `NEXT_PUBLIC_API_URL` can override backend base URL.

## Quick examples
- Protect route: add `authMiddleware` to route in `backend/routes/*`.
- File upload: use `handleCoverUpload` or `handleUpload` middleware; controller reads `req.file.buffer` and calls `uploadService.uploadToCloudinary(req.file.buffer, "novel-covers")`.
- Aggregation: reference `getNovels` pipeline in `backend/controllers/novelController.js` for combining chapters, reviews, comments and computing `averageRating`.

## What not to change lightly
- Preserve the `AppError` + `errorHandler` pattern.
- Preserve Vietnamese string literals used in code and responses — UI assumes those exact values.

---

# Phiên bản tiếng Việt (Bản dịch ngắn)

Lưu ý quan trọng: kho mã dùng nhiều chuỗi hiển thị bằng tiếng Việt — tuyệt đối KHÔNG đổi các chuỗi này trong mã. Ví dụ cần giữ nguyên: `sáng tác`, `dịch/đăng lại`, `còn tiếp`, `tạm ngưng`, `hoàn thành`, cùng các thông báo như `Truyện đã được tạo thành công`, `Không có token`.

Tổng quan:
- Backend: `backend/` — Express + Mongoose. Entry: `backend/server.js`.
- Frontend: `frontend2/` — Next.js (app-dir) + Capacitor. Base API: `frontend2/src/lib/api.ts`.

Luồng chính & mô hình:
- Frontend gọi REST API ở `/api/*`.
- Backend theo cấu trúc routes -> controllers -> models. Các truy vấn đơn giản dùng Mongoose, các danh sách nâng cao dùng aggregation pipeline (xem `getNovels`).

Workflows:
- Backend dev: vào `backend/`, `npm run dev`.
- Frontend dev: vào `frontend2/`, `npm run dev`.

Mở rộng hoặc cần dịch thêm phần nào không? Tôi có thể dịch toàn bộ file sang tiếng Việt, hoặc giữ song ngữ như hiện tại (English chính + Việt dịch tóm tắt). Xin chỉ định lựa chọn nếu muốn thay đổi.
