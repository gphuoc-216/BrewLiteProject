# PROMPT CHO ANTIGRAVITY IDE (Gemini Flash High)

> Cách dùng: dán toàn bộ phần dưới vào Antigravity. Nếu agent dừng giữa chừng, gõ: "Tiếp tục từ PHASE tiếp theo, không hỏi lại."
> Nên đính kèm 2 file: `Sơ-đồ-lớp-CNPM.drawio` và PDF đề bài vào workspace để agent đọc.

---

## VAI TRÒ

Bạn là Senior Fullstack Engineer + Tech Lead. Hãy xây dựng hoàn chỉnh hệ thống **BrewLite** (ứng dụng đặt cà phê không dùng tiền mặt) theo đúng sơ đồ lớp và đề bài đính kèm, mở rộng thành hệ thống chuẩn production-grade ở mức bài tập lớn. Làm tuần tự theo từng PHASE, sau mỗi phase tự chạy build + test, sửa lỗi rồi mới sang phase kế tiếp. Không hỏi lại những điều đã có đủ thông tin; nếu có điểm mơ hồ thì tự chọn phương án hợp lý nhất và ghi vào `docs/DECISIONS.md`.

## CÔNG NGHỆ BẮT BUỘC

- Monorepo: `/backend` (NestJS + TypeScript), `/frontend` (Next.js App Router + TypeScript + TailwindCSS), `docker-compose.yml` ở root.
- DB: PostgreSQL + Prisma (migration + seed).
- Backend: class-validator/class-transformer, Passport JWT, bcrypt, Swagger (`/api/docs`), Jest + Supertest, helmet, rate-limit, CORS cấu hình qua env, global exception filter, response format thống nhất.
- Frontend: React Query (dữ liệu server), Zustand (giỏ hàng, persist localStorage), react-hook-form + zod, UI responsive, có loading/empty/error state.
- Mock Payment Service (mô phỏng Momo/VNPay/Stripe) chạy như module riêng trong backend, có thể giả lập thành công/thất bại/timeout.
- Có `.env.example`, README hướng dẫn chạy, `docker compose up` chạy được cả 3 dịch vụ (frontend, backend, db) kèm migrate + seed tự động.

## MÔ HÌNH DỮ LIỆU (bám sát sơ đồ lớp, dùng tên bảng/trường tiếng Anh trong code, ánh xạ rõ sang tên tiếng Việt trong docs)

| Lớp trong sơ đồ | Entity (Prisma model) | Trường chính |
|---|---|---|
| TaiKhoan | Account | id, username (unique), passwordHash, role (CUSTOMER/STAFF/ADMIN), status (ACTIVE/LOCKED) |
| KhachHang | Customer | id, fullName, email (unique), loyaltyPoints (int), accountId (FK, unique, 1-1) |
| NhanVien (Barista) | Staff | id, fullName, email, accountId (FK, unique, 1-1) |
| Admin | Admin | id, fullName, email, accountId (FK, unique, 1-1) |
| SanPham | Product | id, name, imageUrl, (isActive, category: thêm mở rộng) |
| ChiTietSanPham | ProductVariant | id, productId (FK), size (S/M/L), price, topping |
| DonHang | Order | id, customerId (FK), staffId (FK, nullable), promotionId (FK, nullable), status (enum), discountAmount, totalAfterDiscount, createdAt |
| ChiTietDonHang | OrderItem | id (autoincrement), orderId (FK), variantId (FK), quantity, lineTotal |
| TrangThaiDonHang (enum) | OrderStatus | PENDING, PAID, PREPARING, READY, COMPLETED, PAYMENT_FAILED, CANCELLED |
| GiaoDichThanhToan | Payment | id, orderId (FK), idempotencyKey (unique), amount, status, method (WALLET/CARD) |
| KhuyenMai | Promotion | id, code (unique), name, discountType (PERCENT/FIXED), discountValue, quantity, usedCount, startDate, endDate, status |
| NguyenLieu | Ingredient | id, name, unit, stockQuantity (decimal), **version (int, optimistic lock)** |
| CongThuc | Recipe | id, variantId (FK), ingredientId (FK), quantityRequired (unique cặp variantId+ingredientId) |
| NhaCungCap | Supplier | id, name, phone, address |
| PhieuNhap | ImportReceipt | id, supplierId (FK), importDate, totalAmount |
| ChiTietPhieuNhap | ImportReceiptItem | id, receiptId (FK), ingredientId (FK), quantity, unitPrice, lineTotal |
| DanhGia | Review | id, customerId (FK), productId (FK), orderId (FK), stars (1-5), content, createdAt, status (VISIBLE/HIDDEN) |

