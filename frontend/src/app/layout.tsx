import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const viewport: Viewport = {
  themeColor: 'rgb(43, 33, 26)',
};

export const metadata: Metadata = {
  title: 'BrewLite — Quầy Cà Phê Thủ Công Không Tiền Mặt',
  description: 'Gọi trước, nhận nhanh ở quầy. Trải nghiệm đặt cà phê không tiền mặt tiện lợi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lora:ital,wght@0,500;0,600;0,700;1,500;1,600&subset=vietnamese&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-ink font-body antialiased">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
