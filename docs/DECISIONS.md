# Kiến Trúc & Quyết Định Kỹ Thuật (Architecture Decision Records - ADR)

> **Dự án**: BrewLite — Hệ thống đặt cà phê không dùng tiền mặt  
> **Cập nhật lần cuối**: 13/10/2026

---

## ADR-01: Kiến trúc Monorepo phân tách rõ rệt Frontend và Backend

- **Bối cảnh**: Đề bài bài tập lớn môn CNPM yêu cầu xây dựng ứng dụng với Backend bằng NestJS và Frontend bằng Next.js, đi kèm với Docker Compose.
- **Quyết định**: Tổ chức theo dạng Monorepo tại thư mục gốc:
  - `/backend`: NestJS 10, Prisma ORM, Passport JWT, Swagger OpenAPI, Jest/Supertest.
  - `/frontend`: Next.js 14/15 App Router, TailwindCSS, TanStack React Query, Zustand persist.
  - `docker-compose.yml` ở root điều phối PostgreSQL, Backend và Frontend cùng 1 mạng nội bộ `brewlite_network`.
- **Hệ quả**: Phát triển độc lập, test riêng biệt, đóng gói 1 lệnh, chuẩn hóa CI/CD.

---

## ADR-02: Thời điểm Khấu trừ Tồn kho Nguyên liệu (Inventory Deduction Timing)

- **Bối cảnh**: Có 2 lựa chọn thời điểm trừ tồn kho: (A) Khi khách tạo đơn `PENDING`; (B) Khi thanh toán thành công `PAID`.
- **Quyết định**: Chọn **Phương án B: Trừ tồn kho trong cùng Transaction khi thanh toán thành công (`PENDING` ➔ `PAID`)**.
- **Lý do**:
  - Tránh tình trạng giữ chỗ ảo (ghost hold) khi khách tạo đơn rồi bỏ ngang không thanh toán làm cạn kiệt nguyên liệu của khách khác.
  - Được bảo vệ bởi **Optimistic Locking** (`version` field) và cơ chế tự động thử lại tối đa 3 lần (`retry with exponential backoff`).
  - Khi đơn hủy sau khi đã `PAID` (trước khi Barista pha chế), hệ thống gọi hàm hoàn kho `HoanSoLuong` để trả lại chính xác lượng nguyên liệu đã trừ.

---

## ADR-03: Cơ chế Chống Trùng lặp Thanh toán (Payment Idempotency)

- **Bối cảnh**: Người dùng mạng yếu hoặc click đúp nút "Thanh toán" có thể kích hoạt nhiều lệnh trừ tiền và tạo đơn trùng lặp.
- **Quyết định**:
  - Client bắt buộc gửi Header `Idempotency-Key` (UUIDv4) trong request `POST /api/payments`.
  - Cơ sở dữ liệu đặt chỉ mục `UNIQUE` trên cột `idempotencyKey` của bảng `payments`.
  - Backend kiểm tra:
    - Nếu key đã tồn tại với cùng payload ➔ trả về ngay kết quả giao dịch trước đó (HTTP 200).
    - Nếu key đã tồn tại nhưng payload khác ➔ ném lỗi `422 Unprocessable Entity`.
    - Nếu key mới ➔ thực thi giao dịch thanh toán bình thường.

---

## ADR-04: Đơn vị Tiền tệ & Tính toán Điểm thưởng (Money & Loyalty Points)

- **Bối cảnh**: Ngôn ngữ JavaScript xử lý kiểu số thực `Number` (IEEE 754) dễ gây sai số làm tròn tài chính (ví dụ: `0.1 + 0.2 = 0.30000000000000004`).
- **Quyết định**:
  - Dùng kiểu `Decimal` trong Prisma / PostgreSQL hoặc số nguyên VNĐ (`Int/BigInt`) cho mọi phép tính giá tiền, giảm giá và thành tiền. Tuyệt đối không dùng `Float`.
  - Điểm thưởng tích lũy: Khách hàng được cộng 1 điểm cho mỗi 10.000 VNĐ chi tiêu thực tế (sau khi đã trừ khuyến mãi).

---

## ADR-05: Ràng buộc Đánh giá Sản phẩm (Verified Purchase Review - KiemTraDaMua)

- **Bối cảnh**: Tránh spam đánh giá ảo hoặc đánh giá khi chưa từng sử dụng sản phẩm.
- **Quyết định**:
  - Chỉ cho phép khách hàng gửi đánh giá (`POST /api/reviews`) khi thỏa mãn: Khách hàng có ít nhất một đơn hàng chứa sản phẩm đó ở trạng thái `COMPLETED`.
  - Khóa tổng hợp duy nhất: Mỗi bộ 3 `(customerId, productId, orderId)` chỉ được phép tạo đúng 1 bản ghi đánh giá.
