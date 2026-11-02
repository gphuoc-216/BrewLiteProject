# 📋 BẢN ĐÁNH GIÁ TOÀN DIỆN & KẾ HOẠCH SỬA LỖI - HOÀN THIỆN
## [P4 - Frontend] Giao diện Auth + Màn hình Thanh toán + Lịch sử đơn /orders/me (Task 7 FE, 8 FE, 9 FE)
**Nhánh Git:** `feat/p4-checkout-history`  
**Ngày cập nhật:** 27/10/2026  
**Tài liệu gốc tham chiếu:**
- 📄 `BrewLite-CongNghePhanMem.pdf` (Đề bài gốc BTL Công nghệ Phần mềm - Trường Đại học Sài Gòn, VER 1.0)
- 📄 `docs/01-analysis-spec.md` (Bản đặc tả phân tích chức năng)
- 📄 `docs/02-implementation-plan.md` (Kế hoạch thực hiện theo Sprint)

---

## 📌 I. MA TRẬN ĐỐI CHIẾU VỚI ĐỀ BÀI GỐC (BrewLite-CongNghePhanMem.pdf)

Theo cấu trúc bài tập lớn 10 Task Scrum (mỗi task 1 điểm, tổng 10 điểm) trong `BrewLite-CongNghePhanMem.pdf`:

| Task theo Đề gốc | Yêu cầu nghiệp vụ & Tiêu chí nghiệm thu (DoD / AC) theo PDF | Hiện trạng mã nguồn nhánh `feat/p4-checkout-history` | Mức độ ưu tiên |
| :--- | :--- | :--- | :---: |
| **Task 5 (Cart)** | • **US-05 AC 1**: Khi giỏ hàng có $\ge 1$ sản phẩm, nút "Thanh toán" **bắt buộc hiển thị tổng tiền**. | Nút ở Giỏ hàng hiện chỉ ghi *"Tiến hành thanh toán"*, chưa đưa số tiền vào nút theo đúng Acceptance Criteria. | 🟡 **Major** |
| **Task 7 (Auth)** | • `POST /auth/register`, `POST /auth/login`<br/>• Băm mật khẩu (bcrypt), phát JWT<br/>• **Guard bảo vệ route đặt đơn**: Bắt buộc đăng nhập trước khi checkout/đặt đơn. | Đã có Form và Guard. Tuy nhiên: khi đăng nhập lỗi code tự sinh token giả `mock_token_cust` bypass xác thực; thiếu toggle ẩn/hiện mật khẩu, thiếu xác nhận mật khẩu & regex email ở Register. | 🔴 **Critical** |
| **Task 8 (Thanh toán)** | • **Wireframe (4)**: Nhãn "Không dùng tiền mặt", 2 lựa chọn: Ví điện tử / Thẻ ngân hàng, nút "Xác nhận trả".<br/>• **US-05 AC**: Chọn Ví/Thẻ $\rightarrow$ `POST /payments` $\rightarrow$ Đơn chuyển `PAID`.<br/>• **Thanh toán lỗi**: **Đơn chuyển `PAYMENT_FAILED` và giỏ hàng được giữ nguyên**.<br/>• Thành công $\rightarrow$ hiển thị mã đơn và màn hình xác nhận. | Đã có VietQR Napas 247 & Ví thành viên.<br/>• **Lỗi**: Chặn phím Back (`popstate`) vô lý khi đang mua sắm.<br/>• **Thiếu**: Nút toggle demo kịch bản "Mô phỏng lỗi thanh toán (`PAYMENT_FAILED`)" theo yêu cầu nghiệm thu DoD Task 8.<br/>• **Thiếu**: Bảng chiết khấu voucher chi tiết tại Checkout. | 🔴 **Critical** |
| **Task 9 (Xác nhận & Lịch sử)** | • **Wireframe (5) Xác nhận**: Biểu tượng `✓`, "Đặt hàng thành công", Mã đơn: `#...`, Trạng thái: `PAID`, Thông điệp: **"Mời tới quầy lấy nước"**, Nút **[Về trang chủ]**.<br/>• **Lịch sử đơn**: Gọi chuẩn API **`GET /orders/me`** xem danh sách đơn của user. | • **Lỗi nghiêm trọng**: Đặt sai route thành `/orders/history` (vào `/orders/me` bị 404).<br/>• **Lỗi tính điểm**: Màn xác nhận tính điểm sai lệch x10 lần (chia 1.000 thay vì 10.000).<br/>• **Lỗi chức năng**: Backend thiếu `reviews` làm nút "Đánh giá món" bị lặp và ném lỗi 409.<br/>• **Thiếu**: Nút Hủy đơn trực tiếp trên màn hình chi tiết đơn `/orders/[id]`. | 🔴 **Critical** |
| **Task 10 (Nghiệp vụ cốt lõi)** | • **Sơ đồ Order State Machine (Mục 9.1 Trang 8 PDF)**:<br/>  - `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`<br/>  - Hủy đơn: `PENDING` $\rightarrow$ `CANCELLED`, `PAID` $\rightarrow$ `CANCELLED`, `PAYMENT_FAILED` $\rightarrow$ `CANCELLED`.<br/>  - Thử lại: `PAYMENT_FAILED` $\rightarrow$ `PAID`.<br/>• **Idempotency-Key**: Gửi 2 lần cùng key chỉ tạo 1 đơn / 1 giao dịch.<br/>• **Loyalty points**: Tích lũy 1 điểm / 10.000 VNĐ khi `PAID`. | Đã có backend xử lý. Cần đồng bộ trạng thái hủy đơn và xử lý luồng "Thử lại thanh toán" từ `PAYMENT_FAILED` trên Frontend. | 🟡 **Major** |

