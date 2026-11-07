import React from 'react';
import { X, ShieldCheck, Check, Ban } from 'lucide-react';

export default function FilamentRoleInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const permissions = [
    { feature: 'Melihat Saldo Kas & Dashboard', admin: true, finance: true, viewer: true },
    { feature: 'Menambah Proyek Baru', admin: true, finance: true, viewer: false },
    { feature: 'Catat Pembayaran Klien ( + Bayar )', admin: true, finance: true, viewer: false },
    { feature: 'Tambah Anggota Tim & Alokasi Plafon', admin: true, finance: true, viewer: false },
    { feature: 'Bayar / Cairkan Honor Tim ( + Honor )', admin: true, finance: true, viewer: false },
    { feature: 'Kirim Reminder WhatsApp Penagihan', admin: true, finance: true, viewer: false },
    { feature: 'Cetak Rekap Laporan PDF', admin: true, finance: true, viewer: true },
    { feature: 'Akses Menu "Manajemen Pengguna"', admin: true, finance: 'Ditolak', viewer: 'Ditolak' },
    { feature: 'Tambah Akun User Baru', admin: true, finance: 'Ditolak', viewer: 'Ditolak' },
    { feature: 'Hapus Akun / Ubah Role Staf', admin: true, finance: 'Ditolak', viewer: 'Ditolak' },
    { feature: 'Reset Password Pengguna Lain', admin: true, finance: 'Ditolak', viewer: 'Ditolak' }
  ];

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-black text-sm">
              !
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Panduan Fitur & Hak Akses Role
              </h3>
              <p className="text-xs text-slate-400">
                Rincian perbandingan hak akses antara Admin, Finance, dan Viewer
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Fitur / Aksi</th>
                <th className="py-3 px-3 text-center text-blue-600 dark:text-blue-400 font-bold">Admin</th>
                <th className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">Finance</th>
                <th className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-bold">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                    {p.feature}
                  </td>

                  {/* Admin */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5 font-bold" /> Ya
                    </span>
                  </td>

                  {/* Finance */}
                  <td className="py-2.5 px-3 text-center">
                    {p.finance === true ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 font-bold" /> Ya
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        <X className="w-3.5 h-3.5 font-bold" /> Ditolak
                      </span>
                    )}
                  </td>

                  {/* Viewer */}
                  <td className="py-2.5 px-3 text-center">
                    {p.viewer === true ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 font-bold" /> Ya
                      </span>
                    ) : p.viewer === 'Ditolak' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        <X className="w-3.5 h-3.5 font-bold" /> Ditolak
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        <X className="w-3.5 h-3.5 font-bold" /> Tidak
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Roles Advice Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs">
            <strong className="text-blue-700 dark:text-blue-300 block mb-1 font-bold">Admin</strong>
            <p className="text-slate-600 dark:text-slate-400 leading-snug">
              Untuk pemilik usaha / project lead. Akses 100% penuh termasuk mengelola seluruh user.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs">
            <strong className="text-emerald-700 dark:text-emerald-300 block mb-1 font-bold">Finance</strong>
            <p className="text-slate-600 dark:text-slate-400 leading-snug">
              Untuk bendahara / staf akunting. Mengelola arus kas proyek tanpa akses user management.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <strong className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Viewer</strong>
            <p className="text-slate-600 dark:text-slate-400 leading-snug">
              Untuk tamu / klien pengawas. Hanya melihat angka saldo & mengunduh cetak laporan PDF.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition"
          >
            Saya Mengerti
          </button>
        </div>

      </div>
    </div>
  );
}
