<?php
// =====================================================================
// EXPORT PRINTABLE REPORT & INVOICE: ProCash Tracker
// =====================================================================

require_once __DIR__ . '/auth.php';
checkAuth();

require_once __DIR__ . '/config/db.php';
$pdo = Database::getConnection();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    die("ID Proyek tidak valid.");
}

// Fetch project summary
$stmt = $pdo->prepare("SELECT * FROM v_project_financial_summary WHERE project_id = ?");
$stmt->execute([$id]);
$project = $stmt->fetch();

if (!$project) {
    die("Proyek tidak ditemukan.");
}

// Fetch client payments
$stmtCp = $pdo->prepare("SELECT * FROM client_payments WHERE project_id = ? ORDER BY payment_date ASC, id ASC");
$stmtCp->execute([$id]);
$clientPayments = $stmtCp->fetchAll();

// Fetch payment terms (sistem pembayaran manual dalam uang)
$stmtPt = $pdo->prepare("SELECT * FROM project_payment_terms WHERE project_id = ? ORDER BY id ASC");
$stmtPt->execute([$id]);
$paymentTerms = $stmtPt->fetchAll();

// Fetch revisions
$stmtRev = $pdo->prepare("SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number ASC");
$stmtRev->execute([$id]);
$revisions = $stmtRev->fetchAll();

// Fetch team members and payments
$stmtTm = $pdo->prepare("SELECT * FROM project_team_members WHERE project_id = ? ORDER BY id ASC");
$stmtTm->execute([$id]);
$teamMembers = $stmtTm->fetchAll();

foreach ($teamMembers as &$member) {
    $stmtTp = $pdo->prepare("SELECT * FROM team_payments WHERE project_team_member_id = ? ORDER BY payment_date ASC");
    $stmtTp->execute([$member['id']]);
    $member['payments'] = $stmtTp->fetchAll();
    $member['total_paid'] = array_reduce($member['payments'], fn($c, $i) => $c + (float)$i['amount_paid'], 0.0);
    $member['remaining'] = (float)$member['agreed_honor'] - $member['total_paid'];
}

