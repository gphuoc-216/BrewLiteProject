# Báo cáo nghiệm thu Vòng 2: Sửa toàn bộ lỗi nghiệp vụ & chất lượng mã frontend BrewLite

> **Tình trạng:** Hoàn tất 100% các hạng mục P0 và P1.  
> **Kiểm tra tự động:** `npm run build` thành công (11/11 routes), `npm run lint` thành công (0 errors/warnings).  
> **Grep kiểm toán:** Không còn bất kỳ token cấm nào (`any\b`, `#[0-9A-Fa-f]{6}`, `<img>`, `.catch(() =>`) trong toàn bộ mã nguồn TSX/TS của `src/`.  
> **File nén:** Đã cập nhật file `frontend_ui.zip` (111 KB) tại thư mục gốc dự án.

---

## 1. Danh sách chi tiết các file đã sửa đổi & bổ sung

| STT | File | Mục tiêu & nội dung đã xử lý |
|:---:|:---|:---|
| 1 | [`src/types/index.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/types/index.ts) | Định nghĩa đầy đủ: `SupplierRecord`, `AccountRecord`, `RevenuePoint`, `TopProduct`, `AdminOverview`, `OrderStatusConfig`. Loại bỏ toàn bộ `any`. |
| 2 | [`src/lib/api.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/lib/api.ts) | Bổ sung class `ApiError`, helper `getErrorMessage(err: unknown)`. |
| 3 | [`src/lib/orderStatus.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/lib/orderStatus.ts) | **(Mới)** Tập trung hóa nhãn tiếng Việt, tone màu và step của toàn bộ trạng thái đơn hàng `ORDER_STATUS`. |
| 4 | [`src/lib/mock/adminMock.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/lib/mock/adminMock.ts) | **(Mới)** Tách toàn bộ dữ liệu mock của Admin, chỉ kích hoạt khi `NEXT_PUBLIC_USE_MOCK === 'true'`. |
| 5 | [`src/hooks/useRequireRole.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/hooks/useRequireRole.ts) | **(Mới)** Role Guard hook có cơ chế kiểm tra `mounted` tránh lỗi hydration và chống redirect nhầm trước khi store tải xong `localStorage`. |
| 6 | [`src/app/globals.css`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/globals.css) | Thêm các CSS custom properties: `--espresso-text` (`#F4EFE7`), `--espresso-muted` (`#C9BBA8`), `--espresso-line` (`#3D3027`), `--espresso-deep` (`#241B15`). |
| 7 | [`tailwind.config.js`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/tailwind.config.js) | Khai báo token Tailwind tương ứng: `espresso-text`, `espresso-muted`, `espresso-line`, `espresso-deep`. |
| 8 | [`src/components/Navbar.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/Navbar.tsx) | Thay toàn bộ hex cứng `#xxxxxx` bằng token class Tailwind espresso; dùng state `mounted` an toàn. |
| 9 | [`src/components/Footer.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/Footer.tsx) | Thay toàn bộ hex cứng `#xxxxxx` bằng token class Tailwind espresso. |
| 10 | [`src/components/ui/StatusBadge.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/StatusBadge.tsx) | Đọc nhãn tiếng Việt và màu sắc tập trung từ `ORDER_STATUS`. |
| 11 | [`src/store/useCartStore.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/store/useCartStore.ts) | Khóa định danh giỏ hàng theo `${variantId}:${topping}`. Đảm bảo cùng size khác topping không bị gộp dòng. |
| 12 | [`src/store/useAuthStore.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/store/useAuthStore.ts) | Thêm hàm `fetchProfile()` để fetch dữ liệu người dùng và điểm thưởng thực tế từ `/auth/profile`. |
| 13 | [`src/app/products/[id]/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/products/[id]/page.tsx) | Xóa mảng topping hard-code; lấy topping & size từ `ChiTietSanPham` (API). Đổi `<img>` sang `next/image`. |
| 14 | [`src/app/checkout/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/checkout/page.tsx) | Snapshot so sánh giỏ/phương thức/khuyến mãi: tự động hủy đơn PENDING cũ nếu thay đổi; radio buttons thật theo `<fieldset>` + `<legend>` + `<input type="radio" className="sr-only">`. |
| 15 | [`src/app/orders/[id]/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/orders/[id]/page.tsx) | Bỏ tính điểm tự bịa; dừng polling khi đơn đạt trạng thái cuối hoặc khi tab ẩn; gọi `fetchProfile()` đúng 1 lần khi chuyển sang `COMPLETED`. |
| 16 | [`src/app/orders/history/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/orders/history/page.tsx) | Gom món đánh giá theo `productId`; vô hiệu hóa món đã đánh giá; ẩn nút đánh giá khi toàn bộ món đã review; bắt mã lỗi 409 qua Toast. |
| 17 | [`src/app/admin/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/admin/page.tsx) | Dùng `Promise.allSettled`, lỗi riêng từng tab với `EmptyState` + "Tải lại"; tính thành tiền nhập kho trước khi gửi; bỏ fallback `|| 15000`; đổi `<img>` sang `next/image`; xóa toàn bộ `any`. |
| 18 | [`src/app/staff/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/staff/page.tsx) | Sử dụng `ORDER_STATUS` và bảo vệ trang qua `useRequireRole(['STAFF', 'ADMIN'])`. |
| 19 | [`src/app/login/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/login/page.tsx) | Xử lý tài khoản có trạng thái `LOCKED`: hiển thị thông báo "Tài khoản đã bị khoá, vui lòng liên hệ quầy". |
| 20 | [`src/app/cart/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/cart/page.tsx) | Đổi `<img>` sang `next/image`; bảo vệ bằng role guard; hiển thị dòng sản phẩm tách biệt theo topping. |
| 21 | [`src/app/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/page.tsx) | Đổi `<img>` sang `next/image` và loại bỏ màu hex cứng. |
| 22 | [`eslint.config.mjs`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/eslint.config.mjs) | Cấu hình ESLint flat config chuẩn Next.js. |

---

## 2. Kịch bản kiểm thử thủ công (Manual Verification Scenarios)

### Kịch bản (a): Chọn topping khác nhau cho cùng size
1. Vào chi tiết sản phẩm Cà phê Sữa Đá (Size M). Chọn topping "Trân châu trắng", bấm Thêm vào giỏ.
2. Vẫn sản phẩm đó (Size M), chọn topping "Thạch cà phê", bấm Thêm vào giỏ.
3. Mở trang Giỏ hàng `/cart`:
   - **Kết quả mong đợi:** Giỏ hàng hiển thị 2 dòng riêng biệt, không bị cộng dồn số lượng vào 1 dòng.
   - Khi tiến hành đặt hàng, mỗi dòng gửi đúng `variantId` (hoặc `topping` đi kèm), giá tiền chuẩn xác từ server.

### Kịch bản (b): Tắt backend hoặc backend gặp sự cố
1. Tắt server backend (hoặc ngắt kết nối mạng).
2. Đăng nhập với quyền Admin và truy cập `/admin`.
3. **Kết quả mong đợi:**
   - Admin không hiển thị bất kỳ số liệu doanh thu / tồn kho giả nào.
   - Mỗi tab hiển thị `EmptyState` cảnh báo "Không thể tải dữ liệu..." kèm theo nút "Tải lại".
   - Không thể bấm nhập kho hoặc khóa tài khoản trên các ID giả.

### Kịch bản (c): Thanh toán thất bại & Đổi phương thức thanh toán
1. Tại trang `/checkout`, chọn phương thức "Chuyển khoản VietQR", bấm "Đặt hàng & Thanh toán".
2. Hệ thống tạo đơn hàng `PENDING` và lưu `orderId` + `idempotencyKey`.
3. Giả lập thanh toán lỗi hoặc người dùng bấm nút **"Đổi phương thức thanh toán"**:
   - Trình duyệt tự động cuộn mượt tới phần lựa chọn phương thức và focus vào lựa chọn đầu tiên.
4. Người dùng chuyển sang chọn "Tiền mặt tại quầy" hoặc thay đổi mã giảm giá:
   - Hệ thống phát hiện thay đổi so với snapshot cũ, tự động gọi API hủy đơn `PENDING` trước đó và reset cả 2 ref.
   - Khi bấm đặt lại, hệ thống tạo đơn hàng mới với key mới, không bị lỗi trùng key 409 và không tạo đơn mồ côi.

### Kịch bản (d): Mở lại đơn hàng COMPLETED nhiều lần
1. Mở trang chi tiết đơn hàng `/orders/[id]` của một đơn đã hoàn thành (`status: 'COMPLETED'`).
2. Tải lại trang (F5) 3 lần liên tiếp:
   - **Kết quả mong đợi:** Hệ thống không tự cộng điểm ở client (`Math.floor...` đã bị xóa bỏ). Điểm thưởng hiển thị chuẩn theo trường `earnedPoints` hoặc điểm hiện tại từ server.
   - Polling ngưng ngay lập tức, không gửi request vô tận mỗi 4 giây.

### Kịch bản (e): F5 trên trang `/admin` hoặc `/staff` khi đang đăng nhập
1. Đang đăng nhập tài khoản Admin, đứng tại trang `/admin`.
2. Bấm F5 tải lại trang:
   - **Kết quả mong đợi:** Hook `useRequireRole` kiểm tra hydration và trạng thái store; giao diện hiển thị Skeleton loading nhẹ thay vì đá người dùng về `/login`.
   - Khi store nạp xong thông tin từ `localStorage`, giao diện Admin hiển thị đầy đủ ngay lập tức.

---

## 3. Khuyến nghị các Endpoint Backend cần bổ sung/hoàn thiện

Để toàn bộ luồng nghiệp vụ hoạt động đồng bộ 100% giữa Server và Frontend, đề xuất team Backend cập nhật/bổ sung các trường sau trong API:

1. **`GET /orders/:id`**:
   - Bổ sung trường `earnedPoints: number` (Số điểm tích lũy thực tế mà đơn hàng này mang lại cho khách sau khi hoàn thành) để frontend hiển thị chính xác thẻ "Bạn nhận được +X điểm thưởng".
2. **`GET /orders/:id` hoặc `GET /orders/history`**:
   - Bổ sung trường `reviewedProductIds: number[]` (danh sách ID sản phẩm trong đơn đã được khách hàng gửi đánh giá) hoặc mảng `reviews: { productId: number, rating: number, comment: string }[]`. Nhờ đó frontend có thể tự động đánh dấu badge "Đã đánh giá" và khóa dropdown ngay khi tải trang.
3. **`GET /products/:id` và `POST /orders`**:
   - Đảm bảo bảng `ChiTietSanPham` trả về đầy đủ các tổ hợp `variantId` đại diện cho từng cặp `(size, topping)` có giá tương ứng, hoặc endpoint `POST /orders` chấp nhận payload có dạng:
     ```json
     {
       "items": [
         {
           "variantId": 12,
           "quantity": 2,
           "topping": "Trân châu trắng"
         }
       ]
     }
     ```
4. **`POST /orders/:id/cancel`**:
   - Đảm bảo hỗ trợ khách hàng hủy đơn hàng đang ở trạng thái `PENDING` khi khách đổi ý hoặc thay đổi phương thức thanh toán tại trang checkout.
