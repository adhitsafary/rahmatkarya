<?php
// =====================================================================
// AI TRACKER ENGINE: ProCash Tracker Financial Analysis & Error Guard
// =====================================================================
// Purpose: Analyzes cashflow patterns, detects overpayments, cash deficits,
// duplicate records, aging receivables, and generates actionable risk scores
// and recommendations to minimize financial and bookkeeping errors.
// =====================================================================

class AIPaymentTracker {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Conducts a full portfolio-wide AI analysis across all projects,
     * client payments, and team honor disbursements.
     */
    public function analyzeAll(): array {
        $projectsStmt = $this->pdo->query("SELECT * FROM v_project_financial_summary WHERE project_status != 'ARCHIVED' ORDER BY project_id ASC");
        $projects = $projectsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch all client payments
        $cpStmt = $this->pdo->query("
            SELECT cp.*, p.project_name, p.client_name 
            FROM client_payments cp 
            JOIN projects p ON cp.project_id = p.id 
            ORDER BY cp.payment_date ASC, cp.id ASC
        ");
        $clientPayments = $cpStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch all team members with payments
        $tmStmt = $this->pdo->query("
            SELECT tm.*, p.project_name 
            FROM project_team_members tm 
            JOIN projects p ON tm.project_id = p.id 
            ORDER BY tm.id ASC
        ");
        $teamMembers = $tmStmt->fetchAll(PDO::FETCH_ASSOC);

        $tpStmt = $this->pdo->query("
            SELECT tp.*, tm.member_name, tm.project_id, p.project_name 
            FROM team_payments tp 
            JOIN project_team_members tm ON tp.project_team_member_id = tm.id 
            JOIN projects p ON tm.project_id = p.id 
            ORDER BY tp.payment_date ASC, tp.id ASC
        ");
        $teamPayments = $tpStmt->fetchAll(PDO::FETCH_ASSOC);

        $anomalies = [];
        $projectAudits = [];
        $today = date('Y-m-d');
        $todayTs = strtotime($today);

        // -------------------------------------------------------------
        // 1. Analyze Each Project Individually
        // -------------------------------------------------------------
        foreach ($projects as $p) {
            $pId = (int)$p['project_id'];
            $contractVal = (float)$p['total_contract_value'];
            $paidClient = (float)$p['total_paid_by_client'];
            $receivable = (float)$p['client_receivable_remaining'];
            $agreedHonor = (float)$p['total_agreed_team_honor'];
            $paidTeam = (float)$p['total_disbursed_to_team'];
            $teamPayable = (float)$p['team_payable_remaining'];
            $netCash = (float)$p['net_cash_in_hand'];
            $marginPct = (float)$p['profit_margin_percentage'];
            $deadline = $p['deadline_date'];

            $projIssues = [];

            // A. DEFISIT KAS PROYEK (Dana Talangan Pribadi)
            if ($netCash < 0) {
                $deficitAmt = abs($netCash);
                $issue = [
                    'id' => 'DEFICIT_' . $pId,
                    'project_id' => $pId,
                    'project_name' => $p['project_name'],
                    'client_name' => $p['client_name'],
                    'type' => 'CASH_DEFICIT',
                    'severity' => 'CRITICAL',
                    'title' => 'Defisit Kas Proyek (Dana Talangan Terdeteksi)',
                    'description' => sprintf(
                        "Uang kas di tangan mengalami minus sebesar Rp %s. Anda telah mencairkan honor tim Rp %s sementara pembayaran dari klien baru masuk Rp %s.",
                        number_format($deficitAmt, 0, ',', '.'),
                        number_format($paidTeam, 0, ',', '.'),
                        number_format($paidClient, 0, ',', '.')
                    ),
                    'impact' => sprintf("Dana pribadi tertahan / defisit kas Rp %s.", number_format($deficitAmt, 0, ',', '.')),
                    'solution' => 'Prioritaskan penagihan termin ke klien sekarang untuk menutup defisit, atau tunda pencairan honor berikutnya.',
                    'action_label' => 'Tagih Klien via WA',
                    'action_type' => 'OPEN_WA'
                ];
                $anomalies[] = $issue;
                $projIssues[] = $issue;
            }

            // B. POTENSI OVERPAYMENT KLIEN (Kelebihan Bayar)
            if ($paidClient > $contractVal && $contractVal > 0) {
                $overAmt = $paidClient - $contractVal;
                $issue = [
                    'id' => 'CLIENT_OVERPAY_' . $pId,
                    'project_id' => $pId,
                    'project_name' => $p['project_name'],
                    'client_name' => $p['client_name'],
                    'type' => 'CLIENT_OVERPAY',
                    'severity' => 'CRITICAL',
                    'title' => 'Pembayaran Klien Melebihi Nilai Kontrak',
                    'description' => sprintf(
                        "Total pembayaran klien tercatat Rp %s, melebihi nilai kontrak Rp %s (+Rp %s).",
                        number_format($paidClient, 0, ',', '.'),
                        number_format($contractVal, 0, ',', '.'),
                        number_format($overAmt, 0, ',', '.')
                    ),
                    'impact' => sprintf("Terdapat selisih lebih bayar Rp %s yang berpotensi komplain atau salah input termin.", number_format($overAmt, 0, ',', '.')),
                    'solution' => 'Periksa mutasi bank dan bukti invoice. Jika ada penambahan scope pekerjaan, update nilai kontrak proyek.',
                    'action_label' => 'Cek Riwayat Pembayaran',
                    'action_type' => 'VIEW_DETAIL'
                ];
                $anomalies[] = $issue;
                $projIssues[] = $issue;
            }

            // C. KOMITMEN HONOR MELEBIHI KONTRAK (Proyek Rugi)
            if ($agreedHonor > $contractVal && $contractVal > 0) {
                $lossAmt = $agreedHonor - $contractVal;
                $issue = [
                    'id' => 'BUDGET_OVERRUN_' . $pId,
                    'project_id' => $pId,
                    'project_name' => $p['project_name'],
                    'client_name' => $p['client_name'],
                    'type' => 'BUDGET_OVERRUN',
                    'severity' => 'CRITICAL',
                    'title' => 'Plafon Honor Tim Melampaui Nilai Kontrak',
                    'description' => sprintf(
                        "Total plafon honor tim disepakati Rp %s, padahal nilai kontrak hanya Rp %s. Proyek diproyeksikan minus Rp %s.",
                        number_format($agreedHonor, 0, ',', '.'),
                        number_format($contractVal, 0, ',', '.'),
                        number_format($lossAmt, 0, ',', '.')
                    ),
                    'impact' => 'Kerugian finansial bersih pada proyek ini.',
                    'solution' => 'Negosiasikan ulang honor subkontraktor atau ajukan klaim addendum biaya tambahan ke klien.',
                    'action_label' => 'Kelola Anggota Tim',
                    'action_type' => 'OPEN_TEAM'
                ];
                $anomalies[] = $issue;
                $projIssues[] = $issue;
            }

            // D. PIUTANG MENUNGGAK & RISIKO DEADLINE
            if ($receivable > 0) {
                if (!empty($deadline)) {
                    $deadlineTs = strtotime($deadline);
                    $daysDiff = (int)round(($todayTs - $deadlineTs) / 86400);

                    if ($daysDiff > 0) {
                        // Lewat deadline
                        $issue = [
                            'id' => 'RECEIVABLE_OVERDUE_' . $pId,
                            'project_id' => $pId,
                            'project_name' => $p['project_name'],
                            'client_name' => $p['client_name'],
                            'type' => 'RECEIVABLE_OVERDUE',
                            'severity' => 'CRITICAL',
                            'title' => 'Piutang Menunggak (Tenggat Waktu Terlampaui)',
                            'description' => sprintf(
                                "Deadline proyek telah lewat %d hari (%s), namun sisa piutang sebesar Rp %s belum dilunasi klien.",
                                $daysDiff,
                                date('d M Y', $deadlineTs),
                                number_format($receivable, 0, ',', '.')
                            ),
                            'impact' => sprintf("Piutang macet Rp %s menghambat perputaran arus kas operasional.", number_format($receivable, 0, ',', '.')),
                            'solution' => 'Kirimkan pesan pengingat tagihan formal kepada klien segera.',
                            'action_label' => 'Kirim Tagihan WA',
                            'action_type' => 'OPEN_WA'
                        ];
                        $anomalies[] = $issue;
                        $projIssues[] = $issue;
                    } elseif ($daysDiff >= -7) {
                        // Mendekati deadline (≤ 7 hari lagi)
                        $daysLeft = abs($daysDiff);
                        $issue = [
                            'id' => 'RECEIVABLE_NEAR_DEADLINE_' . $pId,
                            'project_id' => $pId,
                            'project_name' => $p['project_name'],
                            'client_name' => $p['client_name'],
                            'type' => 'RECEIVABLE_NEAR_DEADLINE',
                            'severity' => 'WARNING',
                            'title' => 'Mendekati Batas Akhir Proyek',
                            'description' => sprintf(
                                "Tenggat proyek tersisa %d hari lagi (%s), sisa piutang Rp %s belum tertagih.",
                                $daysLeft,
                                date('d M Y', $deadlineTs),
                                number_format($receivable, 0, ',', '.')
                            ),
                            'impact' => 'Potensi keterlambatan pelunasan pasca penyerahan hasil kerja (deliverables).',
                            'solution' => 'Kirimkan draf invoice pelunasan atau konfirmasi kesiapan termin akhir.',
                            'action_label' => 'Kirim Tagihan WA',
                            'action_type' => 'OPEN_WA'
                        ];
                        $anomalies[] = $issue;
                        $projIssues[] = $issue;
                    }
                }

                // Kontak WhatsApp kosong saat ada piutang
                if (empty(trim($p['client_phone'] ?? ''))) {
                    $issue = [
                        'id' => 'MISSING_CLIENT_PHONE_' . $pId,
                        'project_id' => $pId,
                        'project_name' => $p['project_name'],
                        'client_name' => $p['client_name'],
                        'type' => 'DATA_INCOMPLETE',
                        'severity' => 'INFO',
                        'title' => 'No Telepon/WhatsApp Klien Belum Dicatat',
                        'description' => sprintf("Proyek ini memiliki sisa piutang Rp %s namun tidak ada nomor telepon klien yang tersimpan.", number_format($receivable, 0, ',', '.')),
                        'impact' => 'Sistem tidak dapat mengirimkan notifikasi reminder WhatsApp 1-klik secara otomatis.',
                        'solution' => 'Lengkapi nomor WhatsApp klien di menu keterangan proyek.',
                        'action_label' => 'Edit Keterangan',
                        'action_type' => 'EDIT_NOTES'
                    ];
                    $anomalies[] = $issue;
                    $projIssues[] = $issue;
                }
            }

            // E. HONOR TIM MENGENDAP SAAT KAS TERSEDIA
            if ($teamPayable > 0 && $netCash >= $teamPayable && $paidClient > 0) {
                $issue = [
                    'id' => 'TEAM_PAYABLE_READY_' . $pId,
                    'project_id' => $pId,
                    'project_name' => $p['project_name'],
                    'client_name' => $p['client_name'],
                    'type' => 'TEAM_PAYABLE_READY',
                    'severity' => 'INFO',
                    'title' => 'Kas Aman: Siap Melunasi Hak Tim',
                    'description' => sprintf(
                        "Uang kas di tangan aman (Rp %s) dan mencukupi untuk melunasi seluruh sisa honor tim (Rp %s).",
                        number_format($netCash, 0, ',', '.'),
                        number_format($teamPayable, 0, ',', '.')
                    ),
                    'impact' => 'Pencairan tepat waktu menjaga loyalitas dan performa kerja rekan tim.',
                    'solution' => 'Segera proses pencairan honor rekan tim sesuai progres kerja yang telah diverifikasi.',
                    'action_label' => 'Bayar Honor Tim',
                    'action_type' => 'OPEN_TEAM'
                ];
                $anomalies[] = $issue;
                $projIssues[] = $issue;
            }

            // F. MARGIN LABA RENDAH
            if ($contractVal > 0 && $marginPct < 20.0 && $marginPct >= 0) {
                $issue = [
                    'id' => 'LOW_MARGIN_' . $pId,
                    'project_id' => $pId,
                    'project_name' => $p['project_name'],
                    'client_name' => $p['client_name'],
                    'type' => 'LOW_MARGIN',
                    'severity' => 'WARNING',
                    'title' => 'Margin Keuntungan Terlalu Tipis',
                    'description' => sprintf(
                        "Margin laba proyek ini hanya %.1f%% (Standar sehat freelance: ≥ 30%%). Plafon tim menyerap %.1f%% nilai proyek.",
                        $marginPct,
                        100.0 - $marginPct
                    ),
                    'impact' => 'Bantalan risiko finansial sangat kecil jika terjadi revisi berkepanjangan.',
                    'solution' => 'Perketat batasan ruang lingkup kerja (scope of work) agar tidak timbul pembengkakan biaya tambahan.',
                    'action_label' => 'Lihat Detail Proyek',
                    'action_type' => 'VIEW_DETAIL'
                ];
                $anomalies[] = $issue;
                $projIssues[] = $issue;
            }

            // G. PROYEK STATUS COMPLETED TAPI MASIH ADA SISA PIUTANG / HUTANG
            if ($p['project_status'] === 'COMPLETED' && ($receivable > 0 || $teamPayable > 0)) {
                $issue = [
                    'id' => 'COMPLETED_UNSETTLED_' . $pId,
                    'project_id' => $pId,
                    'project_name' => $p['project_name'],
                    'client_name' => $p['client_name'],
                    'type' => 'COMPLETED_UNSETTLED',
                    'severity' => 'WARNING',
                    'title' => 'Proyek Selesai Namun Buku Kas Belum Tertutup',
                    'description' => sprintf(
                        "Status proyek 'COMPLETED' namun masih menyisakan piutang Rp %s atau tanggungan tim Rp %s.",
                        number_format($receivable, 0, ',', '.'),
                        number_format($teamPayable, 0, ',', '.')
                    ),
                    'impact' => 'Distorsi laporan pembukuan dan kas mengendap.',
                    'solution' => 'Selesaikan seluruh penagihan dan pembayaran sebelum menutup buku proyek.',
                    'action_label' => 'Audit Proyek',
                    'action_type' => 'VIEW_DETAIL'
                ];
                $anomalies[] = $issue;
                $projIssues[] = $issue;
            }

            // Project health score
            $critCount = count(array_filter($projIssues, fn($i) => $i['severity'] === 'CRITICAL'));
            $warnCount = count(array_filter($projIssues, fn($i) => $i['severity'] === 'WARNING'));
            $infoCount = count(array_filter($projIssues, fn($i) => $i['severity'] === 'INFO'));

            $projScore = max(10, min(100, 100 - ($critCount * 30) - ($warnCount * 12) - ($infoCount * 3)));
            
            $healthStatus = 'HEALTHY';
            if ($critCount > 0) $healthStatus = 'CRITICAL';
            elseif ($warnCount > 0) $healthStatus = 'WARNING';
            elseif ($infoCount > 0) $healthStatus = 'INFO';

            $projectAudits[$pId] = [
                'project_id' => $pId,
                'project_name' => $p['project_name'],
                'client_name' => $p['client_name'],
                'score' => $projScore,
                'status' => $healthStatus,
                'issue_count' => count($projIssues),
                'issues' => $projIssues,
                'net_cash' => $netCash,
                'receivable' => $receivable,
                'team_payable' => $teamPayable
            ];
        }

        // -------------------------------------------------------------
        // 2. Check Team Member Level Overpayments & Anomalies
        // -------------------------------------------------------------
        foreach ($teamMembers as $tm) {
            $mId = (int)$tm['id'];
            $pId = (int)$tm['project_id'];
            $agreed = (float)$tm['agreed_honor'];

            // Find all payments for this member
            $mPayments = array_filter($teamPayments, fn($tp) => (int)$tp['project_team_member_id'] === $mId);
            $totalDisbursed = array_reduce($mPayments, fn($c, $x) => $c + (float)$x['amount_paid'], 0.0);

            if ($totalDisbursed > $agreed && $agreed > 0) {
                $overTeam = $totalDisbursed - $agreed;
                $issue = [
                    'id' => 'TEAM_MEMBER_OVERPAY_' . $mId,
                    'project_id' => $pId,
                    'project_name' => $tm['project_name'],
                    'client_name' => 'Subkon: ' . $tm['member_name'],
                    'type' => 'TEAM_MEMBER_OVERPAY',
                    'severity' => 'CRITICAL',
                    'title' => sprintf("Kelebihan Bayar ke Anggota Tim (%s)", $tm['member_name']),
                    'description' => sprintf(
                        "Honor %s (%s) telah dibayarkan Rp %s, melebihi plafon kesepakatan Rp %s (+Rp %s).",
                        $tm['member_name'],
                        $tm['member_role'] ?: 'Tim',
                        number_format($totalDisbursed, 0, ',', '.'),
                        number_format($agreed, 0, ',', '.'),
                        number_format($overTeam, 0, ',', '.')
                    ),
                    'impact' => sprintf("Kebocoran kas keluar sebesar Rp %s akibat overpayment.", number_format($overTeam, 0, ',', '.')),
                    'solution' => 'Konfirmasi rincian pekerjaan tambahan atau sesuaikan catatan plafon honor bila ada lembur.',
                    'action_label' => 'Periksa Anggota Tim',
                    'action_type' => 'OPEN_TEAM'
                ];
                $anomalies[] = $issue;
                if (isset($projectAudits[$pId])) {
                    $projectAudits[$pId]['issues'][] = $issue;
                    $projectAudits[$pId]['issue_count']++;
                    $projectAudits[$pId]['score'] = max(10, $projectAudits[$pId]['score'] - 25);
                    $projectAudits[$pId]['status'] = 'CRITICAL';
                }
            }

            // Check duplicate payouts to the same team member (Grouped neatly)
            $mPaymentsList = array_values($mPayments);
            $processedPayouts = [];
            foreach ($mPaymentsList as $idx => $curr) {
                if (in_array($curr['id'], $processedPayouts)) continue;
                $matching = [$curr];
                foreach ($mPaymentsList as $subIdx => $comp) {
                    if ($subIdx <= $idx) continue;
                    if ((float)$curr['amount_paid'] === (float)$comp['amount_paid'] && (float)$curr['amount_paid'] > 0) {
                        $diffDays = abs((strtotime($curr['payment_date']) - strtotime($comp['payment_date'])) / 86400);
                        if ($diffDays <= 2) {
                            $matching[] = $comp;
                            $processedPayouts[] = $comp['id'];
                        }
                    }
                }
                if (count($matching) > 1) {
                    $processedPayouts[] = $curr['id'];
                    $datesStr = implode(', ', array_unique(array_map(fn($m) => date('d/m/Y', strtotime($m['payment_date'])), $matching)));
                    $issue = [
                        'id' => 'DUPLICATE_PAYOUT_' . implode('_', array_column($matching, 'id')),
                        'project_id' => $pId,
                        'project_name' => $tm['project_name'],
                        'client_name' => 'Tim: ' . $tm['member_name'],
                        'type' => 'POTENTIAL_DUPLICATE_PAYOUT',
                        'severity' => 'WARNING',
                        'title' => sprintf("Potensi Duplikasi Pencairan Honor (%s)", $tm['member_name']),
                        'description' => sprintf(
                            "Terdeteksi %d transaksi pencairan honor bernilai identik (Rp %s) pada tanggal %s ke %s.",
                            count($matching),
                            number_format($curr['amount_paid'], 0, ',', '.'),
                            $datesStr,
                            $tm['member_name']
                        ),
                        'impact' => 'Risiko transfer ganda atau double-entry pencatatan honor rekan tim.',
                        'solution' => 'Cek bukti transfer bank untuk memastikan apakah ini dua cicilan bertahap atau input ganda.',
                        'action_label' => 'Audit Riwayat Tim',
                        'action_type' => 'OPEN_TEAM'
                    ];
                    $anomalies[] = $issue;
                    if (isset($projectAudits[$pId])) {
                        $projectAudits[$pId]['issues'][] = $issue;
                        $projectAudits[$pId]['issue_count']++;
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 3. Check Duplicate Client Inflow Payments (Grouped neatly)
        // -------------------------------------------------------------
        $cpByProject = [];
        foreach ($clientPayments as $cp) {
            $cpByProject[$cp['project_id']][] = $cp;
        }

        foreach ($cpByProject as $pId => $payList) {
            $processedClientPay = [];
            foreach ($payList as $idx => $curr) {
                if (in_array($curr['id'], $processedClientPay)) continue;
                $matching = [$curr];
                foreach ($payList as $subIdx => $comp) {
                    if ($subIdx <= $idx) continue;
                    if ((float)$curr['amount_paid'] === (float)$comp['amount_paid'] && (float)$curr['amount_paid'] > 0) {
                        $diffDays = abs((strtotime($curr['payment_date']) - strtotime($comp['payment_date'])) / 86400);
                        if ($diffDays <= 2) {
                            $matching[] = $comp;
                            $processedClientPay[] = $comp['id'];
                        }
                    }
                }
                if (count($matching) > 1) {
                    $processedClientPay[] = $curr['id'];
                    $datesStr = implode(', ', array_unique(array_map(fn($m) => date('d/m/Y', strtotime($m['payment_date'])), $matching)));
                    $invsStr = implode(', ', array_map(fn($m) => $m['invoice_number'] ?: 'Tanpa Inv', $matching));
                    $issue = [
                        'id' => 'DUPLICATE_CLIENT_PAY_' . implode('_', array_column($matching, 'id')),
                        'project_id' => $pId,
                        'project_name' => $curr['project_name'],
                        'client_name' => $curr['client_name'],
                        'type' => 'POTENTIAL_DUPLICATE_CLIENT',
                        'severity' => 'WARNING',
                        'title' => 'Potensi Duplikasi Input Pembayaran Klien',
                        'description' => sprintf(
                            "Terdeteksi %d transaksi masuk bernilai sama persis (Rp %s) pada rentang tanggal %s (%s).",
                            count($matching),
                            number_format($curr['amount_paid'], 0, ',', '.'),
                            $datesStr,
                            $invsStr
                        ),
                        'impact' => 'Pembukuan piutang menjadi tidak akurat jika terjadi pencatatan double.',
                        'solution' => 'Verifikasi ke mutasi rekening koran bank apakah benar ada beberapa kali transfer dari klien.',
                        'action_label' => 'Periksa Pembayaran',
                        'action_type' => 'VIEW_DETAIL'
                    ];
                    $anomalies[] = $issue;
                    if (isset($projectAudits[$pId])) {
                        $projectAudits[$pId]['issues'][] = $issue;
                        $projectAudits[$pId]['issue_count']++;
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 4. Calculate Global Health Score & Metric Summary
        // -------------------------------------------------------------
        $totalCritical = count(array_filter($anomalies, fn($a) => $a['severity'] === 'CRITICAL'));
        $totalWarning = count(array_filter($anomalies, fn($a) => $a['severity'] === 'WARNING'));
        $totalInfo = count(array_filter($anomalies, fn($a) => $a['severity'] === 'INFO'));

        // Overall Score Algorithm
        $systemHealthScore = max(15, min(100, 100 - ($totalCritical * 18) - ($totalWarning * 6) - ($totalInfo * 2)));

        $riskTier = 'LOW';
        $riskBadgeText = 'SANGAT AMAN';
        $riskBadgeColor = 'emerald';
        if ($totalCritical > 0 || $systemHealthScore < 50) {
            $riskTier = 'CRITICAL';
            $riskBadgeText = 'BUTUH TINDAKAN SEGERA';
            $riskBadgeColor = 'rose';
        } elseif ($totalWarning > 0 || $systemHealthScore < 75) {
            $riskTier = 'MEDIUM';
            $riskBadgeText = 'PERLU PERHATIAN';
            $riskBadgeColor = 'amber';
        }

        // Generate Executive AI Narration
        $executiveNarration = $this->generateExecutiveNarration($projects, $anomalies, $systemHealthScore, $totalCritical, $totalWarning);

        return [
            'analyzed_at' => date('Y-m-d H:i:s'),
            'system_health_score' => $systemHealthScore,
            'risk_tier' => $riskTier,
            'risk_badge_text' => $riskBadgeText,
            'risk_badge_color' => $riskBadgeColor,
            'counts' => [
                'total_anomalies' => count($anomalies),
                'critical' => $totalCritical,
                'warning' => $totalWarning,
                'info' => $totalInfo,
                'total_projects' => count($projects),
                'clean_projects' => count(array_filter($projectAudits, fn($p) => $p['issue_count'] === 0))
            ],
            'executive_narration' => $executiveNarration,
            'anomalies' => $anomalies,
            'project_audits' => array_values($projectAudits)
        ];
    }

    /**
     * Conducts deep AI analysis for a specific project
     */
    public function analyzeProject(int $projectId): array {
        $all = $this->analyzeAll();
        $targetAudit = null;
        foreach ($all['project_audits'] as $audit) {
            if ((int)$audit['project_id'] === $projectId) {
                $targetAudit = $audit;
                break;
            }
        }

        $projectAnomalies = array_values(array_filter($all['anomalies'], fn($a) => (int)$a['project_id'] === $projectId));

        // Get project detail
        $stmt = $this->pdo->prepare("SELECT * FROM v_project_financial_summary WHERE project_id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get payment history
        $stmtCp = $this->pdo->prepare("SELECT * FROM client_payments WHERE project_id = ? ORDER BY payment_date DESC, id DESC");
        $stmtCp->execute([$projectId]);
        $clientPayments = $stmtCp->fetchAll(PDO::FETCH_ASSOC);

        // Get team members with details
        $stmtTm = $this->pdo->prepare("SELECT * FROM project_team_members WHERE project_id = ? ORDER BY id ASC");
        $stmtTm->execute([$projectId]);
        $teamMembers = $stmtTm->fetchAll(PDO::FETCH_ASSOC);

        foreach ($teamMembers as &$member) {
            $stmtTp = $this->pdo->prepare("SELECT * FROM team_payments WHERE project_team_member_id = ? ORDER BY payment_date DESC, id DESC");
            $stmtTp->execute([$member['id']]);
            $member['payments'] = $stmtTp->fetchAll(PDO::FETCH_ASSOC);
            $totalPaid = array_reduce($member['payments'], fn($carry, $item) => $carry + (float)$item['amount_paid'], 0.0);
            $member['total_paid'] = $totalPaid;
            $member['remaining_honor'] = (float)$member['agreed_honor'] - $totalPaid;
        }

        return [
            'project' => $project,
            'audit' => $targetAudit,
            'anomalies' => $projectAnomalies,
            'client_payments' => $clientPayments,
            'team_members' => $teamMembers
        ];
    }

    /**
     * Real-time pre-check validator for payment inputs
     * (called before user submits payment to prevent mistakes)
     */
    public function validatePaymentInput(int $projectId, string $type, float $amount, ?int $memberId = null): array {
        $stmt = $this->pdo->prepare("SELECT * FROM v_project_financial_summary WHERE project_id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$project) {
            return [
                'is_valid' => false,
                'status' => 'ERROR',
                'message' => 'Proyek tidak ditemukan.'
            ];
        }

        $contractVal = (float)$project['total_contract_value'];
        $paidClient = (float)$project['total_paid_by_client'];
        $receivable = (float)$project['client_receivable_remaining'];
        $netCash = (float)$project['net_cash_in_hand'];

        $warnings = [];
        $suggestions = [];
        $isSafe = true;
        $verdict = 'SAFE';

        if ($type === 'CLIENT_PAYMENT') {
            // Check against remaining receivables
            if ($amount > $receivable && $receivable > 0) {
                $selisih = $amount - $receivable;
                $warnings[] = sprintf(
                    "Peringatan: Nominal Rp %s melebihi sisa piutang proyek (Rp %s). Terjadi potensi kelebihan bayar sebesar +Rp %s!",
                    number_format($amount, 0, ',', '.'),
                    number_format($receivable, 0, ',', '.'),
                    number_format($selisih, 0, ',', '.')
                );
                $isSafe = false;
                $verdict = 'OVERPAYMENT_RISK';
            } elseif ($amount == $receivable && $receivable > 0) {
                $suggestions[] = "Sempurna: Nominal ini akan melunasi 100% sisa tagihan piutang proyek ini.";
            }

            // Check duplicate payment in last 24h
            $checkDup = $this->pdo->prepare("
                SELECT COUNT(*) FROM client_payments 
                WHERE project_id = ? AND amount_paid = ? AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            ");
            $checkDup->execute([$projectId, $amount]);
            if ((int)$checkDup->fetchColumn() > 0) {
                $warnings[] = "Perhatian: Terdeteksi pembayaran dengan nominal yang sama persis dalam 24 jam terakhir. Pastikan ini bukan duplikasi pencatatan.";
                $verdict = 'POSSIBLE_DUPLICATE';
            }

            $simulatedReceivable = max(0, $receivable - $amount);
            $simulatedNetCash = $netCash + $amount;

            return [
                'is_valid' => true,
                'is_safe' => $isSafe,
                'verdict' => $verdict,
                'warnings' => $warnings,
                'suggestions' => $suggestions,
                'simulated_state' => [
                    'current_receivable' => $receivable,
                    'new_receivable' => $simulatedReceivable,
                    'current_net_cash' => $netCash,
                    'new_net_cash' => $simulatedNetCash,
                    'will_settle' => ($simulatedReceivable <= 0)
                ]
            ];
        } elseif ($type === 'TEAM_PAYMENT') {
            if (!$memberId) {
                return ['is_valid' => false, 'status' => 'ERROR', 'message' => 'Anggota tim wajib dipilih.'];
            }

            $stmtMember = $this->pdo->prepare("SELECT * FROM project_team_members WHERE id = ?");
            $stmtMember->execute([$memberId]);
            $member = $stmtMember->fetch(PDO::FETCH_ASSOC);

            if (!$member) {
                return ['is_valid' => false, 'status' => 'ERROR', 'message' => 'Anggota tim tidak ditemukan.'];
            }

            $agreedHonor = (float)$member['agreed_honor'];
            $paidStmt = $this->pdo->prepare("SELECT COALESCE(SUM(amount_paid), 0) FROM team_payments WHERE project_team_member_id = ?");
            $paidStmt->execute([$memberId]);
            $currentPaid = (float)$paidStmt->fetchColumn();
            $remainingHonor = max(0, $agreedHonor - $currentPaid);

            // Check member honor ceiling
            if ($amount > $remainingHonor && $remainingHonor > 0) {
                $selisih = $amount - $remainingHonor;
                $warnings[] = sprintf(
                    "Peringatan: Nominal Rp %s melampaui sisa plafon honor %s (Sisa hak: Rp %s). Kelebihan bayar: +Rp %s!",
                    number_format($amount, 0, ',', '.'),
                    $member['member_name'],
                    number_format($remainingHonor, 0, ',', '.'),
                    number_format($selisih, 0, ',', '.')
                );
                $isSafe = false;
                $verdict = 'TEAM_OVERPAY_RISK';
            }

            // Check cash deficit impact
            if ($amount > $netCash) {
                $selisihDefisit = $amount - $netCash;
                $warnings[] = sprintf(
                    "Perhatian: Kas di tangan untuk proyek ini hanya Rp %s. Pembayaran ini akan menyebabkan defisit kas (dana talangan) sebesar -Rp %s!",
                    number_format($netCash, 0, ',', '.'),
                    number_format($selisihDefisit, 0, ',', '.')
                );
                $isSafe = false;
                $verdict = 'DEFICIT_TRIGGER';
            }

            return [
                'is_valid' => true,
                'is_safe' => $isSafe,
                'verdict' => $verdict,
                'warnings' => $warnings,
                'suggestions' => $suggestions,
                'simulated_state' => [
                    'member_name' => $member['member_name'],
                    'remaining_honor' => $remainingHonor,
                    'new_remaining_honor' => max(0, $remainingHonor - $amount),
                    'current_net_cash' => $netCash,
                    'new_net_cash' => $netCash - $amount,
                    'is_deficit' => (($netCash - $amount) < 0)
                ]
            ];
        }

        return ['is_valid' => false, 'message' => 'Tipe validasi tidak dikenal.'];
    }

    /**
     * Synthesizes a natural, executive AI summary narration
     */
    private function generateExecutiveNarration(array $projects, array $anomalies, int $score, int $critical, int $warning): string {
        $totalProjects = count($projects);
        $totalKas = array_reduce($projects, fn($c, $p) => $c + (float)$p['net_cash_in_hand'], 0.0);
        $totalPiutang = array_reduce($projects, fn($c, $p) => $c + (float)$p['client_receivable_remaining'], 0.0);
        $totalHutangTim = array_reduce($projects, fn($c, $p) => $c + (float)$p['team_payable_remaining'], 0.0);

        $deficits = array_filter($anomalies, fn($a) => $a['type'] === 'CASH_DEFICIT');
        $overdues = array_filter($anomalies, fn($a) => in_array($a['type'], ['RECEIVABLE_OVERDUE', 'RECEIVABLE_NEAR_DEADLINE']));
        $duplicates = array_filter($anomalies, fn($a) => str_contains($a['type'], 'DUPLICATE'));

        $parts = [];

        if ($score >= 85) {
            $parts[] = "Kondisi arus kas dan pembukuan berada pada status **Sangat Sehat** dengan Skor Integritas Finansial **{$score}/100**.";
        } elseif ($score >= 65) {
            $parts[] = "Kondisi keuangan secara umum stabil (**Skor: {$score}/100**), namun AI mendeteksi beberapa potensi risiko transaksi yang perlu ditindaklanjuti untuk mencegah kesalahan pembukuan.";
        } else {
            $parts[] = "**Peringatan Finansial Kritis**: Skor Integritas Keuangan saat ini berada di level **{$score}/100** dengan **{$critical} anomali kritis** yang membutuhkan tindakan segera.";
        }

        if (!empty($deficits)) {
            $firstDef = reset($deficits);
            $parts[] = sprintf(
                "Ditemukan **defisit kas riil** pada proyek **%s**, di mana pengeluaran honor tim telah mendahului pembayaran klien (dana talangan pribadi aktif).",
                $firstDef['project_name']
            );
        }

        if (!empty($overdues)) {
            $parts[] = sprintf(
                "Terdapat **%d proyek** dengan piutang menunggak atau mendekati batas tenggat waktu. Total piutang yang perlu segera ditagih mencapai **Rp %s**.",
                count($overdues),
                number_format($totalPiutang, 0, ',', '.')
            );
        }

        if (!empty($duplicates)) {
            $parts[] = sprintf(
                "AI juga mendeteksi **%d indikasi transaksi bernilai identik** dalam rentang waktu berdekatan yang berpotensi merupakan duplikasi input ganda.",
                count($duplicates)
            );
        }

        $parts[] = sprintf(
            "Total kas riil di tangan saat ini adalah **Rp %s** dengan sisa tanggungan hak rekan tim sebesar **Rp %s**.",
            number_format($totalKas, 0, ',', '.'),
            number_format($totalHutangTim, 0, ',', '.')
        );

        return implode(' ', $parts);
    }
}
