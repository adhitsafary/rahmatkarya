import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderKanban, 
  DollarSign, 
  Users, 
  Printer, 
  Plus, 
  Trash2,
  Calendar,
  Building,
  Edit3
} from 'lucide-react';
import { 
  apiGetProjectDetail, 
  apiAddTeamMember, 
  apiAddTeamPayment,
  apiDeleteProject,
  getEndpoint
} from '../../services/api';
import { formatRupiah, formatDate, formatNumberWithDots, parseNumberFromDots } from '../../utils/format';

export default function FilamentDetailModal({ 
  isOpen, 
  project, 
  onClose, 
  onRefresh, 
  showToast,
  onOpenPayment,
  onOpenWhatsApp,
  onOpenEdit,
  onOpenDelete,
  canEdit = true,
  refreshTrigger = 0
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentProject = detail?.project || project;

  // New Team Member Form state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    member_name: '',
    member_role: '',
    agreed_honor: ''
  });

  // Team payout amount inputs
  const [payAmounts, setPayAmounts] = useState({});

  const fetchDetail = async () => {
    if (!project) return;
    setLoading(true);
    const res = await apiGetProjectDetail(project.project_id);
    if (res.success) {
      setDetail(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchDetail();
    }
  }, [isOpen, project, refreshTrigger]);

  if (!isOpen || !project) return null;

  const handleAddMember = async (e) => {
    e.preventDefault();
    const res = await apiAddTeamMember({
      project_id: project.project_id,
      ...memberForm,
      agreed_honor: parseNumberFromDots(memberForm.agreed_honor)
    });
    if (res.success) {
      showToast('Anggota tim berhasil ditambahkan!');
      setMemberForm({ member_name: '', member_role: '', agreed_honor: '' });
      setShowAddMember(false);
      fetchDetail();
      onRefresh();
    } else {
      showToast(res.message || 'Gagal menambahkan anggota tim', 'danger');
    }
  };

  const handlePayMember = async (memberId) => {
    const rawAmount = parseNumberFromDots(payAmounts[memberId]);
    if (!rawAmount || parseFloat(rawAmount) <= 0) {
      showToast('Masukkan nominal pembayaran tim!', 'warning');
      return;
    }

    const res = await apiAddTeamPayment({
      project_team_member_id: memberId,
      amount_paid: rawAmount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'TRANSFER BCA'
    });

    if (res.success) {
      showToast('Honor tim berhasil dibayarkan!');
      setPayAmounts({ ...payAmounts, [memberId]: '' });
      fetchDetail();
      onRefresh();
    } else {
      showToast(res.message || 'Gagal membayar honor tim', 'danger');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {detail?.project?.project_code || project.project_code}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {detail?.project?.project_name || project.project_name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <Building className="w-3.5 h-3.5" />
              <span>Klien: <strong className="text-slate-700 dark:text-slate-300">{detail?.project?.client_name || project.client_name}</strong></span>
              {(detail?.project?.client_phone || project.client_phone) && <span>&bull; {detail?.project?.client_phone || project.client_phone}</span>}
              {(detail?.project?.contract_number || project.contract_number) && <span>&bull; <span className="font-mono">{detail?.project?.contract_number || project.contract_number}</span></span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getEndpoint(`export.php?id=${project.project_id || project.id}`)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </a>

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenEdit && onOpenEdit(detail?.project || project)}
                  className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="Edit Informasi Proyek"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDelete && onOpenDelete(detail?.project || project)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="Hapus Proyek Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </>
            )}

            <button 
              onClick={onClose} 
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* 4 Financial Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Kontrak</span>
            <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {formatRupiah(detail?.project?.total_contract_value ?? project.total_contract_value)}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Sudah Diterima</span>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatRupiah(detail?.project?.total_paid_by_client ?? project.total_paid_by_client)}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Sisa Piutang</span>
            <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {formatRupiah(detail?.project?.client_receivable_remaining ?? project.client_receivable_remaining)}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Hutang Tim</span>
            <div className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {formatRupiah(detail?.project?.team_payable_remaining ?? project.team_payable_remaining)}
            </div>
          </div>
        </div>

        {/* Section 1: Riwayat Pembayaran Klien */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Riwayat Pembayaran Klien
            </h4>
            {canEdit && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPayment && onOpenPayment(currentProject)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  + Catat Pembayaran
                </button>
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp && onOpenWhatsApp(currentProject)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold cursor-pointer"
                >
                  Kirim WA
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detail?.client_payments?.map((cp) => (
                  <tr key={cp.id}>
                    <td className="py-2.5 px-3 font-mono">{formatDate(cp.payment_date)}</td>
                    <td className="py-2.5 px-3 font-bold">{cp.payment_type}</td>
                    <td className="py-2.5 px-3 text-slate-400">{cp.payment_method}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatRupiah(cp.amount_paid)}
                    </td>
                  </tr>
                ))}
                {(!detail?.client_payments || detail.client_payments.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400 italic">
                      Belum ada catatan pembayaran masuk dari klien.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Anggota Tim & Penyaluran Honor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Alokasi Honor Tim Subkon
            </h4>
            {canEdit && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                + Anggota Tim
              </button>
            )}
          </div>

          {/* Form Tambah Anggota Tim */}
          {canEdit && showAddMember && (
            <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <input
                type="text"
                required
                placeholder="Nama Tim (misal: Budi)"
                value={memberForm.member_name}
                onChange={(e) => setMemberForm({ ...memberForm, member_name: e.target.value })}
                className="rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
              <input
                type="text"
                placeholder="Peran (misal: UI Designer)"
                value={memberForm.member_role}
                onChange={(e) => setMemberForm({ ...memberForm, member_role: e.target.value })}
                className="rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Plafon Honor (Rp)"
                  value={memberForm.agreed_honor}
                  onChange={(e) => setMemberForm({ ...memberForm, agreed_honor: formatNumberWithDots(e.target.value) })}
                  className="rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-1 font-mono font-bold"
                />
                <button type="submit" className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer">
                  Simpan
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {detail?.team_members?.map((m) => {
              const remaining = parseFloat(m.remaining_honor) || 0;
              return (
                <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{m.member_name}</span>
                      <span className="text-slate-400 ml-2">({m.member_role || 'Subkon'})</span>
                    </div>
                    <div className="font-mono text-right">
                      <span className="text-slate-400">Plafon: </span>
                      <strong>{formatRupiah(m.agreed_honor)}</strong>
                      <span className="mx-2">&bull;</span>
                      <span className="text-slate-400">Sisa: </span>
                      <strong className={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        {formatRupiah(remaining)}
                      </strong>
                    </div>
                  </div>

                  {/* Form Bayar Honor */}
                  {canEdit && remaining > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Nominal bayar honor..."
                        value={payAmounts[m.id] || ''}
                        onChange={(e) => setPayAmounts({ ...payAmounts, [m.id]: formatNumberWithDots(e.target.value) })}
                        className="rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs w-48"
                      />
                      <button
                        type="button"
                        onClick={() => handlePayMember(m.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Bayar Honor
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {(!detail?.team_members || detail.team_members.length === 0) && (
              <p className="text-xs text-slate-400 italic py-2">
                Belum ada alokasi anggota tim untuk proyek ini.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
