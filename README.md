# ☕ BrewLite — Hệ Thống Đặt Hàng & Thanh Toán Cà Phê Không Tiền Mặt (Cashless Coffee Platform)

> **Kiến trúc công nghệ**: Monorepo NestJS (Backend API) + Next.js App Router (Frontend Web App) + PostgreSQL + Prisma ORM + Docker Compose.  
> **Tài liệu kỹ thuật**: Xem chi tiết tại [docs/01-analysis-spec.md](docs/01-analysis-spec.md) và [docs/02-implementation-plan.md](docs/02-implementation-plan.md).

---

## 1. Điểm Nổi Bật của Hệ Thống

1. **Chuẩn hóa nghiệp vụ cốt lõi**:
   - **Order State Machine**: Kiểm soát chuyển đổi trạng thái nghiêm ngặt (`PENDING` ➔ `PAID` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`).
   - **Thanh toán Idempotent**: Bắt buộc Header `Idempotency-Key` (UUIDv4) chống trừ tiền và tạo đơn trùng lặp.
   - **Kiểm soát Tồn kho Đồng thời**: Khấu trừ nguyên liệu bằng kỹ thuật **Optimistic Locking** (`version` field) với cơ chế Retry tự động tối đa 3 lần.
   - **Khuyến mãi & Tích lũy Điểm thưởng**: Xác thực mã giảm giá, kiểm tra hạn dùng, lượt dùng và cộng điểm loyalty (1 điểm / 10.000 VNĐ).
   - **Đánh giá xác thực (KiemTraDaMua)**: Chỉ cho phép khách hàng đánh giá khi đã hoàn tất đơn hàng có chứa sản phẩm đó.
2. **Trải nghiệm Đa Tác nhân (Multi-Role)**:
   - **Khách hàng**: Duyệt menu sinh động, tùy chọn size (S/M/L) và topping, giỏ hàng bền vững (Zustand persist), thanh toán không tiền mặt và theo dõi tiến độ đơn hàng thời gian thực.
   - **Quầy Barista**: Bảng Kanban 3 cột trực quan (`PAID` ➔ `PREPARING` ➔ `READY`), nhận đơn và cập nhật pha chế tức thời với polling 5s.
   - **Quản trị viên (Admin)**: Dashboard thống kê doanh thu, biểu đồ ngày, cảnh báo kho nguyên liệu chạm ngưỡng tối thiểu, lập phiếu nhập kho tự động cộng dồn tồn kho và kiểm duyệt đánh giá.
3. **Đóng gói Docker Compose Một Lệnh**: Khởi chạy toàn bộ hệ thống gồm PostgreSQL 16, Backend API NestJS và Frontend Next.js.

---

## 2. Cấu Trúc Thư Mục Monorepo

```text
CNPM/
├── backend/                         # NestJS 10 REST API Server
│   ├── prisma/
│   │   ├── schema.prisma            # 17 Model & Enum ánh xạ kiến trúc cơ sở dữ liệu
│   │   └── seed.ts                  # Dữ liệu khởi tạo (Sản phẩm, nguyên liệu, công thức)
│   ├── src/
│   │   ├── common/                  # Filters, Interceptors, Guards (RBAC, JWT)
│   │   ├── modules/
│   │   │   ├── auth/                # Đăng ký, đăng nhập JWT, đổi mật khẩu
│   │   │   ├── products/            # Menu, lọc danh mục, tìm kiếm, biến thể size
│   │   │   ├── promotions/          # Xác thực mã voucher, tính giảm giá
│   │   │   ├── orders/              # Quản lý đơn hàng, Order State Machine, hủy hoàn kho
│   │   │   ├── payment/             # Thanh toán Idempotent, Mock Gateway
│   │   │   ├── staff/               # Vận hành quầy Barista (Kanban)
│   │   │   ├── reviews/             # Đánh giá món (KiemTraDaMua)
│   │   └── admin/               # Quản trị hệ thống, kho, phiếu nhập, thống kê
│   │   ├── app.module.ts
│   │   └── main.ts                  # Swagger OpenAPI (/api/docs)
│   ├── Dockerfile
│   └── package.json
├── frontend/                        # Next.js 14 App Router + TailwindCSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── (customer)/          # Menu (/), Chi tiết món (/products/[id])
│   │   │   ├── cart/                # Giỏ hàng & áp voucher (/cart)
│   │   │   ├── checkout/            # Thanh toán không tiền mặt (/checkout)
│   │   │   ├── orders/              # Xác nhận đơn (/orders/[id]), Lịch sử (/orders/history)
│   │   │   ├── staff/               # Bảng Kanban Barista (/staff)
│   │   │   ├── admin/               # Dashboard Quản trị (/admin)
│   │   │   └── login/               # Cổng Đăng nhập (/login)
│   │   ├── components/              # Navbar, Footer
│   │   ├── store/                   # Zustand (useCartStore, useAuthStore)
│   │   └── lib/api.ts               # Client gọi API tự đính kèm JWT
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── 01-analysis-spec.md          # Đặc tả SRS & phân rã 81 chức năng nguyên tử
│   ├── 02-implementation-plan.md   # Kế hoạch phát triển và triển khai
│   └── DECISIONS.md                 # Nhật ký quyết định kiến trúc (ADR)
├── docker-compose.yml               # Khởi chạy Postgres, Backend, Frontend
├── .env.example
├── README.md
└── package.json                     # Monorepo root scripts
```

---

## 3. Phân Quyền & Bảo Mật Hệ Thống (RBAC & Security)

Hệ thống thiết lập 3 nhóm quyền hạn theo mô hình Role-Based Access Control (RBAC):
- **Khách hàng (Customer)**: Tự do duyệt menu, đăng ký tài khoản thành viên, đặt món, thanh toán không dùng tiền mặt và tích lũy điểm thưởng loyalty.
- **Nhân viên Pha chế (Barista / Staff)**: Quyền truy cập bảng điều khiển vận hành Kanban tại `/staff`.
- **Quản trị viên (Admin)**: Quyền tối cao quản lý chuỗi, doanh thu, kho bãi và nhân sự tại `/admin`.

> [!NOTE]
> Mọi mật khẩu trong cơ sở dữ liệu đều được mã hóa một chiều an toàn bằng **bcrypt**. Cơ chế xác thực qua JWT Access Token (hạn 15 phút) và Refresh Token (hạn 7 ngày) được bảo vệ bằng HTTP Authorization Bearer headers.

---

## 4. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Cách 1: Khởi chạy bằng Docker Compose (Khuyên dùng khi nghiệm thu)
Đảm bảo máy tính đã cài đặt và khởi động Docker Desktop. Tại thư mục gốc `CNPM/`:

```bash
# 1. Khởi chạy toàn bộ hệ thống
docker compose up --build

# Khi khởi chạy, container Backend sẽ tự động chạy migration và seed dữ liệu mẫu!
```
- **Giao diện Khách hàng**: [http://localhost:3000](http://localhost:3000)
- **Bảng Kanban Barista**: [http://localhost:3000/staff](http://localhost:3000/staff)
- **Cổng Quản trị Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
- **Tài liệu Swagger OpenAPI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

### Cách 2: Chạy Local Development (Từng phần)

#### 1. Khởi chạy Backend (`/backend`):
```bash
cd backend
npm install

# Tạo file .env từ .env.example
cp ../.env.example .env

# Chạy Prisma migration và seed dữ liệu
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Chạy server NestJS ở chế độ watch
npm run start:dev
```
Backend API sẽ hoạt động tại: `http://localhost:3001/api`

#### 2. Khởi chạy Frontend (`/frontend`):
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App sẽ hoạt động tại: `http://localhost:3000`

---

## 5. Hướng Dẫn Chạy Bộ Kiểm Thử Tự Động (Unit & Integration Tests)

Tại thư mục `backend/`:
```bash
# Chạy toàn bộ Unit Tests (Order State Machine, Promotions, Payments)
npm test

# Chạy test kèm thống kê độ bao phủ (Coverage >= 80%)
npm run test:cov
```

**Các kịch bản kiểm thử trọng tâm (Task 10):**
1. `order-state-machine.spec.ts`: Chặn mọi chuyển tiếp trạng thái đơn hàng bất hợp lệ (ném `ConflictException`).
2. `payment.service.spec.ts`: Kiểm tra Idempotency (gửi 2 lần cùng key chỉ tạo 1 đơn); kiểm tra trừ kho đồng thời bằng Optimistic Locking (chặn âm kho).
3. `promotions.service.spec.ts`: Kiểm tra tính tiền giảm giá, chặn mã hết hạn hoặc hết lượt dùng.
