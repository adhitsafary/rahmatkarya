<?php
// =====================================================================
// NOTIFICATION SERVICE: Daily Reminder Engine for ProCash Tracker
// Handles Penagihan, Termin, Piutang Klien, Honor Subkon, & Deadlines
// =====================================================================

class NotificationService {
    private PDO $pdo;
    private array $settings = [];

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
        $this->loadSettings();
        $this->ensureDismissalsTable();
    }

    private function loadSettings(): void {
        try {
            $stmt = $this->pdo->query("SELECT key_name, key_value FROM app_settings");
            $this->settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
        } catch (Exception $e) {
            $this->settings = [];
        }
    }

    private function ensureDismissalsTable(): void {
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `notification_dismissals` (
                    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT UNSIGNED NULL,
                    `notif_key` VARCHAR(100) NOT NULL,
                    `dismissed_date` DATE NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY `idx_user_notif_date` (`user_id`, `notif_key`, `dismissed_date`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
        } catch (Exception $e) {
            // Table creation failure is non-fatal
        }
    }

    public function dismissNotification(string $notifKey, ?int $userId = null): bool {
        try {
            $stmt = $this->pdo->prepare("
                INSERT IGNORE INTO notification_dismissals (user_id, notif_key, dismissed_date)
                VALUES (?, ?, CURDATE())
            ");
            return $stmt->execute([$userId, $notifKey]);
        } catch (Exception $e) {
            return false;
        }
    }

    public function clearDismissedToday(?int $userId = null): bool {
        try {
            if ($userId) {
                $stmt = $this->pdo->prepare("DELETE FROM notification_dismissals WHERE user_id = ? AND dismissed_date = CURDATE()");
                return $stmt->execute([$userId]);
            } else {
                $stmt = $this->pdo->prepare("DELETE FROM notification_dismissals WHERE dismissed_date = CURDATE()");
                return $stmt->execute();
            }
        } catch (Exception $e) {
            return false;
        }
    }

    private function getDismissedKeysToday(?int $userId = null): array {
        try {
            if ($userId) {
                $stmt = $this->pdo->prepare("SELECT notif_key FROM notification_dismissals WHERE (user_id = ? OR user_id IS NULL) AND dismissed_date = CURDATE()");
                $stmt->execute([$userId]);
            } else {
                $stmt = $this->pdo->query("SELECT notif_key FROM notification_dismissals WHERE dismissed_date = CURDATE()");
            }
            return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
        } catch (Exception $e) {
            return [];
        }
    }

    private function formatRupiah(float $amount): string {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    private function formatIndoDate(?string $dateStr): string {
        if (empty($dateStr)) return '-';
        $time = strtotime($dateStr);
        $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date('w', $time)];
        $bulan = [1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][date('n', $time)];
        return $hari . ', ' . date('j', $time) . ' ' . $bulan . ' ' . date('Y', $time);
    }

    private function cleanPhone(?string $phone): string {
        $p = preg_replace('/[^0-9]/', '', (string)$phone);
        if (str_starts_with($p, '0')) {
            $p = '62' . substr($p, 1);
        }
        return $p;
    }

    private function getBankInfo(): string {
        $bankName = $this->settings['default_bank_name'] ?? 'Bank BCA';
        $bankNo = $this->settings['default_bank_account_number'] ?? '123-456-7890';
        $bankHolder = $this->settings['default_bank_account_holder'] ?? 'Tim Manajemen Keuangan';
        return "{$bankName}: {$bankNo} a.n {$bankHolder}";
    }

    /**
     * Generate all daily notifications
     */
    public function getDailyNotifications(?int $userId = null, bool $includeDismissed = false): array {
        $dismissedKeys = $includeDismissed ? [] : $this->getDismissedKeysToday($userId);
        $bankInfo = $this->getBankInfo();

        $notifications = [];
        $termsNotifications = [];
        $receivablesNotifications = [];
        $subkonNotifications = [];
        $deadlinesNotifications = [];

        $totalTermsAmount = 0.0;
        $totalReceivablesAmount = 0.0;
        $totalSubkonAmount = 0.0;
        $urgentCount = 0;
        $todayCount = 0;

        // -------------------------------------------------------------
        // 1. PENAGIHAN & TERMIN (Payment Terms)
        // -------------------------------------------------------------
        $stmtTerms = $this->pdo->query("
            SELECT 
                ppt.id AS term_id,
                ppt.project_id,
                ppt.term_name,
                ppt.amount,
                ppt.paid_amount,
                (ppt.amount - ppt.paid_amount) AS remaining_amount,
                ppt.due_date,
                ppt.status AS term_status,
                p.project_name,
                p.project_code,
                p.contract_number,
                p.client_name,
                p.client_phone,
                p.client_email,
                p.progress_percent,
                p.workflow_step,
                DATEDIFF(ppt.due_date, CURDATE()) AS days_diff
            FROM project_payment_terms ppt
            JOIN projects p ON p.id = ppt.project_id
            WHERE ppt.status != 'PAID'
              AND (ppt.amount - ppt.paid_amount) > 0
              AND p.status = 'ACTIVE'
              AND ppt.due_date IS NOT NULL
            ORDER BY ppt.due_date ASC
        ");
        $terms = $stmtTerms->fetchAll();

        foreach ($terms as $t) {
            $notifKey = "term_" . $t['term_id'];
            $isDismissed = in_array($notifKey, $dismissedKeys);
            $daysDiff = (int)$t['days_diff'];
            $remAmount = (float)$t['remaining_amount'];
            $remFormatted = $this->formatRupiah($remAmount);
            $clientPhone = $this->cleanPhone($t['client_phone']);
            $dueDateFormatted = $this->formatIndoDate($t['due_date']);

            $urgency = 'medium';
            $badgeText = '';
            $statusType = 'UPCOMING';
            $title = '';
            $desc = '';
            $waMessage = '';

            if ($daysDiff < 0) {
                // Overdue
                $statusType = 'OVERDUE';
                $urgency = 'critical'; // Red
                $daysOverdue = abs($daysDiff);
                $badgeText = "LEWAT {$daysOverdue} HARI";
                $title = "Tagihan Termin Lewat Jatuh Tempo: {$t['term_name']}";
                $desc = "Termin {$t['term_name']} sebesar {$remFormatted} untuk {$t['client_name']} ({$t['project_name']}) telah melewati jatuh tempo pada {$dueDateFormatted}.";
                $urgentCount++;

                $waMessage = "Halo Bapak/Ibu {$t['client_name']},\n\nSemoga dalam keadaan sehat selalu. Kami dari manajemen proyek ingin mengonfirmasikan perihal jadwal penagihan termin *{$t['term_name']}* untuk *{$t['project_name']}* sebesar *{$remFormatted}* yang tercatat telah jatuh tempo pada tanggal *{$dueDateFormatted}* ({$daysOverdue} hari yang lalu).\n\nPembayaran dapat disalurkan melalui rekening:\n{$bankInfo}\n\nMohon konfirmasi bukti transfer jika pembayaran telah disalurkan. Terima kasih banyak atas kerjasamanya!";
            } elseif ($daysDiff === 0) {
                // Today
                $statusType = 'TODAY';
                $urgency = 'high'; // Orange / Amber
                $badgeText = "HARI INI";
                $title = "Termin Jatuh Tempo Hari Ini: {$t['term_name']}";
                $desc = "Termin {$t['term_name']} sebesar {$remFormatted} untuk {$t['client_name']} ({$t['project_name']}) jatuh tempo hari ini ({$dueDateFormatted})!";
                $urgentCount++;
                $todayCount++;

                $waMessage = "Halo Bapak/Ibu {$t['client_name']},\n\nSemoga hari ini menyenangkan. Mengingatkan dengan hormat bahwa termin pembayaran *{$t['term_name']}* untuk proyek *{$t['project_name']}* sebesar *{$remFormatted}* jatuh tempo *HARI INI* ({$dueDateFormatted}).\n\nPembayaran dapat disalurkan melalui rekening:\n{$bankInfo}\n\nTerima kasih banyak atas perhatian dan kerjasamanya!";
            } elseif ($daysDiff <= 3) {
                // 1-3 days upcoming
                $statusType = 'UPCOMING_SOON';
                $urgency = 'high';
                $badgeText = "{$daysDiff} HARI LAGI";
                $title = "Termin Jatuh Tempo Segera: {$t['term_name']}";
                $desc = "Termin {$t['term_name']} sebesar {$remFormatted} untuk {$t['client_name']} akan jatuh tempo dalam {$daysDiff} hari ({$dueDateFormatted}).";

                $waMessage = "Halo Bapak/Ibu {$t['client_name']},\n\nSemoga sehat selalu. Kami menginformasikan jadwal termin *{$t['term_name']}* untuk proyek *{$t['project_name']}* sebesar *{$remFormatted}* akan jatuh tempo pada *{$dueDateFormatted}* ({$daysDiff} hari lagi).\n\nRekening pembayaran:\n{$bankInfo}\n\nTerima kasih atas kerjasamanya!";
            } elseif ($daysDiff <= 7) {
                // 4-7 days upcoming
                $statusType = 'UPCOMING';
                $urgency = 'medium';
                $badgeText = "{$daysDiff} HARI LAGI";
                $title = "Termin Mendatang: {$t['term_name']}";
                $desc = "Termin {$t['term_name']} sebesar {$remFormatted} untuk {$t['client_name']} jatuh tempo pada {$dueDateFormatted}.";

                $waMessage = "Halo Bapak/Ibu {$t['client_name']},\n\nSemoga lancar selalu. Mengingatkan jadwal termin *{$t['term_name']}* proyek *{$t['project_name']}* sebesar *{$remFormatted}* pada tanggal *{$dueDateFormatted}*.\n\nRekening:\n{$bankInfo}\n\nTerima kasih!";
            } else {
                // Beyond 7 days - still include as info if active
                $statusType = 'PENDING';
                $urgency = 'info';
                $badgeText = "{$daysDiff} HARI LAGI";
                $title = "Jadwal Termin: {$t['term_name']}";
                $desc = "Termin {$t['term_name']} sebesar {$remFormatted} dijadwalkan pada {$dueDateFormatted}.";

                $waMessage = "Halo Bapak/Ibu {$t['client_name']},\n\nUpdate jadwal termin *{$t['term_name']}* proyek *{$t['project_name']}* sebesar *{$remFormatted}* ({$dueDateFormatted}). Terima kasih!";
            }

            $totalTermsAmount += $remAmount;

            $item = [
                'id' => $notifKey,
                'category' => 'terms',
                'type' => $statusType,
                'urgency' => $urgency,
                'badge_text' => $badgeText,
                'title' => $title,
                'message' => $desc,
                'amount' => $remAmount,
                'amount_formatted' => $remFormatted,
                'project_id' => (int)$t['project_id'],
                'project_name' => $t['project_name'],
                'project_code' => $t['project_code'],
                'term_id' => (int)$t['term_id'],
                'term_name' => $t['term_name'],
                'client_name' => $t['client_name'],
                'contact_phone' => $clientPhone,
                'due_date' => $t['due_date'],
                'due_date_formatted' => $dueDateFormatted,
                'days_diff' => $daysDiff,
                'is_dismissed' => $isDismissed,
                'action_type' => 'open_payment',
                'action_label' => 'Catat Pembayaran',
                'wa_message' => $waMessage,
                'wa_url' => !empty($clientPhone) ? "https://api.whatsapp.com/send?phone={$clientPhone}&text=" . rawurlencode($waMessage) : null
            ];

            $termsNotifications[] = $item;
            if (!$isDismissed) {
                $notifications[] = $item;
            }
        }

        // -------------------------------------------------------------
        // 2. PIUTANG KLIEN (Outstanding Client Receivables)
        // -------------------------------------------------------------
        $stmtRec = $this->pdo->query("
            SELECT 
                project_id,
                project_code,
                contract_number,
                project_name,
                client_name,
                client_phone,
                client_email,
                total_contract_value,
                total_paid_by_client,
                client_receivable_remaining,
                client_payment_progress_percent,
                progress_percent,
                workflow_step,
                deadline_date,
                days_left_to_deadline
            FROM v_project_financial_summary
            WHERE project_status = 'ACTIVE'
              AND client_receivable_remaining > 0
            ORDER BY client_receivable_remaining DESC
        ");
        $receivables = $stmtRec->fetchAll();

        foreach ($receivables as $r) {
            $notifKey = "rec_" . $r['project_id'];
            $isDismissed = in_array($notifKey, $dismissedKeys);
            $recAmount = (float)$r['client_receivable_remaining'];
            $totalContract = (float)$r['total_contract_value'];
            $recFormatted = $this->formatRupiah($recAmount);
            $contractFormatted = $this->formatRupiah($totalContract);
            $clientPhone = $this->cleanPhone($r['client_phone']);
            $progress = (int)$r['progress_percent'];
            $paymentProgress = (float)$r['client_payment_progress_percent'];

            $totalReceivablesAmount += $recAmount;

            $urgency = 'info';
            $badgeText = 'PIUTANG TERBUKA';
            $statusType = 'OPEN_RECEIVABLE';
            $title = "Piutang Klien: {$r['client_name']}";
            $desc = "Sisa piutang sebesar {$recFormatted} dari total kontrak {$contractFormatted} untuk proyek {$r['project_name']}.";

            // If progress is significantly ahead of payments
            if ($progress >= 50 && $paymentProgress < 40) {
                $urgency = 'high';
                $statusType = 'HIGH_RISK';
                $badgeText = "RISIKO CASHFLOW";
                $title = "Peringatan Piutang: Progres Kerja Mendahului Pembayaran";
                $desc = "Pengerjaan {$r['project_name']} sudah {$progress}%, tetapi pembayaran klien baru {$paymentProgress}%. Masih ada sisa piutang {$recFormatted} yang perlu segera ditagihkan.";
                $urgentCount++;
            } elseif ($r['days_left_to_deadline'] !== null && (int)$r['days_left_to_deadline'] <= 10 && (int)$r['days_left_to_deadline'] >= 0) {
                $urgency = 'high';
                $statusType = 'NEAR_DEADLINE';
                $badgeText = "DEADLINE {$r['days_left_to_deadline']} HARI";
                $title = "Piutang Menjelang Deadline: {$r['project_name']}";
                $desc = "Target deadline tersisa {$r['days_left_to_deadline']} hari lagi, namun sisa piutang klien masih tercatat {$recFormatted}.";
                $urgentCount++;
            }

            $waMessage = "Halo Bapak/Ibu {$r['client_name']},\n\nSemoga lancar dan sukses selalu. Kami menginformasikan rekapitulasi administrasi untuk proyek *{$r['project_name']}*.\nSaat ini tercatat sisa tagihan/piutang sebesar *{$recFormatted}* (dari nilai kontrak *{$contractFormatted}*).\n\nPembayaran dapat disalurkan ke rekening resmi kami:\n{$bankInfo}\n\nTerima kasih banyak atas kerjasama dan kepercayaannya!";

            $item = [
                'id' => $notifKey,
                'category' => 'receivables',
                'type' => $statusType,
                'urgency' => $urgency,
                'badge_text' => $badgeText,
                'title' => $title,
                'message' => $desc,
                'amount' => $recAmount,
                'amount_formatted' => $recFormatted,
                'project_id' => (int)$r['project_id'],
                'project_name' => $r['project_name'],
                'project_code' => $r['project_code'],
                'client_name' => $r['client_name'],
                'contact_phone' => $clientPhone,
                'is_dismissed' => $isDismissed,
                'action_type' => 'open_whatsapp',
                'action_label' => 'Kirim WA Tagihan',
                'wa_message' => $waMessage,
                'wa_url' => !empty($clientPhone) ? "https://api.whatsapp.com/send?phone={$clientPhone}&text=" . rawurlencode($waMessage) : null
            ];

            $receivablesNotifications[] = $item;
            if (!$isDismissed) {
                $notifications[] = $item;
            }
        }

        // -------------------------------------------------------------
        // 3. HONOR TIM & SUBKON (Subcontractor Payables)
        // -------------------------------------------------------------
        $stmtSubkon = $this->pdo->query("
            SELECT 
                ptm.id AS member_id,
                ptm.project_id,
                ptm.member_name,
                ptm.member_role,
                ptm.member_phone,
                ptm.bank_account_info,
                ptm.agreed_honor,
                COALESCE(SUM(tp.amount_paid), 0.00) AS total_paid,
                (ptm.agreed_honor - COALESCE(SUM(tp.amount_paid), 0.00)) AS remaining_honor,
                p.project_name,
                p.project_code,
                p.progress_percent,
                p.workflow_step,
                p.status AS project_status
            FROM project_team_members ptm
            JOIN projects p ON p.id = ptm.project_id
            LEFT JOIN team_payments tp ON tp.project_team_member_id = ptm.id
            WHERE p.status != 'ARCHIVED'
            GROUP BY ptm.id
            HAVING remaining_honor > 0
            ORDER BY remaining_honor DESC
        ");
        $subkons = $stmtSubkon->fetchAll();

        foreach ($subkons as $s) {
            $notifKey = "subkon_" . $s['member_id'];
            $isDismissed = in_array($notifKey, $dismissedKeys);
            $remHonor = (float)$s['remaining_honor'];
            $honorFormatted = $this->formatRupiah($remHonor);
            $subkonPhone = $this->cleanPhone($s['member_phone']);

            $totalSubkonAmount += $remHonor;

            $urgency = 'medium';
            $badgeText = 'HONOR SUBKON';
            $statusType = 'SUBKON_PENDING';
            $title = "Kewajiban Honor: {$s['member_name']}";
            $desc = "Sisa honor yang belum dibayarkan sebesar {$honorFormatted} untuk {$s['member_role']} pada {$s['project_name']}.";

            if ($s['workflow_step'] === 'DONE' || $s['project_status'] === 'COMPLETED' || (int)$s['progress_percent'] >= 90) {
                $urgency = 'high';
                $statusType = 'SUBKON_COMPLETED_UNPAID';
                $badgeText = "PROYEK SELESAI";
                $title = "Honor Subkon Tertunda: {$s['member_name']}";
                $desc = "Proyek {$s['project_name']} sudah rampung ({$s['progress_percent']}%), namun honor {$s['member_name']} masih memiliki sisa {$honorFormatted}. Rekening: {$s['bank_account_info']}";
                $urgentCount++;
            }

            $waMessage = "Halo Mas/Mba {$s['member_name']},\n\nUpdate dari manajemen perihal komitmen honor pekerjaan *{$s['project_name']}* ({$s['member_role']}).\nCatatan buku kas kami mencatat sisa honor sebesar *{$honorFormatted}* sedang dalam persiapan penyaluran.\n\nRekening tercatat: {$s['bank_account_info']}.\nMohon konfirmasinya jika ada perubahan data rekening. Terima kasih atas dedikasi dan kerjasamanya!";

            $item = [
                'id' => $notifKey,
                'category' => 'subkon',
                'type' => $statusType,
                'urgency' => $urgency,
                'badge_text' => $badgeText,
                'title' => $title,
                'message' => $desc,
                'amount' => $remHonor,
                'amount_formatted' => $honorFormatted,
                'project_id' => (int)$s['project_id'],
                'project_name' => $s['project_name'],
                'project_code' => $s['project_code'],
                'member_id' => (int)$s['member_id'],
                'member_name' => $s['member_name'],
                'member_role' => $s['member_role'],
                'bank_account_info' => $s['bank_account_info'],
                'contact_phone' => $subkonPhone,
                'is_dismissed' => $isDismissed,
                'action_type' => 'open_subkon',
                'action_label' => 'Bayar Subkon',
                'wa_message' => $waMessage,
                'wa_url' => !empty($subkonPhone) ? "https://api.whatsapp.com/send?phone={$subkonPhone}&text=" . rawurlencode($waMessage) : null
            ];

            $subkonNotifications[] = $item;
            if (!$isDismissed) {
                $notifications[] = $item;
            }
        }

        // -------------------------------------------------------------
        // 4. DEADLINE PROYEK & REVISI (Deadlines & Revisions)
        // -------------------------------------------------------------
        $stmtDeadlines = $this->pdo->query("
            SELECT 
                id AS project_id,
                project_name,
                project_code,
                client_name,
                client_phone,
                deadline_date,
                progress_percent,
                workflow_step,
                revision_deal_status,
                current_revision,
                max_revisions,
                DATEDIFF(deadline_date, CURDATE()) AS days_diff
            FROM projects
            WHERE status = 'ACTIVE'
              AND (
                  (deadline_date IS NOT NULL AND DATEDIFF(deadline_date, CURDATE()) <= 7)
                  OR revision_deal_status = 'IN_REVISION'
              )
            ORDER BY days_diff ASC
        ");
        $deadlines = $stmtDeadlines->fetchAll();

        foreach ($deadlines as $d) {
            $daysDiff = $d['days_diff'] !== null ? (int)$d['days_diff'] : null;
            $clientPhone = $this->cleanPhone($d['client_phone']);

            if ($daysDiff !== null) {
                $notifKey = "deadline_" . $d['project_id'];
                $isDismissed = in_array($notifKey, $dismissedKeys);
                $deadlineFormatted = $this->formatIndoDate($d['deadline_date']);

                if ($daysDiff < 0) {
                    $daysOver = abs($daysDiff);
                    $urgentCount++;
                    $item = [
                        'id' => $notifKey,
                        'category' => 'deadlines',
                        'type' => 'DEADLINE_OVERDUE',
                        'urgency' => 'critical',
                        'badge_text' => "LEWAT DEADLINE {$daysOver} HARI",
                        'title' => "Proyek Melewati Deadline: {$d['project_name']}",
                        'message' => "Target batas waktu ({$deadlineFormatted}) telah lewat {$daysOver} hari dengan progres pengerjaan {$d['progress_percent']}%. Segera koordinasikan dengan klien {$d['client_name']}.",
                        'amount' => 0,
                        'amount_formatted' => null,
                        'project_id' => (int)$d['project_id'],
                        'project_name' => $d['project_name'],
                        'project_code' => $d['project_code'],
                        'client_name' => $d['client_name'],
                        'contact_phone' => $clientPhone,
                        'due_date' => $d['deadline_date'],
                        'due_date_formatted' => $deadlineFormatted,
                        'days_diff' => $daysDiff,
                        'is_dismissed' => $isDismissed,
                        'action_type' => 'open_detail',
                        'action_label' => 'Rincian Proyek',
                        'wa_message' => "Halo Bapak/Ibu {$d['client_name']},\n\nUpdate perihal progres pengerjaan proyek *{$d['project_name']}* saat ini telah mencapai {$d['progress_percent']}%. Kami siap mengoordinasikan langkah finalisasi serah terima pekerjaan. Terima kasih!",
                        'wa_url' => !empty($clientPhone) ? "https://api.whatsapp.com/send?phone={$clientPhone}&text=" . rawurlencode("Halo Bapak/Ibu {$d['client_name']}, update proyek {$d['project_name']}.") : null
                    ];
                    $deadlinesNotifications[] = $item;
                    if (!$isDismissed) $notifications[] = $item;
                } elseif ($daysDiff <= 3) {
                    $urgentCount++;
                    $item = [
                        'id' => $notifKey,
                        'category' => 'deadlines',
                        'type' => 'DEADLINE_SOON',
                        'urgency' => 'high',
                        'badge_text' => "{$daysDiff} HARI LAGI",
                        'title' => "Mendekati Deadline: {$d['project_name']}",
                        'message' => "Deadline pengerjaan tersisa {$daysDiff} hari ({$deadlineFormatted}). Progres saat ini {$d['progress_percent']}%.",
                        'amount' => 0,
                        'amount_formatted' => null,
                        'project_id' => (int)$d['project_id'],
                        'project_name' => $d['project_name'],
                        'project_code' => $d['project_code'],
                        'client_name' => $d['client_name'],
                        'contact_phone' => $clientPhone,
                        'due_date' => $d['deadline_date'],
                        'due_date_formatted' => $deadlineFormatted,
                        'days_diff' => $daysDiff,
                        'is_dismissed' => $isDismissed,
                        'action_type' => 'open_detail',
                        'action_label' => 'Rincian Proyek',
                        'wa_message' => "",
                        'wa_url' => null
                    ];
                    $deadlinesNotifications[] = $item;
                    if (!$isDismissed) $notifications[] = $item;
                }
            }

            // Pending revisions
            if ($d['revision_deal_status'] === 'IN_REVISION') {
                $notifKey = "rev_" . $d['project_id'];
                $isDismissed = in_array($notifKey, $dismissedKeys);
                $item = [
                    'id' => $notifKey,
                    'category' => 'deadlines',
                    'type' => 'REVISION_PENDING',
                    'urgency' => 'medium',
                    'badge_text' => "REVISI KE-{$d['current_revision']}",
                    'title' => "Revisi Menunggu Deal: {$d['project_name']}",
                    'message' => "Proyek sedang dalam proses revisi ke-{$d['current_revision']} (dari kuota {$d['max_revisions']}x). Pastikan hasil revisi segera disetujui klien menjadi Deal.",
                    'amount' => 0,
                    'amount_formatted' => null,
                    'project_id' => (int)$d['project_id'],
                    'project_name' => $d['project_name'],
                    'project_code' => $d['project_code'],
                    'client_name' => $d['client_name'],
                    'contact_phone' => $clientPhone,
                    'is_dismissed' => $isDismissed,
                    'action_type' => 'open_detail',
                    'action_label' => 'Tinjau Revisi',
                    'wa_message' => "",
                    'wa_url' => null
                ];
                $deadlinesNotifications[] = $item;
                if (!$isDismissed) $notifications[] = $item;
            }
        }

        // Sort all notifications by urgency priority: critical -> high -> medium -> info
        $urgencyWeights = ['critical' => 4, 'high' => 3, 'medium' => 2, 'info' => 1];
        usort($notifications, function ($a, $b) use ($urgencyWeights) {
            $wA = $urgencyWeights[$a['urgency']] ?? 0;
            $wB = $urgencyWeights[$b['urgency']] ?? 0;
            if ($wA !== $wB) return $wB <=> $wA;
            return ($b['amount'] ?? 0) <=> ($a['amount'] ?? 0);
        });

        $todayFormatted = $this->formatIndoDate(date('Y-m-d'));

        return [
            'generated_at' => date('Y-m-d H:i:s'),
            'today_date' => date('Y-m-d'),
            'today_formatted' => $todayFormatted,
            'summary' => [
                'total_alerts' => count($notifications),
                'urgent_count' => $urgentCount,
                'today_count' => $todayCount,
                'terms_count' => count($termsNotifications),
                'receivables_count' => count($receivablesNotifications),
                'subkon_count' => count($subkonNotifications),
                'deadlines_count' => count($deadlinesNotifications),
                'total_terms_amount' => $totalTermsAmount,
                'total_terms_amount_formatted' => $this->formatRupiah($totalTermsAmount),
                'total_receivables_amount' => $totalReceivablesAmount,
                'total_receivables_amount_formatted' => $this->formatRupiah($totalReceivablesAmount),
                'total_subkon_amount' => $totalSubkonAmount,
                'total_subkon_amount_formatted' => $this->formatRupiah($totalSubkonAmount),
            ],
            'categories' => [
                'terms' => $termsNotifications,
                'receivables' => $receivablesNotifications,
                'subkon' => $subkonNotifications,
                'deadlines' => $deadlinesNotifications
            ],
            'items' => $notifications
        ];
    }
}