Quan hệ và bội số (theo sơ đồ):
- Account 1–1 Customer / Staff / Admin.
- Customer 1–0..* Order; Staff 0..1–0..* Order (gán khi nhận đơn); Promotion 0..1–0..* Order.
- Order 1–1..* OrderItem; OrderItem *–1 ProductVariant; Product 1–1..* ProductVariant.
- ProductVariant 1–1..* Recipe; Recipe *–1 Ingredient.
- Supplier 1–1..* ImportReceipt; ImportReceipt 1–1..* ImportReceiptItem; ImportReceiptItem *–1 Ingredient.
- Order 1–0..1 Payment (cho phép nhiều Payment nếu thử lại sau PAYMENT_FAILED, mỗi lần có idempotencyKey riêng).
- Review *–1 Customer, *–1 Product, *–1 Order; chỉ cho review khi đơn của khách chứa sản phẩm đó và đã COMPLETED (`KiemTraDaMua`), mỗi (customer, product, order) chỉ 1 review.

Thêm index hợp lý (order.customerId, order.status, payment.idempotencyKey, promotion.code...). Seed dữ liệu: 1 admin, 2 staff, 3 customer, ≥12 sản phẩm × 3 size, topping, công thức cho từng variant, nguyên liệu có tồn kho, 3 khuyến mãi (còn hạn / hết hạn / hết lượt), nhà cung cấp, vài phiếu nhập, vài đơn mẫu.

## PHÂN QUYỀN (RBAC)

- **Khách hàng (CUSTOMER):** đăng ký/đăng nhập, đổi mật khẩu, xem menu, xem chi tiết, giỏ hàng, nhập mã khuyến mãi, thanh toán, xem lịch sử đơn, hủy đơn (chỉ khi PENDING/PAID chưa PREPARING, hoàn tồn kho và hoàn tiền mock), xem điểm tích lũy, thêm/sửa/xóa đánh giá của mình.
- **Nhân viên/Barista (STAFF):** xem danh sách đơn (lọc theo trạng thái, realtime bằng polling 5s hoặc SSE), nhận đơn (PAID→PREPARING, gán staffId), bắt đầu pha chế, cập nhật trạng thái (READY), hoàn tất (COMPLETED).
- **Admin (ADMIN):** CRUD sản phẩm/variant/công thức, CRUD khuyến mãi, quản lý nhân viên, khóa/mở tài khoản, quản lý nguyên liệu + nhà cung cấp + phiếu nhập (nhập kho cộng tồn trong transaction), duyệt/ẩn đánh giá, thống kê và doanh thu (theo ngày/tuần/tháng, top sản phẩm, đơn theo trạng thái).
- Tài khoản `LOCKED` không đăng nhập được. Mật khẩu bcrypt, JWT access (15 phút) + refresh token (7 ngày), guard theo role, endpoint công khai chỉ gồm menu và auth.

## NGHIỆP VỤ BACKEND BẮT BUỘC (Task 10)

1. **Order State Machine:** bảng chuyển hợp lệ trong một hàm `assertTransition(from, to)`:
   PENDING→PAID | PAYMENT_FAILED | CANCELLED; PAYMENT_FAILED→PENDING(thử lại) | CANCELLED; PAID→PREPARING | CANCELLED; PREPARING→READY; READY→COMPLETED. COMPLETED, CANCELLED là trạng thái kết thúc. Chuyển sai ném `ConflictException` có mã lỗi rõ ràng. Mỗi lần đổi trạng thái ghi `OrderStatusHistory(orderId, from, to, actorId, at)`.
2. **Thanh toán idempotent:** header `Idempotency-Key` bắt buộc ở `POST /payments`. Cùng key + cùng payload → trả lại kết quả cũ, không tạo giao dịch/đơn thứ 2; cùng key + khác payload → 422. Dùng unique constraint DB + xử lý race (bắt lỗi unique, đọc lại bản ghi).
3. **Tồn kho đồng thời:** khi thanh toán thành công (hoặc khi tạo đơn, chọn một và ghi vào DECISIONS.md), trong **một transaction**: tính nguyên liệu cần = Σ(quantity × Recipe.quantityRequired), kiểm tra `stockQuantity`, trừ kho bằng optimistic locking (`UPDATE ... WHERE id=? AND version=?`, tăng version, retry tối đa 3 lần), nếu thiếu thì rollback toàn bộ và báo hết nguyên liệu cụ thể. Hủy đơn/PAYMENT_FAILED phải hoàn kho (`HoanSoLuong`) đúng một lần.
4. **Khuyến mãi + điểm thưởng:** kiểm tra mã (tồn tại, còn hạn, còn lượt `usedCount < quantity`, status active), tính `discountAmount` (PERCENT/FIXED, không vượt tổng tiền), tăng `usedCount` nguyên tử trong transaction. Khi đơn PAID cộng `loyaltyPoints` (ví dụ 1 điểm / 10.000đ sau giảm), hủy đơn thì trừ lại điểm và hoàn lượt mã.
5. Tiền dùng `Decimal`/integer VND, không dùng float cho logic tiền.

## API (REST, prefix `/api`, Swagger đầy đủ, phân trang `?page&limit`)

