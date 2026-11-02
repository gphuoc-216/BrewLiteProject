# Báo cáo thực thi p4-checkout-history-review

## File đã sửa và nội dung thay đổi

- `backend/src/modules/orders/orders.service.ts`
  - Thêm `reviews: true` vào `getMyOrders` để frontend biết món nào đã đánh giá và không hiện nút đánh giá lặp.

- `backend/src/modules/orders/order-state-machine.ts`
  - Cho phép chuyển `PAYMENT_FAILED -> PAID` để hỗ trợ thanh toán lại đúng sơ đồ nghiệp vụ.

- `backend/src/modules/payment/payment.service.ts`
  - Xử lý kịch bản `simulateError` để lưu trạng thái `PAYMENT_FAILED` mà không trừ kho/không rollback trạng thái lỗi.
  - Giữ kiểm tra tồn kho và optimistic locking trước luồng thanh toán thành công để các lỗi kho vẫn trả `ConflictException`.

- `frontend/src/lib/api.ts`
  - Thêm silent refresh: khi gặp 401, tự gọi `/auth/refresh`, lưu access/refresh token mới và retry request ban đầu.
  - Chỉ logout khi refresh token không có hoặc refresh thất bại.

- `frontend/src/app/cart/page.tsx`
  - Nút thanh toán hiển thị tổng tiền theo US-05 AC 1.

- `frontend/src/app/login/page.tsx`
  - Xóa toàn bộ mock token fallback khi đăng nhập lỗi.
  - Nút tài khoản demo chỉ điền username/password.
  - Thêm nút ẩn/hiện mật khẩu.

- `frontend/src/app/register/page.tsx`
  - Thêm xác nhận mật khẩu.
  - Thêm validate regex email phía client.
  - Thêm nút ẩn/hiện mật khẩu.

- `frontend/src/app/profile/page.tsx`
  - Tạo mới trang cá nhân hiển thị username, email, họ tên, điểm tích lũy.
  - Thêm form đổi mật khẩu gọi `/auth/change-password`.

- `frontend/src/app/checkout/page.tsx`
  - Chuẩn hóa nội dung wireframe thanh toán: "Không dùng tiền mặt", "Ví điện tử", "Thẻ ngân hàng", "Xác nhận trả".
  - Bỏ chặn Back khi thanh toán chưa thành công.
  - Thêm toggle demo "Giả lập lỗi thanh toán (PAYMENT_FAILED)".
  - Thêm chi tiết tạm tính, giảm giá voucher, tổng tiền.
  - Hỗ trợ thanh toán lại bằng query `?orderId=...` cho đơn `PAYMENT_FAILED` hoặc `PENDING`.

- `frontend/src/app/orders/[id]/page.tsx`
  - Sửa công thức điểm thưởng từ `/ 1000` thành `/ 10000`.
  - Đổi link lịch sử về `/orders/me`.
  - Chuẩn hóa màn xác nhận PAID: "Đặt hàng thành công", "Mã đơn", "Trạng thái: PAID", "Mời tới quầy lấy nước", nút "Về trang chủ".
  - Thêm nút/modal hủy đơn trực tiếp cho `PENDING` và `PAID`.
  - Nút thanh toán lại đơn `PAYMENT_FAILED` trỏ sang `/checkout?orderId=...`.

- `frontend/src/app/orders/me/page.tsx`
  - Tạo route chuẩn `/orders/me`.
  - Thêm tabs: Tất cả đơn, Đang xử lý, Hoàn tất, Đã hủy / Lỗi.
  - Giữ modal hủy đơn, modal đánh giá món và trạng thái đã đánh giá.
  - Thêm stepper trạng thái rút gọn trên từng thẻ đơn.

- `frontend/src/app/orders/history/page.tsx`
  - Chuyển thành redirect sang `/orders/me` để tương thích link cũ.

- `frontend/src/app/orders/page.tsx`
  - Redirect sang `/orders/me`.

- `frontend/src/components/Navbar.tsx`
  - Link lịch sử đơn trỏ về `/orders/me`.
  - Thêm đường vào Trang cá nhân `/profile` từ thông tin tài khoản và menu mobile.

## Test đã chạy và kết quả thực tế

- `npm test -- --runInBand` tại `backend`
  - Kết quả: PASS.
  - `Test Suites: 5 passed, 5 total`.
  - `Tests: 43 passed, 43 total`.

- `npx tsc --noEmit` tại `frontend`
  - Kết quả: PASS, không có lỗi TypeScript.

- `npm run build` tại `frontend`
  - Kết quả: FAIL do môi trường Windows chặn Next worker.
  - Lỗi thực tế: `Error: spawn EPERM`.

- `npm run lint` tại `frontend`
  - Kết quả: FAIL do không tìm thấy binary ESLint trong môi trường hiện tại.
  - Lỗi thực tế: `'eslint' is not recognized as an internal or external command`.
  - Kiểm tra thêm: `frontend/node_modules/.bin/eslint.cmd` không tồn tại.

## Vấn đề còn tồn tại và hướng xử lý tiếp theo

- Frontend build chưa xác nhận được bằng `next build` vì lỗi `spawn EPERM`; cần chạy lại trong terminal/user có quyền spawn child process cho Next worker.
- Frontend lint chưa chạy được vì thiếu binary `eslint.cmd`; cần cài lại dependency frontend bằng `npm install` trong `frontend`, sau đó chạy lại `npm run lint`.
- Worktree trước khi sửa đã có nhiều thay đổi ngoài phạm vi task như `backend/package.json`, `backend/src/app.module.ts`, `backend/src/modules/products/products.service.ts`, `backend/src/prisma/prisma.service.ts`, `package.json` và một số file chưa track. Các thay đổi đó được giữ nguyên, không ghi đè hoặc xóa.