---

## 🚨 II. DANH SÁCH CHI TIẾT CÁC LỖI & CẢI TIẾN CẦN SỬA

### 1. 🔴 Lỗi 1: Sai đường dẫn Route `/orders/me` (Gây lỗi 404 khi chấm bài)
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 8 (Task 9) và Mục 12.1 (Bảng endpoint): `GET /orders/me - Lịch sử đơn của user`.
- **Vị trí tệp**: `frontend/src/app/orders/history/page.tsx`, `frontend/src/components/Navbar.tsx`
- **Nguyên nhân**:
  App Router hiện chỉ có thư mục `app/orders/history`. Thư mục `app/orders/me` không tồn tại. Khi giảng viên hoặc tester truy cập URL chuẩn `http://localhost:3000/orders/me`, Next.js trả về mã **404 Not Found**.
- **Giải pháp**:
  1. Tạo thư mục và trang chính thức: `frontend/src/app/orders/me/page.tsx` chứa toàn bộ màn hình Lịch sử đơn hàng.
  2. Tại `frontend/src/app/orders/history/page.tsx` và `frontend/src/app/orders/page.tsx`, cấu hình chuyển hướng tự động (`router.replace('/orders/me')`) để tương thích cả 2 đường link.
  3. Cập nhật các liên kết trong `Navbar.tsx` và nút quay lại ở `orders/[id]/page.tsx` thành `/orders/me`.

---

### 2. 🔴 Lỗi 2: Tính sai công thức Điểm thưởng tại Màn hình Xác nhận Đơn (Bug thổi phồng x10)
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 9 (Task 10 yêu cầu 4) & `backend/src/modules/payment/payment.service.ts` dòng 236:  
  `earnedPoints = Math.floor(order.totalAfterDiscount / 10000)` (1 điểm / 10.000 VNĐ).
- **Vị trí tệp**: `frontend/src/app/orders/[id]/page.tsx` (dòng 106)
- **Nguyên nhân**:
  Frontend đang chia cho `1000` thay vì `10000`:
  ```typescript
  // Hiện tại (SAI):
  const earnedPoints = Math.floor((Number(order.totalAfterDiscount) || 0) / 1000);
  ```
  Khiến đơn 50.000 VNĐ hiển thị `+50 điểm` (thay vì `+5 điểm`). Khi F5 hoặc nhìn lên Navbar, điểm số chỉ nhảy 5 điểm, gây sai lệch dữ liệu hiển thị.
- **Giải pháp**:
  Sửa số chia thành `10000`:
  ```typescript
  const earnedPoints = Math.floor((Number(order.totalAfterDiscount) || 0) / 10000);
  ```

---

### 3. 🔴 Lỗi 3: Mock Auth Token Bypass nguy hiểm trong `login/page.tsx`
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 8 (Task 7): Bắt buộc xác thực qua `POST /auth/login` và phát JWT chuẩn.
- **Vị trí tệp**: `frontend/src/app/login/page.tsx` (dòng 49 - 63)
- **Nguyên nhân**:
  Khi backend trả về lỗi đăng nhập (sai pass hoặc backend chưa bật), khối `catch` lại tự động gán `mock_token_cust`, `mock_token_admin` và lưu vào `localStorage`. Token này không có chữ ký JWT thật, dẫn đến các request sau (`/orders/me`, `/payments`) bị backend trả về **401 Unauthorized** và kích hoạt cơ chế văng/logout liên tục.
