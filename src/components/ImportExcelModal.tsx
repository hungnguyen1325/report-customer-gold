'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  onSuccess: () => void;
}

export default function ImportExcelModal({
  isOpen,
  onClose,
  tableName,
  onSuccess,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    totalRows: number;
    totalInvoices: number;
    totalAmount: number;
    minDate?: string;
    maxDate?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.match(/\.(xlsx|xls)$/i)) {
        setError('Chỉ chấp nhận file định dạng Excel (.xlsx hoặc .xls)');
        return;
      }
      setFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.match(/\.(xlsx|xls)$/i)) {
        setError('Chỉ chấp nhận file định dạng Excel (.xlsx hoặc .xls)');
        return;
      }
      setFile(dropped);
    }
  };

  const handleUpload = async () => {
    if (!file || !tableName) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/transactions/import?table=${encodeURIComponent(tableName)}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi nhập dữ liệu');
      }

      setResult({
        totalRows: data.totalRows,
        totalInvoices: data.totalInvoices,
        totalAmount: data.totalAmount,
        minDate: data.minDate,
        maxDate: data.maxDate,
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối khi gửi dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (result) {
      onSuccess();
    }
    setFile(null);
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nhập dữ liệu từ Excel</h2>
              <p className="text-xs text-neutral-400">
                Bảng đích: <span className="font-semibold text-amber-400">{tableName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Nhập dữ liệu thành công!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                <div className="bg-neutral-900/80 p-2.5 rounded-lg">
                  <div className="text-neutral-400">Số dòng đã nạp:</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {result.totalRows.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="bg-neutral-900/80 p-2.5 rounded-lg">
                  <div className="text-neutral-400">Số hóa đơn:</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    {result.totalInvoices.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="col-span-2 bg-neutral-900/80 p-2.5 rounded-lg">
                  <div className="text-neutral-400">Tổng giá trị giao dịch:</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {result.totalAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                {result.minDate && result.maxDate && (
                  <div className="col-span-2 bg-neutral-900/80 p-2 rounded-lg text-[11px] text-neutral-400">
                    Khoảng thời gian: <span className="text-neutral-200 font-medium">{result.minDate}</span> đến{' '}
                    <span className="text-neutral-200 font-medium">{result.maxDate}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-neutral-700 hover:border-amber-500/40 hover:bg-neutral-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Nhấp để chọn file khác
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-neutral-200">
                      Kéo thả file Excel vào đây hoặc <span className="text-amber-400 underline">duyệt tìm file</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-1.5">
                      Hỗ trợ định dạng .xlsx, .xls từ phần mềm vàng
                    </p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
                <div className="font-semibold text-neutral-300">Quy tắc nạp dữ liệu:</div>
                <ul className="list-disc list-inside space-y-0.5 text-neutral-400">
                  <li>Tự động nhận diện cột: Số phiếu, Ngày, Tên hàng, Cân nặng, Đơn giá, Thành tiền...</li>
                  <li>Hỗ trợ hóa đơn gộp nhiều món hàng, tự động chuẩn hóa họ tên khách hàng.</li>
                  <li>Xử lý tốc độ cao qua bulk copy hàng chục nghìn dòng chỉ trong vài giây.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-950/50">
          {result ? (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Đóng & Cập nhật danh sách
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang nạp dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Bắt đầu nhập</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
