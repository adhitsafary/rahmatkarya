<?php
// =====================================================================
// EXPORT PRINTABLE REPORT & INVOICE: ProCash Tracker
// Mode: Individual Project (?id=...) OR All Projects (?mode=all / default)
// =====================================================================

require_once __DIR__ . '/auth.php';
checkAuth();

require_once __DIR__ . '/config/db.php';
$pdo = Database::getConnection();

function rupiah($nominal) {
    return 'Rp ' . number_format((float)$nominal, 0, ',', '.');
}

$id = (int)($_GET['id'] ?? 0);
$mode = $_GET['mode'] ?? ($id > 0 ? 'single' : 'all');

// =====================================================================
// MODE ALL PROJECTS (RINGKASAN EKSEKUTIF SEMUA PROYEK)
// =====================================================================
if ($mode === 'all' || $id <= 0) {
    // Fetch all projects summary
    $stmt = $pdo->query("SELECT * FROM v_project_financial_summary ORDER BY project_id ASC");
    $projects = $stmt->fetchAll();

    $totalContract = 0;
    $totalPaid = 0;
    $totalReceivable = 0;
    $totalTeamHonor = 0;
    $totalNetCash = 0;

    foreach ($projects as $p) {
        $totalContract += (float)$p['total_contract_value'];
        $totalPaid += (float)$p['total_paid_by_client'];
        $totalReceivable += (float)$p['client_receivable_remaining'];
        $totalTeamHonor += (float)$p['total_disbursed_to_team'];
        $totalNetCash += (float)$p['net_cash_in_hand'];
    }
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rekapitulasi Arus Kas Semua Proyek - Rahmat-Karya</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { font-family: 'Inter', -apple-system, sans-serif; }
            .font-mono { font-variant-numeric: tabular-nums; }
            @media print {
                .no-print { display: none !important; }
                body { padding: 0; background: white; }
                .sheet { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; }
            }
        </style>
    </head>
    <body class="bg-slate-100 text-slate-800 p-4 md:p-8">

        <!-- Action Bar -->
        <div class="max-w-5xl mx-auto mb-6 flex justify-between items-center no-print">
            <a href="index.html" class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition">
                ← Kembali ke Dashboard
            </a>
            <button onclick="window.print()" class="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer">
                🖨️ Cetak / Simpan PDF
            </button>
        </div>

        <!-- Printable Sheet -->
        <div class="sheet max-w-5xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200">
            <!-- Header -->
            <div class="border-b-2 border-slate-900 pb-5 mb-5 flex justify-between items-start">
                <div>
                    <span class="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">Laporan Eksekutif Arus Kas</span>
                    <h1 class="text-2xl font-black text-slate-900 mt-2 tracking-tight">RAHMAT-KARYA</h1>
                    <p class="text-xs text-slate-500 mt-0.5">Rekapitulasi Keuangan, Nilai Kontrak SPK, Termin Masuk & Piutang Seluruh Proyek</p>
                </div>
                <div class="text-right">
                    <span class="text-[10px] text-slate-400 font-mono">Dicetak pada:</span>
                    <p class="text-xs font-bold text-slate-700 font-mono"><?= date('d F Y, H:i') ?> WIB</p>
                    <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-blue-100 text-blue-800 border border-blue-200">
                        Total <?= count($projects) ?> Proyek Terdaftar
                    </span>
                </div>
            </div>

            <!-- Summary KPI Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                    <span class="text-[10px] font-bold uppercase text-slate-400 font-mono">Total Nilai SPK</span>
                    <p class="text-sm font-black text-blue-600 font-mono mt-0.5"><?= rupiah($totalContract) ?></p>
                </div>
                <div>
                    <span class="text-[10px] font-bold uppercase text-slate-400 font-mono">Termin Masuk</span>
                    <p class="text-sm font-black text-emerald-600 font-mono mt-0.5"><?= rupiah($totalPaid) ?></p>
                </div>
                <div>
                    <span class="text-[10px] font-bold uppercase text-slate-400 font-mono">Sisa Piutang</span>
                    <p class="text-sm font-black text-rose-500 font-mono mt-0.5"><?= rupiah($totalReceivable) ?></p>
                </div>
                <div>
                    <span class="text-[10px] font-bold uppercase text-slate-400 font-mono">Honor Subkon</span>
                    <p class="text-sm font-black text-amber-500 font-mono mt-0.5"><?= rupiah($totalTeamHonor) ?></p>
                </div>
                <div>
                    <span class="text-[10px] font-bold uppercase text-slate-400 font-mono">Kas Bersih Riil</span>
                    <p class="text-sm font-black text-slate-900 font-mono mt-0.5"><?= rupiah($totalNetCash) ?></p>
                </div>
            </div>

            <!-- Projects Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="border-b-2 border-slate-200 text-slate-500 uppercase font-black text-[10px] font-mono tracking-wider bg-slate-50">
                            <th class="py-2.5 px-2 text-center w-8">No</th>
                            <th class="py-2.5 px-3">Kode / Proyek & Klien</th>
                            <th class="py-2.5 px-3 text-right">Nilai Kontrak</th>
                            <th class="py-2.5 px-3 text-right">Termin Masuk</th>
                            <th class="py-2.5 px-3 text-right">Sisa Piutang</th>
                            <th class="py-2.5 px-3 text-right">Honor Subkon</th>
                            <th class="py-2.5 px-2 text-center w-24">Tahap</th>
                            <th class="py-2.5 px-2 text-center w-20">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
                        <?php foreach ($projects as $idx => $p): 
                            $isPaid = (float)$p['client_receivable_remaining'] <= 0;
                            $pct = (float)$p['total_contract_value'] > 0 ? round(((float)$p['total_paid_by_client'] / (float)$p['total_contract_value']) * 100) : 0;
                        ?>
                            <tr class="hover:bg-slate-50/60 transition">
                                <td class="py-2.5 px-2 text-center text-slate-400"><?= $idx + 1 ?></td>
                                <td class="py-2.5 px-3 font-sans">
                                    <div class="font-extrabold text-slate-900 leading-tight"><?= htmlspecialchars($p['project_name']) ?></div>
                                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">Klien: <?= htmlspecialchars($p['client_name']) ?> • <?= htmlspecialchars($p['contract_number'] ?? $p['project_code']) ?></div>
                                </td>
                                <td class="py-2.5 px-3 text-right font-bold text-slate-900"><?= rupiah($p['total_contract_value']) ?></td>
                                <td class="py-2.5 px-3 text-right font-bold text-emerald-600">
                                    <?= rupiah($p['total_paid_by_client']) ?>
                                    <span class="block text-[9px] text-slate-400 font-normal"><?= $pct ?>%</span>
                                </td>
                                <td class="py-2.5 px-3 text-right font-bold <?= (float)$p['client_receivable_remaining'] > 0 ? 'text-rose-500' : 'text-slate-400' ?>">
                                    <?= (float)$p['client_receivable_remaining'] > 0 ? rupiah($p['client_receivable_remaining']) : 'Lunas (Rp 0)' ?>
                                </td>
                                <td class="py-2.5 px-3 text-right font-bold text-amber-500">
                                    <?= rupiah($p['total_disbursed_to_team']) ?>
                                </td>
                                <td class="py-2.5 px-2 text-center font-sans">
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                        <?= htmlspecialchars($p['workflow_step'] ?? 'KONTRAK') ?>
                                    </span>
                                </td>
                                <td class="py-2.5 px-2 text-center font-sans">
                                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold <?= $isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800' ?>">
                                        <?= $isPaid ? 'Lunas' : 'Belum' ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot class="border-t-2 border-slate-800 bg-slate-50 font-mono font-black text-[11px]">
                        <tr>
                            <td colspan="2" class="py-3 px-3 text-slate-900 font-sans uppercase">Total Rekapitulasi (<?= count($projects) ?> Proyek)</td>
                            <td class="py-3 px-3 text-right text-blue-600"><?= rupiah($totalContract) ?></td>
                            <td class="py-3 px-3 text-right text-emerald-600"><?= rupiah($totalPaid) ?></td>
                            <td class="py-3 px-3 text-right text-rose-500"><?= rupiah($totalReceivable) ?></td>
                            <td class="py-3 px-3 text-right text-amber-500"><?= rupiah($totalTeamHonor) ?></td>
                            <td colspan="2" class="py-3 px-2 text-center text-slate-800 font-sans">
                                Kas: <?= rupiah($totalNetCash) ?>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Footer Signatures -->
            <div class="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500">
                <div>
                    <p>Disiapkan Oleh:</p>
                    <div class="h-14"></div>
                    <p class="font-bold text-slate-900 text-sm">Tim Manajemen Keuangan</p>
                    <p>Finance & Project Control</p>
                </div>
                <div>
                    <p>Mengetahui / Pimpinan:</p>
                    <div class="h-14"></div>
                    <p class="font-bold text-slate-900 text-sm">Direktur Utama</p>
                    <p>PT Rahmat-Karya</p>
                </div>
            </div>
        </div>

        <script>
            // Auto open print dialog if auto=1 is passed
            if (new URLSearchParams(window.location.search).get('auto') === '1') {
                window.addEventListener('load', () => window.print());
            }
        </script>
    </body>
    </html>
    <?php
    exit;
}

