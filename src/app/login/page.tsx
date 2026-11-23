'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import GoldLogo from '@/components/GoldLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      login(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-neutral-900/90 border border-amber-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <GoldLogo size="xl" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            QUẢN TRỊ GIAO DỊCH VÀNG
          </h1>
          <p className="text-xs text-amber-300/70 mt-1 font-medium">
            Hệ thống báo cáo & kiểm soát dữ liệu
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/90 text-neutral-100 text-sm rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-400 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/90 text-neutral-100 text-sm rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-400 transition-all"
                required
              />
            </div>
          </div>

          <div></div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-neutral-800/80 text-center text-[11px] text-neutral-500">
          Hệ thống bảo mật dữ liệu giao dịch tiệm vàng & doanh nghiệp
        </div>
      </div>
    </div>
  );
}
