import React from 'react';
import Link from 'next/link';
import { Coffee, ShieldCheck, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-coffee-900 text-coffee-200 border-t border-coffee-800 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-coffee-700 flex items-center justify-center text-white">
                <Coffee className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white">BrewLite Coffee</span>
            </div>
            <p className="text-sm text-coffee-300 max-w-sm leading-relaxed">
              Chuỗi cà phê chất lượng cao với hệ thống đặt món và thanh toán không dùng tiền mặt hiện đại. Trải nghiệm nhanh chóng, tiện lợi và tích điểm đổi quà thành viên.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Giao dịch trực tuyến được mã hóa an toàn 100%</span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Dịch vụ & Khám phá</h4>
            <ul className="space-y-2 text-sm text-coffee-300">
              <li><Link href="/" className="hover:text-white transition-colors">Thực đơn đồ uống</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Giỏ hàng của bạn</Link></li>
              <li><Link href="/orders/history" className="hover:text-white transition-colors">Theo dõi đơn hàng</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Cổng thành viên</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Chăm sóc khách hàng</h4>
            <ul className="space-y-2 text-xs text-coffee-300">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Hotline: 1900 8888 (Miễn phí)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>support@brewlite.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Phục vụ: 07:00 - 22:30 mỗi ngày</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-coffee-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-coffee-400 gap-4">
          <p>© 2026 BrewLite Coffee Chain. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-coffee-400">
            <span>Chính sách bảo mật</span>
            <span>•</span>
            <span>Điều khoản sử dụng</span>
            <span>•</span>
            <span>Chuỗi cửa hàng toàn quốc</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