- **Giải pháp**:
  - Xóa bỏ hoàn toàn việc cấp token giả trong `catch`.
  - Các nút "Tài khoản demo nhanh" chỉ điền sẵn giá trị vào 2 ô `username` và `password` trên form để người dùng gửi request thật vào database đã seed (`123456`).

---

### 4. 🔴 Lỗi 4: Backend `getMyOrders` thiếu quan hệ `reviews` làm hỏng tính năng Đánh giá món
- **Vị trí tệp**: `backend/src/modules/orders/orders.service.ts` (dòng 100 - 114)
- **Nguyên nhân**:
  Prisma query trong `getMyOrders` không `include: { reviews: true }`. Khi frontend kiểm tra `order.reviews` để ẩn nút đánh giá thì trường này luôn là `undefined`. Nút "Đánh giá món" vẫn hiển thị dù khách đã đánh giá rồi, và khi bấm gửi lại sẽ bị crash với mã lỗi:  
  `409 Conflict: Mỗi cặp (customer, product, order) chỉ được đánh giá 1 lần`.
- **Giải pháp**:
  Thêm `reviews: true` vào `include` của `getMyOrders` trong `orders.service.ts`.

---

### 5. 🔴 Lỗi 5: Luồng thanh toán lại đơn lỗi (`PAYMENT_FAILED`) bị kẹt do giỏ hàng rỗng
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 9.1 (Sơ đồ State Machine: `PAYMENT_FAILED ➔ thử lại ➔ PAID`).
- **Vị trí tệp**: `frontend/src/app/orders/[id]/page.tsx` (dòng 151) và `frontend/src/app/checkout/page.tsx` (dòng 260)
- **Nguyên nhân**:
  Tại màn hình `orders/[id]/page.tsx`, khi đơn bị `PAYMENT_FAILED`, nút "Quay lại thanh toán" điều hướng về `/checkout`. Tuy nhiên, trang `/checkout` lại có đoạn chặn:
  ```typescript
  if (items.length === 0) router.replace('/products');
  ```
  Nếu giỏ hàng rỗng, khách hàng bị đẩy văng về `/products` và không thể tiếp tục thanh toán cho đơn hàng đang lỗi!
- **Giải pháp**:
  - Trang `/checkout` hỗ trợ nhận query param `?orderId=...`. Nếu có `orderId`, tải thông tin đơn hàng này để khách thanh toán tiếp mà không phụ thuộc vào `items.length` của giỏ hàng.
  - Hoặc cho phép gọi nút "Thanh toán lại ngay" trực tiếp tại màn hình `orders/[id]/page.tsx`.

---

### 6. 🟡 Lỗi 6: Nút "Thanh toán" tại Giỏ hàng thiếu hiển thị tổng tiền (Vi phạm US-05 AC 1)
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 4.3 (US-05 Acceptance Criteria):  
  *"Khi giỏ hàng có ít nhất 1 sản phẩm, nút 'Thanh toán' hiển thị tổng tiền."*
- **Vị trí tệp**: `frontend/src/app/cart/page.tsx` (dòng 565)
- **Nguyên nhân**:
  Nút submit hiện tại chỉ hiển thị chữ cố định: `Tiến hành thanh toán`.
- **Giải pháp**:
  Cập nhật nút thanh toán hiển thị kèm tổng tiền:
  ```tsx
  <span>
    {user 
      ? `Tiến hành thanh toán (${finalTotal.toLocaleString('vi-VN')}đ)` 
      : `Đăng nhập để thanh toán (${finalTotal.toLocaleString('vi-VN')}đ)`}
  </span>
  ```

---

### 7. 🟡 Lỗi 7: Thiếu kịch bản Demo "Thanh toán thất bại (PAYMENT_FAILED)" phục vụ nghiệm thu DoD Task 8
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 4.3 (US-05) & Mục 8 (Task 8 DoD):  
  *"Tích hợp mock payment: chọn Ví/Thẻ, gọi POST /payments; đơn chuyển PAID khi thành công, PAYMENT_FAILED khi lỗi."*  
  *"Nếu thanh toán lỗi, đơn ở trạng thái PAYMENT_FAILED và giỏ hàng được giữ nguyên."*
