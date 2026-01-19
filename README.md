# novel-app

## Giới thiệu

**Tên đề tài**: Ứng dụng đọc/đăng truyện (novel-app)

**Công nghệ**:
- Backend: Node.js (ESM), Express, MongoDB/Mongoose
- Frontend: Next.js (app-dir), TypeScript, Capacitor


---

## 1) Chuẩn bị

- Node.js v22.20.0
- VSCode

---

## 2) File môi trường (.env)

Đặt **2 file .env** vào vị trí:

- backend/.env  → đặt vào thư mục backend/
- frontend2/.env.local → đặt vào thư mục frontend2/


---

## 3) Backend: install & khởi động

mở project novel-app trong VSCode, mở 1 terminal và chạy 3 lệnh sau:
```powershell
cd backend
npm install
npm start
```
sau khi khởi động, backend nên được chạy ở port 5000, localhost
để kiểm tra: mở http://localhost:5000/api/ping.
nếu trên màn hình trình duyệt hiện {"message":"Backend Express is running!"} là backend đã hoạt động

---

## 4) Frontend: build & khởi động
mở thêm 1 terminel khác và chạy 4 lệnh:

```powershell
cd frontend2
npm install
npm run build
npm run dev
```
sau khi khởi động, frontend nên được chạy ở port 3000, localhost
nếu frontend đã khởi động thành công, terminal sẽ log ra 2 dòng sau:   
[1]    ▲ Next.js 15.5.9 (Turbopack)
[1]    - Local:        http://localhost:3000

Mở http://localhost:3000 để truy cập trang web


---

## 5) Tài khoản test

- **Tài khoản user thường**: 
  - Email: testuser@example.com
  - Password: password123

- **Tài khoản admin**: 
  - Email: admin@example.com
  - Password: adminpassword

---

## 6) Thẻ test thanh toán

- **Stripe (test mode)**
  - Số thẻ: 4242 4242 4242 4242
  - Hạn: bất kỳ tháng/năm tương lai
  - CVC: 123
  - ZIP: bất kỳ

- **VNPAY (sandbox)**

  - Thẻ test:
  - Ngân hàng:	    NCB
  - Số thẻ:	        9704198526191432198
  - Tên chủ thẻ:	  NGUYEN VAN A
  - Ngày phát hành:	07/15
  - Mật khẩu OTP:	  123456
---

## Ghi chú thêm (tuỳ chọn)

- nếu backend chạy ở port khác 5000 thì phải sửa port của biến môi trường trong 2 file .env để có thể hoạt động.

BASE_URL=https://localhost:5000 trong backend/.env 
NEXT_PUBLIC_API_URL=http://localhost:5000  trong frontend2/.env.local.

- nếu frontend chạy ở port khác 3000 thì phải sửa port của biến môi trường trong 2 file .env để có thể hoạt động.
FRONTEND_URL=http://localhost:3000  trong backend/.env 
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000  trong frontend2/.env.local.

---

## Demo — Screenshots

Bạn có thể thêm ảnh màn hình (screenshots) vào README để demo giao diện.

Hướng dẫn ngắn:

- Tạo thư mục trong repo để chứa ảnh, ví dụ `docs/screenshots/` hoặc `public/screenshots/`.
- Sao chép file ảnh vào thư mục đó (ví dụ `docs/screenshots/home.png`).
- Thêm thẻ Markdown vào README để hiển thị ảnh, ví dụ:

```markdown
![Home screen](docs/screenshots/home.png)
```

- Trong VSCode: copy ảnh vào thư mục, mở `README.md`, nhập `![](` rồi kéo thả ảnh vào editor — VSCode sẽ chèn đường dẫn tương đối.
- Commit và push thay đổi:

```powershell
git add docs/screenshots/home.png README.md
git commit -m "Add demo screenshot"
git push
```

Lưu ý ngắn:
- GitHub/Viewer sẽ hiển thị ảnh nếu đường dẫn tương đối chính xác.
- Nên tối ưu ảnh (kích thước < ~1MB) để tránh repo lớn.

Muốn tôi thêm một ảnh demo mẫu vào repo không? Nếu có, upload ảnh lên đây hoặc cho phép tôi tạo một ảnh placeholder để mình thêm giúp.

