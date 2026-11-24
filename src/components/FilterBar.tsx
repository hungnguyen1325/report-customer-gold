'use client';

import React from 'react';
import { Search, Calendar, Filter, RotateCcw, FileSpreadsheet, Upload, History, X } from 'lucide-react';

interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  kieuCt: string;
  setKieuCt: (v: string) => void;
  khoName: string;
  setKhoName: (v: string) => void;
  maQuay: string;
  setMaQuay: (v: string) => void;
  bpkdName?: string;
  setBpkdName?: (v: string) => void;
  kieuCtOptions: string[];
  khoOptions: string[];
  quayOptions: string[];
  bpkdOptions?: string[];
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onExportExcel: () => void;
  loadingExport?: boolean;
  onImportExcel?: () => void;
}

export default function FilterBar({
  search,
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  kieuCt,
  setKieuCt,
  khoName,
  setKhoName,
  maQuay,
  setMaQuay,
  bpkdName = '',
  setBpkdName,
  kieuCtOptions,
  khoOptions,
  quayOptions,
  bpkdOptions = [],
  onApplyFilters,
  onResetFilters,
  onExportExcel,
  loadingExport,
  onImportExcel,
}: FilterBarProps) {
  // Helper to format local date without UTC shifts
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const todayStr = formatLocalDate(now);
  const prior7Str = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
  const month1Str = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));

  // Quick date presets
  const setQuickDate = (type: 'today' | '7days' | 'month' | 'all') => {
    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7days') {
      setStartDate(prior7Str);
      setEndDate(todayStr);
    } else if (type === 'month') {
      setStartDate(month1Str);
      setEndDate(todayStr);
    } else if (type === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="bg-neutral-900/90 rounded-2xl p-5 border border-amber-500/20 shadow-xl mb-6 backdrop-blur-md">
      {/* Top row: Search, Quick Dates, Action buttons */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <input
            type="text"
            placeholder="Tìm theo số chứng từ, tên khách hàng, SĐT, CCCD, tên vàng, mã vật tư..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
            className="w-full pl-10 pr-10 py-2.5 bg-neutral-800 text-neutral-100 placeholder-neutral-400 text-sm rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-400 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              title="Xóa từ khóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => setQuickDate('all')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-all cursor-pointer whitespace-nowrap"
            title="Xem tất cả lịch sử không giới hạn ngày"
          >
            Tất cả thời gian
          </button>
          <button
            type="button"
            onClick={() => setQuickDate('today')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-all cursor-pointer whitespace-nowrap"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setQuickDate('7days')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-all cursor-pointer whitespace-nowrap"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setQuickDate('month')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-all cursor-pointer whitespace-nowrap"
          >
            Tháng này
          </button>
        </div>

        {/* Action Buttons: Import & Export Excel */}
        <div className="flex items-center gap-2">
          {onImportExcel && (
            <button
              type="button"
              onClick={onImportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Nhập Excel</span>
            </button>
          )}
          <button
            onClick={onExportExcel}
            disabled={loadingExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{loadingExport ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>
        </div>
      </div>

      {/* Helpful banner: 1-click search all history without date bounds */}
      {search.trim() && (startDate || endDate) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Đang lọc theo ngày ({startDate || '...'} ~ {endDate || '...'}). Muốn tìm khách hàng này trong <strong>toàn bộ lịch sử</strong>?
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all cursor-pointer whitespace-nowrap shadow-md shadow-amber-500/20"
          >
            Xem toàn bộ lịch sử (Bỏ lọc ngày)
          </button>
        </div>
      )}

      {/* Second row: Detailed Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 pt-3 border-t border-neutral-800">
        {/* Từ ngày */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-neutral-400">
              Từ ngày
            </label>
            {startDate && (
              <button
                type="button"
                onClick={() => setStartDate('')}
                className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="Bỏ lọc ngày bắt đầu"
              >
                Xóa ngày
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 text-xs rounded-lg border border-neutral-700 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Đến ngày */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-neutral-400">
              Đến ngày
            </label>
            {endDate && (
              <button
                type="button"
                onClick={() => setEndDate('')}
                className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="Bỏ lọc ngày kết thúc"
              >
                Xóa ngày
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 text-xs rounded-lg border border-neutral-700 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Kiểu chứng từ */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
            Kiểu chứng từ
          </label>
          <select
            value={kieuCt}
            onChange={(e) => setKieuCt(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 text-xs rounded-lg border border-neutral-700 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">-- Tất cả kiểu --</option>
            {kieuCtOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Kho hàng */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
            Kho hàng / Chi nhánh
          </label>
          <select
            value={khoName}
            onChange={(e) => setKhoName(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 text-xs rounded-lg border border-neutral-700 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">-- Tất cả kho --</option>
            {khoOptions.map((kho) => (
              <option key={kho} value={kho}>
                {kho}
              </option>
            ))}
          </select>
        </div>

        {/* Mã quầy */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
            Quầy giao dịch
          </label>
          <select
            value={maQuay}
            onChange={(e) => setMaQuay(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 text-xs rounded-lg border border-neutral-700 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">-- Tất cả quầy --</option>
            {quayOptions.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        {/* Nhân viên */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
            Nhân viên
          </label>
          <select
            value={bpkdName}
            onChange={(e) => setBpkdName && setBpkdName(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 text-xs rounded-lg border border-neutral-700 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">-- Tất cả nhân viên --</option>
            {bpkdOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Apply & Reset Buttons */}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onApplyFilters}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc</span>
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            className="py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-all cursor-pointer"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
