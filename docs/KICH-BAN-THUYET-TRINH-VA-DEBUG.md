# 🎓 KỊCH BẢN THUYẾT TRÌNH & HƯỚNG DẪN VẤN ĐÁP / DEBUG ĐỒ ÁN BREWLITE
## DÀNH CHO THÀNH VIÊN: NGUYỄN HOÀNG ANH (`hanhdevsgu`)
**Môn học**: Công Nghệ Phần Mềm — ĐH Sài Gòn (HK I, 2026–2027)  
**Nhiệm vụ phụ trách**: Task 6 (Tạo đơn hàng), Task 7 (Auth/Bcrypt), Task 8 (Thanh toán), Task 10 (Nghiệp vụ backend chuyên sâu: State Machine, Idempotency-Key, Optimistic Locking)  
**Nhánh Git**: `feat/p6-payment-ingredients-orders` kết hợp `feature/p7-backend` ➔ Đã merge tích hợp vào `develop`

---

## 🎯 PHẦN 1: MỞ ĐẦU & GIỚI THIỆU VAI TRÒ (30 GIÂY)

> *"Thưa thầy, trong đồ án BrewLite, em là **Nguyễn Hoàng Anh**, đảm nhận các phân hệ cốt lõi nhất ở tầng Backend xử lý nghiệp vụ, bao gồm:*  
> *1. **Bảo mật & Xác thực**: Băm mật khẩu bằng Bcrypt và cấp phát token JWT bảo vệ các route nhạy cảm.*  
> *2. **Xử lý Đặt hàng & Quản lý tồn kho**: API `POST /orders`, tự động trừ kho nguyên liệu theo công thức pha chế (`Recipe`).*  
> *3. **Cổng thanh toán không dùng tiền mặt**: Xử lý giao dịch Ví/Thẻ và VietQR, tích hợp cơ chế chống trừ trùng tiền (`Idempotency-Key`).*  
> *4. **Nghiệp vụ nâng cao (Task 10)**: Máy trạng thái đơn hàng (`Order State Machine`) chống gian lận và Khóa lạc quan (`Optimistic Concurrency Control`) chống bán khống tồn kho khi nhiều khách tranh mua cùng lúc.*  
> *Sau đây em xin phép trình diễn chi tiết từng phần trên cả Giao diện (Frontend), API (Swagger) và Cơ sở dữ liệu (Prisma/PostgreSQL)."*

---

## 🔐 PHẦN 2: BĂM MẬT KHẨU (BCRYPT) & XÁC THỰC (JWT) — TASK 7

### 1. Cách trình bày lý thuyết để ghi điểm 10:
* **Hỏi**: *"Tại sao em lại băm mật khẩu mà không mã hóa? Dùng thuật toán gì?"*
* **Trả lời**:  
  - *"Dạ thưa thầy, mật khẩu người dùng phải tuân thủ nguyên tắc **Bảo mật một chiều (One-way Hashing)**, tuyệt đối không được dùng mã hóa đối xứng (như AES hay DES) vì nếu lộ chìa khóa giải mã, hacker sẽ khôi phục được toàn bộ mật khẩu gốc của khách hàng.*  
  - *Em sử dụng thuật toán **Bcrypt** với **Salt Rounds = 10**. Bcrypt tự động sinh chuỗi Salt ngẫu nhiên gắn vào đầu hash, giúp chống hoàn toàn tấn công Bảng cầu vồng (**Rainbow Table Attack**) và tấn công vét cạn (**Brute-force Attack**).*  
  - *Khi đăng nhập, hệ thống dùng hàm `bcrypt.compare(mật_khẩu_nhập, chuỗi_hash_trong_db)` để kiểm chứng mà không bao giờ cần biết mật khẩu gốc."*

### 2. Kịch bản Debug & Chứng minh thực tế cho thầy xem:
1. **Bước 1**: Mở trình duyệt vào **Prisma Studio**: `http://localhost:5555`.
2. **Bước 2**: Bấm vào bảng **`Account`**.
3. **Bước 3**: Chỉ cho thầy xem cột `passwordHash`:  
   - *"Thưa thầy, toàn bộ tài khoản trong CSDL cột `passwordHash` đều có dạng `$2a$10$...` dài 60 ký tự. Ngay cả quản trị viên hay DBA vào Database cũng không thể biết mật khẩu gốc của khách là gì."*
4. **Bước 4**: Mở Swagger: `http://localhost:3001/api/docs` ➔ Mục `Auth` ➔ `POST /api/auth/register`:
   - Gửi thử một tài khoản mới: `username: test_user`, `password: 123456`.
   - Quay lại Prisma Studio F5 ➔ Cột `passwordHash` của `test_user` lập tức được sinh ra một chuỗi hash hoàn toàn khác với tài khoản cũ (nhờ cơ chế Salt ngẫu nhiên của Bcrypt).
