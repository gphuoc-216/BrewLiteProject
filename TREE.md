# Sơ Đồ Cây Dự Án BrewLite (`Assigment1`)

Tài liệu tóm tắt nhanh vị trí file + nhiệm vụ chính để mở ngay khi bảo vệ đồ án.

---

## 1. Cấu trúc tổng thể (`Assigment1/`)

```text
Assigment1/
├── backend/              ← API Server (NestJS 10 + Prisma 5 + PostgreSQL, cổng 3001)
├── frontend/             ← Giao diện Web (Next.js 14 + React 18 + TailwindCSS, cổng 3000)
├── docs/                 ← Tài liệu đặc tả, kế hoạch & toàn bộ bộ test Postman (.json, users.csv)
├── scripts/              ← Script chạy nhanh (test-two-users.js, test-race-condition.js, setup.js...)
├── docker-compose.yml    ← Nhạc trưởng bật cùng lúc 3 container: postgres (:5432) -> backend (:3001) -> frontend (:3000)
├── package.json          ← Bảng lệnh tắt ở gốc (npm --prefix backend/frontend ... không cần cd)
├── README.md             ← Hướng dẫn cài đặt & chạy dự án
└── JWT.md                ← Giải thích chi tiết A.B.C (Header.Payload.Signature), 15m/7d, bcrypt & Guards
```

---

## 2. Backend (`backend/`) — Xử lý nghiệp vụ, bảo mật & Database

```text
backend/
├── prisma/
│   ├── schema.prisma     ← Bản vẽ 17 bảng DB (Account, Customer, Staff, Admin, Product, Variant, Recipe, Ingredient.version, Order, Payment.idempotencyKey...)
│   ├── migrations/       ← Lịch sử file SQL (prisma migrate deploy tạo bảng giống nhau trên mọi máy)
│   └── seed.ts           ← Dữ liệu mẫu (admin, barista1/2, customer1/2, 12 món đầu, kho, voucher)
│
└── src/
    ├── main.ts           ← Cổng ngoài: gắn /api, bật CORS (localhost & *.vercel.app), ValidationPipe (whitelist gọt trường giả mạo), Swagger /api/docs, listen('0.0.0.0')
    ├── app.module.ts     ← Bảng tổng đài: nạp .env (ConfigModule), nối DB (PrismaModule) & gắn đủ 8 module nghiệp vụ
    ├── app.controller.ts ← Endpoint GET /health & /api/health (chạy SELECT 1 kiểm tra server/DB sống)
    │
    ├── common/
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts ← Trạm 1: Chặn nếu thiếu/sai/hết hạn JWT (401)
    │   │   └── roles.guard.ts    ← Trạm 2: So sánh @Roles(...) với role thật từ DB (sai quyền -> 403)
    │   ├── decorators/           ← @Roles(...) gắn quyền API; @CurrentUser() lấy nhanh user đang login
    │   ├── filters/              ← AllExceptionsFilter: chuẩn hóa mọi lỗi trả về 1 khuôn JSON
    │   └── interceptors/         ← TransformInterceptor: bọc mọi kết quả thành công vào { success, data }
    │
    └── modules/
        ├── auth/                 ← Đăng ký/Đăng nhập (bcrypt 1024 vòng), cấp JWT (accessToken 15m + refreshToken 7d), JwtStrategy (query DB chặn LOCKED)
        ├── products/             ← Menu & thuật toán Min nguyên liệu: maxAvailable = Math.min(...servings), isOutOfStock = maxAvailable < 1
        ├── promotions/           ← Kiểm tra voucher (hạn dùng, lượt dùng, minOrderValue)
        ├── orders/               ← Tạo đơn PENDING (tự tra giá DB, không tin client), State Machine (cấm hủy khi PREPARING), hủy đơn PAID hoàn kho + thu hồi điểm ($transaction)
        ├── payment/              ← Idempotency-Key (chống trừ tiền 2 lần), trừ kho OCC (version + retry 3 lần, hết kho -> 409), MockGateway (SUCCESS/FAIL/TIMEOUT), Webhook mbbank-sync/check/invalidate
        ├── staff/                ← API cho Barista (@Roles STAFF): PAID -> PREPARING -> READY -> COMPLETED
        ├── reviews/              ← Khách đánh giá 1-5 sao sau khi đơn COMPLETED
        └── admin/                ← CRUD món, size, công thức, kho, nhập hàng, voucher, khóa/mở tài khoản, thống kê
```

---

## 3. Frontend (`frontend/`) — Giao diện, giỏ hàng & quét QR

```text
frontend/
├── public/
│   ├── mbbank/index.html ← App giả lập MBBank (/mbbank): mở camera (getUserMedia) + đọc QR (jsQR) + bắn webhook mbbank-sync
│   └── toppings/         ← Ảnh các loại topping
│
└── src/
    ├── hooks/useRequireRole.ts ← Chặn sai Role / hết hạn JWT ngay khi mở trang (/admin, /staff, /checkout)
    ├── store/
    │   ├── useAuthStore.ts     ← Lưu user & token vào localStorage; khi login tự gọi loadUserCart
    │   └── useCartStore.ts     ← Lưu giỏ theo accountId, tự gộp giỏ khách vãng lai (brewlite_cart_guest) khi login, đồng bộ giá server
    ├── lib/api.ts              ← getApiBaseUrl() + fetchApi(): tự gắn Bearer Token, tự refresh khi 401 (cờ X-Retry-After-Refresh), bóc JSON { data }
    ├── components/             ← Navbar, Footer, ProductQuickSelectModal, components/ui (Button, Card, QuantityStepper, StatusBadge...)
    └── app/
        ├── page.tsx            ← Trang chủ Menu (lọc, tìm kiếm, hiện "Còn X ly")
        ├── products/[id]/      ← Chi tiết món (size, đường, đá, topping)
        ├── cart/               ← Giỏ hàng (chặn vượt maxAvailable, áp voucher, dùng điểm)
        ├── checkout/           ← Vẽ VietQR EMVCo (CRC16), check kho mỗi 4s (?limit=100), poll mbbank-check mỗi 600ms -> khớp tiền & "BREWLITE <mã>" mới chốt PAID
        ├── orders/, login/, register/, profile/, staff/, admin/
        └── api/payments/       ← Next.js API Route trung gian cho MBBank
```

