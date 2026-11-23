'use client';

import React from 'react';
import { TransactionRecord } from '@/lib/types';
import { Eye, Edit3, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText } from 'lucide-react';

interface TransactionTableProps {
  records: TransactionRecord[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onViewDetail: (rec: TransactionRecord) => void;
  onEdit: (rec: TransactionRecord) => void;
  onDelete: (rec: TransactionRecord) => void;
}

export default function TransactionTable({
  records,
  loading,
  page,
  pageSize,
  totalPages,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const formatMoney = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatWeight = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return '0.000';
    return Number(val).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const getKieuCtBadge = (kieu: string | undefined) => {
    if (!kieu) return <span className="text-neutral-500 text-xs">--</span>;
    const upper = kieu.toUpperCase();
    if (upper.includes('BÁN')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {kieu}
        </span>
      );
    }
    if (upper.includes('MUA')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {kieu}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
        {kieu}
      </span>
    );
  };

  return (
    <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-neutral-950/90 text-neutral-300 border-b border-neutral-800 text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Số CT / Ngày</th>
              <th className="py-3 px-4">Loại GD</th>
              <th className="py-3 px-4">Khách hàng</th>
              <th className="py-3 px-4">Tên hàng / Vàng</th>
              <th className="py-3 px-4 text-right">Tổng TL (chỉ)</th>
              <th className="py-3 px-4 text-right">TL Vàng (chỉ)</th>
              <th className="py-3 px-4 text-right">Đơn giá</th>
              <th className="py-3 px-4 text-right">Thành tiền</th>
              <th className="py-3 px-4">Kho / Quầy</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={10} className="py-4 px-4">
                    <div className="h-4 bg-neutral-800 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-10 h-10 text-neutral-600" />
                    <p className="text-sm font-medium">Không tìm thấy bản ghi giao dịch nào</p>
                    <p className="text-xs text-neutral-500">
                      Hãy thử thay đổi điều kiện tìm kiếm hoặc chọn khoảng thời gian khác.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((rec, idx) => {
                const dateStr = rec.Ngay_ct
                  ? new Date(rec.Ngay_ct).toLocaleDateString('vi-VN')
                  : rec.datetime0
                  ? new Date(rec.datetime0).toLocaleDateString('vi-VN')
                  : '--';

                return (
                  <tr
                    key={`${rec.stt_rec}-${rec.stt_rec0 || idx}`}
                    className="hover:bg-neutral-800/50 transition-colors group"
                  >
                    {/* Số CT / Ngày */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-200">
                        {rec.So_ct?.trim() || rec.stt_rec?.trim()}
                      </div>
                      <div className="text-[11px] text-neutral-400">{dateStr}</div>
                    </td>

                    {/* Loại GD */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getKieuCtBadge(rec.KieuCt)}
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-200 truncate max-w-[180px]">
                        {rec.DoiTacName || 'Khách vãng lai'}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                        {rec.DoiTacTel && <span>SĐT: {rec.DoiTacTel}</span>}
                        {rec.DoiTacCCCD && <span>CCCD: {rec.DoiTacCCCD}</span>}
                      </div>
                    </td>

                    {/* Tên hàng / Vàng */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-amber-200/90 truncate max-w-[200px]">
                        {rec.VtName || '--'}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                        {rec.code && <span>Mã: {rec.code}</span>}
                        {rec.Hlg_au !== null && rec.Hlg_au !== undefined && (
                          <span>HL: {rec.Hlg_au}%</span>
                        )}
                        {rec.so_luong !== null && rec.so_luong !== undefined && (
                          <span>SL: {rec.so_luong}</span>
                        )}
                      </div>
                    </td>

                    {/* Tổng TL */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-neutral-300">
                      {formatWeight(rec.Tong_tlg)}
                    </td>

                    {/* TL Vàng */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-amber-400">
                      {formatWeight(rec.Tlg_au)}
                    </td>

                    {/* Đơn giá */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-neutral-300 text-xs">
                      {formatMoney(rec.gia_au)}
                    </td>

                    {/* Thành tiền */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-bold font-mono text-sm ${
                          rec.tien && rec.tien >= 0 ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {formatMoney(rec.tien)}
                      </span>
                      {(rec.Tien_cong || rec.Tien_da) ? (
                        <div className="text-[10px] text-neutral-400">
                          {rec.Tien_cong ? `Công: ${formatMoney(rec.Tien_cong)} ` : ''}
                          {rec.Tien_da ? `Đá: ${formatMoney(rec.Tien_da)}` : ''}
                        </div>
                      ) : null}
                    </td>

                    {/* Kho / Quầy */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-xs text-neutral-300">{rec.KhoName || '--'}</div>
                      <div className="text-[11px] text-neutral-400">{rec.maQuay || '--'}</div>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetail(rec)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                          title="Xem chi tiết phiếu"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(rec)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                          title="Chỉnh sửa giao dịch"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(rec)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/60 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="bg-neutral-950/90 border-t border-neutral-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <span>
            Hiển thị <strong className="text-white">{records.length}</strong> / tổng{' '}
            <strong className="text-amber-400">{totalRecords.toLocaleString('vi-VN')}</strong> bản ghi
          </span>

          <div className="flex items-center gap-1.5">
            <span>Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-neutral-800 text-neutral-200 rounded px-2 py-1 border border-neutral-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Trang đầu"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 bg-neutral-800 font-semibold text-amber-300 rounded border border-neutral-700">
            {page} / {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Trang cuối"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
