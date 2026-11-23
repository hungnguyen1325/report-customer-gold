import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Hệ Thống Quản Trị Giao Dịch Vàng | Báo Cáo & Kiểm Soát',
  description: 'Hệ thống quản trị và kiểm soát báo cáo giao dịch vàng chuyên nghiệp',
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