5. **Bước 5**: Chỉ cơ chế bảo vệ Route bằng JWT:  
   - Thử gọi `GET /api/orders/me` khi **không có Bearer Token** ➔ Trả về mã lỗi **`401 Unauthorized`**.
   - Sau khi login lấy `accessToken`, gắn vào Header `Authorization: Bearer <token>` ➔ Trả về dữ liệu **`200 OK`**.

---

## 💳 PHẦN 3: THANH TOÁN KHÔNG DÙNG TIỀN MẶT & IDEMPOTENCY-KEY — TASK 8 & 10

### 1. Cách trình bày lý thuyết:
* **Hỏi**: *"Idempotency-Key là gì? Tại sao phải có trong thanh toán?"*
* **Trả lời**:  
  - *"Dạ thưa thầy, trong môi trường thực tế (kết nối mạng 4G/Wifi chập chờn), khách hàng bấm nút 'Thanh toán' nhưng mạng lag, khách sốt ruột bấm liên tiếp 2-3 lần, hoặc trình duyệt tự động gửi lại request (Network Retry).*  
  - *Nếu không có Idempotency, tài khoản khách hàng sẽ bị **trừ tiền 2 lần** và quán sẽ bị **tạo ra 2 đơn hàng trùng lặp**.*  
  - *Để giải quyết triệt để, hệ thống của em sinh ra một mã **`Idempotency-Key`** (chuỗi UUID duy nhất) gắn vào Header request thanh toán. Nếu request thứ hai gửi tới cùng mã này, Backend sẽ phát hiện ngay trong CSDL và **trả về kết quả giao dịch cũ** chứ không trừ tiền hay tạo đơn thêm một lần nào nữa."*

### 2. Kịch bản Debug & Chứng minh thực tế cho thầy xem:
1. **Bước 1 (Trực quan trên Web)**:
   - Vào `http://localhost:3000`, thêm 1 ly cà phê vào giỏ, bấm Thanh toán.
   - Chọn phương thức **VietQR** hoặc **MBBank**.
   - Bấm Thanh toán ➔ Hệ thống tạo đơn và chuyển trạng thái sang `PAID` mượt mà, cộng điểm tích lũy `loyaltyPoints` (1 điểm = 100đ).
2. **Bước 2 (Bắt lỗi trừ trùng tiền trên Postman / Swagger)**:
   - Mở Swagger tại `POST /api/payments`.
   - Điền Header: `idempotency-key: KEY-TEST-123456`.
   - Body:
     ```json
     {
       "orderId": "<Mã_Đơn_Hàng_Ở_Bước_1>",
       "paymentMethod": "MOMO",
       "amount": 35000
     }
     ```
   - Bấm gửi lần 1 ➔ Trả về `201 Created` (Thanh toán thành công).
   - **Bấm gửi tiếp lần 2 với cùng `KEY-TEST-123456`** ➔ Hệ thống trả về kết quả đã xử lý cũ và **chặn đứng** không cho thanh toán lần 2!

---

## 🔄 PHẦN 4: ORDER STATE MACHINE (MÁY TRẠNG THÁI ĐƠN HÀNG) — TASK 10

### 1. Chu trình trạng thái chuẩn:
```
PENDING (Chờ thanh toán)
   ↓ (Thanh toán thành công)
PAID (Đã thanh toán)
   ↓ (Barista nhận đơn)
PREPARING (Đang pha chế)
   ↓ (Pha xong)
READY (Sẵn sàng nhận nước)
   ↓ (Đã giao khách)
COMPLETED (Hoàn thành)
```
*Nhánh ngoại lệ*: `PAYMENT_FAILED` (thanh toán lỗi, có thể bấm trả lại) hoặc `CANCELLED` (khách hủy). `COMPLETED` và `CANCELLED` là trạng thái kết thúc (Terminal State), không được phép đổi tiếp.

### 2. Kịch bản Debug chứng minh chặn gian lận:
* **Hỏi**: *"Làm sao em đảm bảo khách hàng không tự ý sửa đơn từ PENDING nhảy cóc sang COMPLETED để lấy nước miễn phí?"*
* **Trả lời & Demo**:  
  - *"Dạ thưa thầy, toàn bộ chuyển tiếp trạng thái đều đi qua hàm `assertTransition(fromStatus, toStatus)` kết hợp với `RoleGuard`.*  
  - *Nếu ai đó cố tình gọi API gửi từ `PENDING` nhảy thẳng lên `COMPLETED` mà chưa trả tiền, Backend lập tức ném mã lỗi **`409 Conflict: Không thể chuyển từ trạng thái PENDING sang COMPLETED`**.*  
  - *Đồng thời, chỉ có tài khoản mang quyền **STAFF** mới có quyền chuyển đơn sang `PREPARING` và `READY` (khách hàng gọi vào sẽ bị chặn `403 Forbidden`)."*

