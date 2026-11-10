import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Eye
} from 'lucide-react';
import { formatRupiah, calcPercent, getInitials } from '../../utils/format';
import FilamentKanbanView from './FilamentKanbanView';

// Crisp authentic WhatsApp SVG icon
const WhatsAppIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function FilamentTable({
  projects,
  loading,
  currentFilter,
  setFilter,
  searchQuery = '',
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenDetail,
  onOpenPayment,
  onOpenWhatsApp,
  onOpenEditProject,
  onDeleteProject,
  canEdit = true,
  onRefresh,
  showToast
}) {
  const [selectedSort, setSelectedSort] = useState('default');

  // Dynamic filter counts
  const counts = useMemo(() => {
    let all = projects.length;
    let needBilling = 0;
    let needPayout = 0;
    let settled = 0;

    projects.forEach(p => {
      const rec = parseFloat(p.client_receivable_remaining) || 0;
      const pay = parseFloat(p.team_payable_remaining) || 0;
      if (rec > 0) needBilling++;
      if (pay > 0) needPayout++;
      if (rec <= 0 && pay <= 0) settled++;
    });

    return { all, needBilling, needPayout, settled };
  }, [projects]);

  // Calculate totals for summary footer
  const totals = useMemo(() => {
    return projects.reduce((acc, p) => ({
      contract: acc.contract + (parseFloat(p.total_contract_value) || 0),
      paidClient: acc.paidClient + (parseFloat(p.total_paid_by_client) || 0),
      receivable: acc.receivable + (parseFloat(p.client_receivable_remaining) || 0),
      teamHonor: acc.teamHonor + (parseFloat(p.total_agreed_team_honor) || 0),
      paidTeam: acc.paidTeam + (parseFloat(p.total_paid_to_team) || 0),
      payableTeam: acc.payableTeam + (parseFloat(p.team_payable_remaining) || 0),
    }), { contract: 0, paidClient: 0, receivable: 0, teamHonor: 0, paidTeam: 0, payableTeam: 0 });
  }, [projects]);

  // Sorted projects if sort dropdown is used
  const sortedProjects = useMemo(() => {
    let list = [...projects];
    if (selectedSort === 'highest_contract') {
      list.sort((a, b) => (parseFloat(b.total_contract_value) || 0) - (parseFloat(a.total_contract_value) || 0));
    } else if (selectedSort === 'highest_receivable') {
      list.sort((a, b) => (parseFloat(b.client_receivable_remaining) || 0) - (parseFloat(a.client_receivable_remaining) || 0));
    } else if (selectedSort === 'newest') {
      list.sort((a, b) => (b.project_id || b.id || 0) - (a.project_id || a.id || 0));
    }
    return list;
  }, [projects, selectedSort]);

  return (
    <div className="space-y-3">
      
      {/* ================================================================= */}
      {/* 1. FILTER TABS (PILLS) - Modern capsule pills matching Image 2    */}
      {/* ================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: `Semua Proyek (${counts.all})` },
          { id: 'need_billing', label: `Perlu Ditagih (${counts.needBilling})` },
          { id: 'need_payout', label: `Tanggungan Tim (${counts.needPayout})` },
          { id: 'settled', label: `Lunas Selesai (${counts.settled})` }
        ].map(tab => {
          const isActive = currentFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* 2. SUB-FILTER & SEARCH ROW - Compact console layout               */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder="Cari nama proyek, klien, nomor SPK..."
            className="w-full text-xs rounded-xl pl-3.5 pr-12 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition font-sans"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery && setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400 pointer-events-none">
              Ctrl+K
            </span>
          )}
        </div>

        {/* Right: Dropdown + Showing Count + Table/Cards Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs shrink-0">
          
          {/* Dropdown Sort */}
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="default">Semua Status</option>
              <option value="highest_contract">Kontrak Terbesar</option>
              <option value="highest_receivable">Piutang Terbesar</option>
              <option value="newest">Proyek Terbaru</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Showing Count */}
          <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
            Menampilkan <strong className="text-slate-900 dark:text-white">{sortedProjects.length}</strong> dari {projects.length} Proyek
          </span>

          {/* Segmented Table / Cards / Pipeline Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Tabel
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Kartu
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Pipeline
            </button>
          </div>

        </div>

      </div>

      {/* ================================================================= */}
      {/* 3. TABLE VIEW - Dense, High-Contrast Console Style                */}
      {/* ================================================================= */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b uppercase font-bold tracking-wider bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-800 text-[10px]">
                  <th className="py-2.5 px-3.5">KODE / SPK</th>
                  <th className="py-2.5 px-3 text-center w-10">NO</th>
                  <th className="py-2.5 px-3.5">PROYEK & KLIEN</th>
                  <th className="py-2.5 px-3.5 text-right">NILAI KONTRAK</th>
                  <th className="py-2.5 px-3.5 text-right">TERMIN MASUK</th>
                  <th className="py-2.5 px-3.5 text-center">STATUS</th>
                  <th className="py-2.5 px-3.5 text-right">SISA PIUTANG</th>
                  <th className="py-2.5 px-3.5 text-right">HONOR SUBKON</th>
                  <th className="py-2.5 px-3.5 text-center w-44">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {sortedProjects.map((p, idx) => {
                  const receivable = parseFloat(p.client_receivable_remaining) || 0;
                  const payable = parseFloat(p.team_payable_remaining) || 0;
                  const paidPercent = calcPercent(p.total_paid_by_client, p.total_contract_value);
                  const isSettled = receivable <= 0;
                  const codeDisplay = p.contract_number ? p.contract_number : `PRJ-0${idx + 1}`;

                  return (
                    <tr 
                      key={p.project_id || p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* 1. KODE / SPK */}
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            {getInitials(p.project_name)}
                          </span>
                          <span className="font-semibold">{codeDisplay}</span>
                        </div>
                      </td>

                      {/* 2. NO */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>

                      {/* 3. PROYEK & KLIEN */}
                      <td className="py-2.5 px-3.5 min-w-[200px]">
                        <div className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition truncate"
                          onClick={() => onOpenDetail(p)}
                          title={p.project_name}
                        >
                          {p.project_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.2">
                          {p.client_name}
                        </div>
                      </td>

                      {/* 4. NILAI KONTRAK */}
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatRupiah(p.total_contract_value)}
                      </td>

                      {/* 5. TERMIN MASUK */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatRupiah(p.total_paid_by_client)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.2">
                          {paidPercent}% Termasuk
                        </div>
                      </td>

                      {/* 6. STATUS - Styled exactly like ● pill in Image 2 */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Belum Lunas
                          </span>
                        )}
                      </td>

                      {/* 7. SISA PIUTANG */}
                      <td className="py-2.5 px-3.5 text-right font-mono whitespace-nowrap">
                        {receivable > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatRupiah(receivable)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            Lunas (Rp 0)
                          </span>
                        )}
                      </td>

                      {/* 8. HONOR SUBKON */}
                      <td className="py-2.5 px-3.5 text-right font-mono whitespace-nowrap">
                        {parseFloat(p.total_agreed_team_honor) > 0 ? (
                          <span className={payable > 0 ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                            {payable > 0 ? formatRupiah(payable) : 'Tuntas'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 9. AKSI - Premium polished micro-button badges */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && receivable > 0 && (
                            <button
                              onClick={() => onOpenPayment(p)}
                              className="w-7 h-7 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                              title="Catat Pembayaran"
                              aria-label="Catat Pembayaran"
                            >
                              <CreditCard className="w-3.5 h-3.5 stroke-[2.2]" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenDetail(p)}
                            className="w-7 h-7 rounded-lg border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                            title="Rincian Proyek"
                            aria-label="Rincian Proyek"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                          </button>

                          <button
                            onClick={() => onOpenWhatsApp(p)}
                            className="w-7 h-7 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                            title="Kirim Pesan WhatsApp"
                            aria-label="Kirim Pesan WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => onOpenEditProject && onOpenEditProject(p)}
                                className="w-7 h-7 rounded-lg border border-amber-200/80 dark:border-amber-800/80 bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                                title="Edit Proyek"
                                aria-label="Edit Proyek"
                              >
                                <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                              </button>
                              <button
                                onClick={() => onDeleteProject && onDeleteProject(p)}
                                className="w-7 h-7 rounded-lg border border-rose-200/80 dark:border-rose-800/80 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                                title="Hapus Proyek"
                                aria-label="Hapus Proyek"
                              >
                                <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer: Summary */}
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 font-bold text-xs text-slate-900 dark:text-white">
                  <td colSpan={3} className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">
                    TOTAL REKAPITULASI ({sortedProjects.length} PROYEK)
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                    {formatRupiah(totals.contract)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatRupiah(totals.paidClient)}
                  </td>
                  <td></td>
                  <td className="py-3 px-3.5 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {formatRupiah(totals.receivable)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {formatRupiah(totals.payableTeam)}
                  </td>
                  <td className="py-3 px-3.5 text-center text-xs text-slate-500 font-mono whitespace-nowrap">
                    Kas: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(totals.paidClient - totals.paidTeam)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. CARDS VIEW (When user chooses Kartu mode)                      */}
      {/* ================================================================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedProjects.map((p, idx) => {
            const receivable = parseFloat(p.client_receivable_remaining) || 0;
            const payable = parseFloat(p.team_payable_remaining) || 0;
            const paidPercent = calcPercent(p.total_paid_by_client, p.total_contract_value);
            const isSettled = receivable <= 0;
            const codeDisplay = p.contract_number ? p.contract_number : `PRJ-0${idx + 1}`;

            return (
              <div 
                key={p.project_id || p.id}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {codeDisplay}
                      </div>
                      <h3 
                        onClick={() => onOpenDetail(p)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition truncate mt-0.5"
                        title={p.project_name}
                      >
                        {p.project_name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.2">
                        {p.client_name}
                      </p>
                    </div>

                    {/* Status Pill Badge */}
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Belum Lunas
                      </span>
                    )}
                  </div>

                  {/* Financial Grid */}
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-mono">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>Kontrak:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(p.total_contract_value)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>Termin Masuk:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(p.total_paid_by_client)} ({paidPercent}%)</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-700 dark:text-slate-300">Sisa Piutang:</span>
                      <span className={`font-black ${receivable > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {receivable > 0 ? formatRupiah(receivable) : 'Rp 0 (Lunas)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => onOpenDetail(p)}
                    className="flex-1 py-1.5 px-2 rounded-xl border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold transition text-center cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                    title="Rincian Proyek"
                  >
                    <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Rincian</span>
                  </button>

                  {canEdit && receivable > 0 && (
                    <button
                      onClick={() => onOpenPayment(p)}
                      className="py-1.5 px-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs transition cursor-pointer text-xs flex items-center justify-center gap-1.5 active:scale-95"
                      title="Catat Pembayaran"
                    >
                      <CreditCard className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Bayar</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenWhatsApp(p)}
                    className="py-1.5 px-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                    title="Kirim Pesan WhatsApp"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </button>

                  {canEdit && (
                    <>
                      <button
                        onClick={() => onOpenEditProject && onOpenEditProject(p)}
                        className="w-7 h-7 rounded-xl border border-amber-200/80 dark:border-amber-800/80 bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                        title="Edit Proyek"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                      <button
                        onClick={() => onDeleteProject && onDeleteProject(p)}
                        className="w-7 h-7 rounded-xl border border-rose-200/80 dark:border-rose-800/80 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                        title="Hapus Proyek"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. PIPELINE (KANBAN) VIEW                                         */}
      {/* ================================================================= */}
      {viewMode === 'kanban' && (
        <FilamentKanbanView
          projects={sortedProjects}
          canEdit={canEdit}
          onOpenDetail={onOpenDetail}
          onOpenPayment={onOpenPayment}
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenEditProject={onOpenEditProject}
          onDeleteProject={onDeleteProject}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {/* Empty State */}
      {sortedProjects.length === 0 && !loading && (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak ada proyek yang sesuai kriteria
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Coba sesuaikan kata kunci pencarian atau alihkan tab filter di atas.
          </p>
        </div>
      )}

    </div>
  );
}