import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Sun, Moon, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { apiLogin } from '../../services/api';

export default function FilamentLogin({ onLoginSuccess, isDarkMode, setIsDarkMode, showToast }) {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiLogin(identifier, password);
    if (res.success) {
      showToast('Berhasil masuk ke panel.');
      onLoginSuccess(res.user);
    } else {
      showToast(res.message || 'Username atau password salah', 'danger');
    }
    setLoading(false);
  };

  const fillQuick = (u, p) => {
    setIdentifier(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 transition-colors selection:bg-amber-500 selection:text-white">
      
      {/* Top Bar with Dark Mode Toggle */}
      <div className="max-w-md w-full mx-auto flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
            RC
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight">
            KAS PROYEK
          </span>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Masuk ke Admin Panel
            </h2>
            <p className="text-xs text-slate-400">
              Rekapitulasi Cashflow & Monitoring Piutang Proyek
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Username atau Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin atau email..."
                  className="w-full rounded-xl pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Kata Sandi
                </label>
                <span className="text-[10px] text-slate-400">Terenkripsi</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Pill Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Akses Cepat Demo:
              </span>
              <span className="text-[10px] text-amber-600 font-bold">1-Klik Isi</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => fillQuick('admin', 'admin123')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-400 text-left transition group"
              >
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500">👑 Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuick('finance', 'password123')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-400 text-left transition group"
              >
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500">💼 Finance</div>
                <div className="text-[10px] text-slate-400 font-mono">finance / pass...</div>
              </button>
            </div>
          </div>

        </div>

        <p className="text-center text-[10px] text-slate-400 font-mono mt-6">
          Filament React Admin Panel &bull; Bank-Grade Freelance Ledger
        </p>
      </div>

      <div className="py-2"></div>
    </div>
  );
}
