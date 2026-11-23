'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import StatsCards from '@/components/StatsCards';
import FilterBar from '@/components/FilterBar';
import TransactionTable from '@/components/TransactionTable';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import TransactionFormModal from '@/components/TransactionFormModal';
import AccountsModal from '@/components/AccountsModal';
import DataTablesModal from '@/components/DataTablesModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { TransactionRecord, TransactionSummaryStats } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, tables, selectedTable, loading: authLoading, refreshUser } = useAuth();

  // Transactions state
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TransactionSummaryStats>({
    totalCount: 0,
    totalTien: 0,
    totalTongTlg: 0,
    totalTlgAu: 0,
    totalTienCong: 0,
    totalTienDa: 0,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kieuCt, setKieuCt] = useState('');
  const [khoName, setKhoName] = useState('');
  const [maQuay, setMaQuay] = useState('');

  // Dropdown options
  const [kieuCtOptions, setKieuCtOptions] = useState<string[]>([]);
  const [khoOptions, setKhoOptions] = useState<string[]>([]);
  const [quayOptions, setQuayOptions] = useState<string[]>([]);

  // Modals state
  const [viewingRecord, setViewingRecord] = useState<TransactionRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TransactionRecord | null>(null);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isTablesOpen, setIsTablesOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Load filter options when selectedTable changes
  const loadFilterOptions = useCallback(async () => {
    if (!selectedTable) return;
    try {
      const res = await fetch(`/api/transactions/filters?table=${encodeURIComponent(selectedTable)}`);
      if (res.ok) {
        const data = await res.json();
        setKieuCtOptions(data.kieuCtList || []);
        setKhoOptions(data.khoNameList || []);
        setQuayOptions(data.maQuayList || []);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load filter options:', err);
      }
    }
  }, [selectedTable]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Load transactions
  const fetchTransactions = useCallback(async () => {
    if (!selectedTable) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        table: selectedTable,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (kieuCt) params.append('kieuCt', kieuCt);
      if (khoName) params.append('khoName', khoName);
      if (maQuay) params.append('maQuay', maQuay);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setSummary(data.summary || {});
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.totalRecords || 0);
      } else {
        setRecords([]);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching transactions:', err);
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, page, pageSize, search, startDate, endDate, kieuCt, khoName, maQuay]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setKieuCt('');
    setKhoName('');
    setMaQuay('');
    setPage(1);
  };

  const handleExportExcel = async () => {
    if (!selectedTable) return;
    setLoadingExport(true);
    try {
      const params = new URLSearchParams({ table: selectedTable });
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (kieuCt) params.append('kieuCt', kieuCt);
      if (khoName) params.append('khoName', khoName);
      if (maQuay) params.append('maQuay', maQuay);

      const response = await fetch(`/api/transactions/export?${params.toString()}`);
      if (!response.ok) throw new Error('Xuất file thất bại');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoCao_GiaoDich_${selectedTable}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Lỗi xuất file Excel: ' + err.message);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDelete = async (rec: TransactionRecord) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa giao dịch ${rec.So_ct?.trim() || rec.stt_rec?.trim()}?`)) return;

    try {
      const params = new URLSearchParams({
        table: selectedTable,
        stt_rec0: rec.stt_rec0 || '',
        FK_CtID: rec.FK_CtID || '',
      });
      const res = await fetch(`/api/transactions/${encodeURIComponent(rec.stt_rec)}?${params.toString()}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTransactions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-amber-400 font-semibold text-sm">
        Đang tải hệ thống...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenAccountsModal={() => setIsAccountsOpen(true)}
        onOpenTablesModal={() => setIsTablesOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Stats summary */}
        <StatsCards summary={summary} loading={loading} />

        {/* Filter bar */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          kieuCt={kieuCt}
          setKieuCt={setKieuCt}
          khoName={khoName}
          setKhoName={setKhoName}
          maQuay={maQuay}
          setMaQuay={setMaQuay}
          kieuCtOptions={kieuCtOptions}
          khoOptions={khoOptions}
          quayOptions={quayOptions}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          onExportExcel={handleExportExcel}
          loadingExport={loadingExport}
        />

        {/* Main transactions table */}
        <TransactionTable
          records={records}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          onViewDetail={(rec) => setViewingRecord(rec)}
          onEdit={(rec) => {
            setEditingRecord(rec);
            setIsFormOpen(true);
          }}
          onDelete={handleDelete}
        />
      </main>

      {/* Modals */}
      <TransactionDetailModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
      />

      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => fetchTransactions()}
        record={editingRecord}
        tableName={selectedTable}
      />

      <AccountsModal
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        tables={tables}
      />

      <DataTablesModal
        isOpen={isTablesOpen}
        onClose={() => setIsTablesOpen(false)}
        tables={tables}
        onRefresh={() => refreshUser()}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
