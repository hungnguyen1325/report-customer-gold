import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: {
    default: 'Hệ Thống Quản Trị & Báo Cáo Giao Dịch Vàng',
    template: '%s | Quản Trị Giao Dịch Vàng',
  },
  description: 'Hệ thống chuyên sâu phục vụ quản trị, kiểm soát và tổng hợp báo cáo dữ liệu giao dịch tiệm vàng, đá quý chuyên nghiệp.',
  applicationName: 'Hệ Thống Quản Trị Giao Dịch Vàng',
  keywords: [
    'quản trị tiệm vàng',
    'báo cáo giao dịch vàng',
    'tiệm vàng',
    'vàng bạc đá quý',
    'thống kê kpi tiệm vàng',
    'xuất báo cáo excel',
    'báo cáo tài chính vàng',
  ],
  authors: [{ name: 'Quản trị viên Hệ thống' }],
  creator: 'Vàng Bạc Đá Quý',
  publisher: 'Hệ Thống Báo Cáo Vàng',
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/icon.svg?v=2'],
  },
  openGraph: {
    title: 'Hệ Thống Quản Trị & Báo Cáo Giao Dịch Vàng',
    description: 'Hệ thống chuyên sâu phục vụ quản trị, kiểm soát và tổng hợp báo cáo dữ liệu giao dịch tiệm vàng, đá quý chuyên nghiệp.',
    url: '/',
    siteName: 'Hệ Thống Quản Trị Giao Dịch Vàng',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'Logo Vàng 999.9',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Hệ Thống Quản Trị & Báo Cáo Giao Dịch Vàng',
    description: 'Hệ thống quản trị và kiểm soát báo cáo giao dịch vàng chuyên nghiệp',
    images: ['/icon.svg'],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full bg-neutral-950 text-neutral-100 antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