---

## 4. Vấn đề khách hàng thường gặp

1. **Thuật toán Min nguyên liệu**: `backend/src/modules/products/products.service.ts` (`computeVariantStock` → `Math.min(...servings)`).
2. **Chống fake giá từ Client**: `create-order.dto.ts` không có trường `price`; `main.ts` bật `whitelist: true`; `orders.service.ts` tự lấy giá từ PostgreSQL.
3. **Chống âm kho khi 2 user cùng mua (OCC)**: `backend/src/modules/payment/payment.service.ts` (`WHERE version = currentVersion AND stockQuantity >= qty`, retry 3 lần, hết kho → `409 Conflict`).
4. **Chống bấm đúp thanh toán**: `Idempotency-Key` (`@unique` trong bảng `Payment`).
5. **Hủy đơn hoàn kho & thu hồi điểm**: `backend/src/modules/orders/orders.service.ts` (`assertTransition` cấm hủy ở `PREPARING`; `PAID` → `CANCELLED` chạy trong `$transaction`).
6. **Phân quyền & khóa tài khoản ngay lập tức**: `jwt.strategy.ts` (query lại DB check `LOCKED`) + `roles.guard.ts` (`403 Forbidden`).
7. **QR MBBank & đối soát tiền**: `frontend/src/app/checkout/page.tsx` (VietQR EMVCo + poll `600ms`) ↔ `payment.service.ts` (`mbbank-sync` / `mbbank-check`).
8. **Test 2 user tranh chấp / Performance**: `docs/BrewLite_Performance_LoadTest.postman_collection.json`, `docs/BrewLite_Full_API_Collection.postman_collection.json`, `docs/BrewLite_More.postman_collection.json`, `docs/BrewLite_TwoUsers_Performance.postman_collection.json` + `docs/users.csv`.


---

## 📌 Bản Đồ Vị Trí Code Theo 10 Task (Ôn Bảo Vệ Nhanh)

| Task | Nội dung chính | File & Dòng (tầm) |
|---|---|---|
| **Task 1** | Khởi tạo Monorepo, DB Schema, Seed, Docker | `backend/prisma/schema.prisma` · `backend/prisma/seed.ts` · `docker-compose.yml` |
| **Task 2 & 3** | Menu, Tìm kiếm (`search`), Lọc (`category`), Phân trang | `backend/src/modules/products/products.controller.ts` (dòng 10–36) |
| **Task 4** | Chi tiết món, Size, Bảng giá & nguyên liệu Topping | `backend/src/modules/products/constants/toppings.constant.ts` |
| **Task 5 & 6** | Đặt hàng, tính giá Server-side (Never Trust Client) | `backend/src/modules/orders/orders.service.ts` |
| **Task 7** | Auth JWT (`accessToken`/`refreshToken`), RBAC | `backend/src/modules/auth/auth.service.ts` · `backend/src/common/guards/roles.guard.ts` |
| **Task 8** | Thanh toán, `Idempotency-Key`, MBBank Sync + Secret | `backend/src/modules/payment/payment.controller.ts` (dòng 27–90)<br>`backend/src/modules/payment/payment.service.ts` (dòng 565–590: `mbbank-sync` & `x-mbbank-secret`) |
| **⭐ Task 9** | **Order State Machine & Audit Log gian lận** | `backend/src/modules/orders/order-state-machine.ts` (dòng 21–60: `VALID_TRANSITIONS`)<br>`backend/src/modules/staff/staff.controller.ts` (dòng 12–13: `@Roles(Role.STAFF)`)<br>`backend/src/modules/staff/staff.service.ts` (dòng 119–128, 189–197: chặn nhảy cóc & ghi `OrderStatusHistory`) |
| **⭐ Task 10** | **OCC Chống Âm Kho, Docker 3 container & Unit Test** | `backend/src/modules/payment/payment.service.ts` (dòng 320–364: Retry 3 lần + `version` + `stockQuantity >= qty`)<br>`docker-compose.yml` (dòng 13–79: `postgres`, `backend`, `frontend`)<br>`backend/src/modules/*/*.spec.ts` (Unit Test Jest, chạy `npm test`) |


---

## 🌳 Phần Bổ Sung: Cấu Trúc `Assigment2` (Monorepo `apps/`)

```text
Assigment2/
├── .github/                  # CI/CD GitHub Actions (lint, migrate, seed, test)
├── apps/
│   ├── backend/              # NestJS 10 REST API (src/, prisma/)
│   └── frontend/             # Next.js 14 App Router (Web App)
├── docs/                     # Tài liệu & Postman Collections
├── scripts/                  # Script test đồng thời
├── docker-compose.yml        # Chạy 3 container (postgres, backend, frontend)
└── render.yaml               # Cấu hình deploy Backend lên Render
```

- **Lưu ý nhanh:** Code và vị trí các Task bên `Assigment2` giống hệt `Assigment1` ở bảng trên, chỉ khác đường dẫn có thêm tiền tố **`apps/`** (ví dụ: `apps/backend/src/modules/...` và `apps/frontend/...`).
