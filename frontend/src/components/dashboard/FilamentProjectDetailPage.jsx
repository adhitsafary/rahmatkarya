import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Building, 
  Phone,
  Mail, 
  Users, 
  Printer, 
  Edit3, 
  Trash2, 
  Plus, 
  Send, 
  Check, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  CreditCard,
  Wallet
} from 'lucide-react';
import { 
  apiGetProjectDetail, 
  apiAddTeamMember, 
  apiAddTeamPayment,
  apiAddRevision,
  apiApproveRevisionDeal,
  apiUpdateWorkflowStep,
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
  const [activeTab, setActiveTab] = useState('revisi');

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

  // Set default tab based on project workflow step when loaded
  useEffect(() => {
    if (detail?.project?.workflow_step) {
      const step = detail.project.workflow_step;
      if (step === 'REVISI') {
        setActiveTab('revisi');
      } else if (step === 'PEMBAYARAN_AKHIR' || step === 'KONTRAK_DP') {
        setActiveTab('payments');
      } else {
        setActiveTab('revisi');
      }
    }
  }, [projectId, detail?.project?.workflow_step]);

  if (loading && !detail) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
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
  const revisions = detail?.revisions || [];

  const maxRevisions = parseInt(project.max_revisions, 10) || 3;
  const currentRevision = parseInt(project.current_revision, 10) || 0;
  const remainingRevisions = Math.max(0, maxRevisions - currentRevision);
  const isDealApproved = project.revision_deal_status === 'DEAL_APPROVED';

  // Financial calculations
  const contractVal = parseFloat(project.total_contract_value) || 0;
  const clientPaid = parseFloat(project.total_paid_by_client) || 0;
  const clientReceivable = parseFloat(project.client_receivable_remaining) || 0;
  const teamHonor = parseFloat(project.total_agreed_team_honor) || 0;
  const teamPaid = parseFloat(project.total_paid_to_team) || 0;
  const teamPayable = parseFloat(project.team_payable_remaining) || 0;
  const grossMargin = contractVal - teamHonor;
  const clientPaidPercent = contractVal > 0 ? Math.min(100, Math.round((clientPaid / contractVal) * 100)) : 0;

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
    { key: 'KONTRAK_DP', label: 'Kontrak & DP', stepNumber: 1 },
    { key: 'PENGERJAAN', label: 'Pengerjaan', stepNumber: 2 },
    { key: 'REVISI', label: 'Tahap Revisi', stepNumber: 3 },
    { key: 'PEMBAYARAN_AKHIR', label: 'Pelunasan', stepNumber: 4 },
    { key: 'DONE', label: 'Selesai (Deal)', stepNumber: 5 }
  ];

  const currentStepIndex = workflowSteps.findIndex(s => s.key === project.workflow_step);
  const activeStepIdx = currentStepIndex >= 0 ? currentStepIndex : 1;

  // Handle Interactive Stepper Click
  const handleStepClick = async (targetStep) => {
    if (!canEdit) return;
    if (targetStep.key === project.workflow_step) return;

    const confirmMsg = targetStep.key === 'DONE'
      ? `Selesaikan proyek "${project.project_name}" menjadi status "Selesai (Deal)" (Progres 100%)?`
      : `Ubah tahapan alur kerja proyek menjadi "${targetStep.label}"?`;

    if (window.confirm(confirmMsg)) {
      try {
        const res = await apiUpdateWorkflowStep(project.project_id || project.id || projectId, targetStep.key);
        if (res.success) {
          if (showToast) showToast(res.message || `Tahapan alur kerja berhasil diubah ke "${targetStep.label}"!`);
          fetchDetail();
        } else {
          if (showToast) showToast(res.message || 'Gagal mengubah tahapan alur kerja', 'danger');
        }
      } catch (err) {
        if (showToast) showToast('Gagal menghubungi server', 'danger');
      }
    }
  };

  // Render Revision Section Component
  const renderRevisionSection = () => (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Manajemen & Riwayat Revisi Proyek</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Batas toleransi revisi kontrak dan persetujuan deal sebelum pelunasan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && remainingRevisions > 0 && !isDealApproved && (
            <button
              type="button"
              onClick={() => setShowAddRevision(!showAddRevision)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddRevision ? 'Tutup Form' : 'Catat Revisi Baru'}</span>
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

      {/* Unified Revision Quota Bar */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDealApproved
          ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60'
          : remainingRevisions === 0
          ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60'
          : 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 ${
            isDealApproved
              ? 'bg-emerald-500 text-white'
              : remainingRevisions === 0
              ? 'bg-rose-600 text-white'
              : 'bg-amber-500 text-white'
          }`}>
            #{currentRevision}
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Status Kuota: Revisi ke-{currentRevision} dari {maxRevisions} Kali</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isDealApproved
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  : remainingRevisions === 0
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              }`}>
                {isDealApproved ? 'DEAL APPROVED' : remainingRevisions === 0 ? 'KUOTA HABIS' : `${remainingRevisions} SISA KUOTA`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isDealApproved
                ? 'Tahap revisi telah resmi disetujui. Siap lanjut ke termin pelunasan akhir.'
                : remainingRevisions === 0
                ? 'Batas revisi gratis telah habis. Pengajuan tambahan memerlukan addendum biaya atau klik Deal.'
                : `Masih ada ${remainingRevisions} kuota kesempatan revisi sesuai kesepakatan kontrak.`
              }
            </p>
          </div>
        </div>

        {/* Visual Dots for Quota */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {Array.from({ length: maxRevisions }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < currentRevision
                  ? isDealApproved ? 'bg-emerald-500' : 'bg-amber-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              title={`Revisi ke-${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Form Tambah Revisi */}
      {showAddRevision && !isDealApproved && remainingRevisions > 0 && (
        <form onSubmit={handleAddRevisionSubmit} className="p-4 sm:p-5 rounded-xl bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/80 space-y-3 text-xs">
          <div className="font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between">
            <span>Catat Pengajuan Revisi ke-{currentRevision + 1}</span>
            <button 
              type="button" 
              onClick={() => setShowAddRevision(false)}
              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
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
                placeholder="misal: Penyesuaian Fasad Depan & Tata Letak Ruangan"
                className="w-full rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Diajukan Oleh</label>
              <input
                type="text"
                value={revisionForm.requested_by}
                onChange={(e) => setRevisionForm({ ...revisionForm, requested_by: e.target.value })}
                placeholder="misal: Klien / PIC"
                className="w-full rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="w-full rounded-xl p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={revSubmitting}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs cursor-pointer text-xs"
            >
              {revSubmitting ? 'Menyimpan...' : `Simpan Revisi #${currentRevision + 1}`}
            </button>
          </div>
        </form>
      )}

      {/* Tabel Riwayat Log Revisi */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3.5">No Revisi</th>
              <th className="py-2.5 px-3">Tanggal</th>
              <th className="py-2.5 px-3">Pokok Permintaan & Catatan</th>
              <th className="py-2.5 px-3">Pemohon</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {revisions.map((rev) => (
              <tr key={rev.id || rev.revision_number} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3.5 font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  Revisi #{rev.revision_number}
                </td>
                <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                  {formatDate(rev.requested_date || rev.created_at)}
                </td>
                <td className="py-3 px-3">
                  <div className="font-extrabold text-slate-900 dark:text-white text-xs">{rev.title}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">{rev.description}</div>
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {rev.requested_by || 'Klien'}
                </td>
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
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
                <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                  Belum ada catatan revisi diajukan untuk proyek ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Client Payments Section Component
  const renderPaymentsSection = () => (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Pembayaran Klien</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar setoran DP, termin pengerjaan, dan pelunasan dari klien
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
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
              className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kirim Tagihan WA</span>
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Tanggal</th>
              <th className="py-2.5 px-3">No Invoice</th>
              <th className="py-2.5 px-3">Jenis Pembayaran</th>
              <th className="py-2.5 px-3">Metode Transfer</th>
              <th className="py-2.5 px-3">Catatan</th>
              <th className="py-2.5 px-3.5 text-right">Jumlah Diterima</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {clientPayments.map((cp) => (
              <tr key={cp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">{formatDate(cp.payment_date)}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-500 whitespace-nowrap">{cp.invoice_number || '-'}</td>
                <td className="py-2.5 px-3 font-bold whitespace-nowrap">{cp.payment_type}</td>
                <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{cp.payment_method}</td>
                <td className="py-2.5 px-3 text-slate-400">{cp.notes || '-'}</td>
                <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {formatRupiah(cp.amount_paid)}
                </td>
              </tr>
            ))}
            {clientPayments.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 italic">
                  Belum ada catatan setoran pembayaran dari klien.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Team Subkon Section Component
  const renderTeamSection = () => (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Alokasi Honor Tim & Beban Subkon</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar personil vendor pelaksana, plafon honor, dan catatan pencairan
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowAddMember(!showAddMember)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddMember ? 'Tutup Form' : '+ Anggota Tim'}</span>
          </button>
        )}
      </div>

      {/* Form Tambah Anggota Tim */}
      {canEdit && showAddMember && (
        <form onSubmit={handleAddMember} className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
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
            placeholder="Peran (misal: Arsitek / Drafter CAD / Estimator RAB)"
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
      <div className="space-y-2.5">
        {teamMembers.map((m) => {
          const remaining = parseFloat(m.remaining_honor) || 0;
          return (
            <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{m.member_name}</span>
                  <span className="text-slate-400 ml-2">({m.member_role || 'Subkon'})</span>
                </div>
                <div className="font-mono text-right flex flex-wrap items-center gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Plafon: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(m.agreed_honor)}</strong>
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
                    placeholder="Nominal bayar honor..."
                    value={payAmounts[m.id] || ''}
                    onChange={(e) => setPayAmounts({ ...payAmounts, [m.id]: formatNumberWithDots(e.target.value) })}
                    className="rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs w-48 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handlePayMember(m.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Bayar Honor
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {teamMembers.length === 0 && (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            Belum ada alokasi honor anggota tim subkon untuk proyek ini.
          </p>
        )}
      </div>
    </div>
  );

  // Render Notes Section Component
  const renderNotesSection = () => (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <span>Catatan Khusus & Ketentuan Proyek</span>
      </h3>
      {project.notes ? (
        <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          {project.notes}
        </p>
      ) : (
        <p className="text-xs text-slate-400 italic py-4 text-center">
          Tidak ada catatan atau ketentuan khusus yang dilampirkan untuk proyek ini.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* 1. TOP BREADCRUMB & UNIFIED ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Daftar Proyek</span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{project.project_code}</span>
          </div>
        </div>

        {/* Clean Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
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
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Kirim Pesan WhatsApp ke Klien"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim WA</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenEdit && onOpenEdit(project)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit</span>
              </button>
            </>
          )}

          <a
            href={getEndpoint(`export.php?id=${project.project_id || projectId}`)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </a>

          {canEdit && (
            <button
              type="button"
              onClick={() => onOpenDelete && onOpenDelete(project)}
              className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs transition flex items-center cursor-pointer shadow-2xs"
              title="Hapus Proyek"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. REFINED PROJECT HERO & STEPPER CARD */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        
        {/* Top: Project Info & Client Meta */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                {project.project_code}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${
                project.project_status === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${project.project_status === 'COMPLETED' ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{project.project_status === 'COMPLETED' ? 'SELESAI' : 'AKTIF BERJALAN'}</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300">
                Alur: {project.workflow_step || 'PENGERJAAN'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {project.project_name}
            </h1>

            {project.project_detail && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {project.project_detail}
              </p>
            )}
          </div>

          {/* Compact Client & Deadline Meta */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs min-w-[260px] space-y-2 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Klien & Kontak</span>
              <div className="font-extrabold text-slate-900 dark:text-white text-xs mt-0.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{project.client_name}</span>
              </div>
              {project.client_phone && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-600 dark:text-slate-300">{project.client_phone}</span>
                  <a
                    href={`https://wa.me/${project.client_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    (Chat WA &rarr;)
                  </a>
                </div>
              )}
              {project.client_email && (
                <div className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 text-[11px]">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{project.client_email}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-[11px]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Deadline</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(project.deadline_date)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Sisa Waktu</span>
                <span className={`font-mono font-black ${
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
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern & Sleek Workflow Stepper (Interactive) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Tahapan Alur Kerja Proyek</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">(Klik langkah untuk berpindah status)</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/40">
              Progres: {project.progress_percent || 0}% Selesai
            </span>
          </div>

          <div className="relative pt-1 pb-1">
            {/* Background Track Line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
            
            {/* Progress Fill Line */}
            <div 
              className="absolute top-4 left-6 h-0.5 bg-blue-600 dark:bg-blue-500 transition-all duration-300 -z-0"
              style={{
                width: `${Math.max(0, Math.min(100, (activeStepIdx / (workflowSteps.length - 1)) * 100))}%`
              }}
            />

            <div className="grid grid-cols-5 gap-1 relative z-10">
              {workflowSteps.map((step, idx) => {
                const isPast = idx < activeStepIdx;
                const isCurrent = idx === activeStepIdx;
                return (
                  <button 
                    key={step.key} 
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleStepClick(step)}
                    className="flex flex-col items-center text-center group cursor-pointer transition-transform hover:scale-105 focus:outline-none"
                    title={`Klik untuk ubah tahapan ke: ${step.label}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/80 shadow-xs scale-105'
                        : isPast
                        ? 'bg-blue-600 text-white group-hover:bg-blue-700'
                        : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-500'
                    }`}>
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.stepNumber}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] mt-1.5 transition-colors line-clamp-1 ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                        : isPast
                        ? 'text-slate-700 dark:text-slate-300 font-bold'
                        : 'text-slate-400 dark:text-slate-600 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt banner if project is 100% paid but not marked DONE yet */}
          {remainingReceivable <= 0 && project.workflow_step !== 'DONE' && (
            <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  🎉 Pembayaran Klien Sudah Lunas 100%! Anda dapat menandai proyek ini sebagai Selesai.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStepClick(workflowSteps[4])}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selesaikan Proyek (Deal)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. REORGANIZED FINANCIAL OVERVIEW (2 BALANCED CARDS INSTEAD OF 7 CHAOTIC BOXES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Card 1: Penerimaan Klien (Inflow & Piutang) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Kas Masuk (Klien)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Nilai Kontrak</span>
              <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                {formatRupiah(contractVal)}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1.5 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Diterima: {formatRupiah(clientPaid)} ({clientPaidPercent}%)
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                Sisa Piutang: {formatRupiah(clientReceivable)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${clientPaidPercent}%` }}
              />
              <div 
                className="bg-rose-400/60 dark:bg-rose-500/50 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${100 - clientPaidPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Pengeluaran Tim Subkon & Margin */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Beban Tim & Estimasi Laba
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Plafon Honor Tim</span>
              <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                {formatRupiah(teamHonor)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-medium">Terbayar Tim</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                {formatRupiah(teamPaid)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-medium">Hutang Tim</span>
              <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5 block truncate">
                {formatRupiah(teamPayable)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Margin Bersih</span>
              </span>
              <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300 mt-0.5 block truncate">
                {formatRupiah(grossMargin > 0 ? grossMargin : project.project_margin)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TAB NAVIGATION BAR (EASY TO USE & DRAMATICALLY REDUCES CLUTTER) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('revisi')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'revisi'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Revisi Proyek</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            remainingRevisions === 0 
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}>
            {currentRevision}/{maxRevisions}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pembayaran Klien</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {clientPayments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'team'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Tim & Subkon</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {teamMembers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Catatan & SPK</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ml-auto ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Rincian</span>
        </button>
      </div>

      {/* 5. ACTIVE TAB CONTENT WORKSPACE */}
      <div className="space-y-4">
        {activeTab === 'revisi' && renderRevisionSection()}
        {activeTab === 'payments' && renderPaymentsSection()}
        {activeTab === 'team' && renderTeamSection()}
        {activeTab === 'notes' && renderNotesSection()}

        {/* Tab "Semua Rincian" renders all components cleanly */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {renderRevisionSection()}
            {renderPaymentsSection()}
            {renderTeamSection()}
            {renderNotesSection()}
          </div>
        )}
      </div>

    </div>
  );
}
