import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Copy, Check } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

export default function FilamentWhatsAppModal({ isOpen, project, onClose, showToast }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (project) {
      setPhone(project.client_phone || '');
      const receivable = formatRupiah(project.client_receivable_remaining);
      const text = `Halo Bapak/Ibu ${project.client_name},\n\nSemoga sehat dan sukses selalu. Kami ingin mengonfirmasi mengenai kelanjutan administrasi untuk *${project.project_name}*.\n\nBerdasarkan catatan rekapitulasi kami, sisa tagihan yang masih terbuka adalah sebesar *${receivable}*.\n\nBerikut kami lampirkan nomor rekening untuk kemudahan pembayaran:\nBank BCA: 123-456-7890 a.n Tim Manajemen Keuangan\n\nMohon konfirmasinya jika pembayaran telah disalurkan. Terima kasih banyak atas kerjasamanya! 🙏`;
      setMessage(text);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSendWA = () => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    if (!clean) {
      showToast('Nomor WhatsApp klien belum diisi!', 'warning');
      return;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showToast('Teks pesan WhatsApp disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">Kirim Reminder WhatsApp</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp Tujuan</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789 atau 628123456789"
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Draft Pesan Tagihan Otomatis</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
              </button>
            </div>
            <textarea
              rows="7"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSendWA}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition"
            >
              <Send className="w-4 h-4" />
              <span>Buka WhatsApp Web / App</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
