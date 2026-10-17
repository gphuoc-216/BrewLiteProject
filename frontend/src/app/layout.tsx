import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'BrewLite — Đặt Cà Phê Không Tiền Mặt',
  description: 'Ứng dụng gọi món và thanh toán cà phê tiện lợi không dùng tiền mặt, giảm thời gian xếp hàng.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#faf6f0] text-coffee-950 antialiased selection:bg-coffee-300">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