- **Vị trí tệp**: `frontend/src/app/checkout/page.tsx`
- **Nguyên nhân**:
  Backend `payment.service.ts` đã hỗ trợ cờ `simulateError: true`, nhưng Frontend Checkout chưa có nút bấm hoặc switch để người kiểm thử/giảng viên chủ động kích hoạt kịch bản này nhằm kiểm chứng tiêu chí chấp nhận.
- **Giải pháp**:
  Bổ sung một nút phụ/toggle "⚡ Giả lập lỗi thanh toán (PAYMENT_FAILED)" trên giao diện Checkout để phục vụ việc demo nghiệm thu DoD cho giảng viên.

---

### 8. 🟡 Lỗi 8: Chuẩn hóa nội dung Màn hình Thanh toán & Xác nhận theo đúng Wireframe (4) & (5)
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 7 (Wireframe 4 & 5):
  - **Wireframe (4) Thanh toán**:
    - Nhãn bắt buộc: **"Không dùng tiền mặt"**
    - 2 phương thức: **"Ví điện tử"** và **"Thẻ ngân hàng"**
    - Nút bấm chuẩn: **"Xác nhận trả"**
  - **Wireframe (5) Xác nhận**:
    - Tiêu đề: **"Đặt hàng thành công"** kèm biểu tượng tích xanh `✓`
    - Hiển thị rõ: **"Mã đơn: #..."** và **"Trạng thái: PAID"**
    - Thông điệp chuẩn đề bài: **"Mời tới quầy lấy nước"**
    - Nút bấm: **"Về trang chủ"**
- **Vị trí tệp**: `frontend/src/app/checkout/page.tsx`, `frontend/src/app/orders/[id]/page.tsx`
- **Giải pháp**:
  Cập nhật đúng text và nhãn giao diện khớp chuẩn 100% với wireframe đề bài quy định.

---

### 9. 🟡 Lỗi 9: Chặn phím Back trình duyệt quá mức ở màn hình Checkout
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 5 (Luồng nghiệp vụ): Cho phép quay lại giỏ hàng / thêm sản phẩm khác.
- **Vị trí tệp**: `frontend/src/app/checkout/page.tsx` (dòng 266 - 272)
- **Nguyên nhân**:
  Lắng nghe `popstate` và tự ý điều hướng sang `/products` ngay cả khi người dùng chỉ muốn nhấn Back để quay lại `/cart` thay đổi topping, số lượng hoặc mã voucher.
- **Giải pháp**:
  Chỉ kích hoạt chặn Back khi đơn hàng đã thanh toán thành công (`paymentStatus === 'SUCCESS'`). Khi đơn đang ở trạng thái chờ (`WAITING`), cho phép quay lại `/cart`.

---

### 10. 🟡 Lỗi 10: Màn hình Chi tiết Đơn `/orders/[id]` thiếu nút Hủy đơn
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 9.1 (Order State Machine: cho phép Hủy đơn ở `PENDING`, `PAID` và `PAYMENT_FAILED`).
- **Vị trí tệp**: `frontend/src/app/orders/[id]/page.tsx`
- **Nguyên nhân**:
  Khách hàng khi mở xem chi tiết đơn hàng không có nút Hủy đơn trực tiếp tại màn hình này mà bắt buộc phải quay lại danh sách lịch sử đơn.
- **Giải pháp**:
  Bổ sung nút "Hủy đơn hàng" và Modal xác nhận vào `orders/[id]/page.tsx`, tự động gọi `POST /orders/:id/cancel` khi đơn ở trạng thái `PENDING` hoặc `PAID`.

---

### 11. 💡 Cải tiến 11: Tự động gia hạn Token bằng Refresh Token (Silent Refresh trong `api.ts`)
- **Tài liệu đối chiếu**: `BrewLite-CongNghePhanMem.pdf` Mục 8 (Task 7) & Backend `POST /api/auth/refresh`.
- **Vị trí tệp**: `frontend/src/lib/api.ts`
- **Nguyên nhân**:
  Khi Access Token hết hạn, `api.ts` lập tức xóa sạch token và văng người dùng ra `/login`. Trong khi đó, hệ thống đã lưu `brewlite_refresh_token` trong `localStorage` và backend đã có API `/auth/refresh`.
