import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function FilamentNotification({ toast, onClose }) {
  if (!toast || !toast.show) return null;

  const isError = toast.type === 'danger' || toast.isError;
  const isWarning = toast.type === 'warning';
  const isSuccess = !isError && !isWarning;

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-colors ${
        isError 
          ? 'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-900 dark:text-rose-100'
          : isWarning
          ? 'bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-amber-950/90 dark:border-amber-900 dark:text-amber-100'
          : 'bg-white/95 border-slate-200/90 text-slate-800 dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-100'
      }`}>
        <div className="shrink-0 mt-0.5">
          {isError ? (
            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">
            {toast.title || (isError ? 'Terjadi Kesalahan' : isWarning ? 'Peringatan' : 'Berhasil')}
          </h4>
          <p className="text-xs leading-relaxed opacity-90 font-medium">
            {toast.message}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
