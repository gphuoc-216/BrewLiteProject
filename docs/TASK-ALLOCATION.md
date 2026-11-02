# Bảng Phân Công Công Việc Đồ Án BrewLite (Agile Scrum Task Allocation)

> **Môn học**: Công Nghệ Phần Mềm (CNPM) — Học kỳ I, Năm học 2026–2027  
> **Dự án**: BrewLite — Ứng dụng đặt đồ uống cà phê không dùng tiền mặt  
> **Nguồn đăng ký gốc**: [Google Sheets — Phân chia công việc BrewLite](https://docs.google.com/spreadsheets/d/1IR6SIhbVWJ5-PPvzDbwhGyYciAS8oEPS3tYNBaoFlw4/edit?gid=1466671078#gid=1466671078)  
> **Nhánh tích hợp chính**: `develop` | **Tổng số thành viên**: 7 thành viên  

---

## 1. Bảng Tổng Hợp Phân Công Nhiệm Vụ 7 Thành Viên (Chuẩn 7 Nhánh Git)

| STT | Họ và Tên | GitHub Username | Gói Công Việc Đảm Nhận | Nhánh Git (Feature Branch) | Trọng Tâm Nghiệp Vụ Thực Tế | Trạng Thái |
|:---:|:---|:---|:---|:---:|:---|:---:|
| **1** | **Võ Đức Hoàng Vinh** | `V9vinh` | **[P1 - Frontend]** Layout Hệ Thống & Thực Đơn Số Thông Minh | `feat/p1-menu-page` | Next.js 14, Navbar, Catalog Menu, Bộ lọc/Search debounce, Badge cảnh báo hết hàng thời gian thực | ✅ Hoàn thành |
| **2** | **Hồ Hoàng Anh** | `anhho7303-source` | **[P2 - Frontend]** Chi Tiết Món, Tùy Chọn Topping & Đánh Giá Tức Thì | `feat/p2-product-details` | Modal Quick Select, Tùy chỉnh Đường/Đá/Topping, Tự động vô hiệu hóa Size hết nguyên liệu, Gửi & xem đánh giá | ✅ Hoàn thành |
| **3** | **Dương Thành Phát** | `phatthanh-kiko` | **[P3 - Frontend]** Quản Lý Giỏ Hàng Zustand, Voucher & Loyalty | `feat/p3-cart-store` | Zustand Store persist, Gộp món cùng biến thể, Trang `/cart`, Áp dụng Voucher thông minh, Dùng Điểm thưởng (1đ = 100đ) | ✅ Hoàn thành |
| **4** | **Quách Thanh Phú** | `quachthanhphuu-maker` | **[P4 - Frontend]** Xác Thực Tài Khoản & Màn Hình Checkout Tự Động | `feat/p4-checkout-history` | Trang Đăng nhập/Đăng ký, Luồng Mua ngay & Giỏ hàng, Mã QR chuyển khoản Canvas, Mô phỏng MBBank gạch nợ tự động | ✅ Hoàn thành |
| **5** | **Đặng Lương Thế Anh** | `dangluongtheanh-max` | **[P5 - Backend]** Cơ Sở Dữ Liệu PostgreSQL & API Tính Tồn Kho Thời Gian Thực | `feat/p5-api-products` | Schema Prisma, Seed CSDL mẫu, API `GET /products` đối chiếu công thức định lượng ra cờ `isOutOfStock`, API Đánh giá | ✅ Hoàn thành |
| **6** | **Nguyễn Hoàng Anh** | `hanhdevsgu` | **[P6 - Backend]** Quản Lý Nguyên Liệu, Đơn Hàng & Cổng Thanh Toán | `feat/p6-payment-ingredients-orders` | Entity `Ingredient` & `Recipe`, API `POST /orders`, Auth JWT/Bcrypt, Mock Gateway Service, API MBBank Sync thời gian thực | ✅ Hoàn thành |
| **7** | **Hoàng Trần Gia Phước** | `gphuoc-216` | **[P7 - Fullstack & DevOps]** Core State Machine, Kanban Barista & Docker | `feature/p7-backend` | Order State Machine chống gian lận, Idempotency-Key, Khóa lạc quan OCC, Kanban Barista (`/staff`), Admin (`/admin`), Docker Compose | ✅ Hoàn thành |

---

## 2. Chi Tiết Nhiệm Vụ & Sản Phẩm Bàn Giao Từng Thành Viên

### 👤 1. Võ Đức Hoàng Vinh (`V9vinh`) — Gói P1 (Frontend)
- **Hạng mục phụ trách:**
  - Khởi tạo nền tảng Next.js 14 App Router, thiết lập TailwindCSS, Typography System, cấu trúc layout và components dùng chung (`Navbar`, `Footer`, `ThemeToggle`, `ui/*`).
  - Dựng trang chủ thực đơn `/` (Menu món), gọi API `GET /api/products` hiển thị danh mục linh hoạt (Cà phê, Trà, Đá xay...).
  - Tích hợp thanh tìm kiếm thời gian thực (Debounce 200ms) và phân trang mượt mà.
  - Xây dựng component `ProductCard`: Hiển thị số sao thực tế từ database, badge danh mục, **tự động hiển thị badge `⛔ Tạm hết hàng`, làm mờ ảnh và vô hiệu hóa nút chọn nhanh khi món hết nguyên liệu**.
- **Files code phụ trách:**
  - `frontend/src/app/page.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/ui/*`

---

### 👤 2. Hồ Hoàng Anh (`anhho7303-source`) — Gói P2 (Frontend)
- **Hạng mục phụ trách:**
  - Xây dựng Modal tùy chọn nhanh `ProductQuickSelectModal.tsx` và trang Chi tiết món đầy đủ `/products/[id]`.
  - Tùy chỉnh kích cỡ (Size S / M / L): **Tự động gắn tag `Hết` và vô hiệu hóa kích cỡ nếu thiếu nguyên liệu trong kho**, tự động chọn kích cỡ còn hàng mặc định.
  - Tùy chọn mức đường (100%, 70%, 50%, 0%), lượng đá (100%, 50%, Nóng).
  - Tùy chọn Topping đi kèm có ảnh minh họa chuẩn F&B (Trân châu đường đen, Kem Cheese Macchiato, Thạch đào, Nha đam, Hạt sen, Khúc bạch...), tự động tăng giảm đơn giá tức thì.
  - **Khu vực Đánh giá sản phẩm (Reviews):** Hiển thị danh sách nhận xét, phân bố sao, form viết đánh giá cập nhật ngay lập tức vào database không cần tải lại trang.
- **Files code phụ trách:**
  - `frontend/src/app/products/[id]/page.tsx`
  - `frontend/src/components/ProductQuickSelectModal.tsx`
  - `frontend/src/lib/toppings.ts`

---

### 👤 3. Dương Thành Phát (`phatthanh-kiko`) — Gói P3 (Frontend)
- **Hạng mục phụ trách:**
  - Xây dựng kho lưu trữ trạng thái giỏ hàng toàn cục `useCartStore` bằng **Zustand** (đồng bộ localStorage).
  - Thuật toán gộp dòng giỏ hàng: Cùng món + cùng size + cùng topping thì tăng số lượng; khác tùy chọn thì tách dòng riêng biệt.
  - Dựng trang giỏ hàng `/cart` với đầy đủ chức năng: Tăng/giảm số lượng ly, xóa món, xóa toàn bộ giỏ, hiển thị badge số lượng món trên Navbar.
  - **Tích hợp cơ chế Khuyến mãi thông minh:**
    - Tính toán áp dụng Voucher theo điều kiện (chặn chọn khi đơn 0đ, không cho chọn chồng chéo voucher cùng loại, loại bỏ mã freeship).
    - Tích hợp điểm thưởng thành viên theo tỉ lệ **1 điểm = 100đ**, khấu trừ trực tiếp vào tổng tiền thanh toán.
- **Files code phụ trách:**
  - `frontend/src/store/useCartStore.ts`
  - `frontend/src/app/cart/page.tsx`
  - `frontend/src/lib/vouchers.ts`

---

### 👤 4. Quách Thanh Phú (`quachthanhphuu-maker`) — Gói P4 (Frontend)
- **Hạng mục phụ trách:**
  - Phân hệ Xác thực: Giao diện Đăng nhập (`/login`) và Đăng ký (`/register`), quản lý trạng thái phiên người dùng trong `useAuthStore`.
  - Màn hình Thanh toán `/checkout`: Hỗ trợ luồng **"Mua ngay" (Buy Now 1 món)** không làm mất giỏ hàng, và luồng thanh toán toàn bộ giỏ hàng.
  - Sinh mã đơn hàng chuẩn `BLxxxxxx`, **tự động vẽ mã QR chuyển khoản ngân hàng trực tiếp bằng Canvas & Data URL nội bộ** (không phụ thuộc dịch vụ ảnh bên ngoài).
  - **Trình mô phỏng MBBank Mobile Simulator:** Lắng nghe giao dịch chuyển khoản thời gian thực, tự động gạch nợ thành công trên màn hình khách hàng mà không cần bấm nút thủ công.
  - Màn hình Xác nhận đơn thành công và trang **Lịch sử đơn hàng cá nhân** (`/orders/me`), hiển thị chi tiết món, giá trị đã thanh toán và nút đánh giá.
- **Files code phụ trách:**
  - `frontend/src/app/login/page.tsx`, `frontend/src/app/register/page.tsx`
  - `frontend/src/app/checkout/page.tsx`
  - `frontend/src/app/orders/me/page.tsx`, `frontend/src/app/profile/page.tsx`
  - `frontend/src/store/useAuthStore.ts`
  - `frontend/src/components/checkout/*`

---

### 👤 5. Đặng Lương Thế Anh (`dangluongtheanh-max`) — Gói P5 (Backend)
- **Hạng mục phụ trách:**
  - Khởi tạo kiến trúc NestJS 10, cấu hình kết nối CSDL PostgreSQL với Prisma ORM, quản lý migrations và biến môi trường `.env`.
  - Xây dựng kịch bản nạp dữ liệu hạt giống ban đầu (`prisma/seed.ts`) với đầy đủ danh mục đồ uống và công thức định lượng nguyên liệu.
  - **Xây dựng API Sản phẩm thông minh (`GET /api/products`, `GET /api/products/:id`):**
    - Hỗ trợ tìm kiếm theo tên, lọc danh mục, phân trang.
    - **Thuật toán tính tồn kho Real-Time:** Đọc bảng `Recipe` đối chiếu với `Ingredient.stockQuantity` trong CSDL, tính toán cờ `isOutOfStock` theo từng kích cỡ và cho toàn sản phẩm.
  - **Xây dựng API Đánh giá (`/api/reviews`):** Cho phép khách hàng gửi đánh giá (`POST /api/reviews`), tự động tính lại điểm sao trung bình và số lượt đánh giá của sản phẩm trong CSDL.
- **Files code phụ trách:**
  - `backend/src/modules/products/*`
  - `backend/src/modules/reviews/*`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/seed.ts`

---

### 👤 6. Nguyễn Hoàng Anh (`hanhdevsgu`) — Gói P6 (Backend)
- **Hạng mục phụ trách:**
  - **Quản lý Nguyên liệu & Định lượng:** Thiết kế và duy trì bảng thực thể `Ingredient` (Hạt cà phê, Sữa đặc, Trà, Siro, Topping...) và bảng công thức `Recipe` theo từng biến thể sản phẩm.
  - **API Tạo đơn hàng (`POST /api/orders`):** Nhận giỏ hàng từ Frontend, thẩm định dữ liệu bằng `class-validator`, tính toán tổng tiền, lưu đơn ở trạng thái `PENDING`.
  - **API Xác thực JWT:** Đăng ký (`POST /api/auth/register`), Đăng nhập (`POST /api/auth/login`), băm mật khẩu một chiều bằng `bcrypt`, cấp phát JWT Token (Access/Refresh Token) và cấu hình `JwtAuthGuard`.
  - **Phân hệ Cổng thanh toán giả lập (Mock Gateway):** Xử lý thanh toán mô phỏng (`POST /api/mock-gateway/charge`), API webhook đồng bộ chuyển khoản MBBank thời gian thực (`/api/payments/mbbank-sync`, `/api/payments/mbbank-check/:orderCode`).
  - **Cơ chế Fallback Store (`fallback-store.ts`):** Bộ nhớ in-memory dự phòng giúp hệ thống Auth, Orders và Payment duy trì hoạt động ngay cả khi CSDL offline.
- **Files code phụ trách:**
  - `backend/src/modules/orders/orders.controller.ts`, `backend/src/modules/orders/orders.service.ts`
  - `backend/src/modules/auth/*`
  - `backend/src/modules/payment/mock-gateway/*`
  - `backend/src/prisma/fallback-store.ts`

---

### 👤 7. Hoàng Trần Gia Phước (`gphuoc-216`) — Gói P7 (Fullstack & DevOps)
- **Hạng mục phụ trách:**
  - **Order State Machine (`order-state-machine.ts`):** Quản lý nghiêm ngặt vòng đời đơn hàng (`PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`), ngăn chặn nhảy cóc trạng thái và ghi Audit Log vào `order_status_histories`.
  - **Idempotency Engine:** Khóa chống trừ tiền trùng lặp bằng `idempotencyKey` duy nhất trên mỗi giao dịch, xử lý kịch bản gửi lại (Replay) an toàn.
  - **Optimistic Concurrency Control (OCC):** Trừ kho nguyên liệu đồng thời qua cột `version` trên `Ingredient`, tự động retry tối đa 3 lần khi nhiều khách đặt cùng lúc.
  - **Bảng Kanban Pha chế Barista (`/staff`):** Màn hình theo dõi và điều phối đơn hàng thời gian thực cho nhân viên quầy bar theo nguyên tắc FIFO (vào trước làm trước).
  - **Admin Dashboard (`/admin`):** Màn hình quản trị doanh thu, tồn kho nguyên liệu, nhập hàng và lịch sử thanh toán.
  - **DevOps & Testing:** Cấu hình `docker-compose.yml` (Postgres, NestJS, Next.js), Dockerfile tối ưu đa tầng (Multi-stage build), trọn bộ 5 test suites (43 unit tests Jest) và script kiểm thử đồng thời `scripts/test-race-condition.js`.
- **Files code phụ trách:**
  - `backend/src/modules/orders/order-state-machine.*`
  - `backend/src/modules/payment/payment.service.ts` (OCC & Idempotency)
  - `frontend/src/app/staff/page.tsx`
  - `frontend/src/app/admin/page.tsx`
  - `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`
  - `backend/src/modules/orders/orders.service.spec.ts`, `backend/src/modules/payment/payment.service.spec.ts`

---

## 3. Quy Tắc Phối Hợp Nhóm (Agile Scrum Workflow)

1. **Phân nhánh độc lập:** Mỗi thành viên code trên nhánh tính năng riêng (`feat/p1-...` đến `feature/p7-...`). Tuyệt đối không push đè trực tiếp lên `develop` hoặc `main`.
2. **Đồng bộ liên tục:** Trước khi tạo Pull Request, thành viên phải pull nhánh `develop` mới nhất về máy để giải quyết xung đột cục bộ.
3. **Tiêu chuẩn bàn giao (Definition of Done - DoD):**
   - Mã nguồn không có lỗi TypeScript, lint pass (`npm run build` thành công cả FE và BE).
   - Đảm bảo đầy đủ xử lý ngoại lệ biên (Network error, out of stock, zero price, session expired).
   - Docker container khởi động và hoạt động trơn tru bằng lệnh `docker compose up -d`.