- **Giải pháp**:
  Khi gặp lỗi 401, tự động gọi `POST /auth/refresh` bằng `refreshToken`. Nếu thành công, cập nhật `token` mới và thực hiện lại request ban đầu; chỉ khi refresh token thất bại mới đăng xuất.

---

### 12. 💡 Cải tiến 12: Bổ sung Màn hình Trang cá nhân & Đổi mật khẩu (`/profile`)
- **Tài liệu đối chiếu**: `docs/01-analysis-spec.md` (Chức năng 1.1.5, 1.1.6) & `docs/02-implementation-plan.md` dòng 248.
- **Vị trí tệp**: Tạo mới `frontend/src/app/profile/page.tsx`
- **Chi tiết**:
  - Hiển thị thông tin cá nhân: Họ tên, Email, Username, Điểm tích lũy thành viên (`loyaltyPoints`).
  - Form Đổi mật khẩu: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu (gọi `POST /api/auth/change-password`).
  - Gắn link "Trang cá nhân" trên Menu thả xuống của Navbar khi đã đăng nhập.

---

### 13. 💡 Cải tiến 13: Tabs lọc trạng thái đơn hàng trên `/orders/me`
- **Vị trí tệp**: `frontend/src/app/orders/me/page.tsx`
- **Chi tiết**:
  Phân loại danh sách đơn thành 4 tab trực quan:
  - **Tất cả đơn**
  - **Đang xử lý** (`PAID`, `PREPARING`, `READY`)
  - **Hoàn tất** (`COMPLETED`)
  - **Đã hủy / Lỗi** (`CANCELLED`, `PAYMENT_FAILED`)
  Kèm stepper tiến độ 4 bước thu gọn trên từng thẻ đơn hàng.

---

### 14. 💡 Cải tiến 14: Form Auth chuyên nghiệp (Toggle mắt, Confirm Password, Regex Email)
- **Vị trí tệp**: `frontend/src/app/login/page.tsx`, `frontend/src/app/register/page.tsx`
- **Chi tiết**:
  - Thêm icon Eye / EyeOff để ẩn/hiện mật khẩu.
  - Thêm ô "Xác nhận mật khẩu" (`confirmPassword`) và validate mật khẩu khớp nhau trước khi submit form đăng ký.
  - Kiểm tra format email hợp lệ bằng Regex phía Client.

---

### 15. 💡 Cải tiến 15: Hiển thị bảng chi tiết giá (Tạm tính, Giảm giá voucher, Tổng tiền) tại Checkout
- **Vị trí tệp**: `frontend/src/app/checkout/page.tsx`
- **Chi tiết**:
  Bổ sung các dòng chi tiết:
  - Tạm tính (`subtotal`)
  - Giảm giá khuyến mãi (`-discountAmount` kèm mã voucher đã áp dụng)
  - Tổng tiền thanh toán (`finalTotal`)
  Giúp hóa đơn tại màn hình quét QR hoàn toàn minh bạch và khớp với giỏ hàng.

---

## 🛠️ III. KẾ HOẠCH TRIỂN KHAI THEO 8 BƯỚC CỤ THỂ

