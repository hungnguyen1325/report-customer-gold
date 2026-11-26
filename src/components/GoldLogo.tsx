'use client';

import React from 'react';

interface GoldLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'bars' | 'diamond' | 'bullion';
}

/**
 * Logo Vàng thiết kế phẳng (Flat Design)
 * Đơn giản, hiện đại, sắc nét ở mọi kích thước, chuẩn nhận diện tiệm vàng cao cấp.
 */
export default function GoldLogo({ className = '', size = 'md', variant = 'bars' }: GoldLogoProps) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Variant 2: Kim Cương Vàng Đồ Họa Phẳng (Geometric Gold Diamond)
  if (variant === 'diamond') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl p-1.5 bg-neutral-900 border border-amber-500/40 shadow-lg shadow-amber-500/10 ${currentSize} ${className}`}
      >
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="14,14 24,8 34,14 24,17" fill="#FEF9C3" />
          <polygon points="14,14 24,17 8,22" fill="#FDE047" />
          <polygon points="34,14 40,22 24,17" fill="#F59E0B" />
          <polygon points="8,22 24,17 40,22 24,20" fill="#FCD34D" />
          <polygon points="8,22 24,40 18,22" fill="#B45309" />
          <polygon points="18,22 24,40 24,22" fill="#D97706" />
          <polygon points="24,22 24,40 30,22" fill="#F59E0B" />
          <polygon points="30,22 24,40 40,22" fill="#78350F" />
        </svg>
      </div>
    );
  }

  // Variant 3: Thỏi Vàng AU 999.9 Phẳng (Minimalist Bullion Hallmark)
  if (variant === 'bullion') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl p-1 bg-neutral-900 border border-amber-500/40 shadow-lg shadow-amber-500/10 ${currentSize} ${className}`}
      >
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="7" y="10" width="34" height="28" rx="5" fill="#1C1917" stroke="#F59E0B" strokeWidth="2.5" />
          <rect x="11" y="14" width="26" height="20" rx="3" fill="#F59E0B" fillOpacity="0.15" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 1" />
          <text x="24" y="24" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.5">AU</text>
          <text x="24" y="31" textAnchor="middle" fill="#F59E0B" fontSize="5.5" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="1">999.9</text>
        </svg>
      </div>
    );
  }

  // Variant 1 (Mặc định): 3 Thỏi Vàng Phẳng Hiện Đại (Flat 3 Gold Bars Stack)
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl p-1.5 bg-neutral-900/90 border border-amber-500/40 shadow-lg shadow-amber-500/10 group ${currentSize} ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full transition-transform duration-200 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Bar (Thỏi vàng trên cùng) */}
        <g>
          {/* Mặt trên */}
          <path d="M16 11h16l2.5 6h-21l2.5-6z" fill="#FEF08A" />
          {/* Mặt trước */}
          <path d="M13.5 17h21l2 6h-25l2-6z" fill="#F59E0B" />
          {/* Vát cạnh bên */}
          <path d="M32 11l2.5 6 2 6h-1.5l-1.8-6-1.2-6z" fill="#D97706" opacity="0.7" />
        </g>

        {/* Bottom Left Bar (Thỏi vàng dưới bên trái) */}
        <g>
          <path d="M6 25h16l2.5 6h-21l2.5-6z" fill="#FEF08A" />
          <path d="M3.5 31h21l2 6h-25l2-6z" fill="#F59E0B" />
          <path d="M22 25l2.5 6 2 6h-1.5l-1.8-6-1.2-6z" fill="#D97706" opacity="0.7" />
        </g>

        {/* Bottom Right Bar (Thỏi vàng dưới bên phải) */}
        <g>
          <path d="M26 25h16l2.5 6h-21l2.5-6z" fill="#FEF08A" />
          <path d="M23.5 31h21l2 6h-25l2-6z" fill="#F59E0B" />
          <path d="M42 25l2.5 6 2 6h-1.5l-1.8-6-1.2-6z" fill="#D97706" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
