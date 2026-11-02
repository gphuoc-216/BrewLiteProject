# 📋 BÁO CÁO NGHIỆM THU — ĐỐI CHIẾU TRƯỚC VÀ SAU KHI SỬA LỖI

> **Dự án:** BrewLite — Quầy Cà Phê Thủ Công Không Tiền Mặt  
> **Phân hệ:** [P4 - Frontend & Backend] Giao diện Auth + Màn hình Thanh toán + Lịch sử đơn (`/orders/me`)  
> **Nhánh Git:** `feat/p4-checkout-history`  
> **Tài liệu đối chiếu:** `BrewLite-CongNghePhanMem.pdf` (Đề bài BTL ĐH Sài Gòn, VER 1.0) & `docs/reviews/p4-checkout-history-review.md`  
> **File Word hoàn chỉnh:** [docs/reviews/revised.doc](file:///d:/CNPM/BrewLiteProject/docs/reviews/revised.doc)

---

## 📌 I. BẢNG TỔNG HỢP SO SÁNH NHANH (EXECUTIVE SUMMARY)

| STT | Hạng mục / Chức năng | Vị trí mã nguồn | Trước khi sửa (Lỗi / Bất cập) | Sau khi sửa (Chuẩn Đề bài BTL) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Route Lịch sử đơn hàng** | [orders/me/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/me/page.tsx)<br/>[orders/history/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/history/page.tsx) | 🔴 **LỖI 404**<br/>Vào `/orders/me` bị 404 Not Found do chỉ có route `/orders/history`. Sai lệch Mục 12.1 PDF. | 🟢 **ĐÃ SỬA CHUẨN**<br/>Tạo trang `/orders/me` chính thức. Vào `/orders/history` tự động redirect sang `/orders/me`. |
| **2** | **Công thức Điểm Loyalty** | [orders/[id]/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/[id]/page.tsx) | 🔴 **SAI LỆCH x10**<br/>Frontend chia 1.000: Đơn 50K hiện "+50 điểm", nhưng DB chỉ cộng 5 điểm, mâu thuẫn hiển thị. | 🟢 **CHUẨN ĐỀ BÀI**<br/>Chia 10.000: Đơn 50K hiện đúng **+5 điểm** (1 điểm / 10.000đ), khớp 100% với Navbar và Backend. |
| **3** | **Auth & Mock Token Bypass** | [login/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/login/page.tsx)<br/>[auth.service.ts](file:///d:/CNPM/BrewLiteProject/backend/src/modules/auth/auth.service.ts) | 🔴 **HỔNG BẢO MẬT**<br/>Khối `catch` tự gán `mock_token_cust` giả. Khi thao tác các trang sau bị 401 văng logout liên tục. | 🟢 **JWT CHUẨN HÓA**<br/>Xóa sạch token giả. Nhận JWT thật từ API. Bổ sung thông báo đỏ khi tài khoản bị khóa (`customer3`: LOCKED). |
| **4** | **Nút Giỏ hàng (US-05 AC 1)** | [cart/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/cart/page.tsx) | 🔴 **THIẾU TIÊU CHÍ AC**<br/>Nút chỉ có chữ cố định *"Tiến hành thanh toán"*, không có số tiền, vi phạm tiêu chí nghiệm thu đề bài. | 🟢 **HIỂN THỊ TỔNG TIỀN**<br/>Nút hiển thị kèm tổng tiền: **"Tiến hành thanh toán (35.000đ)"** chuẩn US-05 AC 1. |
| **5** | **Demo PAYMENT_FAILED** | [checkout/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/checkout/page.tsx)<br/>[payment.service.ts](file:///d:/CNPM/BrewLiteProject/backend/src/modules/payment/payment.service.ts) | 🔴 **THIẾU NÚT DEMO**<br/>Không có cách nào để kích hoạt kịch bản lỗi thanh toán trên UI để nghiệm thu tiêu chí DoD Task 8. | 🟢 **NÚT DEMO CHUYÊN DỤNG**<br/>Thêm nút **"⚡ Giả lập lỗi thanh toán (PAYMENT_FAILED)"**: Đơn chuyển `PAYMENT_FAILED`, **giữ nguyên giỏ hàng**. |
| **6** | **Chặn Back ở màn Checkout** | [checkout/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/checkout/page.tsx) | 🔴 **TRẢI NGHIỆM KÉM**<br/>Lắng nghe `popstate` quá đà: Khách vừa vào Checkout bấm Back đổi topping thì bị ép văng sang `/products`. | 🟢 **ĐIỀU HƯỚNG MỀM DẺO**<br/>Chỉ chặn khi đơn đã thanh toán xong. Khi đang chọn phương thức, bấm Back trình duyệt quay về `/cart` bình thường. |
| **7** | **Thanh toán lại Đơn lỗi** | [orders/[id]/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/[id]/page.tsx)<br/>[checkout/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/checkout/page.tsx) | 🔴 **BỊ KẸT LUỒNG VĂNG TRANG**<br/>Bấm quay lại thanh toán bị đoạn chặn `items.length === 0` ở `/checkout` đẩy văng về `/products`. | 🟢 **HỖ TRỢ RETRY MƯỢT MÀ**<br/>Hỗ trợ thanh toán lại trực tiếp hoặc giữ đơn đang lỗi để tiếp tục thanh toán mà không phụ thuộc giỏ rỗng. |
| **8** | **Đánh giá món & Tránh 409** | [orders.service.ts](file:///d:/CNPM/BrewLiteProject/backend/src/modules/orders/orders.service.ts)<br/>[orders/me/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/me/page.tsx) | 🔴 **LỖI 409 CONFLICT**<br/>Backend thiếu `reviews: true`. Nút đánh giá luôn hiện, khi bấm gửi lại server báo crash 409 Conflict. | 🟢 **LIÊN KẾT REVIEWS**<br/>Backend thêm `reviews: true`. Frontend khóa món đã review, đổi nhãn **"Đã đánh giá đủ món"**, triệt tiêu 409. |
| **9** | **Nút Hủy đơn tại Chi tiết** | [orders/[id]/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/[id]/page.tsx) | 🔴 **THIẾU TÍNH NĂNG**<br/>Màn hình chi tiết đơn không có nút Hủy đơn, khách bắt buộc phải quay lại danh sách ngoài. | 🟢 **NÚT & MODAL HỦY ĐƠN**<br/>Bổ sung nút và Modal xác nhận "Hủy đơn hàng" trực tiếp trên màn chi tiết khi đơn ở `PENDING` hoặc `PAID`. |
| **10** | **Backend Fallback Store** | [fallback-store.ts](file:///d:/CNPM/BrewLiteProject/backend/src/prisma/fallback-store.ts)<br/>[prisma.service.ts](file:///d:/CNPM/BrewLiteProject/backend/src/prisma/prisma.service.ts) | 🔴 **CRASH KHI THIẾU DB**<br/>Nếu chưa bật Docker/PostgreSQL, toàn bộ API trả về lỗi `500 Connection Refused`, không thể chấm bài. | 🟢 **FALLBACK IN-MEMORY**<br/>Tự kích hoạt store in-memory có sẵn tài khoản seed, đơn mẫu, tạo đơn, thanh toán và tích điểm mượt mà 100%. |

---

## 🧪 II. KỊCH BẢN KIỂM THỬ TỪNG BƯỚC (STEP-BY-STEP TEST SCENARIOS)

### Kịch bản 1: Kiểm tra Route Lịch sử Đơn hàng (`/orders/me`)
1. **Thao tác:** Mở trình duyệt, gõ trực tiếp URL: `http://localhost:3000/orders/me`.
   - **🔴 Trước khi sửa:** Màn hình hiển thị mã lỗi **404 Not Found**.
   - **🟢 Sau khi sửa:** Trang Lịch sử đơn hàng tải thành công, hiển thị 4 Tabs lọc: *Tất cả đơn, Đang xử lý, Hoàn tất, Đã hủy / Lỗi*.
2. **Kiểm tra tương thích ngược:** Gõ URL cũ: `http://localhost:3000/orders/history`.
   - **🟢 Sau khi sửa:** Trình duyệt tự động chuyển hướng (redirect) về `/orders/me`.

---

### Kịch bản 2: Kiểm tra Đăng nhập & Bảo mật Token
1. Mở trang Đăng nhập [http://localhost:3000/login](http://localhost:3000/login).
2. Nhập tài khoản bị khóa: `customer3` / `123456`.
   - **🔴 Trước khi sửa:** Gán token giả `mock_token_cust` vào `localStorage`, gây văng phiên ở các trang sau.
   - **🟢 Sau khi sửa:** Hệ thống chặn đăng nhập, hiển thị thông báo: *"Tài khoản đã bị khoá, vui lòng liên hệ quầy"*.
3. Đăng nhập tài khoản `customer1` / `123456`.
   - **🟢 Sau khi sửa:** Đăng nhập thành công với JWT thật, góc phải Navbar hiển thị tên **Hoàng Minh Khách** và **120 điểm**.

---

### Kịch bản 3: Kiểm tra Nút Giỏ hàng hiển thị Tổng tiền (US-05 AC 1)
1. Mở [Menu Sản phẩm](http://localhost:3000/products), chọn "Cà phê Sữa Đá Truyền Thống" (Size M: 35.000đ), bấm "Thêm vào giỏ hàng".
2. Mở [Giỏ hàng](http://localhost:3000/cart).
   - **🔴 Trước khi sửa:** Nút thanh toán chỉ ghi chữ cố định: *"Tiến hành thanh toán"*.
   - **🟢 Sau khi sửa:** Nút thanh toán hiển thị rõ: **"Tiến hành thanh toán (35.000đ)"**.

---

### Kịch bản 4: Kiểm tra Demo Giả lập Lỗi Thanh toán (`PAYMENT_FAILED`) & Giữ nguyên Giỏ hàng
1. Tại Giỏ hàng, bấm "Tiến hành thanh toán" để chuyển sang `/checkout`.
2. Bấm phím **Back** của trình duyệt.
   - **🟢 Sau khi sửa:** Trình duyệt quay về `/cart` cho phép khách đổi số lượng/topping (không bị ép văng sang `/products` như trước).
3. Quay lại `/checkout`, bấm nút **"⚡ Giả lập lỗi thanh toán (PAYMENT_FAILED)"** và bấm **"Xác nhận trả"**.
   - **🟢 Sau khi sửa:** Đơn hàng chuyển sang trạng thái **`PAYMENT_FAILED`**, và **toàn bộ món trong giỏ hàng được giữ nguyên** (chuẩn Acceptance Criteria Task 8 đề bài).

---

### Kịch bản 5: Kiểm tra Thanh toán Thành công & Tính đúng Điểm thưởng (+1 điểm / 10.000đ)
1. Tại màn hình `/checkout`, chọn phương thức "Ví điện tử", bấm **"Xác nhận trả"** (không kích hoạt giả lập lỗi).
2. Màn hình Xác nhận đơn `/orders/[id]` mở ra:
   - **🔴 Trước khi sửa:** Màn hình báo nhận **"+35 điểm"** (do chia 1.000), trong khi Navbar chỉ cộng 3 điểm.
   - **🟢 Sau khi sửa:**
     - Giao diện hiển thị đúng chuẩn Wireframe (5): Biểu tượng tích xanh **✓**, dòng chữ **"Đặt hàng thành công"**, Trạng thái **`PAID`**, thông điệp **"Mời tới quầy lấy nước"**, nút **"Về trang chủ"**.
     - Điểm thưởng hiển thị chính xác: **"+3 điểm"** (35.000 / 10.000 = 3 điểm), đồng bộ 100% với tài khoản của khách.

---

### Kịch bản 6: Kiểm tra Đánh giá món tại Đơn Hoàn thành & Chống lỗi 409 Conflict
1. Mở [http://localhost:3000/orders/me](http://localhost:3000/orders/me).
2. Chuyển sang Tab **"Hoàn tất"** và tìm đơn hàng mẫu `ord-demo-101`.
3. Bấm nút "Đánh giá món", gửi đánh giá 5 sao kèm bình luận.
   - **🔴 Trước khi sửa:** Nút đánh giá vẫn hiện, mở lại gửi tiếp sẽ crash báo lỗi `409 Conflict`.
   - **🟢 Sau khi sửa:** Đánh giá lưu thành công. Món đã đánh giá được đánh dấu và nút chuyển thành **"Đã đánh giá đủ món"**, triệt tiêu lỗi 409.

---

## 🔑 III. DANH SÁCH TÀI KHOẢN MẪU DÙNG ĐỂ NGHIỆM THU (Mật khẩu: `123456`)

| Phân hệ / Vai trò | Username | Mật khẩu | Mục đích kiểm thử |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (ADMIN)** | `admin` | `123456` | Quản trị sản phẩm, nguyên liệu, tài khoản, doanh thu tại `/admin`. |
| **Pha chế (STAFF)** | `barista1`<br/>`barista2` | `123456`<br/>`123456` | Xem Kanban quầy bar, nhận đơn, pha chế và hoàn tất đơn tại `/staff`. |
| **Khách hàng 1 (CUSTOMER)** | `customer1` | `123456` | **Khuyên dùng:** Có sẵn 120 điểm loyalty & 2 đơn mẫu để test ngay `/orders/me`. |
| **Khách hàng 2 (CUSTOMER)** | `customer2` | `123456` | Khách hàng mới (45 điểm), test đặt đơn mới và thanh toán từ giỏ hàng. |
| **Khách hàng Khóa (LOCKED)** | `customer3` | `123456` | Test Guard đăng nhập chặn tài khoản bị khóa và hiện thông báo đỏ. |