- [ ] **Bước 1 (Backend Query)**: Sửa [backend/src/modules/orders/orders.service.ts](file:///d:/CNPM/BrewLiteProject/backend/src/modules/orders/orders.service.ts) thêm `reviews: true` vào query `getMyOrders`.
- [ ] **Bước 2 (API Silent Refresh)**: Cập nhật [frontend/src/lib/api.ts](file:///d:/CNPM/BrewLiteProject/frontend/src/lib/api.ts) hỗ trợ tự động gia hạn token bằng `refreshToken` khi gặp mã 401.
- [ ] **Bước 3 (Cart Button)**: Sửa [frontend/src/app/cart/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/cart/page.tsx) đưa tổng tiền vào nút thanh toán theo chuẩn US-05 AC 1.
- [ ] **Bước 4 (Auth Pages)**: Cải tiến [login/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/login/page.tsx) và [register/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/register/page.tsx): Bỏ token giả, thêm nút mắt xem mật khẩu, thêm xác nhận mật khẩu & regex email. Tạo trang [profile/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/profile/page.tsx) hỗ trợ đổi mật khẩu.
- [ ] **Bước 5 (Checkout Screen)**: Cải tiến [frontend/src/app/checkout/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/checkout/page.tsx):
  - Bỏ chặn `popstate` khi chưa thanh toán để khách quay lại được `/cart`.
  - Chuẩn hóa nhãn Wireframe (4): "Không dùng tiền mặt", "Xác nhận trả".
  - Thêm nút demo "⚡ Giả lập lỗi thanh toán (PAYMENT_FAILED)".
  - Bổ sung chi tiết Tạm tính, Giảm giá voucher, Tổng tiền.
- [ ] **Bước 6 (Order Detail & Confirmation)**: Sửa [frontend/src/app/orders/[id]/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/[id]/page.tsx):
  - Khớp thông điệp Wireframe (5): "Đặt hàng thành công", "Mời tới quầy lấy nước", nút "Về trang chủ".
  - Sửa công thức điểm thưởng từ `/ 1000` thành `/ 10000`.
  - Đổi liên kết quay lại thành `/orders/me`.
  - Bổ sung nút và Modal "Hủy đơn hàng" khi đơn ở `PENDING` hoặc `PAID`.
  - Hỗ trợ thanh toán lại cho đơn `PAYMENT_FAILED`.
- [ ] **Bước 7 (Orders Me Page)**: Tạo mới trang [frontend/src/app/orders/me/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/me/page.tsx) hoàn chỉnh chuẩn đề bài (Tabs lọc, Badge trạng thái, Modal hủy đơn, Modal đánh giá món).
- [ ] **Bước 8 (Routing & Navigation)**:
  - Cập nhật [app/orders/history/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/history/page.tsx) và [app/orders/page.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/app/orders/page.tsx) tự động chuyển hướng sang `/orders/me`.
  - Cập nhật [Navbar.tsx](file:///d:/CNPM/BrewLiteProject/frontend/src/components/Navbar.tsx) trỏ link lịch sử đơn về `/orders/me` và bổ sung link Trang cá nhân `/profile`.

---

## 🧪 IV. BẢNG TIÊU CHÍ NGHIỆM THU THEO ĐỀ BÀI (DoD VERIFICATION)

| Tiêu chí kiểm thử | Thao tác kiểm chứng | Kết quả mong đợi chuẩn Đề bài |
| :--- | :--- | :--- |
| **1. Route Lịch sử đơn** | Nhập trực tiếp `http://localhost:3000/orders/me` | Tải trang thành công, không bị 404, hiển thị danh sách đơn của khách. |
| **2. Tương thích ngược** | Truy cập `http://localhost:3000/orders/history` | Tự động chuyển hướng mượt mà sang `/orders/me`. |
| **3. Nút Giỏ hàng (US-05)** | Mở trang Giỏ hàng với giỏ có món | Nút hiển thị rõ ràng: `Tiến hành thanh toán (123.000đ)`. |
| **4. Điểm thưởng Loyalty** | Đặt đơn 50.000 VNĐ và thanh toán thành công | Màn xác nhận hiển thị `+5 điểm` (chuẩn 1 điểm / 10.000đ), Navbar nhảy +5 điểm. |
| **5. Wireframe (5) Xác nhận** | Quan sát màn hình sau khi thanh toán thành công | Hiển thị: Biểu tượng `✓`, "Đặt hàng thành công", Mã đơn, "Trạng thái: PAID", câu "Mời tới quầy lấy nước", nút "Về trang chủ". |
| **6. Hủy đơn hợp lệ** | Bấm Hủy đơn khi đơn ở `PENDING` hoặc `PAID` | Đơn chuyển sang `CANCELLED`, hoàn tiền/kho, Navbar trừ lại điểm thưởng nếu có. |
| **7. Đánh giá món** | Gửi đánh giá cho món trong đơn `COMPLETED` | Đánh giá lưu thành công, nút chuyển thành "Đã đánh giá đủ món", không bị lỗi 409 khi mở lại. |
| **8. Giả lập lỗi thanh toán** | Kích hoạt kịch bản lỗi tại Checkout | Đơn chuyển sang `PAYMENT_FAILED`, **giỏ hàng vẫn được giữ nguyên** (chuẩn AC US-05). |
| **9. Bảo mật Auth** | Nhập sai mật khẩu tại form đăng nhập | Báo lỗi chuẩn từ backend, không cấp token giả mạo, không bị văng phiên đăng nhập. |
| **10. Silent Refresh Token** | Access token hết hạn khi đang thao tác | Tự động gia hạn ngầm token mới mà không bắt người dùng phải đăng nhập lại. |
