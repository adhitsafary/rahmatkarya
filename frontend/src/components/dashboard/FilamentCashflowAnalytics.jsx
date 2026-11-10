import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  CreditCard, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  Users,
  FileCheck,
  Lock,
  Flame,
  Eye,
  X,
  PhoneCall,
  ExternalLink,
  Layers
} from 'lucide-react';
import { formatRupiah, getInitials } from '../../utils/format';

// Clean WhatsApp Icon
const WhatsAppIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function getDaysLeft(deadlineStr) {
  if (!deadlineStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadlineStr);
  if (isNaN(dl.getTime())) return null;
  dl.setHours(0, 0, 0, 0);
  const diffTime = dl.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDaysBadge(days) {
  if (days === null || days === undefined) {
    return { text: 'Belum Diatur', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
  }
  if (days < 0) {
    return { text: `Terlewat ${Math.abs(days)} Hari`, class: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900' };
  }
  if (days === 0) {
    return { text: 'Deadline Hari Ini!', class: 'bg-rose-600 text-white animate-pulse' };
  }
  if (days <= 7) {
    return { text: `Sisa ${days} Hari`, class: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900' };
  }
  return { text: `Sisa ${days} Hari`, class: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
}

function getRankBadge(index) {
  if (index === 0) return { label: '#1', class: 'bg-amber-500 text-white shadow-2xs font-black' };
  if (index === 1) return { label: '#2', class: 'bg-slate-400 text-white shadow-2xs font-bold' };
  if (index === 2) return { label: '#3', class: 'bg-amber-700 text-white shadow-2xs font-bold' };
  return { label: `#${index + 1}`, class: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium' };
}

export default function FilamentCashflowAnalytics({
  projects = [],
  summary = null,
  onOpenDetail,
  onOpenPayment,
  onOpenWhatsApp,
  onOpenSimulator,
  selectedWorkflowStage = null,
  onSelectWorkflowStage
}) {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [internalSelectedStage, setInternalSelectedStage] = useState(null);

  const activeSelectedStage = selectedWorkflowStage !== undefined && selectedWorkflowStage !== null ? selectedWorkflowStage : internalSelectedStage;

  const handleSelectStage = (stageKey) => {
    const next = activeSelectedStage === stageKey ? null : stageKey;
    if (onSelectWorkflowStage) {
      onSelectWorkflowStage(next);
    }
    setInternalSelectedStage(next);
  };

  const getNormalizedStage = (p) => {
    let step = p.workflow_step || 'KONTRAK';
    if (step === 'KONTRAK_DP') step = 'KONTRAK';
    if (step === 'PEMBAYARAN_AKHIR') step = 'PELUNASAN';
    if (!['KONTRAK', 'PENGERJAAN', 'REVISI', 'PELUNASAN', 'DONE'].includes(step)) step = 'PENGERJAAN';
    return step;
  };

  const selectedStageProjects = useMemo(() => {
    if (!activeSelectedStage) return [];
    return projects.filter(p => getNormalizedStage(p) === activeSelectedStage);
  }, [projects, activeSelectedStage]);

  // Sorting and limit state for cashflow comparison chart (Default: 3 data teratas)
  const [chartSort, setChartSort] = useState('highest_spk'); // 'highest_spk' | 'lowest_spk' | 'highest_rec' | 'newest'
  const [showAllChart, setShowAllChart] = useState(false);

  // Filter Radar Category: 'all' | 'receivables' | 'revisions' | 'deadlines' | 'subkons'
  const [radarFilter, setRadarFilter] = useState('all');

  // Modal State for View All Top 5: null | 'receivables' | 'revisions' | 'deadlines' | 'subkons'
  const [modalType, setModalType] = useState(null);

  // Inline Expand State for Each Card: toggle to show Top 5 inside the card
  const [expandedCards, setExpandedCards] = useState({
    receivables: false,
    revisions: false,
    deadlines: false,
    subkons: false
  });

  const toggleExpand = (key) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Financial aggregates & Actionable Priority Lists
  const stats = useMemo(() => {
    let totalContract = summary?.total_contract ?? 0;
    let totalPaidClients = summary?.total_paid_clients ?? 0;
    let totalReceivables = summary?.total_receivables ?? 0;
    let totalPaidTeam = summary?.total_paid_team ?? 0;
    let totalPayables = summary?.total_payables ?? 0;
    let totalTeamHonor = summary?.total_team_honor ?? 0;

    if (totalContract === 0 && projects.length > 0) {
      projects.forEach(p => {
        totalContract += parseFloat(p.total_contract_value) || 0;
        totalPaidClients += parseFloat(p.total_paid_by_client) || 0;
        totalReceivables += parseFloat(p.client_receivable_remaining) || 0;
        totalPaidTeam += parseFloat(p.total_paid_to_team) || 0;
        totalPayables += parseFloat(p.team_payable_remaining) || 0;
        totalTeamHonor += parseFloat(p.total_agreed_team_honor) || 0;
      });
    }

    const netCash = totalPaidClients - totalPaidTeam;
    const profitMargin = totalPaidClients > 0 
      ? Math.round(((totalPaidClients - totalPaidTeam) / totalPaidClients) * 100) 
      : (totalContract > 0 ? Math.round(((totalContract - totalTeamHonor) / totalContract) * 100) : 0);
    const collectionRate = totalContract > 0 
      ? Math.round((totalPaidClients / totalContract) * 100) 
      : 0;
    const subkonExpenseRatio = totalContract > 0 
      ? Math.round((totalTeamHonor / totalContract) * 100) 
      : 0;

    // Workflow stages breakdown
    const stages = {
      KONTRAK: { label: 'Kontrak & DP', count: 0, nominal: 0, color: '#3B82F6' },
      PENGERJAAN: { label: 'Pengerjaan Desain', count: 0, nominal: 0, color: '#6366F1' },
      REVISI: { label: 'Revisi Mayor', count: 0, nominal: 0, color: '#F59E0B' },
      PELUNASAN: { label: 'Pelunasan', count: 0, nominal: 0, color: '#EC4899' },
      DONE: { label: 'Selesai (Done)', count: 0, nominal: 0, color: '#10B981' }
    };

    projects.forEach(p => {
      let step = p.workflow_step || 'KONTRAK';
      if (step === 'KONTRAK_DP') step = 'KONTRAK';
      if (step === 'PEMBAYARAN_AKHIR') step = 'PELUNASAN';
      if (!stages[step]) step = 'PENGERJAAN';

      stages[step].count++;
      stages[step].nominal += parseFloat(p.total_contract_value) || 0;
    });

    // 1. TOP 5 PIUTANG KLIEN TERBESAR
    const sortedReceivables = [...projects]
      .filter(p => (parseFloat(p.client_receivable_remaining) || 0) > 0)
      .sort((a, b) => (parseFloat(b.client_receivable_remaining) || 0) - (parseFloat(a.client_receivable_remaining) || 0));
    const highestReceivable = sortedReceivables[0] || null;
    const top5Receivables = sortedReceivables.slice(0, 5);

    // 2. TOP 5 MONITORING REVISI MAYOR & KUOTA BERLEBIH
    const sortedRevisions = [...projects]
      .filter(p => p.project_status !== 'COMPLETED' && p.workflow_step !== 'DONE')
      .sort((a, b) => {
        const curA = parseInt(a.current_revision) || 0;
        const curB = parseInt(b.current_revision) || 0;
        const maxA = parseInt(a.max_revisions) || 3;
        const maxB = parseInt(b.max_revisions) || 3;
        const ratioA = curA / maxA;
        const ratioB = curB / maxB;
        const unapprovedA = a.revision_deal_status !== 'DEAL_APPROVED' ? 1 : 0;
        const unapprovedB = b.revision_deal_status !== 'DEAL_APPROVED' ? 1 : 0;
        if (unapprovedB !== unapprovedA) return unapprovedB - unapprovedA;
        if (ratioB !== ratioA) return ratioB - ratioA;
        return curB - curA;
      });
    const revisionActive = sortedRevisions[0] || null;
    const top5Revisions = sortedRevisions.slice(0, 5);

    // 3. TOP 5 TARGET SERAH TERIMA DED & GAMBAR KERJA TERDEKAT
    const sortedDeadlines = [...projects]
      .filter(p => p.project_status !== 'COMPLETED' && p.workflow_step !== 'DONE' && p.deadline_date)
      .map(p => {
        const days = (p.days_left_to_deadline !== undefined && p.days_left_to_deadline !== null)
          ? parseInt(p.days_left_to_deadline)
          : getDaysLeft(p.deadline_date);
        return { ...p, calculatedDaysLeft: days };
      })
      .sort((a, b) => (a.calculatedDaysLeft ?? 999) - (b.calculatedDaysLeft ?? 999));
    const nearestDeadline = sortedDeadlines[0] || null;
    const top5Deadlines = sortedDeadlines.slice(0, 5);

    // 4. TOP 5 PENGENDALIAN KAS TALANGAN & HONOR SUBKON
    const sortedSubkons = [...projects]
      .filter(p => (parseFloat(p.team_payable_remaining) || 0) > 0 || (parseFloat(p.total_paid_to_team) || 0) > 0)
      .sort((a, b) => {
        const payA = parseFloat(a.team_payable_remaining) || 0;
        const payB = parseFloat(b.team_payable_remaining) || 0;
        return payB - payA;
      });
    const highestSubkonPayable = sortedSubkons[0] || null;
    const top5Subkons = sortedSubkons.slice(0, 5);

    return {
      totalContract,
      totalPaidClients,
      totalReceivables,
      totalPaidTeam,
      totalPayables,
      netCash,
      profitMargin,
      collectionRate,
      subkonExpenseRatio,
      stages,
      highestReceivable,
      top5Receivables,
      revisionActive,
      top5Revisions,
      nearestDeadline,
      top5Deadlines,
      highestSubkonPayable,
      top5Subkons
    };
  }, [projects, summary]);

  // Visual Chart calculations: default 3 data teratas (Terbesar -> Terkecil)
  const chartProjects = useMemo(() => {
    let list = [...projects];
    if (chartSort === 'highest_spk') {
      list.sort((a, b) => (parseFloat(b.total_contract_value) || 0) - (parseFloat(a.total_contract_value) || 0));
    } else if (chartSort === 'lowest_spk') {
      list.sort((a, b) => (parseFloat(a.total_contract_value) || 0) - (parseFloat(b.total_contract_value) || 0));
    } else if (chartSort === 'highest_rec') {
      list.sort((a, b) => (parseFloat(b.client_receivable_remaining) || 0) - (parseFloat(a.client_receivable_remaining) || 0));
    } else if (chartSort === 'newest') {
      list.sort((a, b) => (b.project_id || b.id || 0) - (a.project_id || a.id || 0));
    }
    return showAllChart ? list : list.slice(0, 3);
  }, [projects, chartSort, showAllChart]);

  const maxVal = useMemo(() => {
    let max = 1000000;
    chartProjects.forEach(p => {
      const c = parseFloat(p.total_contract_value) || 0;
      const pd = parseFloat(p.total_paid_by_client) || 0;
      const rc = parseFloat(p.client_receivable_remaining) || 0;
      const tm = parseFloat(p.total_agreed_team_honor) || 0;
      if (c > max) max = c;
      if (pd > max) max = pd;
      if (rc > max) max = rc;
      if (tm > max) max = tm;
    });
    return max * 1.05; // 5% breathing room
  }, [chartProjects]);

  // Donut chart path calculations
  const donutData = useMemo(() => {
    const totalCount = projects.length || 1;
    let cumulativeAngle = 0;
    const slices = [];

    Object.entries(stats.stages).forEach(([key, stage]) => {
      const sliceAngle = (stage.count / totalCount) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle = endAngle;

      slices.push({
        key,
        label: stage.label,
        count: stage.count,
        nominal: stage.nominal,
        color: stage.color,
        startAngle,
        endAngle,
        percent: Math.round((stage.count / totalCount) * 100)
      });
    });

    return slices;
  }, [stats.stages, projects.length]);

  // Modal configuration details
  const modalConfig = useMemo(() => {
    if (modalType === 'receivables') {
      return {
        title: 'Top 5 Piutang Klien Terbesar',
        subtitle: 'Daftar 5 proyek dengan nominal piutang terbuka tertinggi yang memerlukan penagihan segera.',
        icon: AlertTriangle,
        iconBg: 'bg-rose-500',
        badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        data: stats.top5Receivables,
        type: 'receivables'
      };
    }
    if (modalType === 'revisions') {
      return {
        title: 'Top 5 Monitoring Revisi Mayor',
        subtitle: 'Pengawasan ketat kuota revisi (maksimal 3x) untuk mencegah pengerjaan berlebih (scope creep).',
        icon: Clock,
        iconBg: 'bg-amber-500',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        data: stats.top5Revisions,
        type: 'revisions'
      };
    }
    if (modalType === 'deadlines') {
      return {
        title: 'Top 5 Target Serah Terima DED Terdekat',
        subtitle: 'Prioritas batas waktu penyerahan gambar kerja, DED, dan 3D render agar jadwal proyek klien tepat waktu.',
        icon: Calendar,
        iconBg: 'bg-blue-600',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        data: stats.top5Deadlines,
        type: 'deadlines'
      };
    }
    if (modalType === 'subkons') {
      return {
        title: 'Top 5 Pengendalian Kas Talangan & Honor Subkon',
        subtitle: 'Pengawasan komitmen honor rekanan (Drafter CAD, Struktur, ME) untuk menjaga arus kas studio tetap aman.',
        icon: Users,
        iconBg: 'bg-emerald-600',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        data: stats.top5Subkons,
        type: 'subkons'
      };
    }

    // Pie Chart Drilldown: Stage selection (KONTRAK, PENGERJAAN, REVISI, PELUNASAN, DONE, ALL)
    if (modalType && modalType.startsWith('stage_')) {
      const stageKey = modalType.replace('stage_', '');

      const getNormalizedStage = (p) => {
        let step = p.workflow_step || 'KONTRAK';
        if (step === 'KONTRAK_DP') step = 'KONTRAK';
        if (step === 'PEMBAYARAN_AKHIR') step = 'PELUNASAN';
        if (!['KONTRAK', 'PENGERJAAN', 'REVISI', 'PELUNASAN', 'DONE'].includes(step)) step = 'PENGERJAAN';
        return step;
      };

      if (stageKey === 'ALL') {
        return {
          title: 'Semua Proyek Studio',
          subtitle: `Menampilkan total ${projects.length} proyek dalam seluruh alur kerja rancang bangun studio.`,
          icon: PieChart,
          iconBg: 'bg-indigo-600',
          badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
          data: projects,
          type: 'stage',
          stageKey: 'ALL',
          stageLabel: 'Semua Proyek',
          totalNominal: stats.totalContract
        };
      }

      const st = stats.stages[stageKey] || { label: stageKey, count: 0, nominal: 0, color: '#3B82F6' };
      const stageProjects = projects.filter(p => getNormalizedStage(p) === stageKey);

      return {
        title: `Tahapan: ${st.label}`,
        subtitle: `Menampilkan ${stageProjects.length} proyek pada tahap ${st.label} (Akumulasi SPK: ${formatRupiah(st.nominal)}).`,
        icon: PieChart,
        iconBg: stageKey === 'DONE' ? 'bg-emerald-600' : (stageKey === 'REVISI' ? 'bg-amber-500' : (stageKey === 'PELUNASAN' ? 'bg-pink-600' : (stageKey === 'PENGERJAAN' ? 'bg-indigo-600' : 'bg-blue-600'))),
        badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        stageColor: st.color,
        data: stageProjects,
        type: 'stage',
        stageKey,
        stageLabel: st.label,
        totalNominal: st.nominal
      };
    }

    return null;
  }, [modalType, stats, projects]);

  return (
    <div className="space-y-4">

      {/* ================================================================= */}
      {/* 1. DUAL VISUAL CHARTS ROW (CASHFLOW BARS + WORKFLOW RADAR DONUT)  */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Left Chart (2 Cols): Interactive Cashflow Comparison Bars */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  KOMPARASI ARUS KAS PER PROYEK
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Visualisasi realisasi Termin Masuk vs Sisa Piutang vs Honor Subkon (Urutan: Terbesar &rarr; Terkecil)
              </p>
            </div>

            {/* Controls: Sort Dropdown, Tombol Lihat Semua & Legend */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Dropdown Sort */}
              <div className="flex items-center gap-1.5">
                <select
                  value={chartSort}
                  onChange={(e) => setChartSort(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  title="Urutan Proyek"
                >
                  <option value="highest_spk">Total SPK (Terbesar - Terkecil)</option>
                  <option value="lowest_spk">Total SPK (Terkecil - Terbesar)</option>
                  <option value="highest_rec">Sisa Piutang Terbesar</option>
                  <option value="newest">Proyek Terbaru</option>
                </select>

                {projects.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllChart(!showAllChart)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title={showAllChart ? "Tampilkan 3 Proyek Saja" : "Tampilkan Seluruh Proyek"}
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{showAllChart ? 'Ringkas (3)' : `Lihat Semua (${projects.length})`}</span>
                  </button>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2.5 text-[10px] font-bold font-mono pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  Termin Masuk
                </span>
                <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  Sisa Piutang
                </span>
                <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
                  Honor Tim
                </span>
              </div>
            </div>
          </div>

          {/* SVG Visual Bars Canvas */}
          <div className="relative pt-2">
            {chartProjects.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Belum ada proyek yang dapat ditampilkan
              </div>
            ) : (
              <div className="space-y-3.5">
                {chartProjects.map((p, idx) => {
                  const contract = parseFloat(p.total_contract_value) || 0;
                  const paid = parseFloat(p.total_paid_by_client) || 0;
                  const rec = parseFloat(p.client_receivable_remaining) || 0;
                  const teamTotal = parseFloat(p.total_agreed_team_honor) || 0;

                  const paidW = maxVal > 0 ? Math.max(0, Math.min(100, (paid / maxVal) * 100)) : 0;
                  const recW = maxVal > 0 ? Math.max(0, Math.min(100, (Math.max(0, rec) / maxVal) * 100)) : 0;
                  const teamW = maxVal > 0 ? Math.max(0, Math.min(100, (teamTotal / maxVal) * 100)) : 0;

                  const isHovered = hoveredProject === p.project_id;
                  const rankBadge = getRankBadge(idx);

                  return (
                    <div 
                      key={p.project_id || p.id || idx}
                      onMouseEnter={() => setHoveredProject(p.project_id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      onClick={() => onOpenDetail(p)}
                      className={`p-2.5 rounded-xl transition cursor-pointer ${
                        isHovered 
                          ? 'bg-slate-50 dark:bg-slate-800/80 shadow-2xs' 
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Bar Top Label */}
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {chartSort === 'highest_spk' ? (
                            <span className={`w-5 h-5 rounded-md text-[9px] font-black font-mono flex items-center justify-center shrink-0 ${rankBadge.class}`}>
                              {rankBadge.label}
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[9px] font-black font-mono flex items-center justify-center shrink-0">
                              {getInitials(p.project_name) || `P${idx+1}`}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {p.project_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate hidden sm:inline">
                            ({p.client_name})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          Total SPK: <span className="text-slate-900 dark:text-white">{formatRupiah(contract)}</span>
                        </div>
                      </div>

                      {/* Triple Micro-Bars for comparison */}
                      <div className="space-y-1">
                        
                        {/* 1. Kas Masuk (Emerald) */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[10px] font-mono text-slate-400 text-right">Masuk</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${paidW}%` }}
                            />
                          </div>
                          <span className="w-24 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                            {formatRupiah(paid)}
                          </span>
                        </div>

                        {/* 2. Sisa Piutang (Rose) */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[10px] font-mono text-slate-400 text-right">Piutang</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                              style={{ width: `${recW}%` }}
                            />
                          </div>
                          <span className="w-24 text-[10px] font-mono font-bold text-rose-500 dark:text-rose-400 text-right">
                            {formatRupiah(rec)}
                          </span>
                        </div>

                        {/* 3. Plafon Subkon (Amber) */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[10px] font-mono text-slate-400 text-right">Subkon</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                              style={{ width: `${teamW}%` }}
                            />
                          </div>
                          <span className="w-24 text-[10px] font-mono font-bold text-amber-500 dark:text-amber-400 text-right">
                            {formatRupiah(teamTotal)}
                          </span>
                        </div>

                      </div>

                    </div>
                  );
                })}

                {/* Tombol Lihat Semua di bawah daftar 3 data */}
                {projects.length > 3 && (
                  <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAllChart(!showAllChart)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 transition cursor-pointer shadow-2xs active:scale-98"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {showAllChart 
                          ? 'Tampilkan 3 Data Saja (Ringkas)' 
                          : `Lihat Semua (${projects.length} Proyek)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Chart (1 Col): Donut Distribution of Workflow Stages */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                    STATUS ALUR KERJA PROYEK
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Distribusi 5 tahapan alur SPK rancang bangun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalType('stage_ALL')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer flex items-center gap-1"
                title="Buka rincian semua proyek"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Donut Chart SVG (Interactive, Crisp Vector & Selectable per Color) */}
            <div className="flex flex-col items-center justify-center my-3">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90 pointer-events-auto" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  {/* Interactive Slices */}
                  {donutData.map((slice) => {
                    if (slice.count === 0) return null;
                    const strokeDasharray = `${(slice.count / (projects.length || 1)) * 100} ${100 - (slice.count / (projects.length || 1)) * 100}`;
                    const strokeDashoffset = -slice.startAngle * (100 / 360);
                    const isSelected = activeSelectedStage === slice.key;
                    const isHovered = hoveredSlice?.key === slice.key;
                    const isAnyActive = !!activeSelectedStage || !!hoveredSlice;
                    const isDimmed = isAnyActive && !isSelected && !isHovered;

                    return (
                      <circle
                        key={slice.key}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isSelected ? "4.8" : (isHovered ? "4.2" : "3.2")}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStage(slice.key);
                        }}
                        onMouseEnter={() => setHoveredSlice(slice)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          opacity: isDimmed ? 0.35 : 1,
                          cursor: 'pointer'
                        }}
                      >
                        <title>{`${slice.label}: ${slice.count} Proyek (${formatRupiah(slice.nominal)}) - Klik untuk pilih warna ini`}</title>
                      </circle>
                    );
                  })}
                </svg>

                {/* Donut Inner Label (Properly sized to the inner hole so it does NOT block slice clicks) */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeSelectedStage) {
                      handleSelectStage(activeSelectedStage);
                    } else {
                      setModalType('stage_ALL');
                    }
                  }}
                  className="w-[102px] h-[102px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center rounded-full cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-all p-2 group pointer-events-auto"
                  title={activeSelectedStage ? "Klik untuk reset pilihan warna" : "Klik untuk melihat semua data proyek"}
                >
                  {hoveredSlice ? (
                    <>
                      <span className="text-xl font-black font-mono leading-none transition-colors" style={{ color: hoveredSlice.color }}>
                        {hoveredSlice.count}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-tight truncate max-w-[80px] mt-0.5 leading-tight" style={{ color: hoveredSlice.color }}>
                        {hoveredSlice.label}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 mt-0.5 flex items-center gap-0.5">
                        {activeSelectedStage === hoveredSlice.key ? '✕ Batal' : 'Pilih Warna'}
                      </span>
                    </>
                  ) : activeSelectedStage ? (
                    <>
                      <span className="text-xl font-black font-mono leading-none" style={{ color: stats.stages[activeSelectedStage]?.color }}>
                        {stats.stages[activeSelectedStage]?.count || 0}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-tight truncate max-w-[80px] mt-0.5 leading-tight" style={{ color: stats.stages[activeSelectedStage]?.color }}>
                        {stats.stages[activeSelectedStage]?.label}
                      </span>
                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full mt-0.5 hover:bg-slate-200">
                        ✕ Reset
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white leading-none">
                        {projects.length}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Total Proyek
                      </span>
                      <span className="text-[8px] font-semibold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Pilih Warna
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Click Hint Helper */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                  {activeSelectedStage 
                    ? `Warna terpilih: ${stats.stages[activeSelectedStage]?.label}` 
                    : '💡 Klik warna diagram untuk memilih card'}
                </span>
                {activeSelectedStage && (
                  <button
                    type="button"
                    onClick={() => handleSelectStage(activeSelectedStage)}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Workflow Stage Legend List (Clickable per stage to select color) */}
            <div className="space-y-1 pt-0.5">
              {Object.entries(stats.stages).map(([k, st]) => {
                const isSelected = activeSelectedStage === k;
                const isHovered = hoveredSlice?.key === k;
                return (
                  <div
                    key={k}
                    onClick={() => handleSelectStage(k)}
                    onMouseEnter={() => setHoveredSlice({ key: k, ...st })}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`flex items-center justify-between text-xs p-1.5 rounded-xl transition cursor-pointer group border ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-2xs font-bold'
                        : isHovered
                          ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                    title={`Klik untuk memilih warna ${st.label}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform" 
                        style={{ 
                          backgroundColor: st.color,
                          transform: isSelected ? 'scale(1.25)' : 'scale(1)'
                        }}
                      ></span>
                      <span className={`truncate text-[11px] ${isSelected ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {st.label}
                      </span>
                      {isSelected && (
                        <span 
                          className="text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider shrink-0" 
                          style={{ backgroundColor: `${st.color}22`, color: st.color }}
                        >
                          Dipilih
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {st.count}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        ({formatRupiah(st.nominal)})
                      </span>
                      <ChevronRight className={`w-3 h-3 text-slate-400 transition-opacity -mr-0.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Stage Project Cards Drawer (Inside Card) */}
            {activeSelectedStage && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stats.stages[activeSelectedStage]?.color }}></span>
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">
                      Kartu {stats.stages[activeSelectedStage]?.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold shrink-0">
                      {selectedStageProjects.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalType(`stage_${activeSelectedStage}`)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Pop-up</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(activeSelectedStage)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      ✕ Tutup
                    </button>
                  </div>
                </div>

                {/* Project Cards List */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {selectedStageProjects.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Belum ada proyek di tahapan ini.</p>
                  ) : (
                    selectedStageProjects.map((p, idx) => (
                      <div 
                        key={p.project_id || p.id || idx}
                        className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h5 
                              onClick={() => onOpenDetail(p)}
                              className="font-bold text-xs text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
                            >
                              {p.project_name}
                            </h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              Klien: <strong className="text-slate-700 dark:text-slate-300">{p.client_name}</strong>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                              {formatRupiah(p.total_contract_value)}
                            </span>
                            {(parseFloat(p.client_receivable_remaining) || 0) > 0 ? (
                              <span className="text-[9px] font-mono font-semibold text-rose-600 dark:text-rose-400 block">
                                Piutang: {formatRupiah(p.client_receivable_remaining)}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 block">
                                Lunas 100%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons inside card */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800 text-[10px]">
                          <span className="text-slate-400 font-mono">
                            Progres: <strong className="text-slate-700 dark:text-slate-300">{p.progress_percent || 0}%</strong>
                          </span>
                          <div className="flex items-center gap-1">
                            {(parseFloat(p.client_receivable_remaining) || 0) > 0 && (
                              <button
                                onClick={() => onOpenPayment(p)}
                                className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition cursor-pointer"
                              >
                                Bayar
                              </button>
                            )}
                            <button
                              onClick={() => onOpenWhatsApp(p)}
                              className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-0.5 cursor-pointer"
                            >
                              <WhatsAppIcon className="w-2.5 h-2.5" />
                              <span>WA</span>
                            </button>
                            <button
                              onClick={() => onOpenDetail(p)}
                              className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                            >
                              Detail
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Kas Masuk Likuid:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(stats.netCash)}</strong>
            </div>
          </div>

        </div>

      </div>

      {/* ================================================================= */}
      {/* 3. RADAR AKSI CEPAT & SISTEM KONTROL PRIORITAS STUDIO             */}
      {/* ================================================================= */}
      <div className="space-y-3 pt-2">
        
        {/* Radar Header & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight uppercase">
                RADAR KONTROL & PRIORITAS OPERASIONAL
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pusat peringatan otomatis: amankan kas masuk, tertibkan kuota revisi, dan kawal deadline serah terima DED.
            </p>
          </div>

          {/* Minimalist Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'Semua Radar', count: 4, dot: 'bg-slate-400' },
              { id: 'receivables', label: 'Piutang Klien', count: stats.top5Receivables.length, dot: 'bg-rose-500' },
              { id: 'revisions', label: 'Revisi Mayor', count: stats.top5Revisions.length, dot: 'bg-amber-500' },
              { id: 'deadlines', label: 'Deadline DED', count: stats.top5Deadlines.length, dot: 'bg-blue-500' },
              { id: 'subkons', label: 'Honor Subkon', count: stats.top5Subkons.length, dot: 'bg-emerald-500' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRadarFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  radarFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4 Multi-Quadrant Radar Cards Grid (1 Baris Penuh / 4 Kolom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* ============================================================= */}
          {/* RADAR 1: PERINGATAN PIUTANG TERBESAR                          */}
          {/* ============================================================= */}
          {(radarFilter === 'all' || radarFilter === 'receivables') && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3.5 transition">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                      Piutang Klien
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      Amankan Pelunasan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {stats.top5Receivables.length > 1 && (
                    <button
                      onClick={() => toggleExpand('receivables')}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-0.5"
                      title="Buka / Tutup 5 Data Teratas"
                    >
                      <span>{expandedCards.receivables ? 'Ringkas' : '5 Top'}</span>
                      {expandedCards.receivables ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  <button
                    onClick={() => setModalType('receivables')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Lihat Semua Piutang"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              {stats.highestReceivable ? (
                <>
                  {!expandedCards.receivables ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      {/* Project Info & Metric */}
                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            #1 Terbesar
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Belum Lunas
                          </span>
                        </div>

                        <div>
                          <h5 
                            onClick={() => onOpenDetail(stats.highestReceivable)}
                            className="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                            title={stats.highestReceivable.project_name}
                          >
                            {stats.highestReceivable.project_name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {stats.highestReceivable.client_name}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-baseline justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Sisa Piutang
                          </span>
                          <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                            {formatRupiah(stats.highestReceivable.client_receivable_remaining)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 text-xs pt-1">
                        <button
                          onClick={() => onOpenPayment(stats.highestReceivable)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-rose-600/25 active:scale-98"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Catat Bayar</span>
                        </button>

                        <button
                          onClick={() => onOpenWhatsApp(stats.highestReceivable)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer shadow-2xs"
                          title="Follow Up WA"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>

                        <button
                          onClick={() => onOpenDetail(stats.highestReceivable)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Lihat Detail Proyek"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Inline Expanded Top 5 List
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                      {stats.top5Receivables.map((p, idx) => {
                        const rank = getRankBadge(idx);
                        return (
                          <div 
                            key={p.project_id || p.id || idx}
                            className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-1.5 text-xs hover:border-rose-300 transition"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center shrink-0 ${rank.class}`}>
                                {rank.label}
                              </span>
                              <div className="min-w-0">
                                <h5 
                                  onClick={() => onOpenDetail(p)}
                                  className="font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:underline text-[11px]"
                                >
                                  {p.project_name}
                                </h5>
                                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-[10px] block">
                                  {formatRupiah(p.client_receivable_remaining)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onOpenWhatsApp(p)}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                                title="Follow Up WA"
                              >
                                <WhatsAppIcon className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onOpenPayment(p)}
                                className="p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                                title="Catat Bayar"
                              >
                                <CreditCard className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Tidak ada piutang klien yang belum tertagih.
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* RADAR 2: MONITORING REVISI MAYOR                              */}
          {/* ============================================================= */}
          {(radarFilter === 'all' || radarFilter === 'revisions') && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3.5 transition">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                      Revisi Mayor
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      Maks 3x Revisi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {stats.top5Revisions.length > 1 && (
                    <button
                      onClick={() => toggleExpand('revisions')}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-0.5"
                      title="Buka / Tutup 5 Data Teratas"
                    >
                      <span>{expandedCards.revisions ? 'Ringkas' : '5 Top'}</span>
                      {expandedCards.revisions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  <button
                    onClick={() => setModalType('revisions')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Lihat Semua Revisi"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              {stats.revisionActive ? (
                <>
                  {!expandedCards.revisions ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      {/* Project Info & Metric */}
                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Prioritas
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate max-w-[120px]">
                            {stats.revisionActive.revision_deal_status === 'DEAL_APPROVED' ? 'Deal Kompensasi' : 'Belum Kompensasi'}
                          </span>
                        </div>

                        <div>
                          <h5 
                            onClick={() => onOpenDetail(stats.revisionActive)}
                            className="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-amber-600 transition"
                            title={stats.revisionActive.project_name}
                          >
                            {stats.revisionActive.project_name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {stats.revisionActive.client_name}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-baseline justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Kuota Revisi
                          </span>
                          <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                            Revisi {stats.revisionActive.current_revision || 0} / {stats.revisionActive.max_revisions || 3}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 text-xs pt-1">
                        <button
                          onClick={() => onOpenDetail(stats.revisionActive)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs shadow-amber-500/25 active:scale-98"
                        >
                          <span>Kelola Revisi</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenWhatsApp(stats.revisionActive)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer shadow-2xs"
                          title="Diskusi Revisi WA"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>

                        <button
                          onClick={() => onOpenDetail(stats.revisionActive)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Lihat Detail Proyek"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                      {stats.top5Revisions.map((p, idx) => {
                        const rank = getRankBadge(idx);
                        const curRev = parseInt(p.current_revision) || 0;
                        const maxRev = parseInt(p.max_revisions) || 3;
                        return (
                          <div 
                            key={p.project_id || p.id || idx}
                            className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-1.5 text-xs hover:border-amber-300 transition"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center shrink-0 ${rank.class}`}>
                                {rank.label}
                              </span>
                              <div className="min-w-0">
                                <h5 
                                  onClick={() => onOpenDetail(p)}
                                  className="font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:underline text-[11px]"
                                >
                                  {p.project_name}
                                </h5>
                                <span className="font-mono font-bold text-amber-600 text-[10px] block">
                                  {curRev}/{maxRev} Rev
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => onOpenDetail(p)}
                              className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer"
                              title="Kelola Revisi"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Semua proyek dalam kuota revisi aman.
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* RADAR 3: TARGET SERAH TERIMA DED & GAMBAR KERJA               */}
          {/* ============================================================= */}
          {(radarFilter === 'all' || radarFilter === 'deadlines') && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3.5 transition">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                      Deadline DED
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      Kawal Serah Terima
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {stats.top5Deadlines.length > 1 && (
                    <button
                      onClick={() => toggleExpand('deadlines')}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-0.5"
                      title="Buka / Tutup 5 Data Teratas"
                    >
                      <span>{expandedCards.deadlines ? 'Ringkas' : '5 Top'}</span>
                      {expandedCards.deadlines ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  <button
                    onClick={() => setModalType('deadlines')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Lihat Semua Deadline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              {stats.nearestDeadline ? (
                <>
                  {!expandedCards.deadlines ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      {/* Project Info & Metric */}
                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Target Terdekat
                          </span>
                          {(() => {
                            const badge = formatDaysBadge(stats.nearestDeadline.calculatedDaysLeft);
                            return (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black font-mono ${badge.class}`}>
                                {badge.text}
                              </span>
                            );
                          })()}
                        </div>

                        <div>
                          <h5 
                            onClick={() => onOpenDetail(stats.nearestDeadline)}
                            className="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600 transition"
                            title={stats.nearestDeadline.project_name}
                          >
                            {stats.nearestDeadline.project_name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {stats.nearestDeadline.client_name} &bull; {stats.nearestDeadline.deadline_date || '-'}
                          </p>
                        </div>

                        {/* Progress bar */}
                        <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>Progres DED</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{stats.nearestDeadline.progress_percent || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.max(0, stats.nearestDeadline.progress_percent || 0))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 text-xs pt-1">
                        <button
                          onClick={() => onOpenDetail(stats.nearestDeadline)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-blue-600/25 active:scale-98"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Rincian DED</span>
                        </button>

                        <button
                          onClick={() => onOpenWhatsApp(stats.nearestDeadline)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer shadow-2xs"
                          title="Koordinasi WA"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>

                        <button
                          onClick={() => onOpenDetail(stats.nearestDeadline)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Lihat Detail Proyek"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                      {stats.top5Deadlines.map((p, idx) => {
                        const rank = getRankBadge(idx);
                        const badge = formatDaysBadge(p.calculatedDaysLeft);
                        return (
                          <div 
                            key={p.project_id || p.id || idx}
                            className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-1.5 text-xs hover:border-blue-300 transition"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center shrink-0 ${rank.class}`}>
                                {rank.label}
                              </span>
                              <div className="min-w-0">
                                <h5 
                                  onClick={() => onOpenDetail(p)}
                                  className="font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:underline text-[11px]"
                                >
                                  {p.project_name}
                                </h5>
                                <span className={`px-1 rounded text-[9px] font-mono font-bold ${badge.class}`}>
                                  {badge.text}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => onOpenDetail(p)}
                              className="p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                              title="Rincian Proyek"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada tenggat waktu serah terima yang tercatat.
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* RADAR 4: PENGENDALIAN KAS TALANGAN & HONOR SUBKON              */}
          {/* ============================================================= */}
          {(radarFilter === 'all' || radarFilter === 'subkons') && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3.5 transition">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                      Honor Subkon
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      Kewajiban Tim
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {stats.top5Subkons.length > 1 && (
                    <button
                      onClick={() => toggleExpand('subkons')}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-0.5"
                      title="Buka / Tutup 5 Data Teratas"
                    >
                      <span>{expandedCards.subkons ? 'Ringkas' : '5 Top'}</span>
                      {expandedCards.subkons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  <button
                    onClick={() => setModalType('subkons')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Lihat Semua Honor"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              {stats.highestSubkonPayable ? (
                <>
                  {!expandedCards.subkons ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      {/* Project Info & Metric */}
                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Komitmen
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Belum Dicairkan
                          </span>
                        </div>

                        <div>
                          <h5 
                            onClick={() => onOpenDetail(stats.highestSubkonPayable)}
                            className="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-emerald-600 transition"
                            title={stats.highestSubkonPayable.project_name}
                          >
                            {stats.highestSubkonPayable.project_name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Klien: {stats.highestSubkonPayable.client_name}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-baseline justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Sisa Hak Honor
                          </span>
                          <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(stats.highestSubkonPayable.team_payable_remaining)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 text-xs pt-1">
                        <button
                          onClick={() => onOpenDetail(stats.highestSubkonPayable)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-600/25 active:scale-98"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cairkan Honor</span>
                        </button>

                        <button
                          onClick={() => onOpenWhatsApp(stats.highestSubkonPayable)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer shadow-2xs"
                          title="Hubungi Subkon WA"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>

                        <button
                          onClick={() => onOpenDetail(stats.highestSubkonPayable)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Lihat Detail Proyek"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                      {stats.top5Subkons.map((p, idx) => {
                        const rank = getRankBadge(idx);
                        return (
                          <div 
                            key={p.project_id || p.id || idx}
                            className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-1.5 text-xs hover:border-emerald-300 transition"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center shrink-0 ${rank.class}`}>
                                {rank.label}
                              </span>
                              <div className="min-w-0">
                                <h5 
                                  onClick={() => onOpenDetail(p)}
                                  className="font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:underline text-[11px]"
                                >
                                  {p.project_name}
                                </h5>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[10px] block">
                                  {formatRupiah(p.team_payable_remaining)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => onOpenDetail(p)}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                              title="Pencairan Honor"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Tidak ada kewajiban honor tim/subkon yang tertahan.
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ================================================================= */}
      {/* 4. MODAL INTERAKTIF: LIHAT SEMUA (TOP 5 DATA TERATAS)             */}
      {/* ================================================================= */}
      {modalConfig && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setModalType(null)}
        >
          <div 
            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-2xl ${modalConfig.iconBg} text-white shadow-sm shrink-0`}>
                  <modalConfig.icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {modalConfig.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {modalConfig.subtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Financial Snapshot for Stage Drilldown */}
            {modalConfig.type === 'stage' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Jumlah Proyek</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                    {modalConfig.data.length} Proyek
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total Akumulasi SPK</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                    {formatRupiah(modalConfig.totalNominal || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Kas Diterima</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatRupiah(modalConfig.data.reduce((sum, p) => sum + (parseFloat(p.total_paid_by_client) || 0), 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Sisa Piutang Klien</span>
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                    {formatRupiah(modalConfig.data.reduce((sum, p) => sum + (parseFloat(p.client_receivable_remaining) || 0), 0))}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Items List */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {modalConfig.data.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada data untuk kategori ini.
                </div>
              ) : (
                modalConfig.data.map((item, idx) => {
                  const rank = modalConfig.type === 'stage'
                    ? { label: `${idx + 1}`, class: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 font-bold' }
                    : getRankBadge(idx);

                  const itemStageKey = (() => {
                    let step = item.workflow_step || 'KONTRAK';
                    if (step === 'KONTRAK_DP') step = 'KONTRAK';
                    if (step === 'PEMBAYARAN_AKHIR') step = 'PELUNASAN';
                    if (!['KONTRAK', 'PENGERJAAN', 'REVISI', 'PELUNASAN', 'DONE'].includes(step)) step = 'PENGERJAAN';
                    return step;
                  })();

                  return (
                    <div 
                      key={item.project_id || item.id || idx}
                      className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Rank + Project Info */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-xl text-xs font-mono font-black flex items-center justify-center shrink-0 ${rank.class}`}>
                          {rank.label}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 
                              onClick={() => {
                                setModalType(null);
                                onOpenDetail(item);
                              }}
                              className="font-extrabold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
                            >
                              {item.project_name}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.project_code || `PRJ-${item.id}`}
                            </span>
                            {modalConfig.stageKey === 'ALL' && (
                              <span 
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                                style={{ backgroundColor: stats.stages[itemStageKey]?.color || '#6366F1' }}
                              >
                                {stats.stages[itemStageKey]?.label || itemStageKey}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Klien: <strong className="text-slate-700 dark:text-slate-300">{item.client_name}</strong> {item.client_phone ? `(${item.client_phone})` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Metrics + Action Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                        
                        {/* Metric depending on card type */}
                        <div className="text-right">
                          {modalConfig.type === 'receivables' && (
                            <>
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm block">
                                {formatRupiah(item.client_receivable_remaining)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Sisa Piutang
                              </span>
                            </>
                          )}

                          {modalConfig.type === 'revisions' && (
                            <>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs block">
                                Revisi {item.current_revision || 0}/{item.max_revisions || 3}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {item.revision_deal_status === 'DEAL_APPROVED' ? 'Deal Disetujui' : 'Belum Deal'}
                              </span>
                            </>
                          )}

                          {modalConfig.type === 'deadlines' && (
                            <>
                              {(() => {
                                const badge = formatDaysBadge(item.calculatedDaysLeft);
                                return (
                                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] block ${badge.class}`}>
                                    {badge.text}
                                  </span>
                                );
                              })()}
                              <span className="text-[10px] text-slate-400 mt-0.5 block">
                                Target: {item.deadline_date || '-'}
                              </span>
                            </>
                          )}

                          {modalConfig.type === 'subkons' && (
                            <>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                                {formatRupiah(item.team_payable_remaining)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Sisa Honor Subkon
                              </span>
                            </>
                          )}

                          {modalConfig.type === 'stage' && (
                            <>
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                                SPK: {formatRupiah(item.total_contract_value)}
                              </span>
                              {(parseFloat(item.client_receivable_remaining) || 0) > 0 ? (
                                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 text-[10px] block">
                                  Piutang: {formatRupiah(item.client_receivable_remaining)}
                                </span>
                              ) : (
                                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] block">
                                  Lunas 100%
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Progres: <strong className="text-slate-700 dark:text-slate-300">{item.progress_percent || 0}%</strong>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Direct 1-Click Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {modalConfig.type === 'stage' && (
                            <>
                              {(parseFloat(item.client_receivable_remaining) || 0) > 0 && (
                                <button
                                  onClick={() => {
                                    setModalType(null);
                                    onOpenPayment(item);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                                  title="Catat Pembayaran"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Bayar</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenWhatsApp(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Kirim Pesan WhatsApp"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>

                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenDetail(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Buka Detail Proyek"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Detail</span>
                              </button>
                            </>
                          )}
                          {modalConfig.type === 'receivables' && (
                            <>
                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenPayment(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                                title="Catat Pelunasan"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Bayar</span>
                              </button>

                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenWhatsApp(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Kirim Pesan WhatsApp"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Follow Up</span>
                              </button>
                            </>
                          )}

                          {modalConfig.type === 'revisions' && (
                            <>
                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenDetail(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Kelola Revisi"
                              >
                                <span>Kelola</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenWhatsApp(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Diskusi WA</span>
                              </button>
                            </>
                          )}

                          {modalConfig.type === 'deadlines' && (
                            <>
                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenDetail(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Buka Detail Proyek"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Rincian</span>
                              </button>

                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenWhatsApp(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WA Klien</span>
                              </button>
                            </>
                          )}

                          {modalConfig.type === 'subkons' && (
                            <>
                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenDetail(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Pencairan Honor Subkon"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Cairkan</span>
                              </button>

                              <button
                                onClick={() => {
                                  setModalType(null);
                                  onOpenWhatsApp(item);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Hubungi</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setModalType(null);
                              onOpenDetail(item);
                            }}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                            title="Buka Halaman Proyek"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">
                {modalConfig.type === 'stage'
                  ? `Menampilkan total ${modalConfig.data.length} proyek pada tahap ${modalConfig.stageLabel || ''}`
                  : 'Menampilkan maksimal 5 data prioritas tertinggi'}
              </span>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
