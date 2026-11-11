import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt, 
  Users, 
  ExternalLink, 
  X, 
  Send, 
  RefreshCw, 
  CreditCard, 
  Sparkles,
  ChevronRight,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  apiGetDailyNotifications, 
  apiDismissNotification, 
  apiClearDismissedNotifications 
} from '../../services/api';
import { formatRupiah } from '../../utils/format';

export default function FilamentNotificationDropdown({
  onOpenDailyBriefing,
  onOpenWhatsApp,
  onOpenPayment,
  onOpenDetail,
  onSelectTab,
  showToast
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all, terms, receivables, subkon, deadlines
  const [desktopNotifGranted, setDesktopNotifGranted] = useState(false);
  const dropdownRef = useRef(null);

  // Check desktop notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopNotifGranted(Notification.permission === 'granted');
    }
  }, []);

  // Fetch notifications
  const loadNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiGetDailyNotifications();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(true);
    // Poll every 3 minutes for live updates
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 180000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Request Desktop Notification Permission
  const handleRequestDesktopPermission = async () => {
    if (!('Notification' in window)) {
      if (showToast) showToast('Browser Anda tidak mendukung Web Desktop Notification.', 'warning');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setDesktopNotifGranted(true);
        if (showToast) showToast('Notifikasi desktop harian berhasil diaktifkan!');
        new Notification('ProCash Tracker', {
          body: 'Notifikasi desktop pengingat harian aktif. Anda akan menerima pengingat tagihan dan honor setiap hari.',
          icon: '/favicon.svg'
        });
      } else {
        setDesktopNotifGranted(false);
        if (showToast) showToast('Izin notifikasi desktop ditolak oleh browser.', 'warning');
      }
    } catch (e) {
      if (showToast) showToast('Gagal mengaktifkan notifikasi: ' + e.message, 'danger');
    }
  };

  // Dismiss a notification item for today
  const handleDismiss = async (e, notifKey) => {
    e.stopPropagation();
    try {
      const res = await apiDismissNotification(notifKey);
      if (res.success) {
        // Optimistically remove from state
        setData(prev => {
          if (!prev) return prev;
          const filteredItems = prev.items.filter(it => it.id !== notifKey);
          return {
            ...prev,
            summary: {
              ...prev.summary,
              total_alerts: Math.max(0, prev.summary.total_alerts - 1)
            },
            items: filteredItems
          };
        });
        if (showToast) showToast('Notifikasi disembunyikan untuk hari ini.');
      }
    } catch {
      // ignore
    }
  };

  // Restore all dismissed notifications for today
  const handleRestoreDismissed = async () => {
    try {
      const res = await apiClearDismissedNotifications();
      if (res.success) {
        if (showToast) showToast('Semua notifikasi hari ini dipulihkan.');
        loadNotifications();
      }
    } catch {
      // ignore
    }
  };

  const summary = data?.summary || { total_alerts: 0, urgent_count: 0, today_count: 0 };
  const items = data?.items || [];

  const filteredItems = items.filter(it => {
    if (activeFilter === 'all') return true;
    return it.category === activeFilter;
  });

  const urgentTotal = summary.urgent_count || 0;
  const hasAlerts = items.length > 0;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
          isOpen
            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
            : hasAlerts
            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 shadow-2xs'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400'
        }`}
        title="Pengingat & Notifikasi Harian"
        aria-label="Notifikasi Harian"
      >
        <div className="relative">
          <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${urgentTotal > 0 ? 'text-rose-500 animate-wiggle' : ''}`} />
          {hasAlerts && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                urgentTotal > 0 ? 'bg-rose-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                urgentTotal > 0 ? 'bg-rose-500' : 'bg-amber-500'
              }`}></span>
            </span>
          )}
        </div>

        {hasAlerts && (
          <span className={`hidden sm:inline-flex items-center text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono ${
            isOpen
              ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
              : urgentTotal > 0
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
          }`}>
            {items.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[92vw] sm:w-[440px] md:w-[480px] max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[82vh]">
          
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    Pengingat & Notifikasi Harian
                    {items.length > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded font-mono ${
                        urgentTotal > 0 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {urgentTotal > 0 ? `${urgentTotal} Mendesak` : `${items.length} Perhatian`}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {data?.today_formatted || 'Monitoring Penagihan, Termin, Piutang & Honor'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadNotifications()}
                  disabled={loading}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
                  title="Segarkan Notifikasi"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Banner: Daily Briefing Button & Desktop Alert Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenDailyBriefing) onOpenDailyBriefing();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-2xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                <span>Buka Rekap Harian (Briefing)</span>
              </button>

              {!desktopNotifGranted && (
                <button
                  type="button"
                  onClick={handleRequestDesktopPermission}
                  className="inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold py-1.5 px-2.5 rounded-xl transition"
                  title="Aktifkan pengingat desktop di layar komputer"
                >
                  <Bell className="w-3 h-3 text-blue-500" />
                  <span>Notif Desktop</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-3 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'all', label: 'Semua', count: items.length },
                { id: 'terms', label: 'Termin', count: data?.categories?.terms?.length || 0 },
                { id: 'receivables', label: 'Piutang', count: data?.categories?.receivables?.length || 0 },
                { id: 'subkon', label: 'Honor Subkon', count: data?.categories?.subkon?.length || 0 },
                { id: 'deadlines', label: 'Deadline', count: data?.categories?.deadlines?.length || 0 }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-[9px] px-1 rounded-full font-mono ${
                      activeFilter === tab.id
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 sm:p-3 space-y-2">
            {filteredItems.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                  Tidak Ada Tagihan Mendesak
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Semua termin, piutang klien, dan honor subkon dalam kategori ini dalam keadaan aman dan lancar!
                </p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isCritical = item.urgency === 'critical';
                const isHigh = item.urgency === 'high';
                const isMedium = item.urgency === 'medium';

                const borderAccent = isCritical
                  ? 'border-l-4 border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                  : isHigh
                  ? 'border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
                  : isMedium
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
                  : 'border-l-4 border-l-slate-300 dark:border-l-slate-600';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 transition hover:shadow-xs ${borderAccent}`}
                  >
                    {/* Top Row: Category, Badge, Due Date & Dismiss */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded font-mono ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : isMedium
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {item.badge_text}
                        </span>

                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[140px]">
                          {item.project_name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDismiss(e, item.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
                        title="Sembunyikan untuk hari ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Middle: Title & Message */}
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white mb-1 leading-snug">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                      {item.message}
                    </p>

                    {/* Bottom: Amount in Rupiah & Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div>
                        {item.amount > 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] text-slate-400 font-medium">Nominal:</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                              {item.amount_formatted}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {item.client_name ? `Klien: ${item.client_name}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* WhatsApp Action Button */}
                        {item.wa_url && (
                          <a
                            href={item.wa_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs"
                            title="Kirim Pengingat WhatsApp Langsung"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Kirim WA</span>
                          </a>
                        )}

                        {/* Secondary Modal Trigger Buttons */}
                        {item.action_type === 'open_payment' && onOpenPayment && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenPayment({ id: item.project_id, project_name: item.project_name });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold transition"
                            title="Catat Realisasi Pembayaran Termin"
                          >
                            <CreditCard className="w-2.5 h-2.5" />
                            <span>Catat Lunas</span>
                          </button>
                        )}

                        {item.action_type === 'open_subkon' && onSelectTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onSelectTab('team');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition"
                            title="Buka Menu Honor Subkon"
                          >
                            <Users className="w-2.5 h-2.5" />
                            <span>Bayar Subkon</span>
                          </button>
                        )}

                        {item.action_type === 'open_detail' && onOpenDetail && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenDetail({ id: item.project_id, project_name: item.project_name });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition"
                            title="Buka Rincian Proyek"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>Detail</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            <span className="truncate">
              Total Tagihan Terbuka: <strong className="text-slate-800 dark:text-slate-200 font-mono">{data?.summary?.total_terms_amount_formatted || 'Rp 0'}</strong>
            </span>

            <button
              type="button"
              onClick={handleRestoreDismissed}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Tampilkan kembali notifikasi yang disembunyikan hari ini"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Pulihkan Notif</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
