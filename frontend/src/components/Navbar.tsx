'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingBag, User, LogOut, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { getTotalCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalCount() : 0;

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'STAFF':
        return 'Barista quầy';
      case 'CUSTOMER':
      default:
        return 'Khách hàng';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-espresso text-espresso-text border-b border-espresso-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo Wordmark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-espresso-text hover:text-white transition-colors">
            BrewLite
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-body">
            <Link
              href="/"
              className={`transition-colors py-1 ${
                pathname === '/'
                  ? 'text-white border-b-2 border-accent font-medium'
                  : 'text-espresso-muted hover:text-white'
              }`}
            >
              Thực đơn
            </Link>

            {mounted && user?.role === 'CUSTOMER' && (
              <Link
                href="/orders/history"
                className={`transition-colors py-1 ${
                  pathname === '/orders/history'
                    ? 'text-white border-b-2 border-accent font-medium'
                    : 'text-espresso-muted hover:text-white'
                }`}
              >
                Lịch sử đơn
              </Link>
            )}

            {mounted && (user?.role === 'STAFF' || user?.role === 'ADMIN') && (
              <Link
                href="/staff"
                className={`transition-colors py-1 ${
                  pathname === '/staff'
                    ? 'text-white border-b-2 border-accent font-medium'
                    : 'text-espresso-muted hover:text-white'
                }`}
              >
                Quầy Barista
              </Link>
            )}

            {mounted && user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`transition-colors py-1 ${
                  pathname === '/admin'
                    ? 'text-white border-b-2 border-accent font-medium'
                    : 'text-espresso-muted hover:text-white'
                }`}
              >
                Quản trị Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: Cart + Account + Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 text-espresso-muted hover:text-white rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Giỏ hàng, có ${totalItems} món`}
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-on-accent text-[10px] font-semibold flex items-center justify-center tabular-nums">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Account status */}
          {mounted && user ? (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-espresso-line text-xs">
              <div className="text-right">
                <span className="text-espresso-text font-medium block">
                  {user.fullName || user.username}
                  {user.role === 'CUSTOMER' && (
                    <span className="text-espresso-muted font-normal ml-1">
                      · {user.loyaltyPoints || 0} điểm
                    </span>
                  )}
                </span>
                <span className="text-espresso-muted text-[11px]">
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="p-1.5 text-espresso-muted hover:text-white rounded transition-colors"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-espresso-line text-espresso-text hover:bg-espresso-line transition-colors"
            >
              <User className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Đăng nhập</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-espresso-muted hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Mở menu điều hướng"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-espresso-deep border-t border-espresso-line px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded transition-colors ${
                pathname === '/' ? 'bg-espresso-line text-white font-medium' : 'text-espresso-muted'
              }`}
            >
              Thực đơn
            </Link>
            {mounted && user?.role === 'CUSTOMER' && (
              <Link
                href="/orders/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded transition-colors ${
                  pathname === '/orders/history' ? 'bg-espresso-line text-white font-medium' : 'text-espresso-muted'
                }`}
              >
                Lịch sử đơn
              </Link>
            )}
            {mounted && (user?.role === 'STAFF' || user?.role === 'ADMIN') && (
              <Link
                href="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded transition-colors ${
                  pathname === '/staff' ? 'bg-espresso-line text-white font-medium' : 'text-espresso-muted'
                }`}
              >
                Quầy Barista
              </Link>
            )}
            {mounted && user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded transition-colors ${
                  pathname === '/admin' ? 'bg-espresso-line text-white font-medium' : 'text-espresso-muted'
                }`}
              >
                Quản trị Admin
              </Link>
            )}
          </nav>

          {/* Mobile Auth row */}
          <div className="pt-3 border-t border-espresso-line flex items-center justify-between">
            {mounted && user ? (
              <>
                <div className="text-xs text-espresso-text">
                  <p className="font-medium">{user.fullName || user.username}</p>
                  <p className="text-espresso-muted">
                    {getRoleLabel(user.role)} {user.role === 'CUSTOMER' && `· ${user.loyaltyPoints || 0} điểm`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    router.push('/');
                  }}
                  className="text-xs px-3 py-1.5 rounded border border-espresso-line text-espresso-muted hover:text-white"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-medium rounded bg-accent text-on-accent"
              >
                Đăng nhập tài khoản
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
