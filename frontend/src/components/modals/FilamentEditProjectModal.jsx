import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Save, Calendar, Building, Phone, Mail, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiUpdateProject } from '../../services/api';
import { formatNumberWithDots, parseNumberFromDots } from '../../utils/format';

export default function FilamentEditProjectModal({ 
  isOpen, 
  project, 
  onClose, 
  onSuccess, 
  showToast 
}) {
  const modalScrollRef = useRef(null);
  const [form, setForm] = useState({
    id: '',
    project_name: '',
    contract_number: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    total_contract_value: '',
    start_date: '',
    deadline_date: '',
    workflow_step: 'PENGERJAAN',
    status: 'ACTIVE',
    progress_percent: 0,
    max_revisions: 3,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
    if (project) {
      setForm({
        id: project.project_id || project.id || '',
        project_name: project.project_name || '',
        contract_number: project.contract_number || '',
        client_name: project.client_name || '',
        client_phone: project.client_phone || '',
        client_email: project.client_email || '',
        total_contract_value: formatNumberWithDots(project.total_contract_value || ''),
        start_date: project.start_date || '',
        deadline_date: project.deadline_date || '',
        workflow_step: project.workflow_step || 'PENGERJAAN',
        status: project.status || project.project_status || 'ACTIVE',
        progress_percent: project.progress_percent !== undefined ? project.progress_percent : 0,
        max_revisions: project.max_revisions || 3,
        notes: project.notes || project.project_detail || ''
      });
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const totalContractNum = parseFloat(parseNumberFromDots(form.total_contract_value)) || 0;
  const alreadyPaidClient = parseFloat(project?.total_paid_by_client ?? project?.total_paid ?? 0);
  const isInvalidEditContract = alreadyPaidClient > 0 && totalContractNum > 0 && totalContractNum < alreadyPaidClient;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const totalContract = parseFloat(parseNumberFromDots(form.total_contract_value)) || 0;

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
      setErrorMessage('Total Nilai Kontrak (Rp) wajib lebih besar dari 0.');
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
      return;
    }

    if (alreadyPaidClient > 0 && totalContract < alreadyPaidClient) {
      setErrorMessage(`Nilai Kontrak baru (Rp ${formatNumberWithDots(totalContract)}) tidak boleh lebih kecil dari total pembayaran/DP yang sudah diterima (Rp ${formatNumberWithDots(alreadyPaidClient)}).`);
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
      return;
    }

    setLoading(true);

    const payload = {
      id: form.id,
      project_id: form.id,
      project_name: form.project_name.trim(),
      contract_number: form.contract_number.trim(),
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      client_email: form.client_email.trim(),
      total_contract_value: totalContract,
      start_date: form.start_date || null,
      deadline_date: form.deadline_date || null,
      workflow_step: form.workflow_step,
      status: form.status,
      progress_percent: parseInt(form.progress_percent, 10) || 0,
      max_revisions: parseInt(form.max_revisions, 10) || 3,
      notes: form.notes.trim()
    };

    const res = await apiUpdateProject(payload);
    if (res.success) {
      showToast(res.message || 'Data proyek berhasil diperbarui!');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      const err = res.message || 'Gagal memperbarui data proyek';
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
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Informasi Proyek</h3>
              <p className="text-xs text-slate-500 font-mono">{project.project_code || `ID: #${project.project_id || project.id}`}</p>
            </div>
          </div>
          <button 
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
              <span className="font-bold block mb-0.5">Gagal Menyimpan:</span>
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

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          {/* Row 1: Nama Proyek & No SPK */}
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
                placeholder="misal: Desain Arsitektur Rumah Tinggal 2 Lantai"
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
                placeholder="misal: SPK/2026/001"
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

          {/* Row 3: Nilai Kontrak & Tanggal Mulai / Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Nilai Kontrak (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={form.total_contract_value}
                onChange={(e) => setForm({ ...form, total_contract_value: formatNumberWithDots(e.target.value) })}
                placeholder="misal: 10.000.000"
                className={`w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border font-mono font-bold focus:outline-none focus:ring-2 transition ${
                  isInvalidEditContract
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

          {/* Validation Warning for Contract < Total Paid */}
          {isInvalidEditContract && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Invalid: Nilai Kontrak Lebih Kecil dari Total Pembayaran!</span>
                Nilai Kontrak (Rp {formatNumberWithDots(totalContractNum)}) tidak boleh lebih kecil dari total pembayaran klien yang sudah diterima (Rp {formatNumberWithDots(alreadyPaidClient)}).
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
              placeholder="Catatan kebutuhan klien, termin pembayaran, spesifikasi desain, luas bangunan, dll..."
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
              disabled={loading || isInvalidEditContract}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