---

## 📦 PHẦN 5: CHỐNG BÁN KHỐNG KHO KHI NHIỀU KHÁCH TRANH MUA (OPTIMISTIC LOCKING - OCC)

### 1. Cách trình bày lý thuyết:
* **Hỏi**: *"Trường hợp 2 khách hàng cùng đặt 1 ly cà phê cuối cùng trong kho lúc 12:00:00 thì hệ thống xử lý thế nào?"*
* **Trả lời**:  
  - *"Dạ thưa thầy, nếu dùng truy vấn thông thường sẽ bị lỗi **Race Condition** dẫn đến tồn kho bị âm (-1).*  
  - *Hệ thống của em giải quyết bằng kỹ thuật **Optimistic Concurrency Control (OCC)**. Trên bảng `Ingredient`, mỗi nguyên liệu có một cột **`version`**.*  
  - *Khi trừ kho, câu lệnh SQL sẽ có điều kiện:  
    `UPDATE "Ingredient" SET stockQuantity = stockQuantity - ?, version = version + 1 WHERE id = ? AND version = ?`*  
  - *Người nào đến trước 1 phần triệu giây sẽ cập nhật thành công (version từ 1 lên 2).*  
  - *Người đến sau kiểm tra `version = 1` không còn khớp nữa, Transaction sẽ phát hiện xung đột và trả về mã lỗi **`409 Conflict: Tạm hết nguyên liệu trong kho`**, đảm bảo kho **không bao giờ bị âm**!"*

### 2. Cách demo thực tế cho thầy xem trong 10 giây:
1. Mở Terminal gõ:
   ```powershell
   npm run stock -- "Robusta" 10
   ```
   *(Chỉnh kho cà phê Robusta còn đúng 10g — chỉ đủ cho 1 ly).*
2. Chạy kịch bản kiểm thử đồng thời có sẵn:
   ```powershell
   npm run test:race
   ```
3. Màn hình in ra:
   - **Khách 1**: Đặt thành công (`201 Created`).
   - **Khách 2**: Bị chặn ngay lập tức (`409 Conflict: Cà phê hạt Robusta không đủ tồn kho`).
   - **Tồn kho cuối cùng trong DB**: Đúng bằng `0g` (version = 2), hoàn toàn không bị âm!

---

## ❓ PHẦN 6: BỘ CÂU HỎI HÓC BÚA THƯỜNG GẶP CỦA GIẢNG VIÊN & ĐÁP ÁN

| Câu hỏi của Thầy | Đáp án ghi điểm tuyệt đối |
|:---|:---|
| **1. Tại sao dùng NestJS mà không dùng Express thuần?** | *"NestJS xây dựng trên nền kiến trúc Module, Dependency Injection và Controller-Service chuẩn doanh nghiệp giống Spring Boot/Angular. Giúp tách biệt rõ ràng Business Logic, dễ viết Unit Test và tích hợp sẵn OpenAPI Swagger."* |
| **2. Tại sao lại dùng Prisma ORM thay vì viết SQL thuần?** | *"Prisma cung cấp Type-safe tuyệt đối từ Database Schema ra TypeScript. Khi sửa cột dữ liệu, TypeScript sẽ báo lỗi ngay lúc biên dịch nếu code chưa cập nhật, loại bỏ hoàn toàn lỗi cú pháp SQL và ngăn ngừa 100% tấn công SQL Injection."* |
| **3. Lưu JWT ở đâu trên Frontend thì an toàn?** | *"Trong đồ án môn học, token lưu ở `localStorage` để demo nhanh. Ở môi trường Production thực tế, Access Token nên lưu trong Memory (Zustand/React State) và Refresh Token lưu trong `HttpOnly Secure Cookie` để chống tấn công XSS."* |
| **4. Nếu Database bị sập thì Backend có cơ chế gì?** | *"Backend có thiết kế `fallbackStore` (bộ nhớ tạm in-memory) giúp hệ thống không bị crash đột ngột mà vẫn có thể thông báo trạng thái suy giảm dịch vụ (Graceful Degradation) rõ ràng cho người dùng."* |

---

## 🧹 LỆNH RESET DATABASE TRƯỚC KHI BẮT ĐẦU CHẤM:
Ngay trước khi thầy tới bàn chấm, bạn chỉ cần gõ đúng 1 lệnh duy nhất:
```powershell
npm run clean:db
```
Toàn bộ đơn hàng test sẽ về 0 và toàn bộ 11 nguyên liệu sẽ đầy 100%, sẵn sàng cho một buổi thuyết trình hoàn hảo!
