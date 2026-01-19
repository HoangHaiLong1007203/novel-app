# novel-app

## Giới thiệu

**Tên đề tài**: Thiết kế và xây dựng nền tảng xuất bản và đọc tiểu thuyết trực tuyến (Web Novel Platform). 

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

- .env  → đặt vào thư mục backend/
- .env.local → đặt vào thư mục frontend2/


---

## 3) Hướng dẫn khởi động Backend

Mở project novel-app trong VSCode, mở 1 terminal và chạy 3 lệnh sau:
```powershell
cd backend
npm install
npm start
```
Sau khi khởi động, backend nên được chạy ở port 5000, localhost.

Để kiểm tra: mở http://localhost:5000/api/ping.
nếu trên màn hình trình duyệt hiện {"message":"Backend Express is running!"} là backend đã hoạt động

---

## 4) Hướng dẫn khởi động Frontend:
Mở thêm 1 terminal khác và chạy 4 lệnh:

```powershell
cd frontend2
npm install
npm run build
npm run dev
```
Sau khi khởi động, frontend nên được chạy ở port 3000, localhost.

Nếu frontend đã khởi động thành công, terminal sẽ log ra 2 dòng sau:   
```powershell
[1]    ▲ Next.js 15.5.9 (Turbopack)
[1]    - Local:        http://localhost:3000
```
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

  - Ngân hàng:	    NCB
  - Số thẻ:	        9704198526191432198
  - Tên chủ thẻ:	  NGUYEN VAN A
  - Ngày phát hành:	07/15
  - Mật khẩu OTP:	  123456
---

## Chú ý

- Nếu backend chạy ở port khác 5000 thì phải sửa port của biến môi trường trong 2 file .env để có thể hoạt động.
```powershell
BASE_URL=https://localhost:5000            #trong backend/.env 
NEXT_PUBLIC_API_URL=http://localhost:5000  #trong frontend2/.env.local.
```
- Nếu frontend chạy ở port khác 3000 thì phải sửa port của biến môi trường trong 2 file .env để có thể hoạt động.
```powershell
FRONTEND_URL=http://localhost:3000              #trong backend/.env 
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000  #trong frontend2/.env.local.
```
---

## Demo — Screenshots
Tài khoản & hồ sơ (Account & Profile)	

![Đăng nhập](frontend2/public/docs/đăng%20nhập.png)
![Đăng kí](frontend2/public/docs/đăng%20kí.png)

Tra cứu truyện (Discovery)	

![Tìm kiếm](frontend2/public/docs/tìm%20kiếm.png)
 
Đọc truyện (Reading)	

![Đọc truyện](frontend2/public/docs/đọc%20truyện.png)

Tương tác bình luận/đánh giá (Interaction)	

![Bình luận](frontend2/public/docs/bình%20luận.png)

Quản lý truyện & chương (Content Management)	

![Quản lí truyện](frontend2/public/docs/quản%20lí%20truyện.png)

Thanh toán & giao dịch (Payments & Transactions)

![Thanh toán](frontend2/public/docs/thanh%20toán.png)

Quản trị hệ thống (Administration)

![Quản trị hệ thống](frontend2/public/docs/quản%20trị%20hệ%20thống.png)
