import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Eye, 
  EyeOff, 
  Save, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Landmark, 
  ShieldCheck,
  Percent,
  Sliders,
  Check,
  Bell,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { apiGetAppSettings, apiSaveAppSettings, apiTestGeminiKey } from '../../services/api';
import { getInitials } from '../../utils/format';

export default function FilamentSettings({ currentUser, showToast, onSettingsUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Form State
  const [form, setForm] = useState({
    company_name: 'RAHMAT-KARYA',
    company_tagline: 'Management Proyek & Digital Arus Kas',
    company_logo: '',
    company_phone: '081234567890',
    company_email: 'admin@rahmatkarya.com',
    company_address: 'Jl. Raya Utama No. 123, Indonesia',
    default_bank_name: 'Bank BCA',
    default_bank_account_number: '123-456-7890',
    default_bank_account_holder: 'Tim Manajemen Keuangan',
    default_tax_percent: '0',
    currency_symbol: 'Rp',
    notif_auto_briefing: '1',
    notif_upcoming_days: '7',
    notif_desktop_enabled: '1',
    login_banner_image: '',
    login_banner_title: '',
    login_banner_subtitle: '',
    gemini_api_key: '',
    has_gemini_key: false,
    masked_gemini_key: ''
  });

  // Load Settings from Backend
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiGetAppSettings();
      if (res.success && res.data) {
        setForm({
          ...res.data,
          gemini_api_key: '' // keep empty unless user types a new one
        });
      }
    } catch (err) {
      if (showToast) showToast('Gagal memuat pengaturan sistem: ' + err.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle Logo Upload (Base64)
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('File harus berupa gambar (PNG, JPG, SVG, WebP)!', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      if (showToast) showToast('Ukuran file logo maksimal 2MB!', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setForm(prev => ({ ...prev, company_logo: base64 }));
      if (showToast) showToast('Logo berhasil dipilih! Klik Simpan Pengaturan untuk menerapkan.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({ ...prev, company_logo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (showToast) showToast('Logo dihapus. Monogram inisial akan digunakan.');
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Ukuran gambar banner maksimal 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setForm(prev => ({ ...prev, login_banner_image: base64 }));
      if (showToast) showToast('Gambar banner berhasil dipilih! Klik Simpan Pengaturan untuk menerapkan.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = () => {
    setForm(prev => ({ ...prev, login_banner_image: '' }));
    if (bannerInputRef.current) bannerInputRef.current.value = '';
    if (showToast) showToast('Gambar banner dikosongkan. Gambar default akan digunakan.');
  };

  // Test Gemini API Key Connection
  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const keyToTest = form.gemini_api_key.trim() || null;
      const res = await apiTestGeminiKey(keyToTest);
      if (res.success) {
        setGeminiTestResult({
          success: true,
          message: res.message || 'Koneksi ke Google Gemini AI berhasil! Model responsif dan aktif.'
        });
        if (showToast) showToast('Uji koneksi Gemini AI berhasil!');
      } else {
        setGeminiTestResult({
          success: false,
          message: res.message || 'Gagal menghubungi Gemini AI. Pastikan API key valid.'
        });
        if (showToast) showToast(res.message || 'Uji koneksi Gemini AI gagal!', 'warning');
      }
    } catch (err) {
      setGeminiTestResult({
        success: false,
        message: 'Error koneksi: ' + err.message
      });
      if (showToast) showToast('Error menguji Gemini: ' + err.message, 'warning');
    } finally {
      setTestingGemini(false);
    }
  };

  // Save Settings
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name.trim(),
        company_tagline: form.company_tagline.trim(),
        company_logo: form.company_logo,
        company_phone: form.company_phone.trim(),
        company_email: form.company_email.trim(),
        company_address: form.company_address.trim(),
        default_bank_name: form.default_bank_name.trim(),
        default_bank_account_number: form.default_bank_account_number.trim(),
        default_bank_account_holder: form.default_bank_account_holder.trim(),
        default_tax_percent: form.default_tax_percent,
        currency_symbol: form.currency_symbol.trim() || 'Rp',
        notif_auto_briefing: form.notif_auto_briefing === '1' || form.notif_auto_briefing === true ? '1' : '0',
        notif_upcoming_days: String(form.notif_upcoming_days || '7'),
        notif_desktop_enabled: form.notif_desktop_enabled === '1' || form.notif_desktop_enabled === true ? '1' : '0',
        login_banner_image: form.login_banner_image || '',
        login_banner_title: (form.login_banner_title || '').trim(),
        login_banner_subtitle: (form.login_banner_subtitle || '').trim()
      };

      // Only pass gemini_api_key if user typed something
      if (form.gemini_api_key.trim()) {
        payload.gemini_api_key = form.gemini_api_key.trim();
      }

      const res = await apiSaveAppSettings(payload);
      if (res.success && res.data) {
        setForm(prev => ({
          ...prev,
          ...res.data,
          gemini_api_key: '' // reset raw input field
        }));
        if (showToast) showToast('Semua pengaturan sistem berhasil disimpan!');
        if (onSettingsUpdated) onSettingsUpdated(res.data);
      } else {
        if (showToast) showToast(res.message || 'Gagal menyimpan pengaturan.', 'warning');
      }
    } catch (err) {
      if (showToast) showToast('Error menyimpan pengaturan: ' + err.message, 'warning');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Memuat konfigurasi sistem...</p>
      </div>
    );
  }

  const monogram = getInitials(form.company_name) || 'RK';

  return (
    <div className="space-y-6">

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              PENGATURAN SISTEM & PROFIL BISNIS
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              CONFIG
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi identitas perusahaan, logo, kontak resmi, rekening kas, dan integrasi Google Gemini AI.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pengaturan</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. IDENTITAS & LOGO PERUSAHAAN */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Identitas & Logo Perusahaan
              </h3>
              <p className="text-[11px] text-slate-400">
                Informasi ini ditampilkan pada Header Sidebar, Rekapitulasi Kas, dan Laporan Invoice.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Logo Upload & Live Preview Card */}
            <div className="lg:col-span-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Logo Perusahaan
              </label>

              {/* Logo Preview Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[140px]">
                {form.company_logo ? (
                  <div className="relative group">
                    <img
                      src={form.company_logo}
                      alt="Logo Perusahaan"
                      className="max-h-24 max-w-full object-contain rounded-lg shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition"
                      title="Hapus Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-black text-xl flex items-center justify-center shadow-xs">
                      {monogram}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Monogram Otomatis: <strong className="font-mono">{monogram}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                  id="logo-upload-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.company_logo ? 'Ganti Logo' : 'Upload File Logo'}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Format: PNG, JPG, SVG, WebP (Maks. 2MB)
                </p>
              </div>

              {/* Live Preview Sidebar Header */}
              <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pratinjau Sidebar:
                </span>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
                  {form.company_logo ? (
                    <img 
                      src={form.company_logo} 
                      alt="Logo" 
                      className="w-8 h-8 rounded-lg object-contain bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {monogram}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">
                      {form.company_name || 'RAHMAT-KARYA'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {form.company_tagline || 'Management Proyek'}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Form Fields: Name & Tagline */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Perusahaan / Bisnis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Contoh: RAHMAT-KARYA atau PT Rahmat Karya Konstruksi"
                  className="w-full text-xs font-semibold rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Slogan / Subtitle Usaha
                </label>
                <input
                  type="text"
                  value={form.company_tagline}
                  onChange={(e) => setForm(prev => ({ ...prev, company_tagline: e.target.value }))}
                  placeholder="Contoh: Management Proyek & Digital Arus Kas"
                  className="w-full text-xs rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              {/* Direct Image URL input (Alternative to upload) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tautan / URL Logo Eksternal (Opsional)
                </label>
                <input
                  type="text"
                  value={form.company_logo.startsWith('http') ? form.company_logo : ''}
                  onChange={(e) => setForm(prev => ({ ...prev, company_logo: e.target.value }))}
                  placeholder="https://studio-anda.com/logo.png"
                  className="w-full text-xs font-mono rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Anda juga dapat memasukkan link URL gambar langsung jika gambar sudah tersimpan secara online.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 2. KUSTOMISASI BANNER HALAMAN LOGIN */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/70 dark:border-purple-800/70 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Kustomisasi Banner & Gambar Halaman Login
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur foto proyek/alat berat/arsitektur dan teks sambutan yang tampil di sisi kiri halaman login.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Banner Preview Card */}
            <div className="lg:col-span-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pratinjau Banner Login
              </label>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 aspect-[16/10] flex items-center justify-center group shadow-xs">
                <img
                  src={form.login_banner_image || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80'}
                  alt="Pratinjau Banner"
                  className="w-full h-full object-cover"
                />
                {form.login_banner_image && (
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer"
                    title="Hapus dan kembalikan ke gambar default"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleBannerFileChange}
                  className="hidden"
                  id="banner-upload-input"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.login_banner_image ? 'Ganti Foto Banner' : 'Upload Foto Banner'}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Format: PNG, JPG, WebP (Rasio 16:10 / landscape)
                </p>
              </div>
            </div>

            {/* Banner Text Inputs & URL Option */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Sambutan Banner (Kiri)
                </label>
                <input
                  type="text"
                  value={form.login_banner_title}
                  onChange={(e) => setForm(prev => ({ ...prev, login_banner_title: e.target.value }))}
                  placeholder={`Contoh: Selamat Datang di ${form.company_name}`}
                  className="w-full text-xs rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kosongkan jika ingin menggunakan judul otomatis: "Selamat Datang di [Nama Perusahaan]".
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subtitle Sambutan Banner
                </label>
                <textarea
                  rows={2}
                  value={form.login_banner_subtitle}
                  onChange={(e) => setForm(prev => ({ ...prev, login_banner_subtitle: e.target.value }))}
                  placeholder="Contoh: Mengintegrasikan Keamanan dan Efisiensi dalam Setiap Proyek Infrastruktur..."
                  className="w-full text-xs rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Atau Masukkan URL Gambar Banner Online
                </label>
                <input
                  type="text"
                  value={form.login_banner_image && form.login_banner_image.startsWith('http') ? form.login_banner_image : ''}
                  onChange={(e) => setForm(prev => ({ ...prev, login_banner_image: e.target.value }))}
                  placeholder="https://domain-anda.com/foto-banner-proyek.jpg"
                  className="w-full text-xs font-mono rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Dapat berupa tautan link gambar langsung dari website atau cloud storage.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 3. KONTAK & ALAMAT KANTOR */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Kontak Resmi & Alamat Kantor
              </h3>
              <p className="text-[11px] text-slate-400">
                Nomor kontak utama perusahaan yang tercantum pada cetak faktur PDF dan pesan konfirmasi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Telepon / WhatsApp Resmi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={form.company_phone}
                  onChange={(e) => setForm(prev => ({ ...prev, company_phone: e.target.value }))}
                  placeholder="081234567890 atau 6281234567890"
                  className="w-full text-xs font-mono rounded-xl pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Perusahaan
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.company_email}
                  onChange={(e) => setForm(prev => ({ ...prev, company_email: e.target.value }))}
                  placeholder="finance@rahmatkarya.com"
                  className="w-full text-xs font-mono rounded-xl pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Alamat Kantor / Domisili Usaha
              </label>
              <div className="relative">
                <textarea
                  rows="2"
                  value={form.company_address}
                  onChange={(e) => setForm(prev => ({ ...prev, company_address: e.target.value }))}
                  placeholder="Jl. Raya Utama No. 123, Kelurahan, Kecamatan, Kota, Kode Pos"
                  className="w-full text-xs rounded-xl pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white leading-relaxed"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. REKENING KAS & PEMBAYARAN DEFAULT */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Rekening Kas & Penagihan Default
              </h3>
              <p className="text-[11px] text-slate-400">
                Informasi nomor rekening resmi yang otomatis disertakan pada pesan WhatsApp pengingat tagihan klien.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Bank / Lembaga
              </label>
              <input
                type="text"
                value={form.default_bank_name}
                onChange={(e) => setForm(prev => ({ ...prev, default_bank_name: e.target.value }))}
                placeholder="Contoh: Bank BCA / Mandiri / BRI"
                className="w-full text-xs font-bold rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Rekening
              </label>
              <input
                type="text"
                value={form.default_bank_account_number}
                onChange={(e) => setForm(prev => ({ ...prev, default_bank_account_number: e.target.value }))}
                placeholder="Contoh: 123-456-7890"
                className="w-full text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Atas Nama Rekening (A.N)
              </label>
              <input
                type="text"
                value={form.default_bank_account_holder}
                onChange={(e) => setForm(prev => ({ ...prev, default_bank_account_holder: e.target.value }))}
                placeholder="Contoh: Tim Manajemen Keuangan"
                className="w-full text-xs font-semibold rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-between text-xs">
            <span className="text-indigo-800 dark:text-indigo-300 font-medium">
              Format WhatsApp: <strong>{form.default_bank_name}: {form.default_bank_account_number} a.n {form.default_bank_account_holder}</strong>
            </span>
            <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400">Variabel: {'{rekening}'}</span>
          </div>
        </div>

        {/* 4. INTEGRASI GOOGLE GEMINI AI */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/70 dark:border-purple-800/70 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Integrasi Google Gemini AI API
                </h3>
                <p className="text-[11px] text-slate-400">
                  Menghidupkan Asisten AI Analis Keuangan, Audit Piutang, dan Chatbot Konsultan Proyek.
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              {form.has_gemini_key ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI Aktif & Terhubung</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 font-bold text-xs shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Kunci Belum Dikonfigurasi</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Gemini API Key
                </label>
                {form.masked_gemini_key && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Tersimpan: <strong className="text-slate-600 dark:text-slate-300">{form.masked_gemini_key}</strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={form.gemini_api_key}
                  onChange={(e) => setForm(prev => ({ ...prev, gemini_api_key: e.target.value }))}
                  placeholder={form.has_gemini_key ? 'Ketik API key baru jika ingin mengganti...' : 'Tempelkan API Key Gemini di sini (AIzaSy...)'}
                  className="w-full text-xs font-mono rounded-xl pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                <p className="text-[11px] text-slate-400">
                  Model default: <strong className="text-slate-600 dark:text-slate-300 font-mono">gemini-1.5-flash</strong> (Cepat, Ringan & Gratis).
                </p>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <span>Dapatkan API Key Gratis di Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Test Connection Buttons & Output */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testingGemini}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {testingGemini ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji Koneksi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Uji Koneksi Gemini Sekarang</span>
                  </>
                )}
              </button>

              {form.has_gemini_key && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Yakin ingin menghapus kunci Google Gemini AI dari sistem? Asisten AI tidak akan dapat membalas chat.')) {
                      setForm(prev => ({ ...prev, gemini_api_key: '', has_gemini_key: false, masked_gemini_key: '' }));
                      await apiSaveAppSettings({ gemini_api_key: '' });
                      if (showToast) showToast('Kunci Gemini AI telah dihapus.');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kunci</span>
                </button>
              )}
            </div>

            {/* Result Alert Box */}
            {geminiTestResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in ${
                geminiTestResult.success 
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                {geminiTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {geminiTestResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90">
                    {geminiTestResult.message}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 5. PREFERENSI KEUANGAN & FORMAT */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/70 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Format Mata Uang & Pajak Default
              </h3>
              <p className="text-[11px] text-slate-400">
                Pengaturan standar nilai uang dan tarif kalkulasi pajak awal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Simbol Mata Uang
              </label>
              <input
                type="text"
                value={form.currency_symbol}
                onChange={(e) => setForm(prev => ({ ...prev, currency_symbol: e.target.value }))}
                placeholder="Rp"
                className="w-full text-xs font-bold rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tarif PPN / Pajak Standar (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.default_tax_percent}
                  onChange={(e) => setForm(prev => ({ ...prev, default_tax_percent: e.target.value }))}
                  placeholder="0 atau 11"
                  className="w-full text-xs font-mono font-bold rounded-xl pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 6. PENGINGAT & NOTIFIKASI HARIAN (DAILY REMINDERS & NOTIFICATIONS) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/70 dark:border-purple-800/70 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Pengingat & Notifikasi Harian (Penagihan, Termin, Piutang & Subkon)
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur pengingat berkala untuk mengingatkan jatuh tempo termin, penagihan piutang, dan honor tim subkon setiap hari.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Auto daily briefing toggle */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <input
                type="checkbox"
                id="notif_auto_briefing"
                checked={form.notif_auto_briefing === '1' || form.notif_auto_briefing === true}
                onChange={(e) => setForm(prev => ({ ...prev, notif_auto_briefing: e.target.checked ? '1' : '0' }))}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="notif_auto_briefing" className="cursor-pointer select-none">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Tampilkan Pop-up Rekap Pengingat Harian (Briefing) Otomatis
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Secara otomatis memunculkan rekapitulasi agenda penagihan dan honor subkon saat Anda pertama kali membuka dashboard setiap hari.
                </div>
              </label>
            </div>

            {/* Threshold for upcoming payment terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ambang Batas Pengingat Termin Mendatang (Hari)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.notif_upcoming_days || '7'}
                    onChange={(e) => setForm(prev => ({ ...prev, notif_upcoming_days: e.target.value }))}
                    className="w-full text-xs font-mono font-bold rounded-xl pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Termin yang jatuh tempo dalam rentang hari ini akan dimunculkan sebagai pengingat mendatang.
                </p>
              </div>

              {/* Desktop notification test button */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notifikasi Layar Desktop / Browser
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!('Notification' in window)) {
                      if (showToast) showToast('Browser tidak mendukung notifikasi desktop.', 'warning');
                      return;
                    }
                    try {
                      const p = await Notification.requestPermission();
                      if (p === 'granted') {
                        new Notification('🔔 Pengingat ProCash', {
                          body: 'Notifikasi desktop aktif! Anda akan mendapatkan pengingat harian untuk penagihan termin dan honor subkon.',
                          icon: '/favicon.svg'
                        });
                        if (showToast) showToast('Notifikasi desktop berhasil diaktifkan dan diuji!');
                      } else {
                        if (showToast) showToast('Izin notifikasi desktop ditolak oleh browser.', 'warning');
                      }
                    } catch (err) {
                      if (showToast) showToast('Error: ' + err.message, 'danger');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs transition cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Uji Coba Notifikasi Desktop</span>
                </button>
                <p className="text-[10px] text-slate-400 mt-1">
                  Memunculkan pemberitahuan pop-up langsung di sistem operasi / browser Anda.
                </p>
              </div>
            </div>

            {/* Cron background automation tip */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Otomatisasi Cron Job Harian di Server / Windows Task Scheduler</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Aplikasi ini dilengkapi skrip mandiri <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">cron_daily_notifications.php</code> yang dapat dijalankan secara otomatis setiap hari (misal jam 08:00 WIB) untuk mencatat log audit dan memproses pengingat harian secara berkala.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">Perubahan akan langsung aktif di seluruh sistem aplikasi.</span>
            <span className="sm:hidden">Langsung aktif di sistem.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua Pengaturan</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}