- Auth: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/change-password`, `GET /auth/me`
- Menu: `GET /products`, `GET /products/:id` (kèm variants, điểm đánh giá trung bình), lọc/tìm kiếm theo tên/category
- Order (customer): `POST /orders`, `GET /orders/me`, `GET /orders/:id`, `POST /orders/:id/cancel`
- Promotion: `POST /promotions/validate` (customer)
- Payment: `POST /payments` (Idempotency-Key)
- Review: `POST/PATCH/DELETE /reviews`, `GET /products/:id/reviews`
- Staff: `GET /staff/orders`, `POST /staff/orders/:id/accept|start|ready|complete`
- Admin: `/admin/products`, `/admin/variants`, `/admin/recipes`, `/admin/promotions`, `/admin/staff`, `/admin/accounts/:id/lock|unlock`, `/admin/ingredients`, `/admin/suppliers`, `/admin/import-receipts`, `/admin/reviews/:id/hide`, `/admin/stats/revenue`, `/admin/stats/overview`
- Mock gateway: `POST /mock-gateway/charge` (có tham số giả lập success/fail/timeout để demo).

## FRONTEND (Next.js)

Trang khách: Menu (lưới, tìm kiếm, lọc), Chi tiết (size, topping, đánh giá), Giỏ hàng (sửa/xóa, mã khuyến mãi), Thanh toán (Ví/Thẻ), Xác nhận (mã đơn, trạng thái, polling cập nhật), Lịch sử đơn + hủy đơn, Hồ sơ + điểm tích lũy, Đăng ký/Đăng nhập.
Trang nhân viên `/staff`: bảng đơn theo cột trạng thái (kiểu kanban) với nút chuyển trạng thái hợp lệ.
Trang admin `/admin`: dashboard thống kê + biểu đồ doanh thu, CRUD sản phẩm/variant/công thức, khuyến mãi, nhân viên, tài khoản, nguyên liệu, nhà cung cấp, phiếu nhập, kiểm duyệt đánh giá.
Middleware chặn route theo role, xử lý 401 → refresh token → redirect login. Giao diện đẹp, nhất quán (theme cà phê nâu/kem), responsive mobile-first, accessible cơ bản.

## KIỂM THỬ (bắt buộc, phải pass)

- Unit: `assertTransition` (hợp lệ và không hợp lệ), tính giá/giảm giá/điểm, tính nguyên liệu cần.
- Integration (Supertest + DB test): (a) chuyển trạng thái sai bị chặn; (b) gửi 2 lần cùng Idempotency-Key chỉ tạo 1 giao dịch/1 lần trừ kho; (c) 20 request đặt đồng thời không làm tồn kho âm; (d) mã hết lượt bị từ chối khi đặt đồng thời; (e) hủy đơn hoàn kho + điểm + lượt mã; (f) RBAC: customer không gọi được API staff/admin; (g) review chỉ khi đã mua.
- Frontend: test các hook/store giỏ hàng chính (tính tổng, thêm/sửa/xóa).
- Script `npm run test`, `npm run test:e2e` ở backend.

## TÀI LIỆU & BÀN GIAO

`README.md` (cài đặt, chạy local, chạy docker, tài khoản demo, cách chạy test), `docs/ARCHITECTURE.md` (sơ đồ kiến trúc, ERD Mermaid khớp sơ đồ lớp, sequence diagram luồng thanh toán), `docs/DECISIONS.md`, `docs/API.md` (hoặc Swagger), Postman collection, `.env.example`. Commit Git theo từng phase với message rõ ràng (Conventional Commits).

## QUY TRÌNH THỰC HIỆN (làm đúng thứ tự, báo cáo ngắn sau mỗi phase)

- **PHASE 0:** Đọc 2 file đính kèm, lập kế hoạch, tạo cấu trúc monorepo, docker-compose, Prisma schema + migration + seed.
- **PHASE 1:** Auth + Account/Customer/Staff/Admin + RBAC + Swagger.
- **PHASE 2:** Product, ProductVariant, Ingredient, Recipe + menu API + frontend Menu/Chi tiết.
- **PHASE 3:** Giỏ hàng, Promotion, Order (PENDING) + frontend giỏ hàng.
- **PHASE 4:** Payment mock + idempotency + State Machine + trừ kho optimistic lock + điểm thưởng + hủy/hoàn.
- **PHASE 5:** Staff flow (kanban) + lịch sử đơn + xác nhận đơn.
- **PHASE 6:** Admin: CRUD, nhập kho (Supplier/ImportReceipt), thống kê, Review.
- **PHASE 7:** Hoàn thiện test, UI polish, tài liệu, chạy `docker compose up` kiểm tra end-to-end, liệt kê checklist Definition of Done (build sạch, validate đầu vào, loading/error state, README).

## TIÊU CHÍ HOÀN THÀNH

Chạy `docker compose up` là có hệ thống chạy được với dữ liệu mẫu; luồng end-to-end: chọn sản phẩm → giỏ hàng → mã giảm giá → thanh toán → barista nhận/pha/giao → khách đánh giá → admin xem thống kê, đều hoạt động; toàn bộ test pass; API phản hồi < 500ms với dữ liệu mẫu. Cuối cùng xuất báo cáo: đã làm gì, chạy thế nào, các giả định đã chọn, việc còn tồn đọng.
