'use client';

import React, { useState, useEffect } from 'react';
import { Account, DataTableInfo } from '@/lib/types';
import { X, UserPlus, Shield, Trash2, Edit2, AlertCircle, Plus, Table2 } from 'lucide-react';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: DataTableInfo[];
}

export default function AccountsModal({ isOpen, onClose, tables }: AccountsModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [active, setActive] = useState(true);

  // Dynamic table names input
  const [tableInput, setTableInput] = useState('');
  const [tableNamesList, setTableNamesList] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Lỗi tải tài khoản');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('user');
    setActive(true);
    setTableInput('');
    setTableNamesList([]);
    setIsFormOpen(true);
    setError(null);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setUsername(acc.username);
    setPassword(''); // leave empty unless changing
    setFullName(acc.full_name || '');
    setRole(acc.role);
    setActive(acc.active);
    setTableInput('');

    // Pre-populate table names
    let names: string[] = [];
    if (acc.table_names && acc.table_names.length > 0) {
      names = [...acc.table_names];
    } else if (acc.tables && acc.tables.length > 0) {
      names = acc.tables
        .map((id) => tables.find((t) => t.id === id)?.name)
        .filter((n): n is string => Boolean(n));
    }
    setTableNamesList(names);
    setIsFormOpen(true);
    setError(null);
  };

  const handleAddTableName = () => {
    if (!tableInput.trim()) return;

    // Support comma or space separated table names
    const parts = tableInput
      .split(/[,;\s]+/)
      .map((p) => p.trim().replace(/[^a-zA-Z0-9_]/g, ''))
      .filter((p) => p.length > 0);

    setTableNamesList((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.includes(p)) {
          next.push(p);
        }
      }
      return next;
    });

    setTableInput('');
  };

  const handleRemoveTableName = (nameToRemove: string) => {
    setTableNamesList((prev) => prev.filter((name) => name !== nameToRemove));
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // If there is still text typed in tableInput, add it before submitting
    let finalTableNames = [...tableNamesList];
    if (tableInput.trim()) {
      const parts = tableInput
        .split(/[,;\s]+/)
        .map((p) => p.trim().replace(/[^a-zA-Z0-9_]/g, ''))
        .filter((p) => p.length > 0);
      for (const p of parts) {
        if (!finalTableNames.includes(p)) {
          finalTableNames.push(p);
        }
      }
    }

    try {
      if (editingAccount) {
        // Update
        const res = await fetch(`/api/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName,
            role,
            active,
            password: password.trim() || undefined,
            tableNames: finalTableNames,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        // Create
        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            full_name: fullName,
            role,
            active,
            tableNames: finalTableNames,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      setIsFormOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchAccounts();
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
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-amber-300">
              QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN TRUY CẬP
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

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {!isFormOpen ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-neutral-400">
                  Danh sách người dùng và tên bảng dữ liệu (Table) được phân quyền truy cập
                </span>
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo tài khoản mới</span>
                </button>
              </div>

              {/* Table of Accounts */}
              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-neutral-950 text-neutral-300 border-b border-neutral-800 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Tài khoản</th>
                      <th className="py-2.5 px-4">Họ tên</th>
                      <th className="py-2.5 px-4">Vai trò</th>
                      <th className="py-2.5 px-4">Trạng thái</th>
                      <th className="py-2.5 px-4">Tên Table được gán</th>
                      <th className="py-2.5 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400">
                          Đang tải danh sách tài khoản...
                        </td>
                      </tr>
                    ) : accounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400">
                          Chưa có tài khoản nào
                        </td>
                      </tr>
                    ) : (
                      accounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-neutral-800/40">
                          <td className="py-3 px-4 font-mono font-semibold text-amber-300">
                            {acc.username}
                          </td>
                          <td className="py-3 px-4 text-neutral-200">
                            {acc.full_name || '--'}
                          </td>
                          <td className="py-3 px-4">
                            {acc.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Quản trị viên
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Người dùng
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {acc.active ? (
                              <span className="text-emerald-400 text-xs font-semibold">Hoạt động</span>
                            ) : (
                              <span className="text-red-400 text-xs font-semibold">Đã khóa</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {acc.role === 'admin' ? (
                              <span className="text-xs text-amber-300 font-medium">Toàn quyền (Tất cả bảng)</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {acc.table_names && acc.table_names.length > 0 ? (
                                  acc.table_names.map((tName, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-neutral-800 text-amber-300 font-mono text-[11px] rounded border border-amber-500/30 font-semibold"
                                    >
                                      {tName}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-neutral-500 text-xs italic">Chưa gán table nào</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(acc)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                title="Chỉnh sửa tài khoản"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(acc.id)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/60 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Create / Edit Form */
            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h3 className="font-bold text-amber-300">
                  {editingAccount ? `Chỉnh sửa tài khoản: ${editingAccount.username}` : 'Thêm tài khoản mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Quay lại danh sách
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!!editingAccount}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    {editingAccount ? 'Đổi mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
                    required={!editingAccount}
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="user">Người dùng (Chỉ xem bảng được điền)</option>
                    <option value="admin">Quản trị viên (Toàn quyền hệ thống)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded bg-neutral-800 border-neutral-700"
                    />
                    <span className="text-neutral-300 font-medium">
                      Kích hoạt tài khoản (Cho phép đăng nhập)
                    </span>
                  </label>
                </div>

                {/* Table Names Input - Điền tên table vô */}
                {role !== 'admin' && (
                  <div className="sm:col-span-2 bg-neutral-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-amber-400" />
                        <span>Điền tên bảng dữ liệu (Table name):</span>
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        (Nhập tên table SQL, ví dụ: Vang_NamPhong)
                      </span>
                    </div>

                    {/* Input field to type table name */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        list="available-tables-list"
                        placeholder="Nhập tên table, VD: Vang_NamPhong (gõ Enter hoặc bấm Thêm)..."
                        value={tableInput}
                        onChange={(e) => setTableInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTableName();
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 bg-neutral-800 text-neutral-100 rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-400 font-mono text-xs sm:text-sm"
                      />
                      <datalist id="available-tables-list">
                        {tables.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.display_name || t.name}
                          </option>
                        ))}
                      </datalist>
                      <button
                        type="button"
                        onClick={handleAddTableName}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm table</span>
                      </button>
                    </div>

                    {/* Quick suggestion pills from available system tables */}
                    {tables.filter((t) => !tableNamesList.includes(t.name)).length > 0 && (
                      <div className="flex items-center flex-wrap gap-1.5 text-xs">
                        <span className="text-neutral-400 text-[11px]">Bảng có sẵn (bấm để thêm nhanh):</span>
                        {tables
                          .filter((t) => !tableNamesList.includes(t.name))
                          .map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                if (!tableNamesList.includes(t.name)) {
                                  setTableNamesList([...tableNamesList, t.name]);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border border-neutral-700 hover:border-amber-500/40 font-mono text-[11px] transition-colors cursor-pointer"
                            >
                              + {t.name}
                            </button>
                          ))}
                      </div>
                    )}

                    {/* Tag list of entered table names */}
                    {tableNamesList.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] text-neutral-400 font-medium">
                          Các bảng dữ liệu được gán cho tài khoản này:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tableNamesList.map((tblName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold shadow-sm"
                            >
                              <span>{tblName}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTableName(tblName)}
                                className="w-4 h-4 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-red-600/80 transition-colors cursor-pointer text-xs"
                                title="Bỏ bảng này"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-400/80 italic">
                        * Hãy điền tên bảng dữ liệu (Table name) ở ô trên rồi nhấn <strong>"Thêm table"</strong>.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
