'use client';

import React, { useState } from 'react';
import { DataTableInfo } from '@/lib/types';
import { X, Database, Plus, Trash2, AlertCircle, CheckCircle, Sparkles, Server } from 'lucide-react';

interface DataTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: DataTableInfo[];
  onRefresh: () => void;
}

export default function DataTablesModal({
  isOpen,
  onClose,
  tables,
  onRefresh,
}: DataTablesModalProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [autoCreate, setAutoCreate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          display_name: displayName.trim(),
          description: description.trim(),
          autoCreate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(data.message || 'Thêm bảng thành công');
      setName('');
      setDisplayName('');
      setDescription('');
      setIsAddOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePhysicalTable = async (id: number) => {
    setActionLoadingId(id);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/tables/${id}/create-physical`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(data.message);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTable = async (id: number, tableName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn bỏ quản lý bảng "${tableName}"?`)) return;

    try {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-6 text-neutral-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 px-6 py-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-amber-300">
              QUẢN LÝ DANH SÁCH BẢNG DỮ LIỆU GIAO DỊCH
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-neutral-400 block">
                Hệ thống hỗ trợ <strong>Tự động tạo bảng vật lý mới</strong> trong SQL Server với chuẩn 37 cột giao dịch vàng khi chưa có.
              </span>
            </div>
            <button
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddOpen ? 'Đóng form' : 'Thêm bảng mới'}</span>
            </button>
          </div>

          {/* Add form */}
          {isAddOpen && (
            <form onSubmit={handleAddTable} className="bg-neutral-950 p-5 rounded-2xl border border-amber-500/30 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-amber-300 pb-2 border-b border-neutral-800">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Đăng ký & Tự động tạo bảng dữ liệu mới</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Tên bảng kỹ thuật trong SQL Server
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Vang_KimCuong, Vang_ChiNhanh3..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Chỉ gồm chữ cái, số và dấu gạch dưới (_).
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Tên hiển thị trên giao diện
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tiệm Vàng Kim Cương - Chi nhánh 3..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 font-semibold mb-1">Mô tả / Ghi chú</label>
                  <input
                    type="text"
                    placeholder="Mô tả về chi nhánh hoặc loại giao dịch..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Auto Create Checkbox */}
                <div className="sm:col-span-2 bg-neutral-900/80 p-3.5 rounded-xl border border-amber-500/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCreate}
                      onChange={(e) => setAutoCreate(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-amber-500 rounded bg-neutral-800 border-neutral-700 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-amber-300 text-xs">
                        ⚡ Tự động tạo bảng vật lý trong SQL Server (Nếu chưa tồn tại)
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Hệ thống sẽ tự động thực thi lệnh DDL để tạo bảng với đầy đủ 37 cột chuẩn: mã chứng từ, thông tin khách hàng (CCCD, SĐT), khối lượng vàng, hàm lượng, tiền công, tiền đá, thành tiền và tài khoản kế toán.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Đang khởi tạo...' : 'Xác nhận tạo bảng'}
                </button>
              </div>
            </form>
          )}

          {/* Tables list */}
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-neutral-950 text-neutral-300 border-b border-neutral-800 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Tên hiển thị</th>
                  <th className="py-2.5 px-4">Tên bảng SQL</th>
                  <th className="py-2.5 px-4">Trạng thái trong DB</th>
                  <th className="py-2.5 px-4">Số lượng bản ghi</th>
                  <th className="py-2.5 px-4">Mô tả</th>
                  <th className="py-2.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {tables.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-bold text-amber-300">
                      {t.display_name || t.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-300">{t.name}</td>
                    
                    {/* Status in DB */}
                    <td className="py-3 px-4">
                      {t.physical_exists ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>Đã có trong SQL Server</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Server className="w-3 h-3" />
                            <span>Chưa có bảng vật lý</span>
                          </span>
                          <button
                            onClick={() => handleCreatePhysicalTable(t.id)}
                            disabled={actionLoadingId === t.id}
                            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-bold rounded shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === t.id ? 'Đang tạo...' : 'Tạo ngay'}
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-neutral-200">
                      {t.total_records ? t.total_records.toLocaleString('vi-VN') : '0'} phiếu
                    </td>
                    <td className="py-3 px-4 text-neutral-400 text-xs">{t.description || '--'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteTable(t.id, t.name)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/60 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Bỏ theo dõi bảng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
