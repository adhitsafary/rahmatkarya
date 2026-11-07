import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { apiDeleteProject } from '../../services/api';

export default function FilamentDeleteConfirmModal({
  isOpen,
  project,
  onClose,
  onSuccess,
  showToast
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    setLoading(true);
    const projectId = project.project_id || project.id;
    const res = await apiDeleteProject(projectId);
    if (res.success) {
      showToast(res.message || 'Proyek berhasil dihapus.', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      showToast(res.message || 'Gagal menghapus proyek.', 'danger');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
        
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Hapus Proyek Ini?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tindakan ini tidak dapat dibatalkan. Seluruh data tagihan, pembayaran, dan alokasi tim untuk proyek ini akan dihapus secara permanen.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Target Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
              {project.project_code || `#${project.project_id || project.id}`}
            </span>
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {project.project_name}
            </span>
          </div>
          <p className="text-slate-500">
            Klien: <strong className="text-slate-700 dark:text-slate-300">{project.client_name}</strong>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Menghapus...' : 'Ya, Hapus Proyek'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
