# CHANGELOG - BrewLite Platform

## [Unreleased] - 2026-11-15

### Fixed
- **Cancel Pending/Payment-Failed Order Loyalty Points Refund (`backend/src/modules/orders/orders.service.ts`, `orders.service.spec.ts`)**:
  - Recorded `[REDEEMED_POINTS:N]` inside the initial `OrderStatusHistory` `note` on `createOrder` whenever loyalty points are redeemed so `cancelOrder` restores redeemed points on `PENDING`, `PAYMENT_FAILED`, and `PAID` cancellations without schema changes.
  - Added unit test #6 in `orders.service.spec.ts` verifying redeemed loyalty point refund when cancelling an unpaid `PAYMENT_FAILED` order.
- **Checkout Pending Order Lifecycle & Method Switch Safety (`frontend/src/app/checkout/page.tsx`)**:
  - Tracked `pendingOrderId` & `cancellingOrder` state synced with `existingOrderRef.current`, added `handleSelectPaymentMethod(method)` to reset `idempotencyKeyRef.current` & `errorMsg` safely when switching `WALLET` ↔ `CARD` without recreating duplicate orders.
  - Added `handleCancelPendingOrder()` calling `POST /api/orders/:id/cancel` + `/api/payments/mbbank-invalidate/:code` alongside a shared `pendingCancelBanner` across `0đ`, `CARD`, and `WALLET` modes plus missing error alert display in `WALLET` mode.
- **Backend Production Entrypoint & Env Config (`backend/package.json`, `.env.example`)**:
  - Fixed `"start:prod"` from `"node dist/main"` to `"node dist/src/main"` matching NestJS compiler output `backend/dist/src/main.js`, and documented `INTERNAL_BACKEND_URL` in `.env.example`.

### Changed
- **Deployment Diagram Alignment (`docs/BrewLite_Deployment_Diagram.drawio`)**:
  - Updated to a clean monochrome 3D-cube UML Deployment Diagram aligned 100% with Assignment 1 local execution & 3-container Docker Compose on `brewlite_network` (`brewlite_frontend :3000`, `brewlite_backend :3001`, `brewlite_postgres :5432` + `brewlite_postgres_data`), `dist/src/main.js`, all 8 NestJS modules + internal `MockGatewayService`, Next.js rewrites, mobile `/mbbank` QR tunnel demo (`scripts/tunnel.js`), `/api/health`, and `AllExceptionsFilter`.
- **Draw.io UML Alignment (`docs/BrewLite_Activity_Diagram_EndToEnd.drawio`, `docs/BrewLite_Class_Diagram.drawio`, `docs/BrewLite_Sequence_Diagram_Order_Payment.drawio`)**:
  - Synced all 3 Draw.io diagrams to 100% match the Prisma schema (all 17 models, 7 enums, `LoyaltyTransaction «Logical Domain View»`), 2-phase `/checkout` flow (`handlePay`, VietQR `mbbank-check`/`mbbank-invalidate`, `ValidationPipe` 400 checks, in-page cancel), and `/api/*` Activity flow (`isOutOfStock`, `/cart` voucher preview, cancel point refunds, 2s polling).

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
