import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng Nhập Hệ Thống',
  description: 'Đăng nhập vào Hệ thống Quản trị & Báo cáo Giao dịch Vàng',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
