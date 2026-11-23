'use client';

import React from 'react';
import { TransactionRecord } from '@/lib/types';
import { X, Printer, Coins, User, Calendar, MapPin, CreditCard, DollarSign, Package } from 'lucide-react';

interface TransactionDetailModalProps {
  record: TransactionRecord | null;
  onClose: () => void;
}

export default function TransactionDetailModal({ record, onClose }: TransactionDetailModalProps) {
  if (!record) return null;

  const formatMoney = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatWeight = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return '0.000';
    return Number(val).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden my-8 text-neutral-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 px-6 py-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300">CHI TIẾT PHIẾU GIAO DỊCH VÀNG</h2>
              <p className="text-xs text-neutral-400 font-mono">
                Mã: {record.stt_rec?.trim()} (Dòng: {record.stt_rec0} | Loại CT: {record.FK_CtID})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Section 1: Customer Information */}
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
              <User className="w-4 h-4" />
              <span>THÔNG TIN KHÁCH HÀNG & CHỨNG TỪ</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-neutral-300">
              <div>
                <span className="text-neutral-500">Tên khách hàng:</span>{' '}
                <strong className="text-white">{record.DoiTacName || 'Khách lẻ'}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Số điện thoại:</span>{' '}
                <span className="font-mono">{record.DoiTacTel || 'Chưa cập nhật'}</span>
              </div>
              <div>
                <span className="text-neutral-500">CCCD / CMND:</span>{' '}
                <span className="font-mono">{record.DoiTacCCCD || 'Chưa cập nhật'}</span>
              </div>
              <div>
                <span className="text-neutral-500">Mã đối tác:</span>{' '}
                <span className="font-mono">{record.FK_DoitacID || '--'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-neutral-500">Địa chỉ:</span>{' '}
                <span>{record.DoiTacAdd || 'Chưa cập nhật'}</span>
              </div>
              <div>
                <span className="text-neutral-500">Số chứng từ:</span>{' '}
                <strong className="text-amber-300 font-mono">{record.So_ct || '--'}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Kiểu chứng từ:</span>{' '}
                <span className="font-semibold text-neutral-200">{record.KieuCt || '--'}</span>
              </div>
              <div>
                <span className="text-neutral-500">Ngày chứng từ:</span>{' '}
                <span>
                  {record.Ngay_ct ? new Date(record.Ngay_ct).toLocaleDateString('vi-VN') : '--'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Thời gian tạo:</span>{' '}
                <span>
                  {record.datetime0 ? new Date(record.datetime0).toLocaleString('vi-VN') : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Gold & Item Specification */}
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
              <Package className="w-4 h-4" />
              <span>CHI TIẾT VÀNG & SẢN PHẨM</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-neutral-300">
              <div className="sm:col-span-2">
                <span className="text-neutral-500 block text-xs">Tên sản phẩm / Vàng</span>
                <span className="font-bold text-amber-300 text-sm sm:text-base">
                  {record.VtName || '--'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-xs">Mã hàng (Code)</span>
                <span className="font-mono font-medium">{record.code || '--'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-xs">Mã vật tư</span>
                <span className="font-mono font-medium">{record.FK_VtID || '--'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-xs">Hàm lượng (%)</span>
                <span className="font-mono font-bold text-amber-400">
                  {record.Hlg_au || 0}% {record.Hlg_auK ? `(${record.Hlg_auK})` : ''}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-xs">Số lượng</span>
                <span className="font-mono font-bold">{record.so_luong || 1}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-xs">Tổng trọng lượng</span>
                <span className="font-mono font-bold text-white">
                  {formatWeight(record.Tong_tlg)} chỉ
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-xs">TL Vàng nguyên chất</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatWeight(record.Tlg_au)} chỉ
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Settlement */}
          <div className="bg-gradient-to-br from-neutral-950 to-amber-950/40 p-4 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
              <DollarSign className="w-4 h-4" />
              <span>THANH TOÁN & TÀI CHÍNH</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-neutral-300">
              <div>
                <span className="text-neutral-500 block text-xs">Đơn giá vàng</span>
                <span className="font-mono font-semibold text-neutral-200">
                  {formatMoney(record.gia_au)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-xs">Tiền công chế tác</span>
                <span className="font-mono font-semibold text-neutral-200">
                  {formatMoney(record.Tien_cong)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-xs">Tiền đá đính kèm</span>
                <span className="font-mono font-semibold text-neutral-200">
                  {formatMoney(record.Tien_da)}
                </span>
              </div>
              <div className="bg-amber-950/50 p-2 rounded-lg border border-amber-500/40">
                <span className="text-amber-400 block text-xs font-bold">TỔNG THÀNH TIỀN</span>
                <span className="font-mono font-bold text-base sm:text-lg text-amber-300">
                  {formatMoney(record.tien)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Store, Counter & System Logs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-1.5 text-neutral-400">
              <div className="text-amber-300 font-semibold mb-1">Cửa hàng & Quầy</div>
              <div>Kho / Chi nhánh: <strong className="text-neutral-200">{record.KhoName || '--'}</strong></div>
              <div>Mã quầy: <strong className="text-neutral-200">{record.maQuay || '--'}</strong></div>
              <div>Bộ phận kinh doanh: <strong className="text-neutral-200">{record.BpkdName || '--'}</strong></div>
              <div>Tài khoản kế toán: <strong className="text-neutral-200">{record.TkName || record.FK_TkID || '--'}</strong></div>
            </div>

            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-1.5 text-neutral-400">
              <div className="text-amber-300 font-semibold mb-1">Kiểm toán & Trạng thái</div>
              <div>Trạng thái: <span className="text-emerald-400 font-semibold">{record.status || 'Hoàn tất'}</span></div>
              <div>Nhân viên lập: <strong className="text-neutral-200">{record.user_id0 || '--'}</strong></div>
              <div>Nhân viên sửa: <strong className="text-neutral-200">{record.user_id2 || '--'}</strong></div>
              <div>Ngày sửa gần nhất: <span>{record.dateEdit ? new Date(record.dateEdit).toLocaleString('vi-VN') : 'Chưa sửa'}</span></div>
            </div>
          </div>

          {record.Dien_giai && (
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 text-xs">
              <span className="text-neutral-400 font-semibold">Ghi chú / Diễn giải:</span>
              <p className="mt-1 text-neutral-200 italic">{record.Dien_giai}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 px-6 py-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
