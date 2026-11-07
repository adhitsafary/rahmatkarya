import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, FolderPlus, AlertCircle } from 'lucide-react';
import { apiCreateProject } from '../../services/api';
import { formatNumberWithDots, parseNumberFromDots } from '../../utils/format';

export default function FilamentCreateProjectModal({ isOpen, onClose, onSuccess, showToast }) {
  const modalScrollRef = useRef(null);
  const [form, setForm] = useState({
    project_name: '',
    contract_number: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    total_contract_value: '',
    initial_dp: '',
    start_date: new Date().toISOString().split('T')[0],
    deadline_date: '',
    status: 'ACTIVE',
    workflow_step: 'PENGERJAAN',
    progress_percent: 0,
    max_revisions: 3,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setForm({
        project_name: '',
        contract_number: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        total_contract_value: '',
        initial_dp: '',
        start_date: new Date().toISOString().split('T')[0],
        deadline_date: '',
        status: 'ACTIVE',
        workflow_step: 'PENGERJAAN',
        progress_percent: 0,
        max_revisions: 3,
        notes: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalContractNum = parseNumberFromDots(form.total_contract_value);
  const initialDpNum = parseNumberFromDots(form.initial_dp);
  const isInvalidDp = initialDpNum > 0 && totalContractNum > 0 && totalContractNum < initialDpNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const totalContract = parseNumberFromDots(form.total_contract_value);
    const initialDp = parseNumberFromDots(form.initial_dp);

    if (!form.project_name.trim()) {
      setErrorMessage('Nama proyek wajib diisi.');
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
      return;
    }

    if (!form.client_name.trim()) {
      setErrorMessage('Nama klien / perusahaan wajib diisi.');
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
      return;
    }

    if (totalContract <= 0) {
      setErrorMessage('Nilai Kontrak (Rp) wajib diisi dan harus lebih besar dari 0.');
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
      return;
    }

    if (initialDp < 0) {
      setErrorMessage('DP Awal tidak boleh bernilai negatif.');
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
      return;
    }

    if (initialDp > totalContract) {
      setErrorMessage(`Nilai Kontrak (Rp ${formatNumberWithDots(totalContract)}) tidak boleh lebih kecil dari DP Awal (Rp ${formatNumberWithDots(initialDp)}). Silakan sesuaikan nominal terlebih dahulu.`);
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
      return;
    }

    setLoading(true);

    const payload = {
      project_name: form.project_name.trim(),
      contract_number: form.contract_number.trim(),
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      client_email: form.client_email.trim(),
      total_contract_value: totalContract,
      initial_dp: initialDp,
      start_date: form.start_date || null,
      deadline_date: form.deadline_date || null,
      status: form.status,
      workflow_step: form.workflow_step,
      progress_percent: parseInt(form.progress_percent, 10) || 0,
      max_revisions: parseInt(form.max_revisions, 10) || 3,
      notes: form.notes.trim()
    };

    const res = await apiCreateProject(payload);
    if (res.success) {
      showToast(res.message || 'Proyek baru berhasil dibuat!');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      const err = res.message || 'Gagal membuat proyek. Silakan periksa kembali formulir Anda.';
      setErrorMessage(err);
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        ref={modalScrollRef}
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Tambah Proyek Baru</h3>
              <p className="text-xs text-slate-500 font-mono">Catat kontrak baru, uang muka (DP), dan parameter pengerjaan</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Box inside Modal */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-bold block mb-0.5">Gagal Menyimpan Proyek:</span>
              <span className="leading-relaxed break-words">{errorMessage}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setErrorMessage(null)} 
              className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          {/* Row 1: Nama Proyek & No Kontrak / SPK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Proyek <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.project_name}
                onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                placeholder="misal: Aplikasi E-Commerce & POS"
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                No Kontrak / SPK
              </label>
              <input
                type="text"
                value={form.contract_number}
                onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                placeholder="misal: SPK/2026/001 (Otomatis jika kosong)"
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Klien & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Klien / Perusahaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="misal: Mas Doni / PT Jaya"
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                No WhatsApp Klien
              </label>
              <input
                type="text"
                value={form.client_phone}
                onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                placeholder="08123456789"
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Klien
              </label>
              <input
                type="email"
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                placeholder="klien@email.com"
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Nilai Kontrak, DP Awal & Jadwal */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nilai Kontrak (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={form.total_contract_value}
                onChange={(e) => setForm({ ...form, total_contract_value: formatNumberWithDots(e.target.value) })}
                placeholder="misal: 15.000.000"
                className={`w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border font-mono font-bold focus:outline-none focus:ring-2 transition ${
                  isInvalidDp
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                DP Awal (Jika Ada)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.initial_dp}
                onChange={(e) => setForm({ ...form, initial_dp: formatNumberWithDots(e.target.value) })}
                placeholder="misal: 5.000.000"
                className={`w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border font-mono font-bold focus:outline-none focus:ring-2 transition ${
                  isInvalidDp
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={form.deadline_date}
                onChange={(e) => setForm({ ...form, deadline_date: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Validation Warning when DP Awal > Nilai Kontrak */}
          {isInvalidDp && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Invalid: Nilai Kontrak Lebih Kecil dari DP Awal!</span>
                Nilai Kontrak (Rp {formatNumberWithDots(totalContractNum)}) tidak boleh lebih kecil dari DP Awal (Rp {formatNumberWithDots(initialDpNum)}). Maksimal DP Awal adalah sebesar Nilai Kontrak.
              </div>
            </div>
          )}

          {/* Row 4: Status Proyek, Tahap Workflow, Progres & Revisi */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Proyek
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="ACTIVE">Aktif (ACTIVE)</option>
                <option value="COMPLETED">Selesai (COMPLETED)</option>
                <option value="ARCHIVED">Arsip (ARCHIVED)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tahap Workflow
              </label>
              <select
                value={form.workflow_step}
                onChange={(e) => setForm({ ...form, workflow_step: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="KONTRAK_DP">Kontrak & DP</option>
                <option value="PENGERJAAN">Pengerjaan</option>
                <option value="REVISI">Tahap Revisi</option>
                <option value="PEMBAYARAN_AKHIR">Pelunasan Akhir</option>
                <option value="DONE">Selesai (Deal)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Progres Pengerjaan (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.progress_percent}
                onChange={(e) => setForm({ ...form, progress_percent: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kuota Maks Revisi
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.max_revisions}
                onChange={(e) => setForm({ ...form, max_revisions: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 5: Catatan Tambahan */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan & Ruang Lingkup Proyek
            </label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan kebutuhan klien, termin, server, ruang lingkup..."
              className="w-full rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidDp}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Menyimpan Proyek...' : 'Simpan Proyek'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