// =====================================================================
// MODE SINGLE PROJECT (Rincian Lembar Rekap Per Proyek)
// =====================================================================
$stmt = $pdo->prepare("SELECT * FROM v_project_financial_summary WHERE project_id = ?");
$stmt->execute([$id]);
$project = $stmt->fetch();

if (!$project) {
    die("Proyek tidak ditemukan.");
}

$stmtCp = $pdo->prepare("SELECT * FROM client_payments WHERE project_id = ? ORDER BY payment_date ASC, id ASC");
$stmtCp->execute([$id]);
$clientPayments = $stmtCp->fetchAll();

$stmtPt = $pdo->prepare("SELECT * FROM project_payment_terms WHERE project_id = ? ORDER BY id ASC");
$stmtPt->execute([$id]);
$paymentTerms = $stmtPt->fetchAll();

$stmtRev = $pdo->prepare("SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number ASC");
$stmtRev->execute([$id]);
$revisions = $stmtRev->fetchAll();

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
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lembar Rekap Keuangan - <?= htmlspecialchars($project['project_name']) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; }
        .font-mono { font-variant-numeric: tabular-nums; }
        @media print {
            .no-print { display: none !important; }
            body { padding: 0; background: white; }
            .sheet { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; }
        }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 font-sans p-4 md:p-8">

    <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
        <a href="index.html" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition">
            ← Kembali ke Dashboard
        </a>
        <button onclick="window.print()" class="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer">
            🖨️ Cetak / Simpan PDF
        </button>
    </div>

    <div class="sheet max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200">
        <div class="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
            <div>
                <span class="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded">Lembar Rekap Proyek & Arus Kas</span>
                <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2"><?= htmlspecialchars($project['project_name']) ?></h1>
                <p class="text-slate-600 text-xs mt-1">No. Kontrak: <span class="font-mono font-bold text-slate-900"><?= htmlspecialchars($project['contract_number'] ?? $project['project_code']) ?></span> | Tgl: <span class="font-semibold"><?= htmlspecialchars($project['contract_date'] ?? $project['start_date']) ?></span> | Klien: <span class="font-semibold text-slate-800"><?= htmlspecialchars($project['client_name']) ?></span></p>
            </div>
            <div class="text-right">
                <span class="text-xs text-slate-400 font-mono">Dicetak pada:</span>
                <p class="text-sm font-medium text-slate-600 font-mono"><?= date('d F Y, H:i') ?> WIB</p>
                <div class="mt-2 space-y-1">
                    <span class="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-300 font-mono">
                        Tahap: <?= htmlspecialchars($project['workflow_step'] ?? 'KONTRAK') ?>
                    </span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">Nilai Kontrak</span>
                <p class="text-lg font-bold text-slate-900 font-mono mt-0.5"><?= rupiah($project['total_contract_value']) ?></p>
            </div>
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">Pemasukan Klien</span>
                <p class="text-lg font-bold text-emerald-600 font-mono mt-0.5"><?= rupiah($project['total_paid_by_client']) ?></p>
                <span class="text-xs text-slate-400 font-mono">Sisa: <?= rupiah($project['client_receivable_remaining']) ?></span>
            </div>
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">Honor Tim</span>
                <p class="text-lg font-bold text-amber-600 font-mono mt-0.5"><?= rupiah($project['total_disbursed_to_team']) ?></p>
                <span class="text-xs text-slate-400 font-mono">Sisa: <?= rupiah($project['team_payable_remaining']) ?></span>
            </div>
            <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">Kas Bersih Riil</span>
                <p class="text-lg font-bold text-blue-700 font-mono mt-0.5"><?= rupiah($project['net_cash_in_hand']) ?></p>
                <span class="text-xs text-slate-400 font-mono">Margin: <?= $project['profit_margin_percentage'] ?>%</span>
            </div>
        </div>

        <!-- Section Pemasukan Klien -->
        <div class="mb-8">
            <h2 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">1. Rincian Pemasukan Masuk dari Klien</h2>
            <table class="w-full text-left text-sm border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-xs font-mono">
                        <th class="py-2">No. Invoice</th>
                        <th class="py-2">Jenis Termin</th>
                        <th class="py-2">Tanggal</th>
                        <th class="py-2">Metode</th>
                        <th class="py-2 text-right">Jumlah Dibayar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono text-xs">
                    <?php if (empty($clientPayments)): ?>
                        <tr><td colspan="5" class="py-4 text-center text-slate-400 italic font-sans">Belum ada catatan termin masuk.</td></tr>
                    <?php else: ?>
                        <?php foreach ($clientPayments as $cp): ?>
                            <tr>
                                <td class="py-2 font-bold text-slate-800"><?= htmlspecialchars($cp['invoice_number'] ?? '-') ?></td>
                                <td class="py-2"><span class="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold"><?= htmlspecialchars($cp['payment_type']) ?></span></td>
                                <td class="py-2 text-slate-600"><?= htmlspecialchars($cp['payment_date']) ?></td>
                                <td class="py-2 text-slate-600"><?= htmlspecialchars($cp['payment_method']) ?></td>
                                <td class="py-2 text-right font-bold text-emerald-600"><?= rupiah($cp['amount_paid']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Section Honor Tim -->
        <div class="mb-8">
            <h2 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">2. Rincian Alokasi & Pembayaran Tim Pendukung</h2>
            <table class="w-full text-left text-sm border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-xs font-mono">
                        <th class="py-2">Nama Rekan</th>
                        <th class="py-2">Peran</th>
                        <th class="py-2 text-right">Plafon Honor</th>
                        <th class="py-2 text-right">Sudah Dicairkan</th>
                        <th class="py-2 text-right">Sisa Hutang</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono text-xs">
                    <?php if (empty($teamMembers)): ?>
                        <tr><td colspan="5" class="py-4 text-center text-slate-400 italic font-sans">Belum ada alokasi tim.</td></tr>
                    <?php else: ?>
                        <?php foreach ($teamMembers as $tm): ?>
                            <tr>
                                <td class="py-2 font-semibold text-slate-800 font-sans"><?= htmlspecialchars($tm['member_name']) ?></td>
                                <td class="py-2 text-slate-600 font-sans"><?= htmlspecialchars($tm['member_role']) ?></td>
                                <td class="py-2 text-right"><?= rupiah($tm['agreed_honor']) ?></td>
                                <td class="py-2 text-right text-amber-600"><?= rupiah($tm['total_paid']) ?></td>
                                <td class="py-2 text-right font-bold <?= $tm['remaining'] > 0 ? 'text-rose-600' : 'text-emerald-600' ?>"><?= rupiah($tm['remaining']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500">
            <div>
                <p>Disiapkan Oleh:</p>
                <div class="h-16"></div>
                <p class="font-bold text-slate-800 text-sm">Tim Manajemen Keuangan</p>
            </div>
            <div>
                <p>Mengetahui / Rekan IT:</p>
                <div class="h-16"></div>
                <p class="font-bold text-slate-800 text-sm">Direktur Utama</p>
            </div>
        </div>
    </div>
</body>
</html>
