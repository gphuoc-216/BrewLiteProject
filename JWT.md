# Cơ chế Bảo mật Mật khẩu (bcrypt) & JWT Token trong BrewLite

Tài liệu tóm tắt nhanh cấu trúc `A.B.C` của JWT, thời hạn `15m / 7d`, và luồng xác thực — phân quyền trong `Assigment1`.

---

## 1. Cấu trúc 3 phần của JWT (`A.B.C`)

Một chuỗi JWT luôn gồm **3 phần** ngăn cách bởi dấu chấm (`.`):

```text
<Header (A)> . <Payload (B)> . <Signature (C)>
```

| Phần | Tên | Cách tạo | Giải mã (Decode Base64URL) đọc được gì? |
|---|---|---|---|
| **`A`** | **Header** | Mã hóa Base64URL từ JSON thuật toán | `{ "alg": "HS256", "typ": "JWT" }` *(gần như giống nhau ở mọi token)* |
| **`B`** | **Payload** | Mã hóa Base64URL từ dữ liệu user | `{ "sub": "<accountId>", "username": "customer1", "role": "CUSTOMER", "iat": 1795010000, "exp": 1795010900 }` |
| **`C`** | **Signature** | Băm 1 chiều **`HMAC-SHA256(A + "." + B, JWT_SECRET)`** | **Không giải mã ngược được.** Dùng để kiểm tra token có bị sửa đổi không. |

### Giải thích các trường trong `Payload (B)`
- **`sub`**: `accountId` (UUID của tài khoản trong bảng `accounts`).
- **`username`**: Tên đăng nhập.
- **`role`**: Vai trò (`CUSTOMER` | `STAFF` | `ADMIN`).
- **`iat`** (*Issued At*): Mốc thời gian tạo token (tính theo giây Unix).
- **`exp`** (*Expiration*): Mốc thời gian hết hạn (`iat + 15 phút` với `accessToken`, hoặc `iat + 7 ngày` với `refreshToken`). Mỗi lần login hoặc refresh, `iat` và `exp` đều nhảy sang mốc mới nên `B` và `C` luôn thay đổi.

> **Lưu ý quan trọng:** Vì ai cũng giải mã Base64URL đọc được `A` và `B`, nên **tuyệt đối không lưu mật khẩu vào JWT**. Nếu kẻ xấu sửa `role` trong `B` mà không có `JWT_SECRET`, chữ ký `C` sẽ sai lệch và Backend chặn ngay (`401 Unauthorized`).

---

## 2. Phân biệt `accessToken` (`15m`) và `refreshToken` (`7d`)

Được cấp đồng thời tại `generateTokens()` (`backend/src/modules/auth/auth.service.ts`):

| Loại Token | Hạn dùng (`exp`) | Khóa bí mật ký | Tác dụng |
|---|---|---|---|
| **`accessToken`** | **15 phút** (`15m`) | `JWT_SECRET` | Gắn vào Header `Authorization: Bearer <accessToken>` để gọi mọi API (`/orders`, `/payments`...). |
| **`refreshToken`** | **7 ngày** (`7d`) | `JWT_REFRESH_SECRET` | Chỉ dùng gửi vào Body `POST /api/auth/refresh` để đổi lấy cặp token mới khi `accessToken` hết hạn. |

### Luồng tự động gia hạn không bị văng ra (`frontend/src/lib/api.ts`)
1. Sau 15 phút, `accessToken` hết hạn → Frontend gọi API và bị Backend trả **`401 Unauthorized`**.
2. `fetchApi()` bắt `401`, lấy `refreshToken` từ `localStorage` gọi `POST /api/auth/refresh`.
3. Backend xác thực `refreshToken` hợp lệ & tài khoản không bị `LOCKED` → cấp lại **cặp mới** (`accessToken` 15 phút mới + `refreshToken` 7 ngày mới).
4. Frontend lưu đè cặp mới vào `localStorage` và tự **retry** lại API ban nãy (gắn cờ `X-Retry-After-Refresh: 1` để tránh lặp vô tận).
5. Chỉ khi người dùng **bỏ web quá 7 ngày liên tiếp** (hoặc Admin khóa tài khoản `LOCKED`), `refreshToken` mới hết hạn và bắt đăng nhập lại.

---

## 3. Phân biệt `bcrypt` (Mật khẩu) vs `JWT` (Token)

- **`bcrypt`** (`auth.service.ts`): Chỉ dùng để **băm 1 chiều mật khẩu** (`bcrypt.hash(password, 10)` → lặp $2^{10} = 1.024$ vòng + `salt` ngẫu nhiên) trước khi lưu vào cột `Account.passwordHash` trong PostgreSQL. Không tạo ra token.
- **`JWT`**: Tạo ra chuỗi vé `A.B.C` sau khi `bcrypt.compare()` xác nhận đúng mật khẩu.

---

## 4. Luồng kiểm tra 2 lớp Guard ở Backend
1. **Trạm 1 — `JwtAuthGuard` + `JwtStrategy`** (`backend/src/modules/auth/strategies/jwt.strategy.ts`):
   - Tách token từ `Authorization: Bearer <token>`, kiểm tra chữ ký `JWT_SECRET` và hạn `exp`.
   - Truy vấn lại bảng `Account` trong PostgreSQL: nếu `status === LOCKED` → chặn ngay **`403 Forbidden`**, đồng thời lấy `role` mới nhất gắn vào `request.user`.
2. **Trạm 2 — `RolesGuard`** (`backend/src/common/guards/roles.guard.ts`):
   - Đọc `@Roles(...)` trên Controller và so sánh với `request.user.role` (ví dụ `CUSTOMER` gọi API `STAFF`/`ADMIN` → chặn **`403 Forbidden`**).
