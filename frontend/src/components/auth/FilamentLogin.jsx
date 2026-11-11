import React, { useState } from 'react';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { apiLogin } from '../../services/api';

export default function FilamentLogin({ onLoginSuccess, isDarkMode, setIsDarkMode, showToast, appSettings }) {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const companyName = appSettings?.company_name || 'Rahmat-Karya';
  const defaultLogo = './company-logo.png';
  const companyLogo = appSettings?.company_logo || defaultLogo;
  const companyMonogram = companyName
    .replace(/^PT\s+/i, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RK';

  const defaultBanner = './login-banner.jpg';
  const bannerImage = appSettings?.login_banner_image || defaultBanner;
  const bannerTitle = appSettings?.login_banner_title || `Selamat Datang di ${companyName}`;
  const bannerSubtitle = appSettings?.login_banner_subtitle || 'Mengintegrasikan Keamanan dan Efisiensi dalam Setiap Proyek Arsitektur, Infrastruktur & Finansial.';

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

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-slate-950 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* SISI KIRI: Banner Visual & Pesan Sambutan                       */}
      {/* ============================================================== */}
      <div className="w-full lg:w-1/2 bg-[#f4f3f9] dark:bg-slate-900/80 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 xl:p-16 border-b lg:border-b-0 lg:border-r border-slate-200/70 dark:border-slate-800 transition-colors">
        <div className="w-full max-w-xl xl:max-w-2xl space-y-6 sm:space-y-8 text-center">
          
          {/* Banner Image Container - Ukuran Lebih Luas, Proporsional & Elegan */}
          <div className="relative w-full max-w-[620px] xl:max-w-[680px] mx-auto rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/50 border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 group">
            <div className="w-full h-[280px] sm:h-[360px] lg:h-[390px] xl:h-[430px] overflow-hidden">
              <img
                src={bannerImage}
                alt={bannerTitle}
                onError={(e) => {
                  if (!e.currentTarget.src.includes('login-banner.jpg')) {
                    e.currentTarget.src = './login-banner.jpg';
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            {/* Subtle elegant gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Heading & Subtitle Sambutan */}
          <div className="space-y-2.5 pt-1 px-2">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
              {bannerTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-lg mx-auto">
              {bannerSubtitle}
            </p>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* SISI KANAN: Formulir Login Terpusat                             */}
      {/* ============================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14 min-h-[550px] lg:min-h-screen relative bg-white dark:bg-slate-950 transition-colors">
        
        {/* Dark Mode Toggle di Pojok Kanan Atas */}
        <div className="absolute top-5 right-5 sm:top-7 sm:right-7">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shadow-2xs"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Toggle Mode Gelap/Terang"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
          </button>
        </div>

        {/* Floating Login Card */}
        <div className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-slate-200/70 dark:shadow-black/60 border border-slate-150 dark:border-slate-800 space-y-6">
          
          {/* Logo Badge & Title */}
          <div className="text-center space-y-3.5">
            {companyLogo ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center p-2 shadow-sm overflow-hidden transition-transform hover:scale-105">
                <img
                  src={companyLogo}
                  alt={companyName}
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('company-logo.png')) {
                      e.currentTarget.src = './company-logo.png';
                    }
                  }}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#5235eb] text-white flex items-center justify-center font-bold font-mono text-2xl shadow-lg shadow-indigo-500/25">
                {companyMonogram}
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-[26px] font-bold text-slate-850 dark:text-white tracking-tight leading-tight">
                {companyName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                Silakan login untuk melanjutkan
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan username atau email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#5235eb] hover:bg-[#4326d9] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Memverifikasi...' : 'Login'}
            </button>
          </form>

          {/* Footer Copyright */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2 font-normal">
            &copy; {new Date().getFullYear()} {companyName}
          </p>

        </div>

      </div>

    </div>
  );
}
