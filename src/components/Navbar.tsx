'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Database, Users, LogOut, Layers, KeyRound, Menu, X } from 'lucide-react';
import GoldLogo from './GoldLogo';

interface NavbarProps {
  onOpenAccountsModal: () => void;
  onOpenTablesModal: () => void;
  onOpenChangePasswordModal: () => void;
}

export default function Navbar({
  onOpenAccountsModal,
  onOpenTablesModal,
  onOpenChangePasswordModal,
}: NavbarProps) {
  const { user, tables, selectedTable, setSelectedTable, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-neutral-950/95 text-white shadow-2xl border-b border-amber-600/30 sticky top-0 z-40 backdrop-blur-xl">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <GoldLogo size="md" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent whitespace-nowrap leading-tight">
                <span className="sm:hidden">QUẢN TRỊ VÀNG</span>
                <span className="hidden sm:inline">QUẢN TRỊ GIAO DỊCH VÀNG</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-amber-300/70 font-medium whitespace-nowrap leading-tight mt-0.5 hidden md:block">
                Hệ thống báo cáo & kiểm soát dữ liệu
              </p>
            </div>
          </div>

          {/* Center / Right: Table Selector + Controls */}
          <div className="flex items-center gap-2 shrink min-w-0 ml-auto">
            {/* Table Selector Pill */}
            <div className="flex items-center gap-1.5 bg-neutral-900/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-amber-500/30 shrink max-w-[170px] sm:max-w-[240px] md:max-w-[280px]">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label htmlFor="tableSelect" className="text-xs text-neutral-300 whitespace-nowrap hidden xl:inline">
                Bảng:
              </label>
              <select
                id="tableSelect"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-transparent text-amber-300 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer w-full truncate pr-1"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.name} className="bg-neutral-900 text-white">
                    {t.display_name || t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop-only Controls (Hidden on Mobile) */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Admin Buttons */}
              {user?.role === 'admin' && (
                <div className="flex items-center gap-2 border-l border-neutral-800 pl-3">
                  <button
                    onClick={onOpenTablesModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 border border-neutral-700 hover:border-amber-500/40 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    title="Quản lý danh sách bảng dữ liệu"
                  >
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quản lý Bảng</span>
                  </button>
                  <button
                    onClick={onOpenAccountsModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 border border-neutral-700 hover:border-amber-500/40 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    title="Quản lý tài khoản & phân quyền truy cập"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tài khoản & Quyền</span>
                  </button>
                </div>
              )}

              {/* User profile & actions */}
              <div className="flex items-center gap-2.5 border-l border-neutral-800 pl-3">
                <div className="text-right whitespace-nowrap leading-tight">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs sm:text-sm font-semibold text-neutral-200 whitespace-nowrap">
                      {user?.full_name || user?.username}
                    </span>
                    {user?.role === 'admin' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        USER
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">@{user?.username}</div>
                </div>

                <button
                  onClick={onOpenChangePasswordModal}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 border border-neutral-700 hover:border-amber-500/40 transition-all cursor-pointer"
                  title="Đổi mật khẩu"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-800/40 transition-all cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Hamburger Button (Hidden on Desktop) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-neutral-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-amber-500/20 bg-neutral-950/98 px-4 py-3.5 space-y-3 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-150">
          {/* User Info Card on Mobile */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-neutral-900 to-amber-950/40 border border-amber-500/20">
            <div>
              <div className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <span>{user?.full_name || user?.username}</span>
                {user?.role === 'admin' ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    ADMIN
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    USER
                  </span>
                )}
              </div>
              <div className="text-[11px] text-amber-300/70 font-mono mt-0.5">@{user?.username}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenChangePasswordModal();
                }}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 transition-colors"
                title="Đổi mật khẩu"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/40 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Management Section for Mobile */}
          {user?.role === 'admin' && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                Quản trị hệ thống
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTablesModal();
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Quản lý Bảng</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAccountsModal();
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Tài khoản & Quyền</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
