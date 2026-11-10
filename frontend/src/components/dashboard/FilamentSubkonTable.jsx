import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  User, 
  Phone, 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Trash2, 
  History, 
  Wallet, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  X,
  ExternalLink,
  Building,
  RefreshCw
} from 'lucide-react';
import { 
  apiGetTeamMembers, 
  apiAddTeamMember, 
  apiAddTeamPayment, 
  apiDeleteTeamMember,
  apiDeleteTeamPayment
} from '../../services/api';
import { 
  formatRupiah, 
  formatDate, 
  formatNumberWithDots, 
  parseNumberFromDots,
  getInitials 
} from '../../utils/format';

export default function FilamentSubkonTable({
  projects = [],
  currentUser,
  canEdit = true,
  onOpenDetail,
  showToast
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    try {
      return sessionStorage.getItem('procash_subkon_status_filter') || 'all';
    } catch {
      return 'all';
    }
  }); // 'all' | 'unpaid' | 'paid'
  const [projectFilter, setProjectFilter] = useState(() => {
    try {
      return sessionStorage.getItem('procash_subkon_project_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('procash_subkon_status_filter', statusFilter);
    } catch {}
  }, [statusFilter]);

  useEffect(() => {
    try {
      sessionStorage.setItem('procash_subkon_project_filter', projectFilter);
    } catch {}
  }, [projectFilter]);

  // Expanded history for subkon
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  // Modal: Add Subkon Member
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    project_id: '',
    member_name: '',
    member_role: '',
    member_phone: '',
    bank_account_info: '',
    agreed_honor: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  // Modal: Pay Subkon Member (Cairkan Honor)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [payForm, setPayForm] = useState({
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'TRANSFER BCA',
    notes: ''
  });
  const [payLoading, setPayLoading] = useState(false);

  // Fetch Subkon Data
  const fetchSubkon = async () => {
    setLoading(true);
    try {
      const res = await apiGetTeamMembers();
      if (res.success && res.data) {
        setMembers(res.data);
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Gagal memuat daftar subkon.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubkon();
  }, []);

  // Filter & Search Logic
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (m.member_name && m.member_name.toLowerCase().includes(q)) ||
        (m.member_role && m.member_role.toLowerCase().includes(q)) ||
        (m.project_name && m.project_name.toLowerCase().includes(q)) ||
        (m.client_name && m.client_name.toLowerCase().includes(q)) ||
        (m.member_phone && m.member_phone.toLowerCase().includes(q)) ||
        (m.bank_account_info && m.bank_account_info.toLowerCase().includes(q));

      // Status match
      const remaining = parseFloat(m.remaining_honor) || 0;
      let matchStatus = true;
      if (statusFilter === 'unpaid') {
        matchStatus = remaining > 0;
      } else if (statusFilter === 'paid') {
        matchStatus = remaining <= 0;
      }

      // Project match
      let matchProject = true;
      if (projectFilter !== 'all') {
        matchProject = String(m.project_id) === String(projectFilter);
      }

      return matchSearch && matchStatus && matchProject;
    });
  }, [members, searchQuery, statusFilter, projectFilter]);

  // Aggregate stats
  const totalAgreed = useMemo(() => {
    return members.reduce((s, m) => s + (parseFloat(m.agreed_honor) || 0), 0);
  }, [members]);

  const totalPaid = useMemo(() => {
    return members.reduce((s, m) => s + (parseFloat(m.total_paid) || 0), 0);
  }, [members]);

  const totalRemaining = useMemo(() => {
    return members.reduce((s, m) => s + (parseFloat(m.remaining_honor) || 0), 0);
  }, [members]);

  const unpaidCount = useMemo(() => {
    return members.filter(m => (parseFloat(m.remaining_honor) || 0) > 0).length;
  }, [members]);

  const paidCount = useMemo(() => {
    return members.filter(m => (parseFloat(m.remaining_honor) || 0) <= 0).length;
  }, [members]);

  // Copy helper
  const handleCopy = (text, label) => {
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text);
      if (showToast) showToast(`${label} disalin!`);
    }
  };

  // Open Pay Modal
  const handleOpenPay = (member) => {
    setSelectedMember(member);
    const remaining = Math.max(0, parseFloat(member.remaining_honor) || 0);
    setPayForm({
      amount_paid: remaining > 0 ? formatNumberWithDots(remaining) : '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'TRANSFER BCA',
      notes: ''
    });
    setIsPayModalOpen(true);
  };

  // Submit Pay Modal
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    const rawAmount = parseNumberFromDots(payForm.amount_paid);
    if (!rawAmount || parseFloat(rawAmount) <= 0) {
      if (showToast) showToast('Masukkan nominal honor yang valid (> 0)!', 'error');
      return;
    }

    setPayLoading(true);
    try {
      const res = await apiAddTeamPayment({
        project_team_member_id: selectedMember.id,
        amount_paid: rawAmount,
        payment_date: payForm.payment_date,
        payment_method: payForm.payment_method,
        notes: payForm.notes
      });

      if (res.success) {
        if (showToast) showToast(`Pencairan honor ke ${selectedMember.member_name} berhasil dicatat!`);
        setIsPayModalOpen(false);
        fetchSubkon();
      } else {
        if (showToast) showToast(res.message || 'Gagal mencatat pembayaran.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Terjadi kesalahan koneksi.', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  // Submit Add Subkon Member
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.project_id) {
      if (showToast) showToast('Pilih proyek terlebih dahulu!', 'error');
      return;
    }
    if (!addForm.member_name.trim()) {
      if (showToast) showToast('Nama subkon / rekan kerja wajib diisi!', 'error');
      return;
    }

    const rawHonor = parseNumberFromDots(addForm.agreed_honor);
    if (!rawHonor || parseFloat(rawHonor) <= 0) {
      if (showToast) showToast('Plafon honor disepakati wajib lebih dari Rp 0!', 'error');
      return;
    }

    setAddLoading(true);
    try {
      const res = await apiAddTeamMember({
        project_id: addForm.project_id,
        member_name: addForm.member_name.trim(),
        member_role: addForm.member_role.trim() || 'Subkon',
        member_phone: addForm.member_phone.trim(),
        bank_account_info: addForm.bank_account_info.trim(),
        agreed_honor: rawHonor
      });

      if (res.success) {
        if (showToast) showToast(`Subkon ${addForm.member_name} berhasil ditambahkan!`);
        setIsAddModalOpen(false);
        setAddForm({
          project_id: '',
          member_name: '',
          member_role: '',
          member_phone: '',
          bank_account_info: '',
          agreed_honor: ''
        });
        fetchSubkon();
      } else {
        if (showToast) showToast(res.message || 'Gagal menambahkan subkon.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  // Delete Subkon
  const handleDeleteMember = async (member) => {
    if (!confirm(`Yakin ingin menghapus subkon "${member.member_name}" beserta seluruh riwayat pembayarannya?`)) return;
    try {
      const res = await apiDeleteTeamMember(member.id);
      if (res.success) {
        if (showToast) showToast('Data subkon berhasil dihapus.');
        fetchSubkon();
      } else {
        if (showToast) showToast(res.message || 'Gagal menghapus subkon.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Terjadi kesalahan koneksi.', 'error');
    }
  };

  // Delete Individual Payment History
  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Yakin ingin menghapus catatan pencairan ini?')) return;
    try {
      const res = await apiDeleteTeamPayment(paymentId);
      if (res.success) {
        if (showToast) showToast('Catatan pembayaran dihapus.');
        fetchSubkon();
      } else {
        if (showToast) showToast(res.message || 'Gagal menghapus pembayaran.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Terjadi kesalahan.', 'error');
    }
  };

  return (
    <div className="space-y-4">

      {/* 1. Header Toolbar: Search, Filters, & Add Subkon Button */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama subkon, rekan kerja, spesialisasi, atau proyek..."
              className="w-full text-xs rounded-xl pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Project Dropdown Filter */}
          <div className="w-full lg:w-64">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Proyek ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.project_id || p.id} value={p.project_id || p.id}>
                  {p.project_name} ({p.client_name})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons: Refresh & Tambah Subkon */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSubkon}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Perbarui Data Subkon"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {canEdit && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Subkon</span>
              </button>
            )}
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua Subkon ({members.length})
          </button>

          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-950'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Belum Lunas ({unpaidCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('paid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Sudah Lunas ({paidCount})</span>
          </button>

          <div className="ml-auto text-[11px] text-slate-400 font-medium hidden sm:block">
            Total Sisa Tanggungan: <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatRupiah(totalRemaining)}</span>
          </div>
        </div>

      </div>

      {/* 2. Main List of People (Daftar Orang Subkon Ke Bawah) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
            <span>Memuat data orang-orang subkon & sisa honor...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              {searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
                ? 'Tidak ditemukan subkon yang sesuai dengan filter pencarian.'
                : 'Belum ada data subkon atau anggota tim yang terdaftar.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Klik tombol "+ Tambah Subkon" di atas untuk mendaftarkan rekan kerja/vendor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Column Header Bar for Exact Visual Alignment */}
            <div className="hidden lg:flex items-center justify-between gap-4 px-4 sm:px-5 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
              <div className="w-[280px] xl:w-[320px] 2xl:w-[360px] shrink-0">
                Rekan Kerja / Subkon & Proyek
              </div>
              <div className="w-[370px] xl:w-[420px] 2xl:w-[460px] shrink-0 px-1">
                Plafon & Realisasi Honor (Rp)
              </div>
              <div className="w-[240px] xl:w-[260px] shrink-0 text-right">
                Aksi Operasional
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((m) => {
                const agreed = parseFloat(m.agreed_honor) || 0;
                const paid = parseFloat(m.total_paid) || 0;
                const remaining = parseFloat(m.remaining_honor) || 0;
                const isPaidOff = remaining <= 0;
                const progressPercent = agreed > 0 ? Math.min(100, Math.round((paid / agreed) * 100)) : 100;
                const isExpanded = expandedMemberId === m.id;
                const paymentsCount = m.payments?.length || 0;

                return (
                  <div 
                    key={m.id} 
                    className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    
                    {/* Top Row: Subkon Info, Project, Financials, & Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left: Avatar & Person Profile - Fixed width column */}
                      <div className="w-full lg:w-[280px] xl:w-[320px] 2xl:w-[360px] shrink-0 flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5">
                          {getInitials(m.member_name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={m.member_name}>
                              {m.member_name}
                            </h4>
                            {isPaidOff ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Lunas</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span>Belum Lunas</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{m.member_role || 'Subkon'}</span>
                            {m.member_phone && (
                              <>
                                <span>•</span>
                                <a
                                  href={`https://wa.me/${m.member_phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                                  title="Chat WhatsApp"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{m.member_phone}</span>
                                </a>
                              </>
                            )}
                          </div>

                          {/* Project name indicator */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              Proyek: <button onClick={() => onOpenDetail && onOpenDetail({ project_id: m.project_id })} className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 underline cursor-pointer">{m.project_name}</button> {m.client_name ? `(${m.client_name})` : ''}
                            </span>
                          </div>

                          {/* Bank info */}
                          {m.bank_account_info && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-1 truncate">
                              <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{m.bank_account_info}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(m.bank_account_info, 'No. Rekening')}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                                title="Salin Info Rekening"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle: Financial Status Card - Fixed uniform width across all rows */}
                      <div className="w-full lg:w-[370px] xl:w-[420px] 2xl:w-[460px] shrink-0">
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs w-full shadow-2xs">
                          
                          {/* Plafon Disepakati */}
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 truncate">
                              Plafon Disepakati
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate block">
                              {formatRupiah(agreed)}
                            </span>
                          </div>

                          {/* Sudah Dicairkan */}
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 truncate">
                              Sudah Dicairkan
                            </span>
                            <div className="flex items-baseline gap-1 truncate">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm truncate">
                                {formatRupiah(paid)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">({progressPercent}%)</span>
                            </div>
                          </div>

                          {/* Sisa Honor Terbuka */}
                          <div className="min-w-0">
                            <span className={`text-[10px] uppercase font-black block mb-0.5 truncate ${
                              remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              Sisa Honor Terbuka
                            </span>
                            <span className={`font-mono font-black text-xs sm:text-sm truncate block ${
                              remaining > 0 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {remaining > 0 ? formatRupiah(remaining) : 'Rp 0 (Lunas)'}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Right: Action Buttons - Aligned cleanly to the right edge */}
                      <div className="w-full lg:w-[240px] xl:w-[260px] flex items-center justify-start lg:justify-end gap-1.5 sm:gap-2 shrink-0">
                        
                        {/* Cairkan Honor Button */}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenPay(m)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap min-w-[110px] ${
                              remaining > 0
                                ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                            title="Cairkan Honor ke Subkon"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>{remaining > 0 ? 'Cairkan Honor' : '+ Tambah Bayar'}</span>
                          </button>
                        )}

                        {/* Expand Payment History Button */}
                        <button
                          onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap ${
                            isExpanded
                              ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                          title="Lihat Riwayat Pencairan"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Riwayat ({paymentsCount})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete Subkon Button */}
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteMember(m)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer shrink-0"
                            title="Hapus Data Subkon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                      </div>

                    </div>

                  {/* Accordion: Payment History List for this member */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Riwayat Pencairan Honor: {m.member_name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {paymentsCount} Transaksi
                        </span>
                      </div>

                      {paymentsCount === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          Belum ada catatan pencairan honor untuk rekan kerja ini.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {m.payments.map((p) => (
                            <div 
                              key={p.id}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(p.payment_date)}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                  {p.payment_method || 'TRANSFER'}
                                </span>
                                {p.notes && (
                                  <span className="text-slate-400 text-[11px] truncate max-w-xs">"{p.notes}"</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatRupiah(p.amount_paid)}
                                </span>
                                {canEdit && (
                                  <button
                                    onClick={() => handleDeletePayment(p.id)}
                                    className="text-slate-300 hover:text-rose-500 transition p-1"
                                    title="Hapus Catatan Pembayaran"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
          </div>
        )}

      </div>

      {/* ================================================================= */}
      {/* MODAL 1: TAMBAH SUBKON BARU                                       */}
      {/* ================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Tambah Subkon / Tim Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">Daftarkan rekan kerja atau vendor pada proyek</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih Proyek <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addForm.project_id}
                  onChange={(e) => setAddForm({ ...addForm, project_id: e.target.value })}
                  required
                  className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Pilih Proyek Terkait --</option>
                  {projects.map((p) => (
                    <option key={p.project_id || p.id} value={p.project_id || p.id}>
                      {p.project_name} ({p.client_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Subkon / Rekan Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.member_name}
                  onChange={(e) => setAddForm({ ...addForm, member_name: e.target.value })}
                  placeholder="Contoh: Pak Budi (Mandor) / PT Baja Abadi"
                  required
                  className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Peran / Spesialisasi
                  </label>
                  <input
                    type="text"
                    value={addForm.member_role}
                    onChange={(e) => setAddForm({ ...addForm, member_role: e.target.value })}
                    placeholder="Contoh: Drafter Arsitektur, Tukang Besi / Struktur, ME"
                    className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    value={addForm.member_phone}
                    onChange={(e) => setAddForm({ ...addForm, member_phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Info Rekening Bank (Tujuan Transfer)
                </label>
                <input
                  type="text"
                  value={addForm.bank_account_info}
                  onChange={(e) => setAddForm({ ...addForm, bank_account_info: e.target.value })}
                  placeholder="Contoh: BCA 1234567890 a.n Budi"
                  className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Plafon Honor Disepakati (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">Rp</span>
                  <input
                    type="text"
                    value={addForm.agreed_honor}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setAddForm({ ...addForm, agreed_honor: formatNumberWithDots(clean) });
                    }}
                    placeholder="0"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {addLoading ? 'Menyimpan...' : 'Simpan Subkon'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: CAIRKAN HONOR SUBKON                                      */}
      {/* ================================================================= */}
      {isPayModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Pencairan Honor Subkon
                  </h3>
                  <p className="text-[11px] text-slate-400">Catat pembayaran honor ke rekan kerja</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Snapshot Callout */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>{selectedMember.member_name}</span>
                <span className="text-slate-400 font-normal">{selectedMember.member_role || 'Subkon'}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Proyek: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedMember.project_name}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                <span className="text-slate-400">Sisa Honor Terbuka:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formatRupiah(selectedMember.remaining_honor)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nominal Pencairan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">Rp</span>
                  <input
                    type="text"
                    value={payForm.amount_paid}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setPayForm({ ...payForm, amount_paid: formatNumberWithDots(clean) });
                    }}
                    placeholder="0"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 font-mono font-bold text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tanggal Bayar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                    required
                    className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={payForm.payment_method}
                    onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="TRANSFER BCA">Transfer BCA</option>
                    <option value="TRANSFER MANDIRI">Transfer Mandiri</option>
                    <option value="TRANSFER BRI">Transfer BRI</option>
                    <option value="TRANSFER BNI">Transfer BNI</option>
                    <option value="KAS TUNAI">Kas Tunai</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="Contoh: Termin 1 / Pelunasan pekerjaan kusen"
                  className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {payLoading ? 'Memproses...' : 'Konfirmasi Pencairan'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
