import React from 'react';
import { 
  List, 
  Grid, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatRupiah, calcPercent, getInitials } from '../../utils/format';

export default function FilamentTable({
  projects,
  loading,
  currentFilter,
  setFilter,
  viewMode,
  setViewMode,
  onOpenDetail,
  onOpenPayment,
  onOpenWhatsApp,
  canEdit = true
}) {
  // Calculate totals for footer
  const totals = projects.reduce((acc, p) => ({
    contract: acc.contract + (parseFloat(p.total_contract_value) || 0),
    paidClient: acc.paidClient + (parseFloat(p.total_paid_by_client) || 0),
    receivable: acc.receivable + (parseFloat(p.client_receivable_remaining) || 0),
    teamHonor: acc.teamHonor + (parseFloat(p.total_agreed_team_honor) || 0),
    paidTeam: acc.paidTeam + (parseFloat(p.total_paid_to_team) || 0),
    payableTeam: acc.payableTeam + (parseFloat(p.team_payable_remaining) || 0),
  }), { contract: 0, paidClient: 0, receivable: 0, teamHonor: 0, paidTeam: 0, payableTeam: 0 });

  return (
    <div className="space-y-4">
      
      {/* Filament Table Filter & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Semua Proyek' },
            { id: 'need_billing', label: 'Perlu Ditagih Klien' },
            { id: 'need_payout', label: 'Tanggungan Honor Tim' },
            { id: 'settled', label: 'Lunas Selesai' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                currentFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Switcher: List vs Grid */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>

      </div>

      {/* VIEW MODE 1: STREAMLINED LIST TABLE */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b uppercase font-bold tracking-wider bg-slate-50/80 text-slate-400 border-slate-200/80 dark:bg-slate-950/80 dark:text-slate-400 dark:border-slate-800 text-[10px]">
                  <th className="py-3 px-4">Proyek & Klien</th>
                  <th className="py-3 px-4 text-right">Nilai Kontrak & Masuk</th>
                  <th className="py-3 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3 px-4 text-right">Honor Tim Subkon</th>
                  <th className="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                {projects.map((p) => {
                  const receivable = parseFloat(p.client_receivable_remaining) || 0;
                  const payable = parseFloat(p.team_payable_remaining) || 0;
                  const paidPercent = calcPercent(p.total_paid_by_client, p.total_contract_value);

                  return (
                    <tr 
                      key={p.project_id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition group"
                    >
                      {/* 1. Proyek & Klien */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(p.project_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => onOpenDetail(p)}
                                className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition text-xs"
                              >
                                {p.project_name}
                              </span>
                              {p.workflow_stage === 'REVISION' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  Revisi {p.revision_used || 1}/{p.revision_max || 3}
                                </span>
                              )}
                              {receivable <= 0 && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  Deal
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {p.client_name} {p.contract_number ? `• ${p.contract_number}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Nilai Kontrak & Masuk */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {formatRupiah(p.total_contract_value)}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Masuk: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatRupiah(p.total_paid_by_client)}</span> ({paidPercent}%)
                          </span>
                        </div>
                        <div className="w-24 ml-auto h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* 3. Sisa Piutang */}
                      <td className="py-3.5 px-4 text-right">
                        {receivable > 0 ? (
                          <div>
                            <div className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                              {formatRupiah(receivable)}
                            </div>
                            <span className="inline-block mt-0.5 text-[10px] font-medium text-rose-500">
                              Belum Lunas
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        )}
                      </td>

                      {/* 4. Honor Tim Subkon */}
                      <td className="py-3.5 px-4 text-right">
                        {parseFloat(p.total_agreed_team_honor) > 0 ? (
                          <div>
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {payable > 0 ? formatRupiah(payable) : <span className="text-emerald-600">Selesai</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Plafon: {formatRupiah(p.total_agreed_team_honor)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* 5. Aksi Cepat */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && receivable > 0 && (
                            <button
                              onClick={() => onOpenPayment(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition cursor-pointer flex items-center gap-1"
                              title="Catat Pembayaran Klien"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Bayar</span>
                            </button>
                          )}

                          <button
                            onClick={() => onOpenDetail(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold text-[11px] shadow-2xs transition cursor-pointer"
                            title="Buka Rincian Proyek"
                          >
                            Detail
                          </button>

                          <button
                            onClick={() => onOpenWhatsApp(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="WhatsApp Tagihan"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer: Clean Summary */}
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950 font-bold text-xs text-slate-900 dark:text-white">
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-bold">TOTAL RINGKASAN</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono">{formatRupiah(totals.contract)}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      Masuk: {formatRupiah(totals.paidClient)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                    {formatRupiah(totals.receivable)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono">{formatRupiah(totals.payableTeam)}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-medium">
                      Plafon: {formatRupiah(totals.teamHonor)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-[11px] text-slate-500 font-mono">
                    Kas: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(totals.paidClient - totals.paidTeam)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: RESPONSIVE CARDS GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const receivable = parseFloat(p.client_receivable_remaining) || 0;
            const paidPercent = calcPercent(p.total_paid_by_client, p.total_contract_value);

            return (
              <div 
                key={p.project_id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(p.project_name)}
                      </div>
                      <div>
                        <h3 
                          onClick={() => onOpenDetail(p)}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer transition line-clamp-1"
                        >
                          {p.project_name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {p.client_name}
                        </p>
                      </div>
                    </div>

                    {receivable > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300">
                        Piutang
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300">
                        Lunas
                      </span>
                    )}
                  </div>

                  {/* Financial Metrics in Card */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Nilai Kontrak:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(p.total_contract_value)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Sudah Diterima:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(p.total_paid_by_client)} ({paidPercent}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-rose-600 dark:text-rose-400">Sisa Piutang:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatRupiah(receivable)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Quick Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onOpenDetail(p)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
                  >
                    Buka Rincian Proyek
                  </button>
                  {canEdit && receivable > 0 && (
                    <button
                      onClick={() => onOpenPayment(p)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                      title="Catat Pembayaran"
                    >
                      Bayar
                    </button>
                  )}
                  <button
                    onClick={() => onOpenWhatsApp(p)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada proyek yang sesuai</h4>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
        </div>
      )}

    </div>
  );
}
