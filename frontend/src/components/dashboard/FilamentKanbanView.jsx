import React, { useState } from 'react';
import { 
  Eye, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Pencil, 
  Trash2
} from 'lucide-react';
import { formatRupiah, getInitials } from '../../utils/format';
import { apiUpdateWorkflowStep } from '../../services/api';

const WhatsAppIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const WORKFLOW_COLUMNS = [
  {
    id: 'KONTRAK',
    serverKey: 'KONTRAK_DP',
    stepNumber: '1',
    title: 'Kontrak & DP',
    desc: 'Tahap SPK & Uang Muka',
    color: 'blue',
    headerBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    borderTop: 'border-t-blue-500'
  },
  {
    id: 'PENGERJAAN',
    serverKey: 'PENGERJAAN',
    stepNumber: '2',
    title: 'Pengerjaan',
    desc: 'Pengembangan / Fisik',
    color: 'indigo',
    headerBadge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    borderTop: 'border-t-indigo-500'
  },
  {
    id: 'REVISI',
    serverKey: 'REVISI',
    stepNumber: '3',
    title: 'Revisi Mayor',
    desc: 'Kuota 3-5x & Approval Deal',
    color: 'amber',
    headerBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    borderTop: 'border-t-amber-500'
  },
  {
    id: 'PELUNASAN',
    serverKey: 'PEMBAYARAN_AKHIR',
    stepNumber: '4',
    title: 'Pelunasan',
    desc: 'Pembayaran Akhir Sisa SPK',
    color: 'rose',
    headerBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    borderTop: 'border-t-rose-500'
  },
  {
    id: 'DONE',
    serverKey: 'DONE',
    stepNumber: '5',
    title: 'Tuntas (Done)',
    desc: 'Serah Terima & Arsip Selesai',
    color: 'emerald',
    headerBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    borderTop: 'border-t-emerald-500'
  }
];

