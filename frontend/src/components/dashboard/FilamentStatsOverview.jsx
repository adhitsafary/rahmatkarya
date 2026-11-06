import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatRupiah, calcPercent } from '../../utils/format';

export default function FilamentStatsOverview({ summary, projects = [], activeTab = 'dashboard' }) {
  const [hideBalance, setHideBalance] = useState(false);

  // Global database totals (for dashboard / overview)
  const globalTotalContract = summary?.total_contract ?? projects.reduce((s, p) => s + (parseFloat(p.total_contract_value) || 0), 0);
  const globalTotalPaidClients = summary?.total_paid_clients ?? projects.reduce((s, p) => s + (parseFloat(p.total_paid_by_client) || 0), 0);
  const globalTotalReceivables = summary?.total_receivables ?? projects.reduce((s, p) => s + (parseFloat(p.client_receivable_remaining) || 0), 0);
  const globalTotalTeamHonor = summary?.total_team_honor ?? projects.reduce((s, p) => s + (parseFloat(p.total_agreed_team_honor) || 0), 0);
  const globalTotalPaidTeam = summary?.total_paid_team ?? projects.reduce((s, p) => s + (parseFloat(p.total_paid_to_team) || 0), 0);
  const globalTotalPayables = summary?.total_payables ?? projects.reduce((s, p) => s + (parseFloat(p.team_payable_remaining) || 0), 0);
  const globalTotalNetCash = summary?.total_net_cash ?? (globalTotalPaidClients - globalTotalPaidTeam);

  const globalTotalProjects = summary?.counts?.total ?? projects.length;
  const globalActiveProjects = summary?.counts?.active ?? projects.filter(p => p.project_status === 'ACTIVE' || (parseFloat(p.client_receivable_remaining) > 0)).length;
  const globalSettledProjects = summary?.counts?.settled ?? projects.filter(p => (parseFloat(p.client_receivable_remaining) <= 0 && parseFloat(p.team_payable_remaining) <= 0)).length;
  const globalNonActiveProjects = Math.max(0, globalTotalProjects - globalActiveProjects);

  // Context-specific totals (from projects currently shown in the table)
  const currentContract = projects.reduce((s, p) => s + (parseFloat(p.total_contract_value) || 0), 0);
  const currentPaidClients = projects.reduce((s, p) => s + (parseFloat(p.total_paid_by_client) || 0), 0);
  const currentReceivables = projects.reduce((s, p) => s + (parseFloat(p.client_receivable_remaining) || 0), 0);
  const currentTeamHonor = projects.reduce((s, p) => s + (parseFloat(p.total_agreed_team_honor) || 0), 0);
  const currentPaidTeam = projects.reduce((s, p) => s + (parseFloat(p.total_paid_to_team) || 0), 0);
  const currentPayables = projects.reduce((s, p) => s + (parseFloat(p.team_payable_remaining) || 0), 0);
  const currentCount = projects.length;

  // 1. DAFTAR SEMUA PROYEK (Fokus Status & Manajemen Proyek)
  if (activeTab === 'projects') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Proyek */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Total Seluruh Proyek
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
            {globalTotalProjects} <span className="text-sm font-normal text-slate-500 font-sans">Proyek</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            <span>Terdaftar dalam sistem</span>
          </div>
        </div>

        {/* Card 2: Proyek Aktif */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Proyek Aktif (Berjalan)
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mb-2">
            {globalActiveProjects} <span className="text-sm font-normal text-slate-500 font-sans">Proyek</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Dalam proses pengerjaan / revisi</span>
          </div>
        </div>

        {/* Card 3: Proyek Selesai / Deal */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Proyek Selesai (Lunas)
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
            {globalSettledProjects} <span className="text-sm font-normal text-slate-500 font-sans">Proyek</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
            <span>{globalNonActiveProjects > 0 ? `${globalNonActiveProjects} non-aktif / selesai` : 'Pengerjaan & termin tuntas'}</span>
          </div>
        </div>

        {/* Card 4: Total Nilai Portofolio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Total Nilai Kontrak
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
            {formatRupiah(globalTotalContract)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white shrink-0"></span>
            <span>Akumulasi seluruh nilai SPK</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. MONITORING PIUTANG KLIEN (Sinkron 100% dengan Proyek Tertagih yang Tampil)
  if (activeTab === 'receivables') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sisa Piutang */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Total Tagihan Terbuka
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight mb-2">
            {formatRupiah(currentReceivables)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
            <span>Sisa piutang belum tertagih</span>
          </div>
        </div>

        {/* Card 2: Proyek Perlu Ditagih */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Proyek Belum Lunas
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight mb-2">
            {currentCount} <span className="text-sm font-normal text-slate-500 font-sans">Proyek</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>Menunggu pelunasan termin klien</span>
          </div>
        </div>

        {/* Card 3: DP / Termin Masuk dari Proyek Ini */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Pemasukan Sudah Masuk
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mb-2">
            {formatRupiah(currentPaidClients)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>DP terbayar dari {currentCount} proyek ini</span>
          </div>
        </div>

        {/* Card 4: Persentase Tertagih Proyek Ini */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Persentase Tertagih
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
            {calcPercent(currentPaidClients, currentContract)}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            <span>Dari kontrak {formatRupiah(currentContract)}</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. HONOR TIM SUBKON (Sinkron 100% dengan Proyek yang Tampil)
  if (activeTab === 'team') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sisa Hutang ke Tim */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Sisa Tanggungan Honor
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight mb-2">
            {formatRupiah(currentPayables)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>Honor tim/vendor belum dicairkan</span>
          </div>
        </div>

        {/* Card 2: Proyek Perlu Payout */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Proyek Menunggu Payout
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
            {currentCount} <span className="text-sm font-normal text-slate-500 font-sans">Proyek</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
            <span>Menunggu pembayaran honor vendor</span>
          </div>
        </div>

        {/* Card 3: Plafon Honor Disepakati */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Plafon Honor Disepakati
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
            {formatRupiah(currentTeamHonor)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white shrink-0"></span>
            <span>Pagu honor proyek yang tampil</span>
          </div>
        </div>

        {/* Card 4: Honor Telah Dibayarkan */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Honor Telah Dicairkan
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mb-2">
            {formatRupiah(currentPaidTeam)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>{calcPercent(currentPaidTeam, currentTeamHonor)}% dari pagu honor terbayar</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. DEFAULT: RINGKASAN KAS (DASHBOARD FINANSIAL CASHFLOW GLOBAL)
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
          {hideBalance ? 'Rp ••••••••' : formatRupiah(globalTotalNetCash)}
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
          {formatRupiah(globalTotalContract)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
          <span>{globalTotalProjects} Proyek aktif terdaftar</span>
        </div>
      </div>

      {/* 3. Sisa Piutang Klien (Receivables) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
          Sisa Piutang Klien
        </div>

        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight mb-2">
          {formatRupiah(globalTotalReceivables)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
          <span>Sisa tagihan terbuka</span>
        </div>
      </div>

      {/* 4. Sisa Tanggungan Tim (Payables) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
          Sisa Honor Tim Subkon
        </div>

        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mb-2">
          {formatRupiah(globalTotalPayables)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span>Dari plafon {formatRupiah(globalTotalTeamHonor)}</span>
        </div>
      </div>
    </div>
  );
}
