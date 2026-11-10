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

  // 4 Metric cards configuration matching Image 2 style
  let cards = [];

  if (activeTab === 'receivables') {
    cards = [
      {
        id: 'receivables',
        label: 'Sisa Piutang Terbuka',
        amount: currentReceivables,
        sub: `${projects.filter(p => (parseFloat(p.client_receivable_remaining) || 0) > 0).length} Proyek Menunggak`,
        labelColor: 'text-rose-600 dark:text-rose-400',
        valueColor: 'text-rose-600 dark:text-rose-400',
        hasEye: true
      },
      {
        id: 'paid-clients',
        label: 'Termin Diterima',
        amount: globalTotalPaidClients,
        sub: `${paidPercent}% Terbayar Klien`,
        labelColor: 'text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400'
      },
      {
        id: 'contract',
        label: 'Total Nilai Kontrak',
        amount: globalTotalContract,
        sub: `${globalTotalProjects} Proyek Terdaftar`,
        labelColor: 'text-slate-400 dark:text-slate-500',
        valueColor: 'text-slate-900 dark:text-white'
      },
      {
        id: 'payables',
        label: 'Honor Subkon',
        amount: globalTotalPayables,
        sub: `Plafon: ${formatRupiah(globalTotalTeamHonor)}`,
        labelColor: 'text-amber-600 dark:text-amber-500',
        valueColor: 'text-amber-600 dark:text-amber-500'
      }
    ];
  } else if (activeTab === 'team') {
    cards = [
      {
        id: 'team-payables',
        label: 'Sisa Tanggungan Tim',
        amount: currentPayables,
        sub: `${projects.filter(p => (parseFloat(p.team_payable_remaining) || 0) > 0).length} Subkon Pending`,
        labelColor: 'text-amber-600 dark:text-amber-500',
        valueColor: 'text-amber-600 dark:text-amber-500',
        hasEye: true
      },
      {
        id: 'team-honor',
        label: 'Plafon Honor Disetujui',
        amount: currentTeamHonor,
        sub: 'Total Anggaran Subkon',
        labelColor: 'text-slate-400 dark:text-slate-500',
        valueColor: 'text-slate-900 dark:text-white'
      },
      {
        id: 'team-paid',
        label: 'Honor Telah Dicairkan',
        amount: globalTotalPaidTeam,
        sub: `${subkonPercent}% Dari Plafon`,
        labelColor: 'text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400'
      },
      {
        id: 'paid-clients',
        label: 'Termin Masuk Klien',
        amount: globalTotalPaidClients,
        sub: 'Sumber Arus Kas',
        labelColor: 'text-blue-600 dark:text-blue-400',
        valueColor: 'text-blue-600 dark:text-blue-400'
      }
    ];
  } else if (activeTab === 'dashboard') {
    cards = [
      {
        id: 'net-cash',
        label: 'Kas Bersih di Tangan',
        amount: globalTotalNetCash,
        sub: 'Arus Kas Riil Siap Pakai',
        labelColor: 'text-slate-400 dark:text-slate-500',
        valueColor: 'text-slate-900 dark:text-white',
        hasEye: true
      },
      {
        id: 'paid-clients',
        label: 'Termin Masuk',
        amount: globalTotalPaidClients,
        sub: `${paidPercent}% Realisasi`,
        labelColor: 'text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400'
      },
      {
        id: 'receivables',
        label: 'Sisa Piutang',
        amount: globalTotalReceivables,
        sub: 'Tagihan Terbuka',
        labelColor: 'text-rose-600 dark:text-rose-400',
        valueColor: 'text-rose-600 dark:text-rose-400'
      },
      {
        id: 'payables',
        label: 'Honor Subkon',
        amount: globalTotalPayables,
        sub: `Plafon: ${formatRupiah(globalTotalTeamHonor)}`,
        labelColor: 'text-amber-600 dark:text-amber-500',
        valueColor: 'text-amber-600 dark:text-amber-500'
      }
    ];
  } else {
    // Default: 'projects' ("Daftar Semua Proyek" matching Image 1 & 2)
    cards = [
      {
        id: 'contract',
        label: 'Kontrak SPK',
        amount: globalTotalContract,
        sub: `${globalTotalProjects} Proyek Terdaftar`,
        labelColor: 'text-slate-400 dark:text-slate-500',
        valueColor: 'text-slate-900 dark:text-white',
        hasEye: true
      },
      {
        id: 'paid-clients',
        label: 'Termin Masuk',
        amount: globalTotalPaidClients,
        sub: `${paidPercent}% Realisasi`,
        labelColor: 'text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400'
      },
      {
        id: 'receivables',
        label: 'Sisa Piutang',
        amount: globalTotalReceivables,
        sub: 'Tagihan Terbuka',
        labelColor: 'text-rose-600 dark:text-rose-400',
        valueColor: 'text-rose-600 dark:text-rose-400'
      },
      {
        id: 'payables',
        label: 'Honor Subkon',
        amount: globalTotalPayables,
        sub: `Plafon: ${formatRupiah(globalTotalTeamHonor)}`,
        labelColor: 'text-amber-600 dark:text-amber-500',
        valueColor: 'text-amber-600 dark:text-amber-500'
      }
    ];
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => {
        const displayValue = hideBalance ? 'Rp ••••••••••' : formatRupiah(card.amount);
        return (
          <div 
            key={card.id} 
            className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${card.labelColor}`}>
                {card.label}
              </span>
              {card.hasEye && (
                <button
                  type="button"
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-0.5 -mr-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title={hideBalance ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                >
                  {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <div 
              className={`text-xl sm:text-2xl font-black font-mono mt-1 truncate ${card.valueColor}`}
              title={hideBalance ? '••••••••••' : formatRupiah(card.amount)}
            >
              {displayValue}
            </div>

            <span className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
              {card.sub}
            </span>
          </div>
        );
      })}
    </div>
  );
}