export default function FilamentKanbanView({
  projects = [],
  canEdit = true,
  onOpenDetail,
  onOpenPayment,
  onOpenWhatsApp,
  onOpenEditProject,
  onDeleteProject,
  onRefresh,
  showToast
}) {
  const [movingId, setMovingId] = useState(null);

  // Normalize project workflow step
  const normalizeStep = (step) => {
    if (!step) return 'KONTRAK';
    const s = step.toUpperCase();
    if (s.includes('KONTRAK') || s.includes('DP')) return 'KONTRAK';
    if (s.includes('REVISI')) return 'REVISI';
    if (s.includes('PELUNASAN') || s.includes('AKHIR')) return 'PELUNASAN';
    if (s.includes('DONE') || s.includes('SELESAI')) return 'DONE';
    return 'PENGERJAAN';
  };

  // Move project to next or previous stage
  const handleMoveStep = async (project, targetColumnKey) => {
    const projId = project.project_id || project.id;
    if (!projId) return;

    setMovingId(projId);
    try {
      const res = await apiUpdateWorkflowStep(projId, targetColumnKey);
      if (res.success) {
        showToast(res.message || 'Tahapan alur berhasil dipindahkan!');
        if (onRefresh) onRefresh();
      } else {
        showToast(res.message || 'Gagal memindahkan tahapan.', 'danger');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi sistem.', 'danger');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="overflow-x-auto pb-4 no-scrollbar">
      <div className="flex gap-3 min-w-[1100px] items-start">
        {WORKFLOW_COLUMNS.map((col, colIdx) => {
          // Filter projects in this column
          const colProjects = projects.filter(p => normalizeStep(p.workflow_step) === col.id);
          const colTotalValue = colProjects.reduce((sum, p) => sum + (parseFloat(p.total_contract_value) || 0), 0);
          const colTotalReceivables = colProjects.reduce((sum, p) => sum + (parseFloat(p.client_receivable_remaining) || 0), 0);

          const nextCol = WORKFLOW_COLUMNS[colIdx + 1] || null;
          const prevCol = WORKFLOW_COLUMNS[colIdx - 1] || null;

          return (
            <div 
              key={col.id} 
              className={`flex-1 min-w-[240px] max-w-[320px] rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 border-t-4 ${col.borderTop} p-3 flex flex-col min-h-[500px] transition-all`}
            >
              
              {/* Column Header */}
              <div className="mb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black flex items-center justify-center font-mono">
                      {col.stepNumber}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight uppercase">
                      {col.title}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${col.headerBadge}`}>
                    {colProjects.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>{col.desc}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatRupiah(colTotalValue)}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh] pr-1">
                {colProjects.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-3 text-slate-400 dark:text-slate-600">
                    <span className="text-[11px] font-medium">Kosong</span>
                    <span className="text-[9px]">Tidak ada proyek di tahap ini</span>
                  </div>
                ) : (
                  colProjects.map((p, idx) => {
                    const receivable = parseFloat(p.client_receivable_remaining) || 0;
                    const contract = parseFloat(p.total_contract_value) || 0;
                    const paid = parseFloat(p.total_paid_by_client) || 0;
                    const paidPercent = calcPercent(paid, contract);
                    const isBusy = movingId === (p.project_id || p.id);

                    return (
                      <div 
                        key={p.project_id || p.id || idx}
                        className={`rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2.5 ${
                          isBusy ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Top: SPK & Progress Badge */}
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                          <span className="text-slate-400 font-bold truncate">
                            {p.contract_number || `PRJ-0${p.id || idx+1}`}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {p.progress_percent || 0}% Fisik
                          </span>
                        </div>

                        {/* Project & Client */}
                        <div>
                          <h5 
                            onClick={() => onOpenDetail(p)}
                            className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition line-clamp-2"
                            title={p.project_name}
                          >
                            {p.project_name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {p.client_name}
                          </p>
                        </div>

                        {/* Financial Micro-Box */}
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-mono space-y-1">
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                            <span>SPK:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(contract)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Sisa Tagihan:</span>
                            <span className={`font-bold ${receivable > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {receivable > 0 ? formatRupiah(receivable) : 'Lunas'}
                            </span>
                          </div>
                        </div>

                        {/* Revision Badge (if in revision stage or revisi > 0) */}
                        {col.id === 'REVISI' && (
                          <div className="flex items-center justify-between px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[10px] font-mono">
                            <span className="text-amber-800 dark:text-amber-300 font-semibold">Kuota:</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {p.current_revision || 0}/{p.max_revisions || 3} {p.revision_deal_status === 'DEAL_APPROVED' ? '(Deal ✓)' : ''}
                            </span>
                          </div>
                        )}

                        {/* Stage Mover Buttons (Next / Prev) */}
                        {canEdit && (
                          <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                            {prevCol && (
                              <button
                                onClick={() => handleMoveStep(p, prevCol.serverKey)}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                                title={`Kembalikan ke: ${prevCol.title}`}
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {nextCol ? (
                              <button
                                onClick={() => handleMoveStep(p, nextCol.serverKey)}
                                className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                title={`Pindahkan ke: ${nextCol.title}`}
                              >
                                <span>Lanjut: {nextCol.title}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <div className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 py-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Tuntas Selesai</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Card Action Toolbar */}
                        <div className="flex items-center justify-between pt-1 text-slate-400">
                          <button
                            onClick={() => onOpenDetail(p)}
                            className="p-1 rounded hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                            title="Rincian Proyek"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && receivable > 0 && (
                            <button
                              onClick={() => onOpenPayment(p)}
                              className="p-1 rounded hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                              title="Catat Pembayaran"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenWhatsApp(p)}
                            className="p-1 rounded hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                            title="Hubungi WA"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => onOpenEditProject && onOpenEditProject(p)}
                                className="p-1 rounded hover:text-amber-600 transition cursor-pointer"
                                title="Edit Proyek"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteProject && onDeleteProject(p)}
                                className="p-1 rounded hover:text-rose-600 transition cursor-pointer"
                                title="Hapus Proyek"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
