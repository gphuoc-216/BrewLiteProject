# ☕ BrewLite — Hệ Thống Đặt Hàng & Thanh Toán Cà Phê Không Dùng Tiền Mặt
## (Cashless Coffee Ordering & Kitchen Management Platform)

> **Môn học**: Công Nghệ Phần Mềm (CNPM)  
> **Kiến trúc hệ thống**: Monorepo NestJS 10 (Backend API) + Next.js 14 App Router (Frontend Web App) + PostgreSQL 16 + Prisma ORM 5.x + Docker Compose  
> **Mô hình quản lý**: Agile Scrum kết hợp State Machine & Optimistic Locking  
> **Repository**: [https://github.com/gphuoc-216/BrewLiteProject](https://github.com/gphuoc-216/BrewLiteProject)

---

## 📌 MỤC LỤC TỔNG QUAN LOGIC ĐỒ ÁN
1. [Tầm Nhìn & Bối Cảnh Nghiệp Vụ](#1-tầm-nhìn--bối-cảnh-nghiệp-vụ)
2. [Kiến Trúc Kỹ Thuật & Công Nghệ Cốt Lõi](#2-kiến-trúc-kỹ-thuật--công-nghệ-cốt-lõi)
3. [Chi Tiết Toàn Bộ Logic 8 Phân Hệ Nghiệp Vụ](#3-chi-tiết-toàn-bộ-logic-8-phân-hệ-nghiệp-vụ)
   - [Phân hệ 1: Xác Thực & Quản Lý Tài Khoản (RBAC)](#phân-hệ-1-xác-thực--quản-lý-tài-khoản-rbac)
   - [Phân hệ 2: Thực Đơn, Biến Thể Size & Công Thức Định Lượng](#phân-hệ-2-thực-đơn-biến-thể-size--công-thức-định-lượng)
   - [Phân hệ 3: Giỏ Hàng Bền Vững & Động Cơ Khuyến Mãi (Voucher Engine)](#phân-hệ-3-giỏ-hàng-bền-vững--động-cơ-khuyến-mãi-voucher-engine)
   - [Phân hệ 4: Đặt Hàng, Thanh Toán Idempotent, VietQR & MBBank Sync](#phân-hệ-4-đặt-hàng-thanh-toán-idempotent-vietqr--mbbank-sync)
   - [Phân hệ 5: Vận Hành Quầy Barista (Kitchen Display & Kanban Board)](#phân-hệ-5-vận-hành-quầy-barista-kitchen-display--kanban-board)
   - [Phân hệ 6: Quản Lý Kho, Cảnh Báo Ngưỡng & Nhập Hàng Tự Động](#phân-hệ-6-quản-lý-kho-cảnh-báo-ngưỡng--nhập-hàng-tự-động)
   - [Phân hệ 7: Đánh Giá Đồ Uống & Ràng Buộc Đã Mua (KiemTraDaMua)](#phân-hệ-7-đánh-giá-đồ-uống--ràng-buộc-đã-mua-kiemtradamua)
   - [Phân hệ 8: Báo Cáo Thống Kê & Doanh Thu Thời Gian Thực](#phân-hệ-8-báo-cáo-thống-kê--doanh-thu-thời-gian-thực)
4. [Các Thuật Toán & Cơ Chế Xử Lý Kỹ Thuật Nổi Bật](#4-các-thuật-toán--cơ-chế-xử-lý-kỹ-thuật-nổi-bật)
5. [Mô Hình Dữ Liệu Thực Thể (Database Schema)](#5-mô-hình-dữ-liệu-thực-thể-database-schema)
6. [Hướng Dẫn Cài Đặt & Chạy Demo Toàn Bộ Hệ Thống](#6-hướng-dẫn-cài-đặt--chạy-demo-toàn-bộ-hệ-thống)
7. [Tài Khoản Mẫu Để Kiểm Thử Nghiệm Thu](#7-tài-khoản-mẫu-để-kiểm-thử-nghiệm-thu)
8. [Bảng Phân Công Công Việc 7 Thành Viên](#8-bảng-phân-công-công-việc-7-thành-viên)

---

## 8. Bảng Phân Công Công Việc 7 Thành Viên

> Chi tiết đầy đủ xem tại file: **[docs/TASK-ALLOCATION.md](./docs/TASK-ALLOCATION.md)**

| STT | Thành Viên | GitHub | Gói Đảm Nhận | Task Phụ Trách | Nhánh Git |
|:---:|:---|:---|:---|:---:|:---|
| 1 | **Võ Đức Hoàng Vinh** | `V9vinh` | [P1 - FE] Dựng nền Next.js + Menu món | Task 1 FE, Task 3 | `feat/p1-menu-page` |
| 2 | **Hồ Hoàng Anh** | `anhho7303-source` | [P2 - FE] Chi tiết món + Size & Topping | Task 4 | `feat/p2-product-details` |
| 3 | **Dương Thành Phát** | `phatthanh-kiko` | [P3 - FE] Giỏ hàng Zustand + Trang /cart | Task 5 | `feat/p3-cart-store` |
| 4 | **Quách Thanh Phú** | `quachthanhphuu-maker` | [P4 - FE] Auth UI + Checkout + Lịch sử đơn /orders/me | Task 7 FE, 8 FE, 9 FE | `feat/p4-checkout-history` |
| 5 | **Đặng Lương Thế Anh** | `dangluongtheanh-max` | [P5 - BE] Khởi tạo NestJS + PostgreSQL + API /products | Task 1 BE, Task 2 | `feat/p5-api-products` |
| 6 | **Nguyễn Hoàng Anh** | `hanhdevsgu` | [P6 - BE] Quản lý Nguyên liệu & Công thức + Mock Payment (Paymock/VietQR/MBBank) + API Orders & Auth JWT | Task 6 BE, 7 BE, 8 BE, Module Nguyên liệu | `feat/p6-payment-ingredients-orders` |
| 7 | **Hoàng Trần Gia Phước** | `gphuoc-216` | [P7 - BE] State Machine + Optimistic Locking + Docker Compose & Unit Test | Task 9 BE, Task 10 BE, DevOps | `feature/p7-backend` |

---

## 1. Tầm Nhìn & Bối Cảnh Nghiệp Vụ

### 1.1 Bài toán thực tế
Tại các chuỗi cà phê và quầy thức uống hiện nay:
- **Khách hàng**: Tốn nhiều thời gian xếp hàng gọi món, chờ tiền thối tiền mặt vào giờ cao điểm, khó tùy biến công thức kích cỡ/topping theo sở thích.
- **Quầy Pha chế (Barista)**: Nhận đơn bằng giấy in nhiệt hoặc truyền miệng dễ thất lạc, nhầm lẫn thứ tự pha chế, khó kiểm soát thời gian làm món.
- **Chủ cửa hàng (Quản lý)**: Thất thoát nguyên liệu không rõ nguyên nhân, xung đột tồn kho khi nhiều đơn phát sinh đồng thời, không nắm bắt số liệu doanh thu tức thời.

### 1.2 Giải pháp BrewLite
BrewLite cung cấp nền tảng **Cashless Coffee Platform** khép kín:
- Khách tự quét mã QR / mở web đặt món và tùy biến size.
- Thanh toán số hóa qua chuẩn **VietQR Napas 247** và **MBBank Mobile Simulator**.
- Đơn hàng tự động đẩy thẳng vào **Bảng Kanban tại quầy Barista** theo thời gian thực.
- Tự động trừ tồn kho nguyên liệu theo công thức pha chế bằng cơ chế **Optimistic Locking**.
- Thống kê doanh thu, cảnh báo nguyên liệu sắp hết và quản lý chuỗi cung ứng minh bạch.

---

## 2. Kiến Trúc Kỹ Thuật & Công Nghệ Cốt Lõi

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  [Khách Hàng (Customer)]         [Quầy Pha Chế (Barista)]        [Quản Trị (Admin)] |
|    Next.js 14 Web App                Bảng Kanban KDS             Dashboard Doanh Thu  |
|                                                                                   |
|  [Mobile Safari/Chrome] ----(HTTPS:3443)---> [https-proxy.js] (Bật quyền Camera) |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                           API GATEWAY & BACKEND (NestJS 10)                       |
|   JWT Passport Guard | Role RBAC Guard | ValidationPipe (Class-Validator)         |
|                                                                                   |
|  +--------------------+  +--------------------+  +----------------------------+   |
|  | Auth & Accounts    |  | Orders & Payment   |  | Inventory & Recipes        |   |
|  | State Machine      |  | Idempotency Engine |  | Optimistic Lock (version)  |   |
|  +--------------------+  +--------------------+  +----------------------------+   |
|  | Promotions Engine  |  | Staff Kanban KDS   |  | Reviews (KiemTraDaMua)     |   |
|  +--------------------+  +--------------------+  +----------------------------+   |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                              DATABASE LAYER (PostgreSQL 16)                       |
|                Prisma ORM 5.x | ACID Transactions | Decimal Money                 |
+-----------------------------------------------------------------------------------+
```

---

## 3. Chi Tiết Toàn Bộ Logic 8 Phân Hệ Nghiệp Vụ

Toàn bộ hệ thống gồm **8 phân hệ nghiệp vụ** và **81 chức năng nguyên tử (atomic leaf functions)** được phân rã chi tiết như sau:

### Phân hệ 1: Xác Thực & Quản Lý Tài Khoản (RBAC)
1. **Đăng ký tài khoản khách hàng**: Kiểm tra tính duy nhất của username/email/số điện thoại; băm mật khẩu 1 chiều bằng thuật toán `bcrypt` với salt round = 10; tự động khởi tạo hồ sơ `CustomerProfile` kèm 0 điểm thưởng tích lũy.
2. **Đăng nhập nhận JWT Token**: Kiểm tra mật khẩu, tài khoản không bị khóa (`isActive = true`), cấp phát cặp token:
   - `accessToken`: Hạn dùng 15 phút, chứa payload `{ id, username, role, profileId }`.
   - `refreshToken`: Hạn dùng 7 ngày, lưu mã băm an toàn trong CSDL.
3. **Làm mới Token (Refresh Token)**: Xoay vòng token an toàn, ngăn chặn việc sử dụng token hết hạn mà không bắt người dùng đăng nhập lại liên tục.
4. **Phân quyền 3 cấp độ (RBAC Guards)**:
   - `CUSTOMER`: Chỉ được xem/sửa dữ liệu giỏ hàng, đơn hàng cá nhân, đánh giá của mình.
   - `STAFF`: Quyền truy cập bảng Kanban quầy Barista `/staff`, tiếp nhận đơn và cập nhật quy trình pha chế.
   - `ADMIN`: Quyền tối cao quản lý người dùng, khóa/mở khóa tài khoản, tạo tài khoản nhân viên, xem toàn bộ báo cáo doanh thu và kho bãi.

---

### Phân hệ 2: Thực Đơn, Biến Thể Size & Công Thức Định Lượng
1. **Cấu trúc sản phẩm đa biến thể**: Mỗi sản phẩm (ví dụ: *Cà Phê Cốt Dừa*) có nhiều biến thể kích cỡ (`Size S`, `Size M`, `Size L`) với đơn giá khác nhau.
2. **Công thức pha chế nguyên liệu (Recipes)**: Mỗi biến thể kích cỡ được gắn với một bảng công thức định lượng chi tiết:
   - *Ví dụ*: Ly Cà phê sữa Size M = 20g Hạt cà phê Robusta + 30ml Sữa đặc + 100ml Sữa tươi.
3. **Tìm kiếm & Phân loại đa năng**: Hỗ trợ tìm kiếm theo từ khóa không dấu/có dấu, lọc theo danh mục (`COFFEE`, `TEA`, `FREEZE`, `PASTRY`) và sắp xếp theo giá tiền/độ phổ biến.

---

### Phân hệ 3: Giỏ Hàng Bền Vững & Động Cơ Khuyến Mãi (Voucher Engine)
1. **Giỏ hàng lưu trữ bền vững (Zustand Persist)**: Dữ liệu giỏ hàng lưu an toàn trong `localStorage`, không bị mất khi F5 hoặc mở lại trình duyệt.
2. **Xác thực mã voucher (Voucher Validation)**:
   - Kiểm tra mã voucher có tồn tại và đang ở trạng thái kích hoạt (`isActive = true`).
   - Kiểm tra hiệu lực thời gian (`startDate <= Hiện tại <= endDate`).
   - Kiểm tra số lượt sử dụng tối đa (`usedCount < maxUsage`).
   - Kiểm tra giá trị đơn hàng tối thiểu (`minOrderValue`).
3. **Tính toán chiết khấu tài chính chính xác**:
   - `PERCENTAGE`: Giảm theo % giá trị đơn, có áp trần giảm giá tối đa (`maxDiscount`).
   - `FIXED_AMOUNT`: Giảm trực tiếp số tiền cố định.
   - Đảm bảo `finalTotal >= 0`, không làm tròn số float làm sai lệch doanh thu.

---

### Phân hệ 4: Đặt Hàng, Thanh Toán Idempotent, VietQR & MBBank Sync
Đây là phân hệ cốt lõi với quy trình khép kín:

```
[Khách chọn món] 
      │
      ▼
[Tạo đơn PENDING] ──(Tạo mã VietQR Napas 247 & Hạn 300s)
      │
      ├──────────────────────────────┬──────────────────────────────┐
      ▼                              ▼                              ▼
[Quét App MBBank/Phone]     [Chuyển SAI nội dung]         [Chuyển THIẾU tiền]
      │                              │                              │
[Khớp mã: BREWLITE BLxxxxxx]         │                              │
      │                              ▼                              ▼
      │                    [TỪ CHỐI TỰ ĐỘNG]             [Báo thiếu số tiền]
      │                    [Báo lỗi đỏ viền đậm]         [Yêu cầu chuyển tiếp]
      ▼                    [Chuyển tra soát 10%]
[Xác thực Digital OTP 6 số]
      │
      ▼
[Bắn Webhook /mbbank-sync]
      │
      ▼
[Backend kiểm tra Idempotency]
      │
      ▼
[Khấu trừ Kho bằng Optimistic Lock]
      │
      ▼
[Đơn chuyển trạng thái PAID] ──(Ting Ting chuông, Xóa mã QR, Chặn nút Back)
      │
      ▼
[Đẩy vào Bảng Kanban Barista]
```

1. **Vòng đời đơn hàng (Order State Machine)**:
   - Các trạng thái hợp lệ: `PENDING` ➔ `PAID` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED` (hoặc `CANCELLED` khi chưa pha chế).
   - Tuyệt đối không cho phép nhảy cóc trạng thái (ví dụ: từ `PENDING` lên `COMPLETED`).
2. **Khóa chống trùng lặp thanh toán (Payment Idempotency)**:
   - Bắt buộc Header `Idempotency-Key` (UUIDv4) cho mỗi phiên thanh toán.
   - Ngăn chặn triệt để tình trạng mạng lag hoặc khách bấm liên tục khiến tài khoản bị trừ tiền 2 lần.
3. **Khấu trừ tồn kho nguyên liệu an toàn (Optimistic Locking)**:
   - Khi thanh toán thành công (`PENDING` ➔ `PAID`), hệ thống tra cứu công thức của từng ly nước và trừ số lượng nguyên liệu trong kho tương ứng.
   - Dùng trường `version` trên bảng nguyên liệu để phát hiện xung đột đồng thời, tự động thử lại (Retry) tối đa 3 lần. Nếu hết hàng, giao dịch tự động Rollback hoàn tiền.
4. **Tích lũy điểm thưởng thành viên (Loyalty Points)**:
   - Cộng tự động 1 điểm thưởng cho mỗi 10.000 VNĐ thanh toán thực tế (sau khi trừ khuyến mãi).
5. **Nghiệp vụ chuyển tiền SAI NỘI DUNG**:
   - Nếu khách hàng chuyển khoản nhưng nội dung **không chứa** cú pháp `BREWLITE BLxxxxxx`:
   - Hệ thống **từ chối kích hoạt tự động**, không chuyển trạng thái sang `PAID`, không trừ kho.
   - Màn hình thanh toán lập tức hiển thị cảnh báo viền đỏ nổi bật, thông báo giao dịch chuyển sang diện *Tra soát thủ công tại quầy (khấu trừ 10% phí vận hành theo quy chế)*.
6. **Hủy mã QR & Chặn nút Back tuyệt đối**:
   - Ngay khi đơn thanh toán thành công: Mã QR bị xóa khỏi bộ nhớ (`localStorage`, `sessionStorage`) và gửi lệnh xóa trên cache Backend (`POST /api/payments/mbbank-invalidate/[code]`).
   - Chuyển hướng bằng `router.replace` và bắt sự kiện `popstate`: Nếu người dùng cố tình bấm phím Back trên trình duyệt/điện thoại, hệ thống sẽ **tự động đẩy thẳng về trang Thực đơn (`/products`)**, tuyệt đối không hiển thị lại mã QR đã thanh toán.

---

### Phân hệ 5: Vận Hành Quầy Barista (Kitchen Display & Kanban Board)
1. **Bảng Kanban thời gian thực 3 cột**:
   - Cột 1: **ĐÃ THANH TOÁN (PAID)** — Đơn mới từ khách hàng đẩy về quầy.
   - Cột 2: **ĐANG PHA CHẾ (PREPARING)** — Barista bấm "Nhận đơn", bắt đầu làm món.
   - Cột 3: **SẴN SÀNG LẤY MÓN (READY)** — Pha xong, hệ thống thông báo mời khách tới quầy nhận nước.
2. **Chuyển giao đơn hoàn tất (COMPLETED)**:
   - Khi khách nhận đồ uống, Barista bấm "Hoàn thành", đơn hàng đóng lại và chuyển vào lịch sử doanh thu.
3. **Đồng bộ trạng thái 2 chiều**:
   - Màn hình theo dõi đơn của khách hàng (`/orders/[id]`) tự động đồng bộ chấm tròn tiến độ tương ứng theo từng thao tác của Barista.

---

### Phân hệ 6: Quản Lý Kho, Cảnh Báo Ngưỡng & Nhập Hàng Tự Động
1. **Kiểm soát tồn kho nguyên liệu**: Quản lý chi tiết số lượng tồn, đơn vị tính (g, ml, hộp, cái), giá vốn của từng loại nguyên liệu (Hạt Arabica, Robusta, Sữa đặc, Cốt dừa, Ly nhựa, Ống hút...).
2. **Cảnh báo chạm ngưỡng an toàn (Low-stock Alert)**:
   - Khi số lượng tồn thực tế `<= minThreshold`, hệ thống tự động gắn cờ cảnh báo đỏ để quản lý kịp thời nhập hàng.
3. **Phiếu nhập kho (Import Receipts)**:
   - Quản lý nhà cung cấp (Supplier) và lập phiếu nhập kho.
   - Khi tạo phiếu nhập kho, CSDL tự động chạy Transaction cộng dồn số lượng nguyên liệu vào kho và cập nhật giá vốn trung bình.

---

### Phân hệ 7: Đánh Giá Đồ Uống & Ràng Buộc Đã Mua (KiemTraDaMua)
1. **Ràng buộc mua hàng xác thực (Verified Purchase)**:
   - Khách hàng chỉ được phép gửi đánh giá (1 đến 5 sao và bình luận) khi và chỉ khi **đã có ít nhất 1 đơn hàng chứa món đó ở trạng thái `COMPLETED`**.
   - Tránh triệt để tình trạng đánh giá ảo, spam hoặc đối thủ phá hoại.
2. **Khóa chống đánh giá trùng**: Mỗi bộ ba `(customerId, productId, orderId)` chỉ được phép tạo đúng 1 bài đánh giá.
3. **Kiểm duyệt đánh giá (Admin Moderation)**: Quản trị viên có quyền ẩn các đánh giá chứa từ ngữ phản cảm hoặc không đúng sự thật.

---

### Phân hệ 8: Báo Cáo Thống Kê & Doanh Thu Thời Gian Thực
1. **Chỉ số kinh doanh tổng quan**:
   - Tổng doanh thu thực thu theo ngày/tuần/tháng.
   - Tổng số đơn hàng đã phục vụ và tỷ lệ đơn hoàn thành/hủy.
   - Số lượng khách hàng thành viên mới đăng ký.
2. **Top sản phẩm bán chạy**: Thống kê đồ uống được yêu thích nhất theo số lượng ly và theo doanh thu.
3. **Biểu đồ trực quan**: Biểu đồ cột phân bố doanh thu theo thời gian và biểu đồ tròn phân tích tỷ trọng các phương thức thanh toán.

---

## 4. Các Thuật Toán & Cơ Chế Xử Lý Kỹ Thuật Nổi Bật

| Tên cơ chế | Thuật toán / Kỹ thuật áp dụng | Mục đích giải quyết |
|:---|:---|:---|
| **Order State Machine** | Finite State Machine (FSM) | Kiểm soát chặt chẽ quy trình chuyển trạng thái đơn hàng, cấm chuyển ngược hoặc nhảy cóc. |
| **Payment Idempotency** | UUIDv4 Header + DB Unique Index | Chống trừ tiền trùng khi mạng yếu hoặc khách click đúp. |
| **Optimistic Locking** | Phiên bản bản ghi (`version` field) + Exponential Retry | Ngăn chặn hiện tượng Race Condition khi nhiều đơn hàng cùng tranh chấp một loại nguyên liệu kho. |
| **VietQR Napas 247** | Chuẩn mã hóa EMVCo QR Code | Tự động sinh mã VietQR chứa STK, số tiền và mã hóa đơn để thanh toán qua mọi app ngân hàng. |
| **HTTPS Mobile Proxy** | Node.js TLS Reverse Proxy (`https-proxy.js`) | Cho phép mở camera quét mã QR trên điện thoại Safari/Chrome khi chạy trong mạng LAN. |
| **Auto-Sync Polling** | Polling đồng bộ 2s + LocalStorage Event | Nhận diện biến động số dư tức thời từ ứng dụng MBBank điện thoại về màn hình checkout máy tính. |
| **Verified Purchase** | Sub-query EXISTS trên OrderItems + Status Check | Bảo vệ độ tin cậy của hệ thống đánh giá sản phẩm. |

---

## 5. Mô Hình Dữ Liệu Thực Thể (Database Schema)

Hệ thống được thiết kế trên PostgreSQL với **17 Models & Enums** thông qua Prisma ORM:

```
[User] 1 ──── 1 [CustomerProfile] 1 ──── N [Order] 1 ──── N [OrderItem] N ──── 1 [ProductVariant]
  │                                           │                                        │
  ├──── 1 [StaffProfile]                      ├──── 1 [Payment]                        ├──── N [Recipe]
  │                                           │                                        │        │
  └──── 1 [AdminProfile]                      ├──── N [OrderStatusHistory]             │        v
                                              │                                        │   [Ingredient]
                                              └──── 0..1 [Promotion]                   │
                                                                                       v
                                                                                   [Product] 1 ──── N [Review]
```

* **`User`**: Tài khoản người dùng (id, username, passwordHash, role: `CUSTOMER` | `STAFF` | `ADMIN`, isActive).
* **`CustomerProfile`**: Hồ sơ khách (fullName, phone, address, loyaltyPoints).
* **`Product` & `ProductVariant`**: Danh mục đồ uống, biến thể kích cỡ (Size S/M/L) và đơn giá.
* **`Ingredient` & `Recipe`**: Định mức nguyên liệu tiêu hao cho từng biến thể ly nước.
* **`Order` & `OrderItem`**: Đơn hàng, chi tiết món, giá tiền, ghi chú đá/đường và trạng thái State Machine.
* **`Payment`**: Giao dịch thanh toán (method: `CARD` | `WALLET`, amount, idempotencyKey, status).
* **`Promotion`**: Mã voucher giảm giá, hạn mức, ngày bắt đầu/kết thúc, số lượt đã dùng.
* **`Review`**: Đánh giá sao (1-5), nhận xét, hình ảnh, cờ kiểm duyệt.
* **`Supplier` & `ImportReceipt`**: Nhà cung cấp và phiếu nhập kho cộng dồn tồn kho.

---

## 6. Hướng Dẫn Cài Đặt & Khởi Chạy Toàn Bộ Hệ Thống (Từ A đến Z)

### 6.1 Yêu Cầu Môi Trường Tiên Quyết (Prerequisites)
Trước khi cài đặt, máy tính cần chuẩn bị:
- **Node.js**: Phiên bản `18.x` hoặc `20.x LTS` (Khuyến nghị `Node.js 20.x`). Kiểm tra bằng: `node -v`.
- **NPM**: Phiên bản `9.x` hoặc `10.x` (đi kèm Node.js). Kiểm tra bằng: `npm -v`.
- **Git**: Đã cài đặt để quản trị mã nguồn. Kiểm tra bằng: `git --version`.
- **Docker Desktop**: (Tùy chọn nhưng **khuyến nghị mạnh mẽ**) để chạy CSDL PostgreSQL và trọn bộ hệ thống chỉ với 1 câu lệnh duy nhất.

---

### 6.2 Bước 1: Tải Mã Nguồn & Cấu Hình Biến Môi Trường (.env)

#### 1. Clone repository về máy:
```bash
git clone https://github.com/gphuoc-216/BrewLiteProject.git
cd BrewLiteProject
```

#### 2. Cấu hình biến môi trường Backend:
Sao chép file mẫu `backend/.env.example` thành `backend/.env`:
```powershell
# Trên Windows PowerShell:
copy backend\.env.example backend\.env
```
*(Nội dung file `backend/.env` đã được cấu hình mặc định chuẩn kết nối local/Docker, bao gồm `DATABASE_URL`, `PORT=3001`, `JWT_SECRET`, `FRONTEND_URL="http://localhost:3000"`).*

#### 3. Cấu hình biến môi trường Frontend:
Sao chép file mẫu `frontend/.env.example` thành `frontend/.env.local`:
```powershell
# Trên Windows PowerShell:
copy frontend\.env.example frontend\.env.local
```
*(Nội dung file `frontend/.env.local` chứa `NEXT_PUBLIC_API_URL="http://localhost:3001/api"`).*

---

### 6.3 Cách 1: Khởi Chạy 1-Click Bằng Docker Compose (Khuyên Dùng Cho Giảng Viên & Nghiệm Thu)

Đây là cách nhanh nhất và chuẩn xác nhất: Docker sẽ tự động dựng toàn bộ PostgreSQL 16, Backend NestJS và Frontend Next.js trong mạng nội bộ độc lập.

#### Khởi chạy:
Tại thư mục gốc dự án, thực thi lệnh:
```bash
docker compose up -d --build
```
> Hệ thống sẽ tự động:
> 1. Tải image PostgreSQL 16 Alpine và khởi chạy database `brewlite_db`.
> 2. Build multi-stage image cho Backend NestJS, generate Prisma Client, kết nối DB.
> 3. Build tối ưu production Next.js 14 Frontend.
> 4. Khởi động cả 3 container và tự động gắn healthcheck kiểm tra độ sẵn sàng.

#### Kiểm tra trạng thái các dịch vụ:
```bash
docker compose ps
```
*Kết quả hiển thị 3 container: `brewlite_postgres` (cổng 5432), `brewlite_backend` (cổng 3001), `brewlite_frontend` (cổng 3000) đều ở trạng thái `Up / Healthy`.*

#### Nạp dữ liệu mẫu ban đầu (Seed Database):
Nếu khởi chạy lần đầu trên máy mới, hãy nạp dữ liệu menu đồ uống, công thức và tài khoản mẫu:
```bash
docker exec -it brewlite_backend npm run seed
```

#### Xem logs trực tiếp khi cần theo dõi:
```bash
docker compose logs -f
# Hoặc xem riêng từng dịch vụ:
docker compose logs -f backend
docker compose logs -f frontend
```

#### Dừng hệ thống:
```bash
# Dừng các container (dữ liệu CSDL vẫn được lưu bền vững trên Volume):
docker compose down

# Dừng và XÓA TOÀN BỘ dữ liệu CSDL để nạp lại từ đầu:
docker compose down -v
```

---

### 6.4 Cách 2: Khởi Chạy Thủ Công Từng Phần (Local Development Cho Lập Trình Viên)

Dành cho thành viên nhóm muốn chạy mã nguồn trực tiếp trên máy không thông qua container backend/frontend:

#### Bước 1: Khởi động CSDL PostgreSQL
Bạn có thể dùng PostgreSQL đã cài trên máy, hoặc bật nhanh PostgreSQL bằng Docker:
```bash
docker run --name brewlite_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgrespassword -e POSTGRES_DB=brewlite_db -p 5432:5432 -d postgres:16-alpine
```

#### Bước 2: Cài đặt và khởi chạy Backend (NestJS)
Mở một cửa sổ Terminal:
```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed              # Nạp danh mục đồ uống, nguyên liệu tồn kho và tài khoản mẫu
npm run start:dev
```
> ✅ Backend sẵn sàng tại: `http://localhost:3001`  
> 📑 Tài liệu Swagger API tại: `http://localhost:3001/api/docs`

#### Bước 3: Cài đặt và khởi chạy Frontend (Next.js)
Mở một cửa sổ Terminal thứ hai:
```powershell
cd frontend
npm install
npm run dev
```
> ✅ Giao diện Web khách hàng sẵn sàng tại: `http://localhost:3000`

---

### 6.5 Cách 3: Trải Nghiệm Demo Quét Mã QR Bằng Điện Thoại Thật (Mobile QR Payment)

Hệ thống hỗ trợ 2 phương án để demo tính năng quét mã QR thanh toán trên điện thoại di động thật:

#### Phương án A — Dùng Cloudflare Tunnel tích hợp sẵn (Khuyên Dùng):
Không cần cùng mạng Wi-Fi, tự động có HTTPS chuẩn quốc tế để bật Camera:
```powershell
# Tại thư mục gốc:
npm run phone
# Hoặc:
node scripts/tunnel.js
```
> Terminal sẽ hiển thị **Mã QR to rõ ngay trong console** và một đường link HTTPS công khai (VD: `https://xxxx.trycloudflare.com`). Dùng camera điện thoại quét để mở ngay ứng dụng MBBank Simulator!

#### Phương án B — Dùng HTTPS Reverse Proxy nội bộ qua mạng LAN:
Yêu cầu điện thoại và máy tính kết nối chung một mạng Wi-Fi:
1. Mở Terminal gõ `ipconfig` xem địa chỉ IPv4 máy tính (VD: `192.168.1.149`).
2. Chạy proxy:
```powershell
node https-proxy.js
```
3. Mở trình duyệt Safari/Chrome trên điện thoại truy cập: `https://<Địa_Chỉ_IP>:3443/mbbank` (bấm Cho phép chứng chỉ tự ký).

---

### 6.6 Cách 4: Chạy Kiểm Thử Tự Động (Automated Testing & Concurrency)

#### 1. Chạy toàn bộ 5 Test Suites Unit Tests Backend (43 unit tests):
```powershell
# Chạy từ thư mục gốc:
npm run test
# Hoặc:
npm --prefix backend test
```
*Kiểm thử toàn diện: Order State Machine, Khóa Idempotency, Logic Điểm thưởng Loyalty, Khóa lạc quan OCC tồn kho.*

#### 2. Chạy kịch bản Kiểm thử Xung đột đồng thời (Race Condition Test):
Mô phỏng 10 giao dịch đặt hàng đồng thời tranh chấp kho nguyên liệu:
```powershell
node scripts/test-race-condition.js
```
*Kết quả chứng minh Optimistic Concurrency Control (OCC) xử lý thành công không để xảy ra bán lố nguyên liệu.*

#### 3. Kiểm tra tính hợp lệ Build Production:
```powershell
npm run build:backend
npm run build:frontend
```

---

## 7. Bảng Tài Khoản Mẫu Để Kiểm Thử Nghiệm Thu

Hệ thống đã nạp sẵn dữ liệu tài khoản đầy đủ phân quyền trong lệnh `npm run seed`:

| Vai Trò Phân Quyền | Tên Đăng Nhập | Mật Khẩu | Đường Dẫn Kiểm Thử | Quyền Hạn & Tính Năng Trải Nghiệm |
|:---|:---|:---:|:---:|:---|
| **Khách Hàng (Customer)** | `customer1` | `123456` | `/login` ➔ `/` | Đặt món, chọn size/topping, áp mã voucher thông minh, dùng điểm tích lũy, quét mã QR VietQR, nhận diện thanh toán tự động, đánh giá sao. |
| **Nhân Viên Pha Chế (Staff)** | `barista1` | `123456` | `/staff` | **Bảng Kanban Barista (FIFO):** Tiếp nhận đơn từ cột "Đã thanh toán" ➔ Kéo chuyển "Đang pha chế" ➔ "Sẵn sàng nhận món" ➔ "Hoàn thành". |
| **Quản Trị Viên (Admin)** | `admin` | `admin123` | `/admin` | **Dashboard Quản Trị:** Thống kê doanh thu theo ngày/tháng, cảnh báo tồn kho nguyên liệu chạm ngưỡng đỏ, tạo phiếu nhập kho, kiểm duyệt đánh giá. |

---

## 8. Hướng Dẫn Khắc Phục Sự Cố Thường Gặp (Troubleshooting / FAQ)

| Hiện Tượng / Lỗi | Nguyên Nhân | Cách Khắc Phục Nhanh |
|:---|:---|:---|
| **Lỗi `EADDRINUSE: port 3000/3001`** | Cổng bị chiếm bởi tiến trình cũ chưa tắt | Chạy PowerShell lệnh: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force` (thay 3000 hoặc 3001). |
| **Lỗi `Can't reach database server at localhost:5432`** | PostgreSQL chưa bật hoặc container DB chưa chạy | Chạy `docker compose up -d postgres` hoặc kiểm tra dịch vụ PostgreSQL trên máy đã khởi động. |
| **Lỗi `Camera access denied` trên điện thoại** | Trình duyệt di động chặn Camera trên giao thức HTTP thường | Dùng phương án Cloudflare Tunnel (`npm run phone`) hoặc bật `node https-proxy.js` để có kết nối HTTPS. |
| **Muốn reset sạch dữ liệu đơn hàng về mặc định** | Cần làm mới đơn thử nghiệm trước giờ báo cáo | Chạy lệnh: `npm --prefix backend run clean:orders` hoặc chạy lại `npm --prefix backend run seed`. |
| **Sản phẩm báo `⛔ Tạm hết hàng`** | Tồn kho của nguyên liệu trong công thức bằng 0 | Đăng nhập tài khoản `admin` vào `/admin` mục "Quản lý nguyên vật liệu" bấm "Nhập thêm kho" hoặc chạy lại `seed`. |

---

## 📱 Các Liên Kết Trực Tiếp Để Trình Diễn Đồ Án

- **Cổng Đặt Món & Thực Đơn Khách Hàng**: [http://localhost:3000](http://localhost:3000)
- **Giỏ Hàng & Cổng Thanh Toán VietQR**: [http://localhost:3000/checkout](http://localhost:3000/checkout)
- **Bảng Kanban Quầy Pha Chế Barista**: [http://localhost:3000/staff](http://localhost:3000/staff)
- **Dashboard Báo Cáo Doanh Thu & Quản Trị**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Ứng Dụng Giả Lập MBBank Mobile (Trên PC)**: [http://localhost:3000/mbbank](http://localhost:3000/mbbank)
- **Tài Liệu API Chuẩn OpenAPI / Swagger**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
