# CHANGELOG - BrewLite Platform

## [Unreleased] - 2026-10-22

### Added
- MBBank Cross-Device Realtime Auto-Confirmation: money deducted in phone app triggers instant auto-payment on PC screen without any manual buttons.
- Real-time inventory out-of-stock calculation: Backend evaluates variant recipes against ingredient stock quantity in real-time (`isOutOfStock` for variants and products).
- Frontend out-of-stock indicators: Home/Menu cards display `⛔ Tạm hết hàng` badge and disabled `Hết` buttons; Quick select modal and Product detail page disable out-of-stock sizes and show alert warnings with disabled CTA buttons.