function rupiah($nominal) {
    return 'Rp ' . number_format((float)$nominal, 0, ',', '.');
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lembar Rekap Keuangan - <?= htmlspecialchars($project['project_name']) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            .no-print { display: none !important; }
            body { padding: 0; background: white; }
            .sheet { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; }
        }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 font-sans p-4 md:p-8">

    <!-- Top Action Bar (hidden on print) -->
    <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
        <a href="index.php" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition">
            ← Kembali ke Dashboard
        </a>
        <div class="flex gap-3">
            <button onclick="window.print()" class="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95">
                Cetak / Simpan PDF
            </button>
        </div>
    </div>

    <!-- Printable Paper Sheet -->
    <div class="sheet max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200">
        
        <!-- Header -->
        <div class="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
            <div>
                <span class="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded">Lembar Rekap Proyek & Arus Kas</span>
                <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2"><?= htmlspecialchars($project['project_name']) ?></h1>
                <p class="text-slate-600 text-xs mt-1">No. Kontrak: <span class="font-mono font-bold text-slate-900"><?= htmlspecialchars($project['contract_number'] ?? $project['project_code']) ?></span> | Tgl: <span class="font-semibold"><?= htmlspecialchars($project['contract_date'] ?? $project['start_date']) ?></span> | Klien: <span class="font-semibold text-slate-800"><?= htmlspecialchars($project['client_name']) ?></span></p>
                <?php if (!empty($project['project_detail'])): ?>
                    <p class="text-slate-500 text-xs mt-1 italic max-w-xl"><?= htmlspecialchars($project['project_detail']) ?></p>
                <?php endif; ?>
            </div>
            <div class="text-right">
                <span class="text-xs text-slate-400">Dicetak pada:</span>
                <p class="text-sm font-medium text-slate-600"><?= date('d F Y, H:i') ?> WIB</p>
                <div class="mt-2 space-y-1">
                    <div>
                        <span class="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-300 font-mono">
                            Tahap: <?= htmlspecialchars($project['workflow_step'] ?? 'KONTRAK') ?>
                        </span>
                    </div>
                    <div>
                        <?php if ($project['visual_status_badge'] === 'GREEN_SETTLED'): ?>
                            <span class="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-300">LUNAS SELESAI</span>
                        <?php elseif ($project['flag_has_unpaid_receivable']): ?>
                            <span class="bg-rose-100 text-rose-800 font-bold text-xs px-3 py-1 rounded-full border border-rose-300">PERLU PENAGIHAN KLIEN</span>
                        <?php else: ?>
                            <span class="bg-amber-100 text-amber-800 font-bold text-xs px-3 py-1 rounded-full border border-amber-300">TANGGUNGAN HONOR TIM</span>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Meta Durasi & Revisi Banner -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
                <span class="text-slate-400 uppercase font-bold text-[10px]">Durasi Pekerjaan:</span>
                <p class="font-semibold text-slate-800 mt-0.5"><?= htmlspecialchars($project['start_date'] ?? '-') ?> s/d <?= htmlspecialchars($project['deadline_date'] ?? '-') ?></p>
            </div>
            <div>
                <span class="text-slate-400 uppercase font-bold text-[10px]">Total Durasi:</span>
                <p class="font-semibold text-slate-800 mt-0.5"><?= (int)($project['duration_days'] ?? 0) ?> Hari Kalender</p>
            </div>
            <div>
                <span class="text-slate-400 uppercase font-bold text-[10px]">Status Revisi ($max):</span>
                <p class="font-semibold text-slate-800 mt-0.5"><?= (int)($project['current_revision'] ?? 0) ?> / <?= (int)($project['max_revisions'] ?? 3) ?> Revisi Mayor</p>
            </div>
            <div>
                <span class="text-slate-400 uppercase font-bold text-[10px]">Persetujuan Deal:</span>
                <p class="font-bold <?= ($project['revision_deal_status'] ?? '') === 'DEAL_APPROVED' ? 'text-emerald-600' : 'text-amber-600' ?> mt-0.5">
                    <?= htmlspecialchars($project['revision_deal_status'] ?? 'PENDING') ?>
                </p>
            </div>
        </div>

        <!-- 4 Key Figures Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Nilai Kontrak</span>
                <p class="text-lg font-bold text-slate-900 mt-0.5"><?= rupiah($project['total_contract_value']) ?></p>
            </div>
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Pemasukan Klien</span>
                <p class="text-lg font-bold text-emerald-600 mt-0.5"><?= rupiah($project['total_paid_by_client']) ?></p>
                <span class="text-xs text-slate-400">Sisa: <?= rupiah($project['client_receivable_remaining']) ?></span>
            </div>
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Honor Tim</span>
                <p class="text-lg font-bold text-amber-600 mt-0.5"><?= rupiah($project['total_disbursed_to_team']) ?></p>
                <span class="text-xs text-slate-400">Sisa: <?= rupiah($project['team_payable_remaining']) ?></span>
            </div>
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Kas Bersih Riil</span>
                <p class="text-lg font-bold text-blue-700 mt-0.5"><?= rupiah($project['net_cash_in_hand']) ?></p>
                <span class="text-xs text-slate-400">Margin: <?= $project['profit_margin_percentage'] ?>%</span>
            </div>
        </div>

        <!-- Section 1: Sistem Pembayaran Manual (Jadwal Termin dalam Nominal Uang) -->
        <div class="mb-8">
            <h2 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 1. Sistem Pembayaran & Jadwal Termin (Nominal Uang Riil)
            </h2>
            <table class="w-full text-left text-sm border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-xs">
                        <th class="py-2">Tahap / Termin</th>
                        <th class="py-2">Jatuh Tempo</th>
                        <th class="py-2">Status</th>
                        <th class="py-2 text-right">Nominal Uang (Rp)</th>
                        <th class="py-2 text-right">Realisasi Bayar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php if (empty($paymentTerms)): ?>
                        <tr><td colspan="5" class="py-4 text-center text-slate-400 italic">Belum ada jadwal termin manual untuk proyek ini.</td></tr>
                    <?php else: ?>
                        <?php foreach ($paymentTerms as $pt): ?>
                            <tr>
                                <td class="py-2.5 font-bold text-slate-800">
                                    <?= htmlspecialchars($pt['term_name']) ?>
                                    <?php if (!empty($pt['notes'])): ?>
                                        <div class="text-[11px] text-slate-400 font-normal"><?= htmlspecialchars($pt['notes']) ?></div>
                                    <?php endif; ?>
                                </td>
                                <td class="py-2.5 text-slate-600 font-mono text-xs"><?= !empty($pt['due_date']) ? date('d/m/Y', strtotime($pt['due_date'])) : '-' ?></td>
                                <td class="py-2.5">
                                    <span class="text-[11px] font-bold px-2 py-0.5 rounded <?= $pt['status'] === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' ?>">
                                        <?= htmlspecialchars($pt['status']) ?>
                                    </span>
                                </td>
                                <td class="py-2.5 text-right font-mono font-bold text-slate-800"><?= rupiah($pt['amount']) ?></td>
                                <td class="py-2.5 text-right font-mono font-bold <?= $pt['status'] === 'PAID' ? 'text-emerald-600' : 'text-slate-400' ?>">
                                    <?= rupiah($pt['paid_amount']) ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Section 2: Client Payments -->
        <div class="mb-8">
            <h2 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 2. Rincian Pemasukan Masuk dari Klien
            </h2>
            <table class="w-full text-left text-sm border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-xs">
                        <th class="py-2">No. Invoice</th>
                        <th class="py-2">Jenis Termin</th>
                        <th class="py-2">Tanggal</th>
                        <th class="py-2">Metode</th>
                        <th class="py-2 text-right">Jumlah Dibayar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php if (empty($clientPayments)): ?>
                        <tr><td colspan="5" class="py-4 text-center text-slate-400 italic">Belum ada pembayaran masuk dari klien.</td></tr>
                    <?php else: ?>
                        <?php foreach ($clientPayments as $cp): ?>
                            <tr>
                                <td class="py-2.5 font-mono text-slate-700"><?= htmlspecialchars($cp['invoice_number'] ?? '-') ?></td>
                                <td class="py-2.5 font-semibold text-slate-800"><?= htmlspecialchars($cp['payment_type']) ?></td>
                                <td class="py-2.5 text-slate-600"><?= date('d/m/Y', strtotime($cp['payment_date'])) ?></td>
                                <td class="py-2.5 text-slate-600"><?= htmlspecialchars($cp['payment_method']) ?></td>
                                <td class="py-2.5 text-right font-bold text-emerald-600"><?= rupiah($cp['amount_paid']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                        <tr class="border-t-2 border-slate-200 bg-slate-50 font-bold">
                            <td colspan="4" class="py-2.5 text-slate-700">Total Pemasukan Masuk</td>
                            <td class="py-2.5 text-right text-emerald-700"><?= rupiah($project['total_paid_by_client']) ?></td>
                        </tr>
                        <tr class="bg-rose-50/50 font-semibold text-xs text-rose-700">
                            <td colspan="4" class="py-2">Sisa Piutang Klien (Belum Ditagih / Belum Cair)</td>
                            <td class="py-2 text-right"><?= rupiah($project['client_receivable_remaining']) ?></td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Section 3: Revisions Log -->
        <div class="mb-8">
            <h2 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 3. Riwayat & Kuota Revisi Mayor (Maksimal <?= (int)$project['max_revisions'] ?>x)
            </h2>
            <?php if (empty($revisions)): ?>
                <p class="py-2 text-center text-slate-400 italic text-xs">Belum ada pengajuan revisi pada proyek ini.</p>
            <?php else: ?>
                <table class="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr class="border-b border-slate-200 text-slate-500 text-xs">
                            <th class="py-2">Revisi Ke</th>
                            <th class="py-2">Judul Perbaikan</th>
                            <th class="py-2">Catatan Detail</th>
                            <th class="py-2">Diajukan</th>
                            <th class="py-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php foreach ($revisions as $rev): ?>
                            <tr>
                                <td class="py-2.5 font-bold font-mono">#<?= (int)$rev['revision_number'] ?></td>
                                <td class="py-2.5 font-semibold text-slate-800"><?= htmlspecialchars($rev['title']) ?></td>
                                <td class="py-2.5 text-slate-600 text-xs"><?= htmlspecialchars($rev['description']) ?></td>
                                <td class="py-2.5 text-slate-500 font-mono text-xs"><?= date('d/m/Y', strtotime($rev['requested_date'])) ?></td>
                                <td class="py-2.5 text-center">
                                    <span class="text-[11px] font-bold px-2 py-0.5 rounded <?= $rev['status'] === 'DEAL_APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' ?>">
                                        <?= htmlspecialchars($rev['status']) ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <!-- Section 4: Team Members & Disbursements -->
        <div class="mb-8">
            <h2 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> 4. Rincian Alokasi & Pembayaran Tim Pendukung
            </h2>
            <table class="w-full text-left text-sm border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-xs">
                        <th class="py-2">Nama Rekan / Vendor</th>
                        <th class="py-2">Peran</th>
                        <th class="py-2 text-right">Plafon Honor</th>
                        <th class="py-2 text-right">Sudah Dicairkan</th>
                        <th class="py-2 text-right">Sisa Hutang Hak Tim</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php if (empty($teamMembers)): ?>
                        <tr><td colspan="5" class="py-4 text-center text-slate-400 italic">Belum ada alokasi anggota tim untuk proyek ini.</td></tr>
                    <?php else: ?>
                        <?php foreach ($teamMembers as $tm): ?>
                            <tr>
                                <td class="py-2.5 font-semibold text-slate-800">
                                    <?= htmlspecialchars($tm['member_name']) ?>
                                    <?php if (!empty($tm['bank_account_info'])): ?>
                                        <div class="text-xs text-slate-400 font-normal"><?= htmlspecialchars($tm['bank_account_info']) ?></div>
                                    <?php endif; ?>
                                </td>
                                <td class="py-2.5 text-slate-600"><?= htmlspecialchars($tm['member_role']) ?></td>
                                <td class="py-2.5 text-right font-medium text-slate-800"><?= rupiah($tm['agreed_honor']) ?></td>
                                <td class="py-2.5 text-right font-semibold text-amber-600"><?= rupiah($tm['total_paid']) ?></td>
                                <td class="py-2.5 text-right font-bold <?= $tm['remaining'] > 0 ? 'text-rose-600' : 'text-emerald-600' ?>">
                                    <?= rupiah($tm['remaining']) ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        <tr class="border-t-2 border-slate-200 bg-slate-50 font-bold">
                            <td colspan="2" class="py-2.5 text-slate-700">Total Komitmen & Realisasi Tim</td>
                            <td class="py-2.5 text-right text-slate-900"><?= rupiah($project['total_agreed_team_honor']) ?></td>
                            <td class="py-2.5 text-right text-amber-600"><?= rupiah($project['total_disbursed_to_team']) ?></td>
                            <td class="py-2.5 text-right text-rose-600"><?= rupiah($project['team_payable_remaining']) ?></td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Footer Signatures -->
        <div class="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500">
            <div>
                <p>Disiapkan Oleh:</p>
                <div class="h-16"></div>
                <p class="font-bold text-slate-800 text-sm">Tim Manajemen Keuangan</p>
                <p>Finance & Project Control</p>
            </div>
            <div>
                <p>Mengetahui / Penanggung Jawab Desain:</p>
                <div class="h-16"></div>
                <p class="font-bold text-slate-800 text-sm">Tim Arsitektur & Perencanaan</p>
                <p>Principal Architect / Project Leader</p>
            </div>
        </div>

    </div>

</body>
</html>
