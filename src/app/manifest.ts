import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hệ Thống Quản Trị & Báo Cáo Giao Dịch Vàng',
    short_name: 'Quản Trị Vàng',
    description: 'Hệ thống kiểm soát và tổng hợp báo cáo dữ liệu giao dịch tiệm vàng',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
