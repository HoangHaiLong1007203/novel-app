# novel-app

Ứng dụng đọc/đăng truyện gồm:
- **Backend**: backend/ (Node.js ESM + Express + MongoDB/Mongoose)
- **Frontend**: frontend2/ (Next.js app-dir + TypeScript

Frontend gọi REST API dưới /api/* (mặc định backend ở http://localhost:5000).

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

- Storage nội dung chương: cấu hình MINIO_* hoặc R2_* trong backend/.env.
- Upload ảnh: cấu hình CLOUDINARY_* trong backend/.env.
- Thanh toán: cấu hình STRIPE_* và VNPAY_* trong backend/.env, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY trong frontend2/.env.local.
