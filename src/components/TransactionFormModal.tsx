'use client';

import React, { useState, useEffect } from 'react';
import { TransactionRecord } from '@/lib/types';
import { X, Save, AlertCircle } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: TransactionRecord | null; // null if creating
  tableName: string;
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSuccess,
  record,
  tableName,
}: TransactionFormModalProps) {
  const [formData, setFormData] = useState<Partial<TransactionRecord>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    } else {
      setFormData({
        So_ct: '',
        KieuCt: '',
        KhoName: '',
        maQuay: '',
        VtName: '',
        code: '',
        Hlg_au: undefined,
        Tong_tlg: undefined,
        Tlg_au: undefined,
        gia_au: undefined,
        Tien_cong: undefined,
        Tien_da: undefined,
        tien: undefined,
        so_luong: 1,
        status: '1',
      });
    }
    setError(null);
  }, [record, isOpen]);

  if (!isOpen) return null;

  // Auto calculate total amount
  const handleCalculateTien = (
    gia_au: number | undefined,
    tlg_au: number | undefined,
    tien_cong: number | undefined,
    tien_da: number | undefined
  ) => {
    const gia = Number(gia_au) || 0;
    const tlg = Number(tlg_au) || 0;
    const cong = Number(tien_cong) || 0;
    const da = Number(tien_da) || 0;
    return gia * tlg + cong + da;
  };

  const handleChange = (field: keyof TransactionRecord, val: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      if (['gia_au', 'Tlg_au', 'Tien_cong', 'Tien_da'].includes(field)) {
        next.tien = handleCalculateTien(next.gia_au, next.Tlg_au, next.Tien_cong, next.Tien_da);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (record) {
        // Edit mode
        const res = await fetch(`/api/transactions/${encodeURIComponent(record.stt_rec)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName,
            record: formData,
            stt_rec0: record.stt_rec0,
            FK_CtID: record.FK_CtID,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại');
      } else {
        // Create mode
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName,
            record: formData,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Thêm mới thất bại');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-6 text-neutral-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 px-6 py-4 border-b border-amber-500/30 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-amber-300">
            {record ? 'CHỈNH SỬA GIAO DỊCH VÀNG' : 'THÊM MỚI GIAO DỊCH VÀNG'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Số chứng từ */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Số chứng từ</label>
              <input
                type="text"
                value={formData.So_ct || ''}
                onChange={(e) => handleChange('So_ct', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
                required
              />
            </div>

            {/* Kiểu chứng từ */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Kiểu giao dịch</label>
              <input
                type="text"
                placeholder="VD: KHÁCH BÁN, KHÁCH MUA..."
                value={formData.KieuCt || ''}
                onChange={(e) => handleChange('KieuCt', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Khách hàng */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Tên khách hàng</label>
              <input
                type="text"
                value={formData.DoiTacName || ''}
                onChange={(e) => handleChange('DoiTacName', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* SĐT */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.DoiTacTel || ''}
                onChange={(e) => handleChange('DoiTacTel', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* CCCD */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">CCCD / CMND</label>
              <input
                type="text"
                value={formData.DoiTacCCCD || ''}
                onChange={(e) => handleChange('DoiTacCCCD', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Địa chỉ</label>
              <input
                type="text"
                value={formData.DoiTacAdd || ''}
                onChange={(e) => handleChange('DoiTacAdd', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tên sản phẩm / Vàng */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">Tên loại vàng / Sản phẩm</label>
              <input
                type="text"
                value={formData.VtName || ''}
                onChange={(e) => handleChange('VtName', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-amber-200 font-semibold focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Mã vật tư */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Mã hàng (Code)</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Hàm lượng (%) */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Hàm lượng (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.Hlg_au || ''}
                onChange={(e) => handleChange('Hlg_au', Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Tổng trọng lượng */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Tổng TL (chỉ)</label>
              <input
                type="number"
                step="0.001"
                value={formData.Tong_tlg !== undefined ? formData.Tong_tlg : ''}
                onChange={(e) => handleChange('Tong_tlg', Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* TL Vàng */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">TL Vàng (chỉ)</label>
              <input
                type="number"
                step="0.001"
                value={formData.Tlg_au !== undefined ? formData.Tlg_au : ''}
                onChange={(e) => handleChange('Tlg_au', Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-amber-300 font-bold focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Đơn giá */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Đơn giá vàng (VNĐ)</label>
              <input
                type="number"
                value={formData.gia_au !== undefined ? formData.gia_au : ''}
                onChange={(e) => handleChange('gia_au', Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Tiền công */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Tiền công (VNĐ)</label>
              <input
                type="number"
                value={formData.Tien_cong !== undefined ? formData.Tien_cong : ''}
                onChange={(e) => handleChange('Tien_cong', Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Tiền đá */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Tiền đá (VNĐ)</label>
              <input
                type="number"
                value={formData.Tien_da !== undefined ? formData.Tien_da : ''}
                onChange={(e) => handleChange('Tien_da', Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Tổng thành tiền */}
            <div>
              <label className="block text-amber-400 font-bold mb-1">Tổng thành tiền (VNĐ)</label>
              <input
                type="number"
                value={formData.tien !== undefined ? formData.tien : ''}
                onChange={(e) => handleChange('tien', Number(e.target.value))}
                className="w-full px-3 py-2 bg-amber-950/60 rounded-lg border border-amber-500/50 text-amber-300 font-bold text-base focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Kho hàng */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Kho hàng</label>
              <input
                type="text"
                value={formData.KhoName || ''}
                onChange={(e) => handleChange('KhoName', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quầy */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Quầy giao dịch</label>
              <input
                type="text"
                value={formData.maQuay || ''}
                onChange={(e) => handleChange('maQuay', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Diễn giải */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">Diễn giải / Ghi chú</label>
              <textarea
                rows={2}
                value={formData.Dien_giai || ''}
                onChange={(e) => handleChange('Dien_giai', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
              ></textarea>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Đang lưu...' : 'Lưu giao dịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
