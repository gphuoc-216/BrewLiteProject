import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-espresso text-espresso-muted border-t border-espresso-line mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3 md:col-span-2">
            <h3 className="font-display text-xl font-semibold text-espresso-text">BrewLite</h3>
            <p className="text-xs text-espresso-muted max-w-sm leading-relaxed">
              Quầy cà phê thủ công với trải nghiệm gọi món trước và nhận đồ nhanh tại quầy. Thanh toán không tiền mặt qua Ví và Thẻ.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-espresso-text tracking-wider uppercase mb-3">
              Khám phá
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-espresso-text transition-colors">
                  Thực đơn món uống
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-espresso-text transition-colors">
                  Giỏ hàng
                </Link>
              </li>
              <li>
                <Link href="/orders/history" className="hover:text-espresso-text transition-colors">
                  Lịch sử đơn hàng
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-espresso-text tracking-wider uppercase mb-3">
              Thông tin quầy
            </h4>
            <ul className="space-y-1.5 text-xs text-espresso-muted">
              <li>Giờ mở cửa: 07:00 – 22:30 hàng ngày</li>
              <li>Hỗ trợ khách hàng: 1900 8888</li>
              <li>Email: cskh@brewlite.vn</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-espresso-line flex flex-col sm:flex-row items-center justify-between text-xs text-espresso-muted/80 gap-3">
          <p>© 2026 BrewLite Coffee. Quầy cà phê thủ công.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Chính sách bảo mật</span>
            <span>·</span>
            <span>Điều khoản sử dụng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
