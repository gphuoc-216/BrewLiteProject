'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingBag, Coffee, User as UserIcon, LogOut, Shield, ChefHat, History, Award } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getTotalCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalCount() : 0;

  return (
    <header className="sticky top-0 z-50 bg-[#faf6f0]/95 backdrop-blur-md border-b border-coffee-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coffee-700 to-coffee-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-coffee-900">BrewLite</span>
            <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-coffee-200 text-coffee-800">
              Cashless
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-coffee-700">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === '/' ? 'bg-coffee-200 text-coffee-950 font-semibold' : 'hover:bg-coffee-100'
            }`}
          >
            Thực đơn
          </Link>

          {mounted && user?.role === 'CUSTOMER' && (
            <Link
              href="/orders/history"
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname === '/orders/history' ? 'bg-coffee-200 text-coffee-950 font-semibold' : 'hover:bg-coffee-100'
              }`}
            >
              <History className="w-4 h-4" />
              Lịch sử đơn
            </Link>
          )}

          {mounted && (user?.role === 'STAFF' || user?.role === 'ADMIN') && (
            <Link
              href="/staff"
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname === '/staff' ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300' : 'hover:bg-coffee-100'
              }`}
            >
              <ChefHat className="w-4 h-4 text-amber-700" />
              Quầy Barista
            </Link>
          )}

          {mounted && user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname === '/admin' ? 'bg-rose-100 text-rose-900 font-semibold border border-rose-300' : 'hover:bg-coffee-100'
              }`}
            >
              <Shield className="w-4 h-4 text-rose-700" />
              Quản trị Admin
            </Link>
          )}
        </nav>

        {/* Action Buttons: Cart & Auth */}
        <div className="flex items-center gap-3">
          {/* Cart Badge Button */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-coffee-200 shadow-sm hover:border-coffee-400 transition-all text-coffee-900 hover:scale-105"
            title="Xem giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5 text-coffee-800" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-coffee-700 text-white text-xs font-bold flex items-center justify-center animate-bounce shadow">
                {totalItems}
              </span>
            )}
          </Link>

          {/* User Status / Login */}
          {mounted && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-coffee-200">
              {user.role === 'CUSTOMER' && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{user.loyaltyPoints || 0} xu</span>
                </div>
              )}

              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-coffee-900 truncate max-w-[110px]">{user.fullName || user.username}</div>
                <div className="text-[10px] text-coffee-600 font-medium tracking-wide uppercase">{user.role}</div>
              </div>

              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="w-10 h-10 rounded-xl bg-coffee-100 hover:bg-red-50 hover:text-red-600 text-coffee-700 flex items-center justify-center transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coffee-800 hover:bg-coffee-900 text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
            >
              <UserIcon className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
