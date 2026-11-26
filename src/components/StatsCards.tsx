import React from 'react';
import { TransactionSummaryStats } from '@/lib/types';
import { TrendingUp, Scale, Gem, Receipt, DollarSign, Layers } from 'lucide-react';

interface StatsCardsProps {
  summary: TransactionSummaryStats;
  loading?: boolean;
}

export default function StatsCards({ summary, loading }: StatsCardsProps) {
  const formatMoney = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatWeight = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0.000';
    return Number(val).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const stats = [
    {
      title: 'Tổng số giao dịch',
      value: (summary?.totalCount || 0).toLocaleString('vi-VN') + ' phiếu',
      subtitle: 'Bản ghi giao dịch phù hợp',
      icon: Receipt,
      color: 'from-blue-600 to-indigo-700',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-950/20',
    },
    {
      title: 'Tổng giá trị giao dịch',
      value: formatMoney(summary?.totalTien),
      subtitle: 'Doanh số phát sinh',
      icon: DollarSign,
      color: 'from-amber-500 to-yellow-600',
      textColor: summary?.totalTien && summary.totalTien >= 0 ? 'text-amber-400' : 'text-rose-400',
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-950/20',
    },
    {
      title: 'Tổng trọng lượng',
      value: `${formatWeight(summary?.totalTongTlg)} chỉ`,
      subtitle: 'Toàn bộ vàng + đá',
      icon: Scale,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      bgColor: 'bg-emerald-950/20',
    },
    {
      title: 'Trọng lượng vàng (Au)',
      value: `${formatWeight(summary?.totalTlgAu)} chỉ`,
      subtitle: 'Khối lượng vàng quy đổi',
      icon: TrendingUp,
      color: 'from-yellow-500 to-amber-600',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/20',
      bgColor: 'bg-yellow-950/20',
    },
    {
      title: 'Tổng tiền đá quý đính kèm',
      value: formatMoney(summary?.totalTienDa),
      subtitle: 'Giá trị đá quý & hạt đính',
      icon: Gem,
      color: 'from-pink-500 to-rose-600',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/20',
      bgColor: 'bg-pink-950/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl p-4 border ${item.borderColor} ${item.bgColor} backdrop-blur-sm shadow-md hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-400 tracking-wide uppercase">
                {item.title}
              </span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} text-white shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className={`text-lg xl:text-xl font-bold tracking-tight ${item.textColor} truncate`}>
                {loading ? (
                  <div className="h-6 w-24 bg-neutral-700/50 animate-pulse rounded"></div>
                ) : (
                  item.value
                )}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">{item.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
