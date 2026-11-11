import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt, 
  Users, 
  Send, 
  CreditCard, 
  ArrowRight, 
  Clock, 
  FolderKanban,
  Check,
  Building2,
  ExternalLink
} from 'lucide-react';
import { formatRupiah } from '../../utils/format';

export default function FilamentDailyBriefingModal({
  isOpen,
  onClose,
  data,
  onOpenWhatsApp,
  onOpenPayment,
  onOpenDetail,
  onSelectTab,
  appSettings
}) {
  if (!isOpen) return null;

  const [dontShowAgainToday, setDontShowAgainToday] = useState(false);

  const summary = data?.summary || {
    total_alerts: 0,
    urgent_count: 0,
    today_count: 0,
    total_terms_amount_formatted: 'Rp 0',
    total_receivables_amount_formatted: 'Rp 0',
    total_subkon_amount_formatted: 'Rp 0'
  };

  const items = data?.items || [];
  const urgentItems = items.filter(it => it.urgency === 'critical' || it.urgency === 'high');
  const otherItems = items.filter(it => it.urgency !== 'critical' && it.urgency !== 'high');

  const handleClose = () => {
    if (dontShowAgainToday) {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('procash_briefing_dismissed_date', todayStr);
    }
    onClose();
  };

  const companyName = appSettings?.company_name || 'RAHMAT-KARYA';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[90vh] my-auto">
        
        {/* Header Hero Banner */}
        <div className="relative p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white overflow-hidden shrink-0">
          {/* Subtle background glow */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-mono">
                    PENGINGAT HARIAN KAS
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-[11px] text-white/70 font-medium">
                    {companyName}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Ringkasan Agenda Finansial Hari Ini
                </h3>
                <p className="text-[11px] text-white/70 mt-0.5 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3 h-3 text-white/50" />
                  <span>{data?.today_formatted || 'Hari Ini'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Tutup Ringkasan"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Metric Highlights (3 Cards) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-3 sm:mt-3.5">
            {/* Termin */}
            <div 
              onClick={() => {
                if (onSelectTab) {
                  onSelectTab('projects');
                  onClose();
                }
              }}
              className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition cursor-pointer"
              title="Klik untuk membuka Tagihan Termin"
            >
              <div className="flex items-center justify-between text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span className="truncate">Tagihan Termin</span>
                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-300 ml-1" />
              </div>
              <div className="text-xs sm:text-base font-black text-white font-mono truncate" title={summary.total_terms_amount_formatted}>
                {summary.total_terms_amount_formatted}
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/60 mt-0.5 truncate">
                {summary.terms_count || 0} termin perlu penagihan
              </div>
            </div>

            {/* Piutang Klien */}
            <div 
              onClick={() => {
                if (onSelectTab) {
                  onSelectTab('receivables');
                  onClose();
                }
              }}
              className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition cursor-pointer"
              title="Klik untuk membuka Monitoring Piutang"
            >
              <div className="flex items-center justify-between text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span className="truncate">Piutang Klien</span>
                <Receipt className="w-3.5 h-3.5 shrink-0 text-rose-300 ml-1" />
              </div>
              <div className="text-xs sm:text-base font-black text-white font-mono truncate" title={summary.total_receivables_amount_formatted}>
                {summary.total_receivables_amount_formatted}
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/60 mt-0.5 truncate">
                {summary.receivables_count || 0} proyek sisa piutang
              </div>
            </div>

            {/* Honor Subkon */}
            <div 
              onClick={() => {
                if (onSelectTab) {
                  onSelectTab('team');
                  onClose();
                }
              }}
              className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition cursor-pointer"
              title="Klik untuk membuka Honor Tim Subkon"
            >
              <div className="flex items-center justify-between text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span className="truncate">Honor Subkon</span>
                <Users className="w-3.5 h-3.5 shrink-0 text-emerald-300 ml-1" />
              </div>
              <div className="text-xs sm:text-base font-black text-white font-mono truncate" title={summary.total_subkon_amount_formatted}>
                {summary.total_subkon_amount_formatted}
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/60 mt-0.5 truncate">
                {summary.subkon_count || 0} rekan tim menanti
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Action Items */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Urgent / Priority Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Prioritas Tindakan Mendesak
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                {urgentItems.length} Agenda
              </span>
            </div>

            {urgentItems.length === 0 ? (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Bagus sekali! Tidak ada tagihan termin lewat tempo atau risiko kritis hari ini.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded font-mono bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                          {item.badge_text}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {item.project_name}
                        </span>
                        {item.client_name && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            • {item.client_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {item.message}
                      </p>
                      {item.amount > 0 && (
                        <div className="mt-1 text-xs font-black text-rose-700 dark:text-rose-400 font-mono">
                          Nominal: {item.amount_formatted}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {item.wa_url && (
                        <a
                          href={item.wa_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
                          title="Kirim WhatsApp Tagihan"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim WA</span>
                        </a>
                      )}

                      {item.action_type === 'open_payment' && onOpenPayment && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenPayment({ id: item.project_id, project_name: item.project_name });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Catat Lunas</span>
                        </button>
                      )}

                      {item.action_type === 'open_detail' && onOpenDetail && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDetail({ id: item.project_id, project_name: item.project_name });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                        >
                          <span>Rincian</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regular Upcoming / Monitoring Section */}
          {otherItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Agenda Mendatang Minggu Ini & Monitoring Piutang
                </h4>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {otherItems.length} Item
                </span>
              </div>

              <div className="space-y-1.5">
                {otherItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.badge_text}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.amount > 0 && (
                        <span className="font-black text-slate-900 dark:text-white font-mono text-[11px]">
                          {item.amount_formatted}
                        </span>
                      )}
                      {item.wa_url && (
                        <a
                          href={item.wa_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 transition"
                          title="Kirim WA"
                        >
                          <Send className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Area */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
            <input
              type="checkbox"
              checked={dontShowAgainToday}
              onChange={(e) => setDontShowAgainToday(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-0"
            />
            <span>Jangan tampilkan otomatis lagi hari ini</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Mulai Kerja & Selesaikan Tagihan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
