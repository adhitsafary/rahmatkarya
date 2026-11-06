import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

export default function FilamentStatsOverview({ summary }) {
  const [hideBalance, setHideBalance] = useState(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Kas Bersih Tersedia */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
          <span>Kas Bersih di Tangan</span>
          <button 
            onClick={() => setHideBalance(!hideBalance)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title={hideBalance ? 'Tampilkan' : 'Sembunyikan'}
          >
            {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
          {hideBalance ? 'Rp ••••••••' : formatRupiah(summary?.total_net_cash || 0)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Kas riil siap digunakan</span>
        </div>
      </div>

      {/* 2. Total Tagihan Kontrak */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
          Total Nilai Kontrak
        </div>

        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
          {formatRupiah(summary?.total_contract || 0)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
          <span>{summary?.counts?.total || 0} Proyek aktif terdaftar</span>
        </div>
      </div>

      {/* 3. Sisa Piutang Klien (Receivables) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
          Sisa Piutang Klien
        </div>

        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight mb-2">
          {formatRupiah(summary?.total_receivables || 0)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
          <span>{summary?.counts?.need_billing || 0} Proyek belum lunas</span>
        </div>
      </div>

      {/* 4. Sisa Tanggungan Tim (Payables) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
          Sisa Honor Tim Subkon
        </div>

        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
          {formatRupiah(summary?.total_payables || 0)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span>Dari plafon {formatRupiah(summary?.total_team_honor || 0)}</span>
        </div>
      </div>

    </div>
  );
}
