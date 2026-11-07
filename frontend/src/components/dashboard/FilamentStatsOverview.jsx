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

  // Context-specific totals
  const currentReceivables = projects.reduce((s, p) => s + (parseFloat(p.client_receivable_remaining) || 0), 0);
  const currentPayables = projects.reduce((s, p) => s + (parseFloat(p.team_payable_remaining) || 0), 0);
  const currentTeamHonor = projects.reduce((s, p) => s + (parseFloat(p.total_agreed_team_honor) || 0), 0);

  const paidPercent = calcPercent(globalTotalPaidClients, globalTotalContract);
  const receivablePercent = calcPercent(globalTotalReceivables, globalTotalContract);
  const subkonPercent = globalTotalContract > 0 ? Math.round((globalTotalPaidTeam / globalTotalContract) * 100) : 0;

  // Configure hero context according to active tab
  let heroConfig = {
    title: 'TOTAL SALDO KAS BERSIH DI TANGAN',
    amount: globalTotalNetCash,
    caption: 'Arus kas riil siap pakai setelah penyaluran honor tim & beban subkon',
    badgeText: `${paidPercent}% Masuk`,
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60'
  };

  if (activeTab === 'receivables') {
    heroConfig = {
      title: 'TOTAL SISA PIUTANG TERBUKA',
      amount: currentReceivables,
      caption: `Tagihan terbuka yang belum diselesaikan klien dari ${projects.length} proyek aktif`,
      badgeText: `${receivablePercent}% Terbuka`,
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60'
    };
  } else if (activeTab === 'team') {
    heroConfig = {
      title: 'SISA HONOR BELUM DICAIRKAN',
      amount: currentPayables,
      caption: `Kewajiban pembayaran subkon dari plafon disetujui ${formatRupiah(currentTeamHonor)}`,
      badgeText: 'Subkon Pending',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
    };
  } else if (activeTab === 'projects') {
    heroConfig = {
      title: 'TOTAL NILAI KONTRAK SPK',
      amount: globalTotalContract,
      caption: `${globalTotalProjects} proyek terdaftar • ${projects.length} ditampilkan dalam filter aktif`,
      badgeText: `${globalTotalProjects} Proyek`,
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60'
    };
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors space-y-4">
      
      {/* Top Split: Left Hero Figure vs Right 4-Pillar Cluster (Image 2 style) */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        
        {/* Left Side: Major Metric Display */}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {heroConfig.title}
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-2 sm:gap-2.5">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
              {hideBalance ? 'Rp ••••••••••' : formatRupiah(heroConfig.amount)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 font-mono">
              IDR
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${heroConfig.badgeClass}`}>
              {heroConfig.badgeText}
            </span>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
              title={hideBalance ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            >
              {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {heroConfig.caption}
          </p>
        </div>

        {/* Right Side: 4 Status Columns matching Image 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
          
          {/* Item 1: Total Kontrak SPK (Online state style) */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
              <span>Kontrak SPK</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-white truncate">
              {formatRupiah(globalTotalContract)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {globalTotalProjects} Proyek Terdaftar
            </div>
          </div>

          {/* Item 2: Termin Diterima (Online working state style) */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Termin Masuk</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 truncate">
              {formatRupiah(globalTotalPaidClients)}
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 truncate">
              {paidPercent}% Realisasi
            </div>
          </div>

          {/* Item 3: Sisa Piutang Klien (LOS / Cut state style) */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Sisa Piutang</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono text-rose-600 dark:text-rose-400 truncate">
              {formatRupiah(globalTotalReceivables)}
            </div>
            <div className="text-[10px] text-rose-500/80 dark:text-rose-400/80 truncate">
              Tagihan Terbuka
            </div>
          </div>

          {/* Item 4: Sisa Honor Subkon (Dying Gasp power loss style) */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Honor Subkon</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono text-amber-600 dark:text-amber-400 truncate">
              {formatRupiah(globalTotalPayables)}
            </div>
            <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 truncate">
              Plafon: {formatRupiah(globalTotalTeamHonor)}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: Progress Bar matching Image 2 */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-1 font-mono">
          <span className="font-bold uppercase tracking-wider text-[10px]">
            DISTRIBUSI ARUS KAS & TERMIN
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Termin: <strong className="text-emerald-600 dark:text-emerald-400">{paidPercent}%</strong> ({formatRupiah(globalTotalPaidClients)}) &bull; Piutang: <strong className="text-rose-600 dark:text-rose-400">{receivablePercent}%</strong> &bull; Subkon: <strong className="text-amber-600 dark:text-amber-400">{subkonPercent}%</strong>
          </span>
        </div>

        {/* Multi-segmented distribution progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${paidPercent}%` }}
            title={`Termin Diterima: ${paidPercent}%`}
          />
          <div 
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${Math.min(10, subkonPercent)}%` }}
            title={`Beban Subkon: ${subkonPercent}%`}
          />
          <div 
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${receivablePercent}%` }}
            title={`Sisa Piutang: ${receivablePercent}%`}
          />
        </div>
      </div>

    </div>
  );
}