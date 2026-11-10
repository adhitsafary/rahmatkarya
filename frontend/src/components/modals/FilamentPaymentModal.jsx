import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { apiAddClientPayment } from '../../services/api';
import { formatRupiah, formatNumberWithDots, parseNumberFromDots } from '../../utils/format';

export default function FilamentPaymentModal({ isOpen, project, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({
    amount_paid: '',
    payment_type: 'TERMIN',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'TRANSFER BCA',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen && project) {
      setErrorMessage(null);
      setForm({
        amount_paid: '',
        payment_type: 'TERMIN',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'TRANSFER BCA',
        notes: ''
      });
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const amountPaidNum = parseFloat(parseNumberFromDots(form.amount_paid)) || 0;
  const receivableRemaining = parseFloat(project?.client_receivable_remaining || 0);
  const isInvalidPaymentAmount = receivableRemaining > 0 && amountPaidNum > receivableRemaining;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountPaid = parseFloat(parseNumberFromDots(form.amount_paid)) || 0;

    if (amountPaid <= 0) {
      setErrorMessage('Nominal pembayaran wajib lebih besar dari Rp 0.');
      return;
    }

    if (receivableRemaining > 0 && amountPaid > receivableRemaining) {
      setErrorMessage(`Nominal pembayaran (Rp ${formatNumberWithDots(amountPaid)}) melebihi sisa piutang proyek (Rp ${formatNumberWithDots(receivableRemaining)}).`);
      return;
    }

    setLoading(true);
    const payload = {
      project_id: project.project_id,
      ...form,
      amount_paid: amountPaid
    };

    const res = await apiAddClientPayment(payload);
    if (res.success) {
      showToast(res.message || 'Pembayaran klien berhasil dicatat!');
      onSuccess();
      onClose();
    } else {
      const err = res.message || 'Gagal menyimpan pembayaran';
      setErrorMessage(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Catat Pembayaran Klien</h3>
            <p className="text-xs text-slate-400 mt-0.5">{project.project_name}</p>
          </div>
          <button onClick={onClose} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Tutup
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

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-bold">Sisa Piutang Terbuka:</span>
          <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
            {formatRupiah(project.client_receivable_remaining)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nominal yang Diterima (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={form.amount_paid}
              onChange={(e) => setForm({ ...form, amount_paid: formatNumberWithDots(e.target.value) })}
              placeholder="misal: 2.500.000"
              className={`w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border font-mono font-bold focus:outline-none focus:ring-2 transition ${
                isInvalidPaymentAmount
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-slate-900 dark:focus:ring-white'
              }`}
            />
            {isInvalidPaymentAmount && (
              <p className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Nominal melebihi sisa piutang ({formatRupiah(receivableRemaining)})</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Pembayaran</label>
              <select
                value={form.payment_type}
                onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
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
                className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
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
              className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
            <textarea
              rows="2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Keterangan transaksi termin..."
              className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidPaymentAmount}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold shadow-xs transition cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
