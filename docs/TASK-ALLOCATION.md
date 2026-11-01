# Bảng Phân Công Công Việc Đồ Án BrewLite (Agile Scrum Task Allocation)

> **Môn học**: Công Nghệ Phần Mềm (CNPM) — Học kỳ I, Năm học 2026–2027  
> **Dự án**: BrewLite — Ứng dụng đặt đồ uống cà phê không dùng tiền mặt  
> **Nguồn đăng ký gốc**: [Google Sheets — Phân chia công việc BrewLite](https://docs.google.com/spreadsheets/d/1IR6SIhbVWJ5-PPvzDbwhGyYciAS8oEPS3tYNBaoFlw4/edit?gid=1466671078#gid=1466671078)  
> **Nhánh tích hợp chính**: `develop` | **Tổng số thành viên**: 7 thành viên  

---

## 1. Bảng Tổng Hợp Phân Công Nhiệm Vụ 7 Thành Viên

| STT | Họ và Tên | GitHub Username | Gói Công Việc Đảm Nhận | Task Đề Bài Phụ Trách | Nhánh Git (Feature Branch) | Trạng Thái |
|:---:|:---|:---|:---|:---:|:---|:---:|
| **1** | **Võ Đức Hoàng Vinh** | `V9vinh` | **[P1 - Frontend]** Dựng nền Next.js + Trang hiển thị Menu món | Task 1 FE, Task 3 | `feat/p1-menu-page` | ✅ Hoàn thành |
| **2** | **Hồ Hoàng Anh** | `anhho7303-source` | **[P2 - Frontend]** Màn hình Chi tiết món + Chọn Size & Topping | Task 4 | `feat/p2-product-details` | ✅ Hoàn thành |
| **3** | **Dương Thành Phát** | `phatthanh-kiko` | **[P3 - Frontend]** Quản lý Giỏ hàng Zustand + Tính tổng tiền + Trang `/cart` | Task 5 | `feat/p3-cart-store` | ✅ Hoàn thành |
| **4** | **Quách Thanh Phú** | `quachthanhphuu-maker` | **[P4 - Frontend]** Giao diện Auth + Màn hình Checkout + Lịch sử đơn `/orders/me` | Task 7 FE, Task 8 FE, Task 9 FE | `feat/p4-checkout-history` | ✅ Hoàn thành |
| **5** | **Đặng Lương Thế Anh** | `dangluongtheanh-max` | **[P5 - Backend]** Khởi tạo NestJS + PostgreSQL + API `GET /products` | Task 1 BE, Task 2 | `feat/p5-api-products` | ✅ Hoàn thành |
| **6** | **Nguyễn Hoàng Anh** | `hanhdevsgu` | **[P6 - Backend]** Quản lý Nguyên liệu & Công thức + Mock Payment (Paymock/VietQR/MBBank) + API Đặt hàng & Auth JWT | Task 6 BE, Task 7 BE, Task 8 BE, Module Nguyên liệu | `feat/p6-payment-ingredients-orders` | ✅ Hoàn thành |
| **7** | **Hoàng Trần Gia Phước** | `gphuoc-216` | **[P7 - Backend]** Order State Machine + Optimistic Locking + Docker Compose & Unit Test | Task 9 BE, Task 10 BE, DevOps | `feat/p7-core-business` | ✅ Hoàn thành |

---

## 2. Chi Tiết Nhiệm Vụ & Sản Phẩm Bàn Giao Từng Thành Viên

### 👤 1. Võ Đức Hoàng Vinh (`V9vinh`) — Gói P1 (Frontend)
- **Hạng mục phụ trách:**
  - **Task 1 FE**: Khởi tạo dự án Next.js 14 App Router, thiết lập TailwindCSS, cấu trúc thư mục UI components và layout dùng chung.
  - **Task 3 FE**: Dựng trang chủ thực đơn `/` (Menu món), gọi API `GET /api/products`, hiển thị lưới sản phẩm responsive kèm trạng thái loading skeleton và empty state khi không có món.
- **Files code phụ trách:**
  - `frontend/src/app/page.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/ProductCard.tsx`
  - `frontend/src/components/ui/*`

---

### 👤 2. Hồ Hoàng Anh (`anhho7303-source`) — Gói P2 (Frontend)
- **Hạng mục phụ trách:**
  - **Task 4 FE**: Dựng màn hình / modal Chi tiết sản phẩm (`/products/[id]`), cho phép khách chọn kích cỡ (Size S / M / L) và danh sách Topping kèm theo (Trân châu, Kem cheese...).
  - Tự động tính toán lại đơn giá hiển thị theo thời gian thực dựa trên size và số lượng topping được chọn.
- **Files code phụ trách:**
  - `frontend/src/app/products/[id]/page.tsx`
  - `frontend/src/components/ProductDetailModal.tsx`

---

### 👤 3. Dương Thành Phát (`phatthanh-kiko`) — Gói P3 (Frontend)
- **Hạng mục phụ trách:**
  - **Task 5 FE**: Xây dựng kho lưu trữ trạng thái giỏ hàng (Cart Store) sử dụng **Zustand** (hỗ trợ persist localStorage).
  - Tính toán tổng tiền gốc (`subtotal`), cộng dồn các món cùng biến thể size/topping, hiển thị badge số lượng món trên Navbar.
  - Dựng trang giỏ hàng `/cart` với các thao tác tăng/giảm số lượng, xóa món và nút điều hướng sang trang Thanh toán.
- **Files code phụ trách:**
  - `frontend/src/store/useCartStore.ts`
  - `frontend/src/app/cart/page.tsx`

---

### 👤 4. Quách Thanh Phú (`quachthanhphuu-maker`) — Gói P4 (Frontend)
- **Hạng mục phụ trách:**
  - **Task 7 FE**: Giao diện Đăng nhập (`/login`) và Đăng ký (`/register`), lưu trữ JWT Token vào Auth Store (`useAuthStore`).
  - **Task 8 FE**: Màn hình Thanh toán (`/checkout`), chọn phương thức (Ví điện tử / Thẻ / Chuyển khoản VietQR), sinh mã đơn và xử lý trạng thái chờ.
  - **Task 9 FE**: Màn hình Xác nhận đơn thành công và trang **Lịch sử đơn hàng cá nhân** (`/orders/me` & `/profile`), lọc theo trạng thái (Đang xử lý, Hoàn tất, Đã hủy) kèm tính năng đánh giá món.
- **Files code phụ trách:**
  - `frontend/src/app/login/page.tsx`, `frontend/src/app/register/page.tsx`
  - `frontend/src/app/checkout/page.tsx`
  - `frontend/src/app/orders/me/page.tsx`, `frontend/src/app/profile/page.tsx`
  - `frontend/src/store/useAuthStore.ts`

---

### 👤 5. Đặng Lương Thế Anh (`dangluongtheanh-max`) — Gói P5 (Backend)
- **Hạng mục phụ trách:**
  - **Task 1 BE**: Khởi tạo dự án NestJS 10, cấu hình kết nối CSDL PostgreSQL với Prisma ORM, thiết lập biến môi trường `.env.example`.
  - **Task 2 BE**: Xây dựng API `GET /api/products` và `GET /api/products/:id` trả về danh sách đồ uống (kèm biến thể size, giá, ảnh) từ PostgreSQL.
  - Viết script nạp dữ liệu mẫu ban đầu (`prisma/seed.ts`).
- **Files code phụ trách:**
  - `backend/src/main.ts`, `backend/src/app.module.ts`
  - `backend/src/modules/products/products.controller.ts`
  - `backend/src/modules/products/products.service.ts`
  - `backend/prisma/seed.ts`

---

### 👤 6. Nguyễn Hoàng Anh (`hanhdevsgu`) — Gói P6 (Backend)
- **Hạng mục phụ trách (Mở rộng toàn diện theo nghiệp vụ đề bài):**
  - **1. Phân hệ Cổng thanh toán giả lập (Mock Payment / Paymock):**
    - Xây dựng `MockGatewayService` xử lý thanh toán mô phỏng (`POST /api/mock-gateway/charge`), hỗ trợ các kịch bản thành công (`SUCCESS`), từ chối giao dịch (`FAIL`) và mô phỏng nghẽn mạng (`TIMEOUT`).
    - Tích hợp bộ xử lý chuyển khoản thời gian thực **VietQR Napas 247 & MBBank Mobile Simulator** (`syncMbPayment`, `checkMbPayment`, `invalidateMbPayment`), nhận diện sai nội dung chuyển tiền trong vòng 2 phút.
  - **2. Quản lý Nguyên liệu & Công thức Pha chế (Ingredients & Recipes):**
    - Thiết kế và quản lý bảng thực thể `Ingredient` (kho nguyên liệu: Hạt cà phê, Sữa đặc, Trà, Siro...) và bảng định lượng `Recipe` tương ứng với từng kích cỡ ly đồ uống.
    - Xây dựng thuật toán tính toán tổng định lượng nguyên liệu tiêu hao cho toàn bộ các món trong đơn hàng phục vụ việc xuất kho khi pha chế.
  - **3. API Đặt hàng & Xác thực JWT (Task 6 & Task 7 BE):**
    - Endpoint `POST /api/orders`: Nhận giỏ hàng từ Frontend, thẩm định dữ liệu bằng `class-validator`, khởi tạo đơn ở trạng thái `PENDING`.
    - Endpoint `POST /api/auth/register` và `POST /api/auth/login`: Băm mật khẩu một chiều bằng `bcrypt`, cấp phát JWT Token (Access Token 15 phút, Refresh Token 7 ngày), xây dựng `JwtAuthGuard` bảo vệ các route riêng tư.
  - **4. Cơ chế Fallback Store:**
    - Xây dựng `fallback-store.ts` lưu trữ in-memory đảm bảo hệ thống Auth, Orders và Payment vẫn hoạt động ổn định khi CSDL offline.
- **Files code phụ trách:**
  - `backend/src/modules/payment/mock-gateway/mock-gateway.controller.ts`
  - `backend/src/modules/payment/mock-gateway/mock-gateway.service.ts`
  - `backend/src/modules/payment/payment.service.ts` (Phần Mock Payment & Realtime Sync)
  - `backend/src/modules/orders/orders.controller.ts`, `backend/src/modules/orders/orders.service.ts`
  - `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/strategies/jwt.strategy.ts`
  - `backend/src/prisma/fallback-store.ts`
  - `backend/prisma/schema.prisma` (Model `Ingredient`, `Recipe`, `Account`, `Customer`)

---

### 👤 7. Hoàng Trần Gia Phước (`gphuoc-216`) — Gói P7 (Backend)
- **Hạng mục phụ trách:**
  - **Task 8 BE & 10.2 (Idempotency Engine):** Triển khai cơ chế chống thanh toán trùng lặp bằng `Idempotency-Key` duy nhất, xử lý kịch bản Replay an toàn và ném lỗi `422 Unprocessable Entity` khi key bị sử dụng sai.
  - **Task 9 BE & 10.1 (Order State Machine):** Xây dựng ma trận máy trạng thái đơn hàng (`PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`), chặn gian lận nhảy cóc trạng thái và ghi Audit Log vào `order_status_histories`.
  - **Task 10.3 (Optimistic Concurrency Control):** Quản lý xung đột kho nguyên liệu đồng thời bằng trường `version` trên bảng `Ingredient` với raw atomic update và cơ chế Retry tự động tối đa 3 lần.
  - **Task 10.4 (Khuyến mãi & Loyalty):** Logic tích lũy điểm thưởng thành viên (+1 điểm / 10.000 VNĐ) và tự động hoàn kho/hoàn điểm khi đơn bị hủy trước khi pha chế.
  - **DevOps & Đóng gói hệ thống:** Thiết lập `docker-compose.yml`, viết Dockerfile tối ưu đa tầng (Multi-stage build), viết trọn bộ 5 test suites (43 unit tests Jest) và script kiểm thử đồng thời `scripts/test-race-condition.js`.
- **Files code phụ trách:**
  - `backend/src/modules/orders/order-state-machine.ts`
  - `backend/src/modules/orders/order-state-machine.spec.ts`
  - `backend/src/modules/payment/payment.service.ts` (Phần Idempotency & Optimistic Locking)
  - `backend/src/modules/payment/payment.service.spec.ts`
  - `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`
  - `scripts/test-race-condition.js`
  - `docs/BrewLite_P7_Core_Business_Collection.postman_collection.json`

---

## 3. Cam Kết Quy Tắc Làm Việc Nhóm (Team Working Rules)

Tất cả 7 thành viên cam kết tuân thủ 3 nguyên tắc vàng trong quá trình phát triển dự án:
1. **KHÔNG push trực tiếp lên nhánh `main` hoặc `develop`:** Mọi thành viên chỉ làm việc trên nhánh tính năng được phân công (`feat/...`).
2. **Kéo (pull) nhánh `develop` về giải quyết xung đột trước khi tạo Pull Request:** Đảm bảo mã nguồn luôn đồng bộ và không làm gián đoạn công việc của thành viên khác.
3. **Đạt chuẩn Definition of Done (DoD):** Code chạy được, không lỗi build, có commit rõ ràng theo chuẩn Conventional Commits và có kiểm thử trước khi bàn giao.

