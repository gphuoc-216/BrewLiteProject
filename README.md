# ☕ BrewLite — Hệ Thống Đặt Hàng & Thanh Toán Cà Phê Không Dùng Tiền Mặt
## (Cashless Coffee Ordering & Kitchen Management Platform)

> **Môn học**: Công Nghệ Phần Mềm (CNPM) — Học kỳ I, Năm học 2026–2027  
> **Kiến trúc hệ thống**: Monorepo NestJS 10 (Backend API) + Next.js 14 App Router (Frontend Web App) + PostgreSQL 16 + Prisma ORM 5.x + Docker Compose  
> **Mô hình phát triển**: Agile Scrum kết hợp Order State Machine & Optimistic Concurrency Control  
> **Repository GitHub**: [https://github.com/gphuoc-216/BrewLiteProject](https://github.com/gphuoc-216/BrewLiteProject) *(Nhánh tích hợp chính: `develop` & 7 Feature Branches)*  

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG (TỪ A ĐẾN Z)

### 1. Yêu Cầu Môi Trường Tiên Quyết (Prerequisites)
- **Node.js**: Phiên bản `18.x` hoặc `20.x LTS` (Khuyến nghị `Node.js 20.x`). Kiểm tra bằng lệnh: `node -v`.
- **NPM**: Phiên bản `9.x` hoặc `10.x` (đi kèm Node.js). Kiểm tra: `npm -v`.
- **Git**: Đã cài đặt trên máy. Kiểm tra: `git --version`.
- **Docker Desktop**: *(Khuyến nghị mạnh mẽ)* để chạy toàn bộ hệ thống bằng 1 câu lệnh duy nhất.

---

### 2. Tải Mã Nguồn & Cấu Hình Biến Môi Trường (.env)

#### Bước 1: Clone repository về máy tính
```bash
git clone https://github.com/gphuoc-216/BrewLiteProject.git
cd BrewLiteProject
```

#### Bước 2: Tạo file biến môi trường Backend
```powershell
# Trên Windows PowerShell:
copy backend\.env.example backend\.env
```
*(File `backend/.env` đã cấu hình sẵn cổng `PORT=3001`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL="http://localhost:3000"`).*

#### Bước 3: Tạo file biến môi trường Frontend
```powershell
# Trên Windows PowerShell:
copy frontend\.env.example frontend\.env.local
```
*(File `frontend/.env.local` đã cấu hình sẵn `NEXT_PUBLIC_API_URL="http://localhost:3001/api"`).*

---

### 3. Cách 1: Khởi Chạy 1-Click Bằng Docker Compose (Khuyên Dùng Cho Giảng Viên & Nghiệm Thu)

Docker sẽ tự động dựng toàn bộ CSDL PostgreSQL 16 Alpine, Backend NestJS và Frontend Next.js trong mạng nội bộ độc lập.

#### Khởi chạy:
Tại thư mục gốc dự án, chạy lệnh:
```bash
docker compose up -d --build
```
> Hệ thống sẽ tự động:
> 1. Tải image PostgreSQL 16 và khởi tạo CSDL `brewlite_db`.
> 2. Build multi-stage image Backend NestJS, generate Prisma Client, kết nối DB.
> 3. Build tối ưu production Next.js 14 Frontend.
> 4. Khởi động 3 container và tự động gắn healthcheck kiểm tra độ sẵn sàng.

#### Kiểm tra trạng thái các container:
```bash
docker compose ps
```
*Kết quả hiển thị 3 container: `brewlite_postgres` (:5432), `brewlite_backend` (:3001), `brewlite_frontend` (:3000) đều ở trạng thái `Up / Healthy`.*

#### Nạp dữ liệu hạt giống ban đầu (Seed Database):
Nếu khởi chạy lần đầu tiên trên máy mới, hãy nạp menu món, công thức định lượng và tài khoản mẫu:
```bash
docker exec -it brewlite_backend npm run seed
```

#### Xem logs trực tiếp khi cần debug:
```bash
docker compose logs -f
```

#### Dừng hệ thống:
```bash
# Dừng các container (dữ liệu CSDL vẫn được lưu bền vững trên Docker Volume):
docker compose down

# Dừng và XÓA SẠCH toàn bộ volume CSDL để nạp lại từ đầu:
docker compose down -v
```

---

### 4. Cách 2: Khởi Chạy Thủ Công Từng Phần (Local Development)

Dành cho thành viên nhóm hoặc giảng viên muốn chạy trực tiếp mã nguồn trên máy:

#### Bước 1: Khởi động CSDL PostgreSQL
Bật nhanh PostgreSQL bằng Docker:
```bash
docker run --name brewlite_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgrespassword -e POSTGRES_DB=brewlite_db -p 5432:5432 -d postgres:16-alpine
```

#### Bước 2: Khởi chạy Backend (NestJS)
Mở một cửa sổ Terminal:
```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed              # Nạp dữ liệu danh mục món, nguyên liệu kho và tài khoản mẫu
npm run start:dev
```
> ✅ Backend API sẵn sàng tại: `http://localhost:3001`  
> 📑 Swagger API Docs tại: `http://localhost:3001/api/docs`

#### Bước 3: Khởi chạy Frontend (Next.js)
Mở một cửa sổ Terminal thứ hai:
```powershell
cd frontend
npm install
npm run dev
```
> ✅ Giao diện Khách hàng sẵn sàng tại: `http://localhost:3000`

---

### 5. Cách 3: Trải Nghiệm Demo Quét Mã QR Bằng Điện Thoại Thật (Mobile QR Payment)

Hệ thống hỗ trợ 2 phương án trải nghiệm thanh toán QR trên thiết bị di động thật:

#### Phương án A — Dùng Cloudflare Tunnel tích hợp sẵn (Khuyên Dùng):
Không cần cùng mạng Wi-Fi, tự động có HTTPS chuẩn để mở Camera quét mã:
```powershell
npm run phone
# Hoặc:
node scripts/tunnel.js
```
> Terminal sẽ in **Mã QR to rõ ngay trong console** và một đường link HTTPS công khai. Dùng camera điện thoại quét để mở ngay ứng dụng MBBank Simulator!

#### Phương án B — Dùng HTTPS Reverse Proxy nội bộ qua mạng LAN Wi-Fi:
Yêu cầu điện thoại và máy tính kết nối chung mạng Wi-Fi:
1. Mở Terminal gõ `ipconfig` xem IP máy tính (VD: `192.168.1.149`).
2. Chạy proxy: `node https-proxy.js`.
3. Mở Safari/Chrome trên điện thoại truy cập: `https://<Địa_Chỉ_IP>:3443/mbbank`.

---

### 6. Cách 4: Chạy Kiểm Thử Tự Động (Automated Testing)

#### 1. Chạy 5 Test Suites Unit Tests Backend (43 unit tests):
```powershell
npm run test
# Hoặc:
npm --prefix backend test
```
*Kiểm thử toàn diện: Order State Machine, Idempotency-Key, Điểm thưởng Loyalty, Khóa lạc quan OCC tồn kho.*

#### 2. Kiểm thử xung đột đồng thời (Race Condition Test):
Mô phỏng 10 giao dịch đặt hàng đồng thời tranh chấp kho nguyên liệu:
```powershell
node scripts/test-race-condition.js
```
*Kết quả chứng minh Optimistic Concurrency Control (OCC) xử lý thành công không xảy ra bán lố nguyên liệu.*

#### 3. Kiểm tra tính hợp lệ Build Production:
```powershell
npm run build:backend
npm run build:frontend
```

---

## 👥 BẢNG PHÂN CHIA 10 TASK & 7 THÀNH VIÊN (CHUẨN ĐỀ BÀI)

| Task Đề Bài | Tên Nhiệm Vụ Đề Bài | Thành Viên Phụ Trách | Nhánh Git | Tiêu Chuẩn Nghiệm Thu Đạt Được |
|:---:|:---|:---|:---:|:---|
| **Task 1** | Khởi tạo dự án & cấu trúc | Võ Đức Hoàng Vinh (FE)<br>Đặng Lương Thế Anh (BE) | `feat/p1-menu-page`<br>`feat/p5-api-products` | Monorepo Next.js 14 + NestJS 10, PostgreSQL Prisma, Docker Compose, build 0 lỗi. |
| **Task 2** | API danh mục sản phẩm | Đặng Lương Thế Anh | `feat/p5-api-products` | `GET /products` lọc, search, phân trang; thuật toán tính tồn kho nguyên liệu gán cờ `isOutOfStock`. |
| **Task 3** | Trang Menu (Frontend) | Võ Đức Hoàng Vinh | `feat/p1-menu-page` | Giao diện menu responsive, thanh search debounce, Skeleton loading, badge `⛔ Tạm hết hàng`. |
| **Task 4** | Chi tiết & tùy chọn sản phẩm | Hồ Hoàng Anh | `feat/p2-product-details` | Modal Quick Select & `/products/:id`, chọn Size S/M/L (tự vô hiệu hóa size hết), đường/đá/topping có ảnh, gửi đánh giá. |
| **Task 5** | Giỏ hàng (Cart Store) | Dương Thành Phát | `feat/p3-cart-store` | Zustand Store persist, gộp món cùng biến thể, trang `/cart`, voucher thông minh, điểm thưởng (1đ=100đ). |
| **Task 6** | API tạo đơn hàng | Nguyễn Hoàng Anh | `feat/p6-payment-ingredients-orders` | `POST /orders` validate giỏ bằng `class-validator`, lưu đơn `PENDING`, tính tổng tiền chính xác. |
| **Task 7** | Đăng ký / Đăng nhập (JWT) | Quách Thanh Phú (FE)<br>Nguyễn Hoàng Anh (BE) | `feat/p4-checkout-history`<br>`feat/p6-payment-ingredients-orders` | Băm Bcrypt 1 chiều, Access/Refresh Token, `JwtAuthGuard`, giao diện form Auth đầy đủ. |
| **Task 8** | Thanh toán không tiền mặt | Quách Thanh Phú (FE)<br>Nguyễn Hoàng Anh (BE) | `feat/p4-checkout-history`<br>`feat/p6-payment-ingredients-orders` | Mock Gateway, vẽ mã VietQR nội bộ bằng Canvas, mô phỏng MBBank tự động gạch nợ tức thời. |
| **Task 9** | Xác nhận, lịch sử & Docker | Quách Thanh Phú (FE)<br>Hoàng Trần Gia Phước (BE) | `feat/p4-checkout-history`<br>`feature/p7-backend` | Trang `/checkout` và `/orders/me` theo dõi đơn; Docker Compose 3 container hoàn chỉnh. |
| **Task 10** | Nghiệp vụ backend chuyên sâu | Nguyễn Hoàng Anh (Kho)<br>Hoàng Trần Gia Phước (Core) | `feat/p6-payment-ingredients-orders`<br>`feature/p7-backend` | Order State Machine chống gian lận, Idempotency-Key chống trừ trùng, OCC trừ kho, 43 test Jest pass. |

---

## 🔑 TÀI KHOẢN MẪU ĐỂ NGHIỆM THU

Dữ liệu tài khoản đã nạp sẵn trong lệnh `npm run seed`:

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Đường Dẫn Trải Nghiệm | Chức Năng Kiểm Thử |
|:---|:---|:---:|:---:|:---|
| **Khách Hàng (Customer)** | `customer1` | `123456` | `/login` ➔ `/` | Đặt món, chọn size/topping, áp mã voucher, dùng điểm tích lũy, quét mã VietQR, thanh toán tự động, đánh giá sao. |
| **Nhân Viên Pha Chế (Staff)** | `barista1` | `123456` | `/staff` | **Bảng Kanban Barista (FIFO):** Tiếp nhận đơn từ cột "Đã thanh toán" ➔ Kéo chuyển "Đang pha chế" ➔ "Sẵn sàng" ➔ "Hoàn thành". |
| **Quản Trị Viên (Admin)** | `admin` | `admin123` | `/admin` | **Dashboard Quản Trị:** Thống kê doanh thu, cảnh báo tồn kho nguyên liệu chạm ngưỡng đỏ, tạo phiếu nhập kho. |

---

## 📱 CÁC ĐƯỜNG DẪN TRỰC TIẾP TRÌNH DIỄN ĐỒ ÁN

- **Cổng Đặt Món & Thực Đơn Khách Hàng**: [http://localhost:3000](http://localhost:3000)
- **Giỏ Hàng & Cổng Thanh Toán VietQR**: [http://localhost:3000/checkout](http://localhost:3000/checkout)
- **Bảng Kanban Quầy Pha Chế Barista**: [http://localhost:3000/staff](http://localhost:3000/staff)
- **Dashboard Báo Cáo Doanh Thu & Quản Trị**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Ứng Dụng Giả Lập MBBank Mobile (Trên PC)**: [http://localhost:3000/mbbank](http://localhost:3000/mbbank)
- **Tài Liệu API Chuẩn OpenAPI / Swagger**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🛠️ KHẮC PHỤC SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING / FAQ)

| Hiện Tượng / Lỗi | Nguyên Nhân | Cách Khắc Phục Nhanh |
|:---|:---|:---|
| **Lỗi `EADDRINUSE: port 3000/3001`** | Cổng bị chiếm bởi tiến trình cũ | Chạy PowerShell: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess \| Stop-Process -Force` (thay 3000/3001). |
| **Lỗi `Can't reach database server at localhost:5432`** | PostgreSQL chưa bật | Chạy `docker compose up -d postgres` hoặc kiểm tra dịch vụ PostgreSQL trên máy đã khởi động. |
| **Lỗi Camera denied khi quét QR trên điện thoại** | Trình duyệt chặn Camera trên HTTP | Dùng Cloudflare Tunnel (`npm run phone`) hoặc bật `node https-proxy.js` để có kết nối HTTPS. |
| **Muốn làm sạch dữ liệu đơn hàng về mặc định** | Cần reset trước giờ báo cáo | Chạy lệnh: `npm --prefix backend run clean:orders` hoặc nạp lại bằng `npm --prefix backend run seed`. |
| **Sản phẩm hiển thị `⛔ Tạm hết hàng`** | Tồn kho nguyên liệu trong công thức = 0 | Đăng nhập tài khoản `admin` vào `/admin` mục "Quản lý nguyên vật liệu" bấm "Nhập thêm kho" hoặc chạy lại `seed`. |

---

## 📚 TÀI LIỆU CHUYÊN SÂU DỰ ÁN
- **Phân chia chi tiết 7 Task cho nhóm**: [docs/TASK-ALLOCATION.md](./docs/TASK-ALLOCATION.md).
- **Tài liệu Đặc tả Kỹ thuật & 81 hàm nguyên tử**: [docs/01-analysis-spec.md](./docs/01-analysis-spec.md).
- **Kế hoạch Triển khai Chi tiết**: [docs/02-implementation-plan.md](./docs/02-implementation-plan.md).
