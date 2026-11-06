import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatRupiah, calcPercent } from '../../utils/format';

export default function FilamentStatsOverview({ summary, projects = [], activeTab = 'dashboard' }) {
  const [hideBalance, setHideBalance] = useState(false);

  // Global database totals
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

  // Context-specific totals (from projects currently shown)
  const currentContract = projects.reduce((s, p) => s + (parseFloat(p.total_contract_value) || 0), 0);
  const currentPaidClients = projects.reduce((s, p) => s + (parseFloat(p.total_paid_by_client) || 0), 0);
  const currentReceivables = projects.reduce((s, p) => s + (parseFloat(p.client_receivable_remaining) || 0), 0);
  const currentTeamHonor = projects.reduce((s, p) => s + (parseFloat(p.total_agreed_team_honor) || 0), 0);
  const currentPaidTeam = projects.reduce((s, p) => s + (parseFloat(p.total_paid_to_team) || 0), 0);
  const currentPayables = projects.reduce((s, p) => s + (parseFloat(p.team_payable_remaining) || 0), 0);
  const currentCount = projects.length;

  // 1. DAFTAR SEMUA PROYEK (NOC DevOps KPI Cards)
  if (activeTab === 'projects') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: TOTAL PROYEK */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            TOTAL PROYEK
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
            {globalTotalProjects}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Semua Terdaftar
          </div>
        </div>

        {/* Card 2: PROYEK AKTIF */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
            ONLINE (AKTIF)
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {globalActiveProjects}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-mono mt-1">
            {calcPercent(globalActiveProjects, globalTotalProjects)}% Berjalan
          </div>
        </div>

        {/* Card 3: PROYEK SELESAI */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            SELESAI (DEAL/LUNAS)
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
            {globalSettledProjects}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            {globalNonActiveProjects > 0 ? `${globalNonActiveProjects} Nonaktif` : '100% Tuntas'}
          </div>
        </div>

        {/* Card 4: NILAI KONTRAK */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
            TOTAL NILAI SPK
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight truncate">
            {formatRupiah(globalTotalContract)}
          </div>
          <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-mono mt-1">
            Akumulasi Portofolio
          </div>
        </div>
      </div>
    );
  }

  // 2. MONITORING PIUTANG KLIEN
  if (activeTab === 'receivables') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: TOTAL SISA PIUTANG */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-rose-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
            SISA PIUTANG (UNPAID)
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight truncate">
            {formatRupiah(currentReceivables)}
          </div>
          <div className="text-[11px] text-rose-500 font-mono mt-1">
            Tagihan Terbuka
          </div>
        </div>

        {/* Card 2: PROYEK BELUM LUNAS */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-amber-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
            PROYEK PERLU DITAGIH
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {currentCount}
          </div>
          <div className="text-[11px] text-amber-500 font-mono mt-1">
            Menunggu Pelunasan
          </div>
        </div>

        {/* Card 3: DP / TERMIN SUDAH MASUK */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-emerald-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
            DP / MASUK DITERIMA
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            {formatRupiah(currentPaidClients)}
          </div>
          <div className="text-[11px] text-emerald-500 font-mono mt-1">
            Realisasi Uang Masuk
          </div>
        </div>

        {/* Card 4: PERSENTASE TERTAGIH */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
            PROGRES TERTAGIH
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
            {calcPercent(currentPaidClients, currentContract)}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
            Pagu {formatRupiah(currentContract)}
          </div>
        </div>
      </div>
    );
  }

  // 3. HONOR TIM SUBKON
  if (activeTab === 'team') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: SISA HUTANG KE TIM */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-amber-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
            SISA HUTANG KE TIM
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight truncate">
            {formatRupiah(currentPayables)}
          </div>
          <div className="text-[11px] text-amber-500 font-mono mt-1">
            Belum Dicairkan
          </div>
        </div>

        {/* Card 2: PROYEK BELUM PAYOUT */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-rose-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
            MENUNGGU PAYOUT
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
            {currentCount}
          </div>
          <div className="text-[11px] text-rose-500 font-mono mt-1">
            Vendor / Subkon Terbuka
          </div>
        </div>

        {/* Card 3: PLAFON HONOR DISETUJUI */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
            PLAFON HONOR TIM
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight truncate">
            {formatRupiah(currentTeamHonor)}
          </div>
          <div className="text-[11px] text-blue-500 font-mono mt-1">
            Total Pagu Alokasi
          </div>
        </div>

        {/* Card 4: REALISASI HONOR DIBAYAR */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-emerald-500/40 shadow-xs transition">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
            REALISASI DIBAYAR
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            {formatRupiah(currentPaidTeam)}
          </div>
          <div className="text-[11px] text-emerald-500 font-mono mt-1">
            {calcPercent(currentPaidTeam, currentTeamHonor)}% Honor Tersalurkan
          </div>
        </div>
      </div>
    );
  }

  // 4. DEFAULT: RINGKASAN KAS (DASHBOARD FINANSIAL CASHFLOW GLOBAL)
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Kas Bersih Tersedia */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-emerald-500/40 shadow-xs transition">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
          <span>KAS BERSIH DI TANGAN</span>
          <button 
            onClick={() => setHideBalance(!hideBalance)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title={hideBalance ? 'Tampilkan' : 'Sembunyikan'}
          >
            {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
          {hideBalance ? 'Rp ••••••••' : formatRupiah(globalTotalNetCash)}
        </div>

        <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-mono mt-1">
          Kas Riil Siap Pakai
        </div>
      </div>

      {/* 2. Total Tagihan Kontrak */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs transition">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
          TOTAL NILAI KONTRAK
        </div>

        <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight truncate">
          {formatRupiah(globalTotalContract)}
        </div>

        <div className="text-[11px] text-slate-400 font-mono mt-1">
          {globalTotalProjects} Proyek Terdaftar
        </div>
      </div>

      {/* 3. Sisa Piutang Klien (Receivables) */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-rose-500/40 shadow-xs transition">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
          SISA PIUTANG KLIEN
        </div>

        <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight truncate">
          {formatRupiah(globalTotalReceivables)}
        </div>

        <div className="text-[11px] text-rose-500 font-mono mt-1">
          Tagihan Terbuka
        </div>
      </div>

      {/* 4. Sisa Tanggungan Tim (Payables) */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#162540] hover:border-slate-300 dark:hover:border-amber-500/40 shadow-xs transition">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
          SISA HONOR TIM
        </div>

        <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight truncate">
          {formatRupiah(globalTotalPayables)}
        </div>

        <div className="text-[11px] text-amber-500 font-mono mt-1 truncate">
          Plafon: {formatRupiah(globalTotalTeamHonor)}
        </div>
      </div>
    </div>
  );
}
