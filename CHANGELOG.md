# CHANGELOG - BrewLite Platform

## [Unreleased] - 2026-11-14

### Fixed
- **Payment Transaction Rollback, Gateway Timeout & Cross-Customer Replay (`backend/src/modules/payment/payment.service.ts`, `backend/src/prisma/fallback-store.ts`)**:
  - Executed OCC inventory deduction (Step 11) before `MockGatewayService.processCharge` (Step 12) for both normal and `simulateError` (`FAIL`/`TIMEOUT`) flows so failed charges roll back deducted stock cleanly and persist `OrderStatus.PAYMENT_FAILED` + `OrderStatusHistory` via `recordPaymentFailure` before throwing the HTTP error.
  - Preserved `HttpException` subclasses (including `408 RequestTimeoutException` on `TIMEOUT`) instead of falling back to `fallbackStore`, recorded accurate `fromStatus` in `fallbackStore.processPayment`, and guarded `Idempotency-Key` replay against cross-customer access (`403 ForbiddenException`).
- **Loyalty Points, DTO Docs, Reviews & Toppings Sync**:
  - Aligned loyalty points earning formula in `frontend/src/app/checkout/page.tsx` (`Math.floor(finalTotal / 10000)` instead of `5%`), updated loyalty copy in `frontend/src/app/cart/page.tsx`, `frontend/src/components/ProductQuickSelectModal.tsx`, and `frontend/src/app/products/[id]/page.tsx` (`+1 điểm / 10.000đ`), and aligned `CreateOrderDto.loyaltyPointsToUse` description (`1 điểm = 100 VNĐ`).
  - Included `reviews: true` in `OrdersService.getOrderById` (`backend/src/modules/orders/orders.service.ts`), updated `frontend/src/app/orders/[id]/page.tsx` to reuse `PATCH /reviews/:id` for already-reviewed items and show `PENDING, PAYMENT_FAILED hoặc PAID` in the cancel modal.
  - Added `fetchToppingsCatalog()` in `frontend/src/lib/toppings.ts` wired into `ProductQuickSelectModal.tsx` and `frontend/src/app/products/[id]/page.tsx` so `GET /products/toppings` syncs topping prices/descriptions with safe fallback to `ALL_TOPPINGS`.
- **Activity & Sequence Diagram Code Alignment (`docs/BrewLite_Activity_Diagram_EndToEnd.drawio`, `docs/BrewLite_Sequence_Diagram_Order_Payment.drawio`)**:
  - Updated Activity Diagram (`c62`, `c78`, cancellation flows, rollback/retry separation) and Sequence Diagram (full `[TH 1]`/`[TH 2]`/`[TH 3]` flows, `409`/`400`/`408` HTTP codes instead of `402`, rollback + `order.update(PAYMENT_FAILED)` without fake `payment.create(FAILED)`, `Roles(CUSTOMER)`, loyalty deduction, and `promotion.update(+usedCount)`).

### Changed
- **Strict RBAC Role Separation (`/staff` & Customer Orders/Payments/Reviews)**:
  - Restricted `StaffController` endpoints (`/api/staff/*`), the `/staff` Kanban UI route (`useRequireRole(['STAFF'])`), and the Navbar `"Quầy Barista"` navigation links strictly to `STAFF` (Barista) instead of allowing `ADMIN` access; implemented `UC-26` (Xem công thức pha chế) in `frontend/src/app/staff/page.tsx`.
  - Restricted `OrdersController` (`/api/orders/*`), `PaymentController.pay` (`POST /api/payments`), and `ReviewsController` (`/api/reviews/*`) strictly to `Role.CUSTOMER` using `RolesGuard` + `@Roles(Role.CUSTOMER)`, synced service-level ownership/role checks, and guarded Customer-only UI routes (`/checkout`, `/orders/me`, `/orders/[id]`, `/cart`, Navbar Cart) against non-`CUSTOMER` roles.
- **Documentation & Spec Sync**: Updated `/api/staff/orders` (`Staff`) and Customer order/cancel permissions in `docs/01-analysis-spec.md`.

### Added
- Unit tests covering RBAC guards, loyalty/order/payment rollback, gateway timeout/rejection, and cross-customer replay (`backend/src/modules/staff/staff.controller.spec.ts`, `orders.controller.spec.ts`, `payment.controller.spec.ts`, `reviews.controller.spec.ts`, `payment.service.spec.ts`, `orders.service.spec.ts`).

## [Unreleased] - 2026-10-22

### Added
- MBBank Cross-Device Realtime Auto-Confirmation: money deducted in phone app triggers instant auto-payment on PC screen without any manual buttons.
- Real-time inventory out-of-stock calculation: Backend evaluates variant recipes against ingredient stock quantity in real-time (`isOutOfStock` for variants and products).
- Frontend out-of-stock indicators: Home/Menu cards display `⛔ Tạm hết hàng` badge and disabled `Hết` buttons; Quick select modal and Product detail page disable out-of-stock sizes and show alert warnings with disabled CTA buttons.
