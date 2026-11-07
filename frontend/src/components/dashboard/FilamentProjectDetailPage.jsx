import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Building, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Users, 
  Printer, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Send, 
  Check, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Percent,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  apiGetProjectDetail, 
  apiAddTeamMember, 
  apiAddTeamPayment,
  apiAddRevision,
  apiApproveRevisionDeal,
  getEndpoint
} from '../../services/api';
import { formatRupiah, formatDate, formatNumberWithDots, parseNumberFromDots } from '../../utils/format';

export default function FilamentProjectDetailPage({
  projectId,
  onBack,
  onOpenPayment,
  onOpenWhatsApp,
  onOpenEdit,
  onOpenDelete,
  canEdit = true,
  showToast,
  refreshTrigger = 0
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Team Member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    member_name: '',
    member_role: '',
    agreed_honor: ''
  });
  const [payAmounts, setPayAmounts] = useState({});

  // Revision Form
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revisionForm, setRevisionForm] = useState({
    title: '',
    description: '',
    requested_by: 'Klien',
    requested_date: new Date().toISOString().split('T')[0]
  });

  const fetchDetail = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await apiGetProjectDetail(projectId);
    if (res.success && res.data) {
      setDetail(res.data);
    } else {
      if (showToast) showToast(res.message || 'Gagal memuat detail proyek', 'danger');
    }
    setLoading(false);
  }, [projectId, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail, refreshTrigger]);

  if (loading && !detail) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-black text-sm flex items-center justify-center animate-pulse">
          RK
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Memuat rincian & rekapitulasi proyek...</span>
        </div>
      </div>
    );
  }

  const project = detail?.project || {};
  const clientPayments = detail?.client_payments || [];
  const teamMembers = detail?.team_members || [];
  const paymentTerms = detail?.payment_terms || [];
  const revisions = detail?.revisions || [];

  const maxRevisions = parseInt(project.max_revisions, 10) || 3;
  const currentRevision = parseInt(project.current_revision, 10) || 0;
  const remainingRevisions = Math.max(0, maxRevisions - currentRevision);
  const isDealApproved = project.revision_deal_status === 'DEAL_APPROVED';

  // Handle Team Member Submit
  const handleAddMember = async (e) => {
    e.preventDefault();
    const res = await apiAddTeamMember({
      project_id: project.project_id || projectId,
      ...memberForm,
      agreed_honor: parseNumberFromDots(memberForm.agreed_honor)
    });
    if (res.success) {
      showToast('Anggota tim vendor berhasil ditambahkan!');
      setMemberForm({ member_name: '', member_role: '', agreed_honor: '' });
      setShowAddMember(false);
      fetchDetail();
    } else {
      showToast(res.message || 'Gagal menambahkan anggota tim', 'danger');
    }
  };

  // Handle Team Honor Payment
  const handlePayMember = async (memberId) => {
    const rawAmount = parseNumberFromDots(payAmounts[memberId]);
    if (!rawAmount || parseFloat(rawAmount) <= 0) {
      showToast('Masukkan nominal honor yang valid!', 'warning');
      return;
    }

    const res = await apiAddTeamPayment({
      project_team_member_id: memberId,
      amount_paid: rawAmount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'TRANSFER BCA'
    });

    if (res.success) {
      showToast('Honor tim berhasil dibayarkan & dicatat!');
      setPayAmounts({ ...payAmounts, [memberId]: '' });
      fetchDetail();
    } else {
      showToast(res.message || 'Gagal membayar honor tim', 'danger');
    }
  };

  // Handle Add Revision
  const handleAddRevisionSubmit = async (e) => {
    e.preventDefault();
    setRevSubmitting(true);
    const res = await apiAddRevision({
      project_id: project.project_id || projectId,
      ...revisionForm
    });
    if (res.success) {
      showToast(res.message || 'Catatan revisi baru berhasil dicatat!');
      setRevisionForm({
        title: '',
        description: '',
        requested_by: 'Klien',
        requested_date: new Date().toISOString().split('T')[0]
      });
      setShowAddRevision(false);
      fetchDetail();
    } else {
      showToast(res.message || 'Gagal mencatat revisi', 'danger');
    }
    setRevSubmitting(false);
  };

  // Handle Approve Revision (DEAL)
  const handleApproveDeal = async () => {
    if (!confirm('Apakah Anda yakin ingin menyetujui tahap revisi ini sebagai DEAL? Proyek akan dialihkan ke tahap Pelunasan Akhir.')) return;
    const res = await apiApproveRevisionDeal(project.project_id || projectId);
    if (res.success) {
      showToast(res.message || 'Revisi telah DEAL! Proyek berlanjut ke tahap Pelunasan Akhir.');
      fetchDetail();
    } else {
      showToast(res.message || 'Gagal menyetujui revisi', 'danger');
    }
  };

  // Workflow Steps Definition
  const workflowSteps = [
    { key: 'KONTRAK_DP', label: 'Kontrak & DP' },
    { key: 'PENGERJAAN', label: 'Pengerjaan' },
    { key: 'REVISI', label: 'Tahap Revisi' },
    { key: 'PEMBAYARAN_AKHIR', label: 'Pelunasan Akhir' },
    { key: 'DONE', label: 'Selesai (Deal)' }
  ];

  const currentStepIndex = workflowSteps.findIndex(s => s.key === project.workflow_step);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. TOP BREADCRUMB & BACK ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Daftar Proyek</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{project.project_code}</span>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => onOpenPayment && onOpenPayment(project)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Pembayaran</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenWhatsApp && onOpenWhatsApp(project)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenEdit && onOpenEdit(project)}
                className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Proyek</span>
              </button>
            </>
          )}

          <a
            href={getEndpoint(`export.php?id=${project.project_id || projectId}`)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </a>

          {canEdit && (
            <button
              type="button"
              onClick={() => onOpenDelete && onOpenDelete(project)}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PROJECT HERO BANNER */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                {project.project_code}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                project.project_status === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
              }`}>
                {project.project_status === 'COMPLETED' ? 'SELESAI (COMPLETED)' : 'AKTIF BERJALAN'}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900">
                Alur: {project.workflow_step || 'PENGERJAAN'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {project.project_name}
            </h1>

            {project.project_detail && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                {project.project_detail}
              </p>
            )}
          </div>

          {/* Quick Client & Timeline Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs min-w-[280px]">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Klien & Kontak</span>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{project.client_name}</span>
              </div>
              {project.client_phone && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-slate-600 dark:text-slate-300">{project.client_phone}</span>
                  <a
                    href={`https://wa.me/${project.client_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    (Chat WA &rarr;)
                  </a>
                </div>
              )}
              {project.client_email && (
                <div className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{project.client_email}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Deadline</span>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(project.deadline_date)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sisa Waktu</span>
                <div className={`font-mono font-extrabold ${
                  project.days_left_to_deadline !== null && project.days_left_to_deadline < 0 
                    ? 'text-rose-600' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {project.days_left_to_deadline !== null 
                    ? project.days_left_to_deadline < 0 
                      ? `Lewat ${Math.abs(project.days_left_to_deadline)} hari`
                      : `${project.days_left_to_deadline} hari lagi`
                    : '-'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. WORKFLOW STEPPER & PROGRES PENGERJAAN */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Tahapan Alur Kerja Proyek</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">Progres: {project.progress_percent || 0}% Selesai</span>
          </div>

          {/* Visual Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {workflowSteps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-2xl border text-center transition ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : isPast
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                      : 'bg-slate-50 dark:bg-slate-950/60 text-slate-400 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Langkah {idx + 1}
                  </div>
                  <div className="text-xs font-black mt-0.5 flex items-center justify-center gap-1">
                    {isPast && <Check className="w-3.5 h-3.5" />}
                    <span>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, project.progress_percent || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. FINANCIAL METRIC HIGHLIGHTS (7 CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Kontrak</span>
          <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {formatRupiah(project.total_contract_value)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Diterima Klien</span>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {formatRupiah(project.total_paid_by_client)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Sisa Piutang</span>
          <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
            {formatRupiah(project.client_receivable_remaining)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Plafon Honor Tim</span>
          <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {formatRupiah(project.total_agreed_team_honor)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Terbayar ke Tim</span>
          <div className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">
            {formatRupiah(project.total_paid_to_team)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Hutang Tim</span>
          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            {formatRupiah(project.team_payable_remaining)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Margin Bersih</span>
          <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
            {formatRupiah(project.project_margin)}
          </div>
        </div>
      </div>

      {/* 5. REVISION MANAGEMENT & LOGS (MAX REVISI & TRACKING) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Manajemen & Kuota Revisi Proyek</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau batas toleransi revisi kontrak, riwayat revisi yang diminta klien, dan persetujuan deal final
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && remainingRevisions > 0 && !isDealApproved && (
              <button
                type="button"
                onClick={() => setShowAddRevision(!showAddRevision)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Revisi Baru</span>
              </button>
            )}

            {canEdit && !isDealApproved && (currentRevision > 0 || project.workflow_step === 'REVISI') && (
              <button
                type="button"
                onClick={handleApproveDeal}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Setujui seluruh revisi dan lanjutkan ke Pelunasan Akhir"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Setujui Revisi (DEAL)</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Cards for Revisions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batas Maksimal Revisi</span>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {maxRevisions} Kali Revisi
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 font-mono">
              MAX
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Revisi Terpakai</span>
              <div className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                Revisi ke-{currentRevision}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black font-mono">
              #{currentRevision}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            remainingRevisions > 0 
              ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400' 
              : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400'
          }`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Sisa Kuota Revisi</span>
              <div className="text-lg font-black font-mono mt-0.5">
                {remainingRevisions > 0 ? `${remainingRevisions} Kesempatan Tersisa` : 'Kuota Revisi Habis!'}
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono ${
              remainingRevisions > 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
            }`}>
              {remainingRevisions}
            </div>
          </div>
        </div>

        {/* Status Deal Banner */}
        {isDealApproved && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Tahap revisi untuk proyek ini telah resmi <strong>DISETUJUI (DEAL)</strong>. Alur pengerjaan berlanjut ke penyelesaian administrasi & pelunasan akhir.</span>
          </div>
        )}

        {/* Form Tambah Revisi */}
        {showAddRevision && !isDealApproved && remainingRevisions > 0 && (
          <form onSubmit={handleAddRevisionSubmit} className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/80 space-y-3.5 text-xs font-medium animate-in fade-in duration-150">
            <div className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center justify-between">
              <span>Catat Pengajuan Revisi ke-{currentRevision + 1}</span>
              <button 
                type="button" 
                onClick={() => setShowAddRevision(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Judul / Pokok Revisi *</label>
                <input
                  type="text"
                  required
                  value={revisionForm.title}
                  onChange={(e) => setRevisionForm({ ...revisionForm, title: e.target.value })}
                  placeholder="misal: Penyesuaian Layout Header & Form Kontak"
                  className="w-full rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Diajukan Oleh</label>
                <input
                  type="text"
                  value={revisionForm.requested_by}
                  onChange={(e) => setRevisionForm({ ...revisionForm, requested_by: e.target.value })}
                  placeholder="misal: Klien / Mas Doni"
                  className="w-full rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Rinci Permintaan Revisi *</label>
              <textarea
                rows="3"
                required
                value={revisionForm.description}
                onChange={(e) => setRevisionForm({ ...revisionForm, description: e.target.value })}
                placeholder="Rincian bagian mana saja yang perlu diperbaiki / disesuaikan..."
                className="w-full rounded-xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={revSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs cursor-pointer"
              >
                {revSubmitting ? 'Menyimpan...' : `Simpan Revisi #${currentRevision + 1}`}
              </button>
            </div>
          </form>
        )}

        {/* Tabel Riwayat Log Revisi */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3">No Revisi</th>
                <th className="py-2.5 px-3">Tanggal Pengajuan</th>
                <th className="py-2.5 px-3">Pokok Permintaan Revisi</th>
                <th className="py-2.5 px-3">Pemohon</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {revisions.map((rev) => (
                <tr key={rev.id || rev.revision_number} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                    Revisi #{rev.revision_number}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {formatDate(rev.requested_date || rev.created_at)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">{rev.title}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">{rev.description}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {rev.requested_by || 'Klien'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      rev.status === 'DEAL_APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {rev.status === 'DEAL_APPROVED' ? 'DEAL APPROVED' : 'IN PROGRESS'}
                    </span>
                  </td>
                </tr>
              ))}
              {revisions.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400 italic">
                    Belum ada catatan revisi diajukan untuk proyek ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. RIWAYAT PEMBAYARAN KLIEN */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Riwayat Pembayaran Klien</h3>
            <p className="text-xs text-slate-400 mt-0.5">Catatan seluruh uang muka (DP) dan termin pelunasan yang disetorkan klien</p>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenPayment && onOpenPayment(project)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Pembayaran</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenWhatsApp && onOpenWhatsApp(project)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs transition cursor-pointer"
              >
                Kirim Tagihan WA
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3">Tanggal Bayar</th>
                <th className="py-2.5 px-3">No Invoice</th>
                <th className="py-2.5 px-3">Jenis Pembayaran</th>
                <th className="py-2.5 px-3">Metode Transfer</th>
                <th className="py-2.5 px-3">Catatan Transaksi</th>
                <th className="py-2.5 px-3 text-right">Jumlah Diterima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {clientPayments.map((cp) => (
                <tr key={cp.id}>
                  <td className="py-2.5 px-3 font-mono">{formatDate(cp.payment_date)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{cp.invoice_number || '-'}</td>
                  <td className="py-2.5 px-3 font-bold">{cp.payment_type}</td>
                  <td className="py-2.5 px-3 text-slate-500">{cp.payment_method}</td>
                  <td className="py-2.5 px-3 text-slate-400">{cp.notes || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(cp.amount_paid)}
                  </td>
                </tr>
              ))}
              {clientPayments.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                    Belum ada catatan setoran pembayaran dari klien.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. ALOKASI HONOR TIM SUBKON & PENYALURAN */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Alokasi Plafon & Honor Tim Subkon</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daftar tim pelaksana teknis, pembagian honor, dan catatan pencairan gaji subkon</p>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowAddMember(!showAddMember)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Anggota Tim</span>
            </button>
          )}
        </div>

        {/* Form Tambah Anggota Tim */}
        {canEdit && showAddMember && (
          <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <input
              type="text"
              required
              placeholder="Nama Tim (misal: Budi Santoso)"
              value={memberForm.member_name}
              onChange={(e) => setMemberForm({ ...memberForm, member_name: e.target.value })}
              className="rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Peran (misal: UI/UX Designer / Drafter)"
              value={memberForm.member_role}
              onChange={(e) => setMemberForm({ ...memberForm, member_role: e.target.value })}
              className="rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="Plafon Honor (Rp)"
                value={memberForm.agreed_honor}
                onChange={(e) => setMemberForm({ ...memberForm, agreed_honor: formatNumberWithDots(e.target.value) })}
                className="rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-1 font-mono font-bold text-slate-900 dark:text-white"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer">
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* List Anggota Tim */}
        <div className="space-y-3">
          {teamMembers.map((m) => {
            const remaining = parseFloat(m.remaining_honor) || 0;
            return (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{m.member_name}</span>
                    <span className="text-slate-400 ml-2">({m.member_role || 'Subkon'})</span>
                  </div>
                  <div className="font-mono text-right flex flex-wrap items-center gap-3">
                    <div>
                      <span className="text-slate-400">Plafon: </span>
                      <strong>{formatRupiah(m.agreed_honor)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Terbayar: </span>
                      <strong className="text-emerald-600">{formatRupiah(m.total_paid || 0)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Sisa: </span>
                      <strong className={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        {formatRupiah(remaining)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Form Bayar Honor */}
                {canEdit && remaining > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Nominal bayar honor tim..."
                      value={payAmounts[m.id] || ''}
                      onChange={(e) => setPayAmounts({ ...payAmounts, [m.id]: formatNumberWithDots(e.target.value) })}
                      className="rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs w-56 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handlePayMember(m.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Bayar Honor
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {teamMembers.length === 0 && (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              Belum ada alokasi honor anggota tim subkon untuk proyek ini.
            </p>
          )}
        </div>
      </div>

      {/* 8. CATATAN & RUANG LINGKUP PROYEK */}
      {project.notes && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Catatan Khusus & Ketentuan Proyek</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
            {project.notes}
          </p>
        </div>
      )}

    </div>
  );
}
