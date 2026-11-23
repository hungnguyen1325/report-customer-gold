'use client';

import React from 'react';

interface GoldLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'ingot' | 'coin' | 'diamond';
}

export default function GoldLogo({ className = '', size = 'md', variant = 'ingot' }: GoldLogoProps) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === 'coin') {
    // Phong Thủy Kim Tiền Tài Lộc
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl p-1 bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950 border border-amber-500/40 shadow-lg shadow-amber-500/10 ${currentSize} ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="coinGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FCD34D" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="90%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </radialGradient>
            <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="innerCut" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451A03" />
              <stop offset="100%" stopColor="#1C1917" />
            </linearGradient>
          </defs>

          {/* Outer coin border with dots */}
          <circle cx="50" cy="50" r="46" fill="url(#coinGrad)" stroke="url(#rimGrad)" strokeWidth="3" />
          <circle cx="50" cy="50" r="40" stroke="#78350F" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />

          {/* Inner ring */}
          <circle cx="50" cy="50" r="34" stroke="#FDE68A" strokeWidth="1.5" opacity="0.8" />

          {/* Square hole in ancient gold coin */}
          <rect x="36" y="36" width="28" height="28" rx="3" fill="url(#innerCut)" stroke="url(#rimGrad)" strokeWidth="2.5" />

          {/* Auspicious corner floral accents */}
          <circle cx="50" cy="22" r="3" fill="#FFFBEB" />
          <circle cx="50" cy="78" r="3" fill="#B45309" />
          <circle cx="22" cy="50" r="3" fill="#FEF08A" />
          <circle cx="78" cy="50" r="3" fill="#D97706" />

          {/* Top sparkle */}
          <path
            d="M50 8 L52 14 L58 16 L52 18 L50 24 L48 18 L42 16 L48 14 Z"
            fill="#FFFFFF"
            className="animate-pulse"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'diamond') {
    // Kim Cương & Vương Miện Vàng
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl p-1 bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950 border border-amber-500/40 shadow-lg shadow-amber-500/10 ${currentSize} ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldCrown" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="30%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="facetLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="facetDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>

          {/* Diamond silhouette with facets */}
          <polygon points="50,14 78,38 50,86 22,38" fill="url(#facetDark)" stroke="#FDE68A" strokeWidth="2" />
          <polygon points="50,14 78,38 50,44 22,38" fill="url(#goldCrown)" />
          <polygon points="36,14 64,14 50,44" fill="url(#facetLight)" />
          <polygon points="50,44 64,14 78,38" fill="#F59E0B" opacity="0.8" />
          <polygon points="50,44 36,14 22,38" fill="#FDE68A" opacity="0.7" />
          <polygon points="22,38 50,44 50,86" fill="#D97706" />
          <polygon points="78,38 50,44 50,86" fill="#92400E" />

          {/* Inner facet lines */}
          <line x1="50" y1="44" x2="50" y2="86" stroke="#FEF08A" strokeWidth="1.5" opacity="0.7" />
          <line x1="36" y1="62" x2="50" y2="44" stroke="#FBBF24" strokeWidth="1" opacity="0.6" />
          <line x1="64" y1="62" x2="50" y2="44" stroke="#FBBF24" strokeWidth="1" opacity="0.6" />

          {/* Gleam */}
          <path
            d="M32 18 L34 23 L39 25 L34 27 L32 32 L30 27 L25 25 L30 23 Z"
            fill="#FFFFFF"
            className="animate-pulse"
          />
        </svg>
      </div>
    );
  }

  // Default: Thỏi Vàng 999.9 (3D Luxury Gold Bar / Ingot)
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl p-1 bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950 border border-amber-500/40 shadow-lg shadow-amber-500/10 group ${currentSize} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top face brilliant gradient */}
          <linearGradient id="topFaceGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="15%" stopColor="#FEF3C7" />
            <stop offset="45%" stopColor="#FBBF24" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Front face shadow gradient */}
          <linearGradient id="frontFaceGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="40%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Right face deep gold gradient */}
          <linearGradient id="rightFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Gold Bar Rim Reflection */}
          <linearGradient id="goldEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Bottom Shadow */}
          <radialGradient id="dropShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient base glow */}
        <ellipse cx="50" cy="84" rx="42" ry="10" fill="url(#dropShadow)" />

        {/* --- 3D GOLD INGOT BODY --- */}
        {/* Front Face */}
        <polygon
          points="14,64 74,64 66,80 8,80"
          fill="url(#frontFaceGrad)"
          stroke="#78350F"
          strokeWidth="0.8"
        />

        {/* Right Face */}
        <polygon
          points="74,64 92,44 84,60 66,80"
          fill="url(#rightFaceGrad)"
          stroke="#551F03"
          strokeWidth="0.8"
        />

        {/* Top Face (Main visible surface) */}
        <polygon
          points="26,34 84,34 92,44 74,64 14,64 18,44"
          fill="url(#topFaceGrad)"
          stroke="url(#goldEdge)"
          strokeWidth="1.2"
        />

        {/* Beveled Top Inset (Luxury Engraved Plate) */}
        <polygon
          points="28,38 80,38 86,46 70,60 22,60 24,46"
          fill="#FDE68A"
          fillOpacity="0.25"
          stroke="#FEF3C7"
          strokeWidth="0.6"
          strokeDasharray="2 1"
        />

        {/* Engraved "999.9" Hallmark on Ingot Top */}
        <text
          x="48"
          y="52"
          textAnchor="middle"
          fill="#78350F"
          fontSize="8.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
          opacity="0.9"
          transform="skewX(-16)"
        >
          999.9
        </text>
        <text
          x="70"
          y="52"
          textAnchor="middle"
          fill="#92400E"
          fontSize="6"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity="0.85"
          transform="skewX(-16)"
        >
          AU
        </text>

        {/* Metallic Luster Line Highlights */}
        <line x1="26" y1="34" x2="84" y2="34" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <line x1="14" y1="64" x2="74" y2="64" stroke="#FFFBEB" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
        <line x1="74" y1="64" x2="92" y2="44" stroke="#FEF08A" strokeWidth="1" strokeLinecap="round" opacity="0.8" />

        {/* Brilliant Four-point Sparkle Star 1 */}
        <g className="animate-pulse">
          <path
            d="M24 24 L26 30 L32 32 L26 34 L24 40 L22 34 L16 32 L22 30 Z"
            fill="#FFFFFF"
            filter="drop-shadow(0 0 4px #FDE047)"
          />
          <circle cx="24" cy="32" r="1.5" fill="#FFFBEB" />
        </g>

        {/* Sparkling Star 2 */}
        <g>
          <path
            d="M86 28 L87.5 32 L91 33.5 L87.5 35 L86 39 L84.5 35 L81 33.5 L84.5 32 Z"
            fill="#FEF08A"
            filter="drop-shadow(0 0 3px #F59E0B)"
            opacity="0.9"
          />
        </g>
      </svg>
    </div>
  );
}
