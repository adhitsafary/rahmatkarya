import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { apiAddClientPayment } from '../../services/api';
import { formatRupiah } from '../../utils/format';

export default function FilamentPaymentModal({ isOpen, project, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({
    amount_paid: '',
    payment_type: 'TERMIN',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'TRANSFER BCA',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiAddClientPayment({
      project_id: project.project_id,
      ...form
    });
    if (res.success) {
      showToast(res.message || 'Pembayaran klien berhasil dicatat!');
      onSuccess();
      onClose();
    } else {
      showToast(res.message || 'Gagal menyimpan pembayaran', 'danger');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Catat Pembayaran Klien</h3>
            <p className="text-xs text-slate-400 mt-0.5">{project.project_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold">Sisa Piutang:</span>
          <span className="font-mono font-black text-rose-600 dark:text-rose-400">
            {formatRupiah(project.client_receivable_remaining)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nominal yang Diterima (Rp)</label>
            <input
              type="number"
              required
              value={form.amount_paid}
              onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
              placeholder="misal: 2500000"
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Pembayaran</label>
              <select
                value={form.payment_type}
                onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="TERMIN">Termin Pembayaran</option>
                <option value="DOWN_PAYMENT">Uang Muka (DP)</option>
                <option value="FULL_PAYMENT">Pelunasan Penuh</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Bayar</label>
              <input
                type="date"
                required
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Metode Pembayaran</label>
            <input
              type="text"
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              placeholder="TRANSFER BCA, MANDIRI, CASH..."
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Keterangan invoice..."
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-md shadow-emerald-600/25 transition"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
