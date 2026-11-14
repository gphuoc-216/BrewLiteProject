# CHANGELOG - BrewLite Platform

## [Unreleased] - 2026-11-14

### Changed
- **Strict RBAC Role Separation (`/staff`)**: Restricted `StaffController` endpoints (`/api/staff/*`), the `/staff` Kanban UI route (`useRequireRole(['STAFF'])`), and the Navbar `"Quầy Barista"` navigation links strictly to `STAFF` (Barista) instead of allowing `ADMIN` access.
- **Documentation & Spec Sync**: Updated `/api/staff/orders` actor permission in `docs/01-analysis-spec.md` to require `Staff` only.

### Added
- Unit tests in `backend/src/modules/staff/staff.controller.spec.ts` verifying `StaffController` `@Roles` metadata (`[Role.STAFF]`) and `RolesGuard` enforcement (403 `ForbiddenException` for `ADMIN`, `CUSTOMER`, and unauthenticated callers).

## [Unreleased] - 2026-10-22

### Added
- MBBank Cross-Device Realtime Auto-Confirmation: money deducted in phone app triggers instant auto-payment on PC screen without any manual buttons.
- Real-time inventory out-of-stock calculation: Backend evaluates variant recipes against ingredient stock quantity in real-time (`isOutOfStock` for variants and products).
- Frontend out-of-stock indicators: Home/Menu cards display `⛔ Tạm hết hàng` badge and disabled `Hết` buttons; Quick select modal and Product detail page disable out-of-stock sizes and show alert warnings with disabled CTA buttons.
