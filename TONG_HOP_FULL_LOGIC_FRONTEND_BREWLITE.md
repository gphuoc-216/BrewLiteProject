# TỔNG HỢP TOÀN BỘ KIẾN TRÚC, THIẾT KẾ & LOGIC FRONTEND BREWLITE

> **Dự án:** BrewLite Frontend — Nền tảng đặt cà phê thủ công & thanh toán không tiền mặt  
> **Tech Stack:** Next.js 14 (App Router) + React 18 + TypeScript 5 + TailwindCSS 3 + Zustand + Lucide Icons  
> **Trạng thái:** Hoàn thiện 100% Vòng 1 (Thiết kế lại UI) và Vòng 2 (Sửa sạch lỗi nghiệp vụ & quy chuẩn mã nguồn)  
> **Kiểm toán chất lượng:** `npm run build` thành công 11/11 routes, `npm run lint` 0 lỗi/0 cảnh báo, 0 token cấm (`any`, hex cứng, `<img>`, `.catch(() =>`)

---

## MỤC LỤC
1. [Triết lý Thiết kế & Hệ thống Design Tokens](#1-triết-lý-thiết-kế--hệ-thống-design-tokens)
2. [Cấu trúc Thư mục & Nguyên tắc Lập trình](#2-cấu-trúc-thư-mục--nguyên-tắc-lập-trình)
3. [Mô hình Dữ liệu & Hệ thống Types (TypeScript)](#3-mô-hình-dữ-liệu--hệ-thống-types-typescript)
4. [Tầng Xử lý API & Quản lý Lỗi](#4-tầng-xử-lý-api--quản-lý-lỗi)
5. [Quản lý State Toàn cục (Zustand Stores)](#5-quản-lý-state-toàn-cục-zustand-stores)
6. [Cơ chế Phân quyền & Role Guard](#6-cơ-chế-phân-quyền--role-guard)
7. [Tập trung hóa Trạng thái Đơn hàng (Order Status System)](#7-tập-trung-hóa-trạng-thái-đơn-hàng-order-status-system)
8. [Đặc tả Logic Chi tiết Từng Màn hình](#8-đặc-tả-logic-chi-tiết-từng-màn-hình)
   - [8.1 Trang chủ & Thực đơn (`/`)](#81-trang-chủ--thực-đơn-)
   - [8.2 Chi tiết Sản phẩm & Chọn Biến thể (`/products/[id]`)](#82-chi-tiết-sản-phẩm--chọn-biến-thể-productsid)
   - [8.3 Giỏ hàng (`/cart`)](#83-giỏ-hàng-cart)
   - [8.4 Đặt hàng & Thanh toán (`/checkout`)](#84-đặt-hàng--thanh-toán-checkout)
   - [8.5 Xác nhận & Theo dõi Đơn hàng Thời gian thực (`/orders/[id]`)](#85-xác-nhận--theo-dõi-đơn-hàng-thời-gian-thực-ordersid)
   - [8.6 Lịch sử Đơn hàng & Đánh giá Từng Món (`/orders/history`)](#86-lịch-sử-đơn-hàng--đánh-giá-từng-món-ordershistory)
   - [8.7 Bảng Điều phối Pha chế Barista (`/staff`)](#87-bảng-điều-phối-pha-chế-barista-staff)
   - [8.8 Bảng Quản trị Trung tâm (`/admin`)](#88-bảng-quản-trị-trung-tâm-admin)
   - [8.9 Đăng nhập & Đăng ký (`/login`, `/register`)](#89-đăng-nhập--đăng-ký-login-register)
9. [Tổng kết Kịch bản Kiểm thử Thủ công](#9-tổng-kết-kịch-bản-kiểm-thử-thủ-công)
10. [Khuyến nghị Endpoint Backend Đồng bộ](#10-khuyến-nghị-endpoint-backend-đồng-bộ)

---

## 1. Triết lý Thiết kế & Hệ thống Design Tokens

### 1.1 Triết lý thị giác: "Craft Roastery & Minimal Warmth"
Không sử dụng các giao diện template phổ thông (nền tím xanh gradient, bo tròn quá đà, thẻ trắng đồng điệu). BrewLite xây dựng hình ảnh một xưởng rang cà phê thủ công cao cấp với:
- **Tông màu chủ đạo:** Nâu cà phê đậm đà (Dark Espresso), nền kem ấm (Warm Cream), điểm xuyết hổ phách (Warm Amber) và xanh lá trà thảo mộc (Matcha Green).
- **Hệ thống Typography kép:**
  - **Display Font (`Fraunces`):** Font serif cổ điển với các đường nét chạm khắc thủ công, tạo cảm xúc ấm cúng, sang trọng cho các tiêu đề chính (`h1`, `h2`, thẻ giá đặc biệt).
  - **Body Font (`Be Vietnam Pro`):** Font sans-serif hiện đại, tối ưu dấu tiếng Việt, độ cao x-height lớn, đảm bảo tính dễ đọc tuyệt đối trên mọi màn hình cho menu, nút bấm, bảng số liệu và nhãn biểu mẫu.

### 1.2 Bảng màu Tokens (Semantic Color Tokens)
Được cấu hình chuẩn hóa tại `globals.css` và `tailwind.config.js`:
- **Nền & Bề mặt:**
  - `bg-cream-50` (`#FAF7F2`): Nền toàn trang, mang lại cảm giác giấy kraft và bọt sữa ấm.
  - `bg-cream-100` (`#F3EDE2`): Nền thứ cấp cho các thẻ phụ, sidebar, input.
  - `bg-white`: Mặt thẻ card nổi bật với viền nhẹ và đổ bóng mềm.
- **Họ Espresso (Nâu Cà Phê):**
  - `espresso-deep` (`#241B15`): Nền header, footer, thanh điều hướng chính.
  - `espresso-line` (`#3D3027`): Đường kẻ phân cách, viền các thành phần trong nền tối.
  - `espresso-muted` (`#C9BBA8`): Văn bản thứ cấp trên nền tối, mô tả phụ.
  - `espresso-text` (`#F4EFE7`): Văn bản chính có độ tương phản cao trên nền espresso.
  - `espresso-900` (`#1F1610`) đến `espresso-600` (`#4A3728`): Các cấp độ nâu cà phê đậm.
- **Họ Amber & Terracotta & Matcha (Nhấn mạnh ngữ nghĩa):**
  - `amber-600` / `amber-500`: Màu hành động chính (Primary CTA), xếp hạng sao, điểm thưởng tích lũy.
  - `terracotta-500` (`#C85A32`): Cảnh báo nhẹ, món bán chạy (Bestseller), giảm giá.
  - `matcha-600` (`#3E6B48`): Trạng thái đơn hoàn thành, sẵn sàng phục vụ, thông báo thành công.

---

## 2. Cấu trúc Thư mục & Nguyên tắc Lập trình

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── globals.css         # Token màu, biến CSS :root, font declarations
│   │   ├── layout.tsx          # Root layout với Navbar, Footer, font injection
│   │   ├── page.tsx            # Trang chủ & thực đơn
│   │   ├── cart/page.tsx       # Trang giỏ hàng
│   │   ├── checkout/page.tsx   # Trang thanh toán & idempotency
│   │   ├── login/page.tsx      # Đăng nhập & bắt khóa tài khoản
│   │   ├── register/page.tsx   # Đăng ký khách hàng
│   │   ├── products/[id]/      # Chi tiết sản phẩm & biến thể
│   │   ├── orders/[id]/        # Theo dõi trạng thái đơn thời gian thực
│   │   ├── orders/history/     # Lịch sử đơn hàng & đánh giá
│   │   ├── staff/page.tsx      # Bảng điều phối Barista
│   │   └── admin/page.tsx      # Trung tâm quản trị Admin
│   ├── components/
│   │   ├── Navbar.tsx          # Thanh điều hướng với giỏ hàng & điểm thưởng
│   │   ├── Footer.tsx          # Chân trang chuẩn nhận diện thương hiệu
│   │   └── ui/                 # Design System Components độc lập
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── PageHeader.tsx
│   │       ├── QuantityStepper.tsx
│   │       ├── Skeleton.tsx
│   │       ├── StatusBadge.tsx # Huy hiệu trạng thái tập trung
│   │       └── Toast.tsx
│   ├── hooks/
│   │   └── useRequireRole.ts   # Guard phân quyền chống lỗi hydration
│   ├── lib/
│   │   ├── api.ts              # Fetch client, ApiError, getErrorMessage
│   │   ├── orderStatus.ts      # Bộ từ điển tập trung trạng thái đơn hàng
│   │   ├── mockProducts.ts     # Dữ liệu dự phòng trang chủ
│   │   └── mock/
│   │       └── adminMock.ts    # Dữ liệu mock Admin tách biệt, mặc định tắt
│   ├── store/
│   │   ├── useAuthStore.ts     # Quản lý phiên đăng nhập & điểm tích luỹ
│   │   └── useCartStore.ts     # Giỏ hàng với khóa id kép ${variantId}:${topping}
│   └── types/
│       └── index.ts            # Định nghĩa toàn bộ kiểu dữ liệu TypeScript
├── eslint.config.mjs           # Cấu hình ESLint flat config chuẩn Next.js
├── tailwind.config.js          # Hệ thống mở rộng màu sắc và font chữ
└── tsconfig.json
```

### Nguyên tắc Lập trình Bắt buộc:
1. **Zero `any`:** 100% biến, hàm, tham số API, state đều có interface cụ thể.
2. **Zero hex cứng trong JSX:** Toàn bộ màu sắc đều sử dụng token CSS/Tailwind (`text-espresso-text`, `bg-cream-50`...), không dùng mã `#xxxxxx` trong `.tsx`.
3. **Chuẩn hóa hình ảnh:** 100% hình ảnh dùng `next/image` có `width/height` hoặc `fill` kèm `sizes`.
4. **Không nuốt lỗi:** Không sử dụng `.catch(() => [mockData])` gây sai lệch dữ liệu thật của hệ thống.

---

## 3. Mô hình Dữ liệu & Hệ thống Types (TypeScript)

Toàn bộ kiểu dữ liệu nằm tại `src/types/index.ts`:

- **Người dùng & Xác thực:**
  - `Role`: `'CUSTOMER' | 'STAFF' | 'ADMIN'`
  - `AccountStatus`: `'ACTIVE' | 'LOCKED'`
  - `User`: `{ id, email, fullName, role, phone?, loyaltyPoints? }`
- **Sản phẩm & Biến thể:**
  - `ChiTietSanPham`: Biến thể cụ thể theo size và topping `{ id, productId, size, topping?, price, stock, sku? }`
  - `ProductRecord`: Sản phẩm cha `{ id, name, category, description, imageUrl, isAvailable, variants?: ChiTietSanPham[] }`
- **Giỏ hàng & Đơn hàng:**
  - `CartItem`: Món trong giỏ `{ id: string, variantId: number, productId: number, name: string, size: string, topping?: string, price: number, quantity: number, imageUrl?: string }`
  - `OrderStatus`: `'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'`
  - `PaymentMethod`: `'CASH' | 'VIETQR' | 'MOMO' | 'ZALOPAY'`
  - `PaymentStatus`: `'PENDING' | 'SUCCESS' | 'FAILED'`
  - `OrderItemRecord`: Dòng trong đơn `{ id, orderId, variantId, quantity, unitPrice, subtotal, product?: { name, imageUrl }, variant?: { size, topping } }`
  - `OrderRecord`: Đơn hàng hoàn chỉnh `{ id, orderCode, customerId, status, paymentMethod, paymentStatus, totalAmount, discountAmount, finalAmount, createdAt, items: OrderItemRecord[], earnedPoints?: number }`
- **Quản trị & Kho:**
  - `SupplierRecord`: Nhà cung cấp nguyên liệu `{ id, name, phone, address, email? }`
  - `IngredientRecord`: Nguyên liệu kho `{ id, name, unit, currentStock, warningThreshold, supplierId?, supplier?: SupplierRecord }`
  - `AccountRecord`: Danh sách tài khoản người dùng `{ id, email, fullName, role, status, phone, loyaltyPoints, createdAt }`
  - `PromotionRecord`: Mã giảm giá `{ id, code, discountPercent, maxDiscount, minOrderValue, startDate, endDate, isActive }`
  - `AdminOverview`: Thống kê tổng quan `{ totalRevenue, totalOrders, newCustomers, lowStockCount }`

---

## 4. Tầng Xử lý API & Quản lý Lỗi

Đặt tại `src/lib/api.ts`:

### 4.1 Lớp Lỗi Tùy Biến `ApiError`
```typescript
export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 4.2 Hàm Trích xuất Thông báo Lỗi An toàn `getErrorMessage`
```typescript
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
}
```

### 4.3 Hàm Gọi API Trung tâm `fetchApi`
- Tự động đọc JWT token từ `localStorage` (`auth-storage`) và đính kèm `Authorization: Bearer <token>`.
- Tự động cấu hình `Content-Type: application/json`.
- Kiểm tra mã phản hồi HTTP:
  - Nếu `401 Unauthorized`: Xóa token và điều hướng về trang `/login`.
  - Nếu status `>= 400`: Ném `ApiError` chứa mã HTTP và thông báo từ máy chủ (hoặc message mặc định).

---

## 5. Quản lý State Toàn cục (Zustand Stores)

### 5.1 `useAuthStore` (`src/store/useAuthStore.ts`)
- **State:** `user: User | null`, `token: string | null`, `isAuthenticated: boolean`.
- **Hành động:**
  - `login(token, user)`: Lưu trạng thái và lưu bền vững vào `localStorage`.
  - `logout()`: Xóa sạch phiên đăng nhập.
  - `fetchProfile()`: Gọi `GET /auth/profile` để cập nhật thông tin mới nhất và điểm thưởng (`loyaltyPoints`) từ máy chủ về Navbar.

### 5.2 `useCartStore` (`src/store/useCartStore.ts`)
- **Nguyên lý Định danh Đột phá:**
  - Khóa dòng giỏ hàng: `id: `${variantId}:${item.topping || 'none'}`.
  - **Khắc phục lỗi gộp nhầm:** Khách hàng chọn cùng một sản phẩm, cùng Size M, nhưng 1 ly chọn "Trân châu trắng", 1 ly chọn "Thạch cà phê" sẽ tạo thành **2 dòng riêng biệt** với số lượng và giá độc lập.
- **Hành động:**
  - `addItem(item)`: Nếu trùng cả `variantId` và `topping` thì cộng dồn số lượng; nếu khác topping thì thêm dòng mới.
  - `updateQuantity(id, quantity)`: Tự động xóa khỏi giỏ nếu số lượng `<= 0`.
  - `removeItem(id)`: Xóa một dòng sản phẩm cụ thể.
  - `clearCart()`: Xóa sạch giỏ sau khi đặt hàng thành công.
  - `applyCoupon(code, discount)`: Ghi nhận mã giảm giá và số tiền được trừ.
  - `getTotalPrice()`: Tính tổng tiền các dòng trước giảm giá.
  - `getFinalPrice()`: Tổng tiền thực trả sau khi trừ mã giảm giá (tối thiểu = 0).

---

## 6. Cơ chế Phân quyền & Role Guard

Tập trung tại `src/hooks/useRequireRole.ts`:

- **Vấn đề đã triệt tiêu:** Next.js App Router render lần đầu trên client khi Zustand chưa kịp hydrate từ `localStorage`. Nếu kiểm tra quyền ngay lập tức sẽ bị hiểu nhầm là chưa đăng nhập và đá người dùng về `/login`.
- **Giải pháp:**
  - Sử dụng state `ready` và cờ `mounted`.
  - Chỉ khi component đã mounted hoàn chỉnh trên client:
    1. Nếu chưa đăng nhập: chuyển hướng về `/login`.
    2. Nếu vai trò của user không nằm trong `allowedRoles`: chuyển hướng về trang chủ `/`.
    3. Nếu hợp lệ: bật `setReady(true)` để màn hình chính render.
- **Phân quyền tại các tuyến đường:**
  - `/admin`: `useRequireRole(['ADMIN'])`
  - `/staff`: `useRequireRole(['STAFF', 'ADMIN'])`
  - `/checkout`, `/orders/[id]`, `/orders/history`: `useRequireRole(['CUSTOMER', 'STAFF', 'ADMIN'])`

---

## 7. Tập trung hóa Trạng thái Đơn hàng (Order Status System)

Đặt tại `src/lib/orderStatus.ts`:

```typescript
export const ORDER_STATUS: Record<OrderStatus, OrderStatusConfig> = {
  PENDING: {
    label: 'Chờ thanh toán',
    tone: 'warning',
    step: 1,
    description: 'Đơn hàng đang chờ thanh toán hoặc xác nhận từ quầy',
  },
  PAID: {
    label: 'Đã thanh toán',
    tone: 'info',
    step: 2,
    description: 'Đã ghi nhận thanh toán, đang gửi đến quầy pha chế',
  },
  PREPARING: {
    label: 'Đang pha chế',
    tone: 'warning',
    step: 3,
    description: 'Barista đang chuẩn bị thức uống của bạn',
  },
  READY: {
    label: 'Sẵn sàng lấy',
    tone: 'success',
    step: 4,
    description: 'Thức uống đã xong, mời bạn đến quầy nhận món',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    tone: 'neutral',
    step: 4,
    description: 'Đơn hàng đã được giao thành công. Cảm ơn bạn!',
  },
  CANCELLED: {
    label: 'Đã hủy',
    tone: 'danger',
    step: 0,
    description: 'Đơn hàng đã bị hủy',
  },
};
```
Toàn bộ `StatusBadge`, thanh tiến trình timeline, bảng Barista và lịch sử đều dùng chung từ điển này, xóa bỏ 100% tình trạng viết nhãn rải rác.

---

## 8. Đặc tả Logic Chi tiết Từng Màn hình

### 8.1 Trang chủ & Thực đơn (`src/app/page.tsx`)
- **Bố cục Hero Bento Grid:** Thể hiện câu chuyện thương hiệu thủ công, nút "Khám phá thực đơn" cuộn mượt xuống danh mục.
- **Bộ lọc & Tìm kiếm:**
  - Bộ nút danh mục ngang (Tất cả, Cà phê pha phin, Espresso thủ công, Trà ủ lạnh, Bánh ngọt).
  - Thanh tìm kiếm theo thời gian thực (lọc cả theo tên và mô tả sản phẩm).
- **Thẻ sản phẩm:**
  - Sử dụng `next/image` tỉ lệ 4:3 với hiệu ứng hover zoom nhẹ.
  - Hiển thị khoảng giá: `"Từ X đ"` dựa theo giá của biến thể nhỏ nhất.
  - Nút "Chọn món" dẫn trực tiếp tới `/products/[id]`.

### 8.2 Chi tiết Sản phẩm & Chọn Biến thể (`src/app/products/[id]/page.tsx`)
- **Nguồn sự thật:** Gọi `GET /products/:id` nhận mảng `variants: ChiTietSanPham[]`.
- **Loại bỏ Topping Hardcode:**
  - Trích xuất danh sách size duy nhất và topping duy nhất từ các biến thể máy chủ trả về.
  - Khi người dùng bấm chọn cặp `(size, topping)`:
    - Tìm biến thể tương ứng `variants.find(v => v.size === selectedSize && (v.topping || '') === (selectedTopping || ''))`.
    - Lấy trực tiếp `price` từ biến thể đó trên server, không tự ý cộng tiền giả lập ở client.
- **Bộ chọn số lượng `QuantityStepper`:** Giới hạn từ `1` đến tồn kho thực tế (`stock`).
- **Thêm vào giỏ:** Gọi `addItem` với đầy đủ thông tin định danh và hiển thị Toast thông báo.

### 8.3 Giỏ hàng (`src/app/cart/page.tsx`)
- **Hiển thị dòng độc lập:** Mỗi dòng hiển thị tên món, ảnh, size, topping đính kèm, đơn giá và tổng phụ.
- **Thao tác nhanh:** Tăng/giảm số lượng từng dòng trực tiếp; nút xóa món có icon thùng rác tinh tế.
- **Mã giảm giá:** Input nhập voucher, gọi API kiểm tra mã hợp lệ, hiển thị số tiền được chiết khấu ngay tại cột tổng tiền.
- **Điều hướng tiếp theo:** Nút "Tiến hành thanh toán" dẫn sang `/checkout`. Nếu giỏ trống, hiển thị `EmptyState` kèm nút "Khám phá thực đơn".

### 8.4 Đặt hàng & Thanh toán (`src/app/checkout/page.tsx`)
- **Cơ chế Snapshot & Chống Trùng Key (Idempotency):**
  - Giữ `orderIdRef` và `idempotencyKeyRef` cho phiên thanh toán.
  - Lưu snapshot cấu hình: `method:cartLength:total:couponCode`.
  - **Logic then chốt:** Nếu khách hàng bấm thử lại với **cùng cấu hình** → giữ nguyên `idempotencyKey` và `orderId` để máy chủ nhận diện giao dịch cũ.
  - Nếu khách hàng **đổi phương thức thanh toán, sửa giỏ hàng hoặc đổi mã giảm giá**:
    - Hệ thống tự động gọi `POST /orders/:id/cancel` để hủy đơn `PENDING` cũ.
    - Reset cả 2 ref (`orderIdRef = null`, `idempotencyKeyRef = null`).
    - Tạo đơn mới hoàn toàn, triệt tiêu lỗi đơn mồ côi và lỗi trùng key 409.
- **Trải nghiệm Đổi phương thức:** Nút "Đổi phương thức thanh toán" tự động scroll mượt tới khối phương thức và focus vào lựa chọn đầu tiên.
- **Chuẩn Accessibility (A11y):**
  - Chuyển toàn bộ thẻ label bấm giả thành thẻ ngữ nghĩa:
    `<fieldset>` + `<legend>` + `<input type="radio" name="paymentMethod" className="sr-only">`.
  - Hỗ trợ chọn phương thức hoàn toàn bằng phím Tab và phím mũi tên.

### 8.5 Xác nhận & Theo dõi Đơn hàng Thời gian thực (`src/app/orders/[id]/page.tsx`)
- **Khắc phục Lỗi Điểm Thưởng Tự Bịa:**
  - Xóa bỏ hoàn toàn công thức `Math.floor(totalAfterDiscount / 1000)` chạy trong vòng lặp polling.
  - Đọc trực tiếp `earnedPoints` từ phản hồi của đơn hàng.
  - Sử dụng `prevStatusRef` để ghi nhớ trạng thái trước đó: **Chỉ gọi `fetchProfile()` đúng 1 lần duy nhất** khi trạng thái của đơn chuyển sang `COMPLETED` để cộng điểm thật về tài khoản.
- **Tối ưu hóa Polling:**
  - Tần suất poll: 4 giây/lần.
  - **Dừng ngay lập tức** khi đơn đạt các trạng thái kết thúc: `COMPLETED`, `CANCELLED`, `PAYMENT_FAILED`.
  - **Tự động tạm dừng** khi tab trình duyệt bị ẩn (`document.visibilityState === 'hidden'`) để tránh lãng phí băng thông và tài nguyên CPU.
- **Thanh tiến trình Timeline:** Thể hiện 4 bước trực quan: Đã đặt → Đã thanh toán → Đang pha chế → Sẵn sàng nhận.

### 8.6 Lịch sử Đơn hàng & Đánh giá Từng Món (`src/app/orders/history/page.tsx`)
- **Bộ lọc trạng thái:** Lọc theo Tất cả, Đang xử lý, Hoàn thành, Đã hủy.
- **Đánh giá Đơn hàng:**
  - Gom danh sách món trong đơn theo `productId` duy nhất (tránh việc cùng 1 món nhưng 2 size khác nhau bị hiển thị lặp trong dropdown).
  - Đánh dấu nhãn `(Đã đánh giá)` và `disabled` lựa chọn nếu món đó đã được review.
  - Tự động ẩn nút "Đánh giá món" nếu toàn bộ sản phẩm trong đơn đã được review xong.
  - Bắt mã lỗi `409 Conflict` nếu gửi trùng và hiển thị thông báo Toast lịch sự.

### 8.7 Bảng Điều phối Pha chế Barista (`src/app/staff/page.tsx`)
- **Bố cục Bảng 4 Cột:**
  1. *Chờ xác nhận / Chờ thanh toán* (`PENDING`)
  2. *Đang pha chế* (`PREPARING`)
  3. *Sẵn sàng lấy* (`READY`)
  4. *Đã hoàn thành* (`COMPLETED`)
- **Thao tác Một Chạm (One-tap action):**
  - Nút chuyển trạng thái nhanh: `Chuyển sang Pha chế` → `Báo có món` → `Giao khách`.
- **Tự động làm mới:** Polling danh sách mỗi 10 giây; trang được bảo vệ bằng `useRequireRole(['STAFF', 'ADMIN'])`.

### 8.8 Bảng Quản trị Trung tâm (`src/app/admin/page.tsx`)
- **Loại bỏ Hoàn toàn Fallback Mock Ngầm:**
  - Không còn bất kỳ đoạn mã `.catch(() => [mockData])`.
  - Tải dữ liệu bằng `Promise.allSettled`. Nếu máy chủ gặp sự cố, tab bị lỗi sẽ hiển thị `EmptyState` kèm nút "Tải lại", không hiển thị số liệu doanh thu ảo.
  - Dữ liệu mẫu được cách ly trong `src/lib/mock/adminMock.ts`, chỉ bật khi cờ `NEXT_PUBLIC_USE_MOCK === 'true'`.
- **Quản lý Nhập kho An toàn:**
  - Form nhập kho yêu cầu chọn Nhà cung cấp, nhập Số lượng và Đơn giá.
  - Kiểm tra điều kiện nghiêm ngặt: `quantity > 0` và `unitPrice > 0`.
  - Hiển thị banner tính trước thành tiền: `thanhTien = Số lượng × Đơn giá` định dạng VNĐ rõ ràng trước khi bấm gửi.
  - **Cảnh báo sắp hết:** So sánh `currentStock <= warningThreshold` theo cấu hình thực tế của API, loại bỏ số cứng `|| 15000`.
- **Quản lý Tài khoản & Phân quyền:**
  - Bảng danh sách người dùng hiển thị vai trò, trạng thái (`ACTIVE` / `LOCKED`).
  - Nút Khóa / Mở khóa tài khoản gọi API trực tiếp với xác nhận an toàn.

### 8.9 Đăng nhập & Đăng ký (`src/app/login/page.tsx`, `src/app/register/page.tsx`)
- **Xử lý Tài khoản Bị Khóa:**
  - Khi người dùng đăng nhập, nếu server trả về trạng thái `status === 'LOCKED'`, hệ thống lập tức hiển thị thông báo:
    `"Tài khoản đã bị khoá, vui lòng liên hệ quầy"`.
- **Điều hướng thông minh sau đăng nhập:**
  - `ADMIN` → tự động chuyển sang `/admin`.
  - `STAFF` → tự động chuyển sang `/staff`.
  - `CUSTOMER` → chuyển về trang chủ `/` hoặc trang trước đó.

---

## 9. Tổng kết Kịch bản Kiểm thử Thủ công

| Kịch bản | Thao tác thực hiện | Kết quả mong đợi đạt được |
|:---|:---|:---|
| **(a) Topping cùng size khác nhau** | Chọn Cà phê Sữa Đá (Size M) + Trân châu trắng, sau đó chọn tiếp Cà phê Sữa Đá (Size M) + Thạch cà phê. | Giỏ hàng hiển thị đúng 2 dòng riêng biệt, không bị cộng dồn số lượng. Giá hiển thị chính xác theo từng biến thể. |
| **(b) Mất kết nối backend** | Tắt server API backend, truy cập `/admin`. | Trang Admin hiển thị thông báo lỗi `EmptyState` độc lập ở các tab kèm nút "Tải lại", tuyệt đối không hiển thị doanh thu hoặc kho giả. |
| **(c) Đổi phương thức thanh toán** | Tại checkout chọn VietQR → Đặt hàng → bấm "Đổi phương thức thanh toán" → chọn Tiền mặt. | Giao diện cuộn mượt và focus radio tiền mặt; đơn PENDING cũ được tự động hủy; tạo đơn mới không bị trùng idempotency key. |
| **(d) Xem lại đơn đã hoàn tất** | Mở `/orders/[id]` của một đơn `COMPLETED`, F5 tải lại 3 lần. | Điểm thưởng không bị tăng vô tội vạ ở client; polling ngưng chạy ngay lập tức; không gửi request ngầm khi ẩn tab. |
| **(e) F5 trên màn hình phân quyền** | Đăng nhập tài khoản Admin hoặc Staff, nhấn F5 tại `/admin` hoặc `/staff`. | Hook `useRequireRole` hiển thị Skeleton tải nhẹ trong tích tắc, sau đó hiển thị nội dung, không bị đá văng về `/login`. |

---

## 10. Khuyến nghị Endpoint Backend Đồng bộ

Để hệ thống vận hành trơn tru và đạt độ toàn vẹn 100%, đề xuất Backend hoàn thiện/cung cấp các trường sau:

1. **`GET /orders/:id`**:
   - Trả về trường `earnedPoints: number` (Số điểm tích lũy thực tế mà đơn hàng đem lại sau khi thanh toán thành công).
2. **`GET /orders/history` hoặc `GET /orders/:id`**:
   - Trả về danh sách `reviewedProductIds: number[]` để frontend khóa các món khách hàng đã gửi đánh giá trước đó.
3. **`GET /products/:id` & `POST /orders`**:
   - Trả về danh sách `variants: ChiTietSanPham[]` đại diện cho các tổ hợp kích cỡ và topping có giá riêng biệt.
4. **`POST /orders/:id/cancel`**:
   - Cho phép khách hàng hủy đơn `PENDING` khi muốn đổi phương thức thanh toán hoặc sửa giỏ hàng.
