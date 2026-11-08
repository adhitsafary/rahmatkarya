<?php
// =====================================================================
// REST API BACKEND: ProCash Tracker
// =====================================================================

header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/ai_tracker.php';
require_once __DIR__ . '/gemini_service.php';

$action = $_GET['action'] ?? '';
$clientToken = $_GET['token'] ?? ($_POST['token'] ?? '');
$isClientAction = in_array($action, ['client_portal_data', 'client_add_revision', 'client_approve_deal', 'client_get_projects', 'get_settings']);

// Protect API calls: Ensure user has valid active session or accessing client portal
if (!$isClientAction) {
    checkAuth(true);
}

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Helper to read JSON request body or POST params
function getRequestData() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json)) return $json;
    }
    return $_POST;
}

function sendResponse($success, $data = [], $message = '', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

try {
    switch ($action) {
        // -------------------------------------------------------------
        // 1. Dashboard Executive Summary
        // -------------------------------------------------------------
        case 'summary':
            $stmt = $pdo->query("SELECT * FROM v_project_financial_summary WHERE project_status != 'ARCHIVED'");
            $projects = $stmt->fetchAll();

            $totalContract = 0;
            $totalPaidByClients = 0;
            $totalReceivables = 0;
            $totalTeamHonor = 0;
            $totalPaidToTeam = 0;
            $totalPayables = 0;
            $totalNetCashInHand = 0;
            $totalProjectedProfit = 0;

            $countActive = 0;
            $countNeedBilling = 0; // Red
            $countNeedPayout = 0;   // Yellow
            $countSettled = 0;      // Green

            foreach ($projects as $p) {
                $totalContract += (float)$p['total_contract_value'];
                $totalPaidByClients += (float)$p['total_paid_by_client'];
                $totalReceivables += (float)$p['client_receivable_remaining'];
                $totalTeamHonor += (float)$p['total_agreed_team_honor'];
                $totalPaidToTeam += (float)$p['total_disbursed_to_team'];
                $totalPayables += (float)$p['team_payable_remaining'];
                $totalNetCashInHand += (float)$p['net_cash_in_hand'];
                $totalProjectedProfit += (float)$p['project_status'] !== 'COMPLETED' ? (float)$p['projected_net_profit'] : 0;

                if ($p['project_status'] === 'ACTIVE') $countActive++;
                if ((float)$p['client_receivable_remaining'] > 0) $countNeedBilling++;
                if ((float)$p['team_payable_remaining'] > 0) $countNeedPayout++;
                if ((float)$p['client_receivable_remaining'] <= 0 && (float)$p['team_payable_remaining'] <= 0) $countSettled++;
            }

            sendResponse(true, [
                'total_contract' => $totalContract,
                'total_paid_clients' => $totalPaidByClients,
                'total_receivables' => $totalReceivables,
                'total_team_honor' => $totalTeamHonor,
                'total_paid_team' => $totalPaidToTeam,
                'total_payables' => $totalPayables,
                'total_net_cash' => $totalNetCashInHand,
                'total_projected_profit' => $totalProjectedProfit,
                'counts' => [
                    'total' => count($projects),
                    'active' => $countActive,
                    'need_billing' => $countNeedBilling,
                    'need_payout' => $countNeedPayout,
                    'settled' => $countSettled
                ]
            ]);
            break;

        // -------------------------------------------------------------
        // 2. List Projects with Filter & Search
        // -------------------------------------------------------------
        case 'projects':
            $filter = $_GET['filter'] ?? 'all';
            $search = trim($_GET['search'] ?? '');

            $sql = "SELECT * FROM v_project_financial_summary WHERE 1=1";
            $params = [];

            if (!empty($search)) {
                $sql .= " AND (project_name LIKE ? OR client_name LIKE ? OR project_code LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }

            if (in_array($filter, ['red', 'need_billing', 'receivables', 'piutang'])) {
                $sql .= " AND client_receivable_remaining > 0";
            } elseif (in_array($filter, ['yellow', 'need_payout', 'team', 'honor'])) {
                $sql .= " AND team_payable_remaining > 0";
            } elseif (in_array($filter, ['green', 'settled', 'lunas'])) {
                $sql .= " AND (client_receivable_remaining <= 0 AND team_payable_remaining <= 0)";
            } elseif (in_array($filter, ['active', 'projects'])) {
                $sql .= " AND project_status = 'ACTIVE'";
            }

            $sql .= " ORDER BY project_id ASC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            sendResponse(true, $rows);
            break;

        // -------------------------------------------------------------
        // 2b. All Team Members & Subkon List with Remaining Honor
        // -------------------------------------------------------------
        case 'team_members':
            $projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;
            $filter = trim($_GET['filter'] ?? 'all'); // 'all', 'unpaid', 'paid'
            $search = trim($_GET['search'] ?? '');

            $sql = "
                SELECT 
                    ptm.id,
                    ptm.project_id,
                    ptm.member_name,
                    ptm.member_role,
                    ptm.member_phone,
                    ptm.bank_account_info,
                    ptm.agreed_honor,
                    ptm.created_at,
                    p.project_name,
                    p.project_code,
                    p.contract_number,
                    p.client_name,
                    p.status AS project_status,
                    COALESCE(SUM(tp.amount_paid), 0) AS total_paid,
                    (ptm.agreed_honor - COALESCE(SUM(tp.amount_paid), 0)) AS remaining_honor
                FROM project_team_members ptm
                JOIN projects p ON p.id = ptm.project_id
                LEFT JOIN team_payments tp ON tp.project_team_member_id = ptm.id
                WHERE 1=1
            ";
            $params = [];

            if ($projectId > 0) {
                $sql .= " AND ptm.project_id = ?";
                $params[] = $projectId;
            }

            if (!empty($search)) {
                $sql .= " AND (ptm.member_name LIKE ? OR ptm.member_role LIKE ? OR p.project_name LIKE ? OR p.client_name LIKE ? OR ptm.member_phone LIKE ?)";
                $sTerm = "%{$search}%";
                $params[] = $sTerm;
                $params[] = $sTerm;
                $params[] = $sTerm;
                $params[] = $sTerm;
                $params[] = $sTerm;
            }

            $sql .= " GROUP BY ptm.id ";

            if ($filter === 'unpaid' || $filter === 'yellow' || $filter === 'need_payout') {
                $sql .= " HAVING remaining_honor > 0 ";
            } elseif ($filter === 'paid' || $filter === 'settled' || $filter === 'lunas') {
                $sql .= " HAVING remaining_honor <= 0 ";
            }

            $sql .= " ORDER BY remaining_honor DESC, ptm.id DESC ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch payment history for each member
            foreach ($members as &$m) {
                $stmtHistory = $pdo->prepare("SELECT * FROM team_payments WHERE project_team_member_id = ? ORDER BY payment_date DESC, id DESC");
                $stmtHistory->execute([$m['id']]);
                $m['payments'] = $stmtHistory->fetchAll(PDO::FETCH_ASSOC);
            }

            sendResponse(true, $members, 'Daftar subkon berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 3. Project Detail with Sub-entities
        // -------------------------------------------------------------
        case 'project_detail':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            // Project overview
            $stmt = $pdo->prepare("SELECT * FROM v_project_financial_summary WHERE project_id = ?");
            $stmt->execute([$id]);
            $project = $stmt->fetch();
            if (!$project) sendResponse(false, null, 'Project not found', 404);

            // Client payments
            $stmtCp = $pdo->prepare("SELECT * FROM client_payments WHERE project_id = ? ORDER BY payment_date DESC, id DESC");
            $stmtCp->execute([$id]);
            $clientPayments = $stmtCp->fetchAll();

            // Team members with payment details
            $stmtTm = $pdo->prepare("SELECT * FROM project_team_members WHERE project_id = ? ORDER BY id ASC");
            $stmtTm->execute([$id]);
            $teamMembers = $stmtTm->fetchAll();

            foreach ($teamMembers as &$member) {
                $stmtTp = $pdo->prepare("SELECT * FROM team_payments WHERE project_team_member_id = ? ORDER BY payment_date DESC, id DESC");
                $stmtTp->execute([$member['id']]);
                $member['payments'] = $stmtTp->fetchAll();

                $totalPaid = array_reduce($member['payments'], fn($carry, $item) => $carry + (float)$item['amount_paid'], 0.0);
                $member['total_paid'] = $totalPaid;
                $member['remaining_honor'] = (float)$member['agreed_honor'] - $totalPaid;
            }

            // Payment terms (Sistem Pembayaran Manual dalam Uang)
            $stmtPt = $pdo->prepare("SELECT * FROM project_payment_terms WHERE project_id = ? ORDER BY id ASC");
            $stmtPt->execute([$id]);
            $paymentTerms = $stmtPt->fetchAll();

            // Revisions (Tracking Revisi)
            $stmtRev = $pdo->prepare("SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number ASC");
            $stmtRev->execute([$id]);
            $revisions = $stmtRev->fetchAll();

            sendResponse(true, [
                'project' => $project,
                'client_payments' => $clientPayments,
                'team_members' => $teamMembers,
                'payment_terms' => $paymentTerms,
                'revisions' => $revisions
            ]);
            break;

        // -------------------------------------------------------------
        // 4. Create New Project (Aligned with Flowchart: Kontrak, Detail, Termin Manual, Kuota Revisi)
        // -------------------------------------------------------------
        case 'create_project':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectName = trim($data['project_name'] ?? '');
            $clientName = trim($data['client_name'] ?? '');
            $clientPhone = trim($data['client_phone'] ?? '');
            $clientEmail = trim($data['client_email'] ?? '');
            $contractValue = (float)($data['total_contract_value'] ?? 0);
            $startDate = !empty($data['start_date']) ? $data['start_date'] : date('Y-m-d');
            $deadlineDate = !empty($data['deadline_date']) ? $data['deadline_date'] : null;
            $contractDate = !empty($data['contract_date']) ? $data['contract_date'] : $startDate;
            $projectDetail = trim($data['project_detail'] ?? ($data['notes'] ?? ''));
            $notes = trim($data['notes'] ?? '');
            $maxRevisions = !empty($data['max_revisions']) ? max(1, (int)$data['max_revisions']) : 3;
            $progressPercent = isset($data['progress_percent']) ? max(0, min(100, (int)$data['progress_percent'])) : 0;
            $initialDp = (float)($data['initial_dp'] ?? 0);

            if (empty($projectName) || empty($clientName) || $contractValue <= 0) {
                sendResponse(false, null, 'Nama proyek, nama klien, dan nilai kontrak (> 0) wajib diisi.', 422);
            }

            // Validasi DP Awal terhadap Nilai Kontrak
            if ($initialDp < 0) {
                sendResponse(false, null, 'Nominal DP awal tidak boleh bernilai negatif.', 422);
            }
            if ($contractValue < $initialDp) {
                sendResponse(false, null, 'Nilai Kontrak (Rp ' . number_format($contractValue, 0, ',', '.') . ') tidak boleh lebih kecil dari DP Awal (Rp ' . number_format($initialDp, 0, ',', '.') . ').', 422);
            }

            // Generate unique project code and contract number
            $year = date('Y');
            $stmtCodes = $pdo->prepare("SELECT project_code FROM projects WHERE project_code LIKE ?");
            $stmtCodes->execute(["PRJ-{$year}-%"]);
            $existingCodes = $stmtCodes->fetchAll(PDO::FETCH_COLUMN);

            $maxNum = 0;
            foreach ($existingCodes as $code) {
                if (preg_match('/PRJ-\d{4}-(\d+)/', $code, $m)) {
                    $val = (int)$m[1];
                    if ($val > $maxNum) {
                        $maxNum = $val;
                    }
                }
            }
            $nextNum = $maxNum + 1;
            $projectCode = sprintf("PRJ-%s-%03d", $year, $nextNum);

            // Double check uniqueness loop to guarantee non-collision
            while (true) {
                $chk = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE project_code = ?");
                $chk->execute([$projectCode]);
                if ((int)$chk->fetchColumn() === 0) {
                    break;
                }
                $nextNum++;
                $projectCode = sprintf("PRJ-%s-%03d", $year, $nextNum);
            }

            $contractNumber = trim($data['contract_number'] ?? '');
            if (empty($contractNumber)) {
                $contractSeq = $nextNum;
                while (true) {
                    $candContract = sprintf("SPK/%s/%03d", $year, $contractSeq);
                    $chkC = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE contract_number = ?");
                    $chkC->execute([$candContract]);
                    if ((int)$chkC->fetchColumn() === 0) {
                        $contractNumber = $candContract;
                        break;
                    }
                    $contractSeq++;
                }
            }

            $clientToken = 'portal-' . bin2hex(random_bytes(10));
            $workflowStep = !empty($data['workflow_step']) ? trim($data['workflow_step']) : (($initialDp > 0) ? 'PENGERJAAN' : 'KONTRAK_DP');
            $status = !empty($data['status']) ? trim($data['status']) : 'ACTIVE';

            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO projects 
                      (project_code, contract_number, contract_date, project_name, project_detail, client_name, client_phone, client_email, client_access_token, total_contract_value, start_date, deadline_date, max_revisions, current_revision, revision_deal_status, workflow_step, progress_percent, status, notes)
                    VALUES 
                      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'PENDING', ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $projectCode, $contractNumber, $contractDate, $projectName, $projectDetail, 
                    $clientName, $clientPhone, $clientEmail, $clientToken, $contractValue, 
                    $startDate, $deadlineDate, $maxRevisions, $workflowStep, $progressPercent, $status, $notes
                ]);
                $newId = (int)$pdo->lastInsertId();

                // Handle DP Awal jika ada
                if ($initialDp > 0) {
                    $stmtDp = $pdo->prepare("
                        INSERT INTO client_payments (project_id, invoice_number, payment_type, amount_paid, payment_date, payment_method, notes)
                        VALUES (?, ?, 'DOWN_PAYMENT', ?, ?, 'TRANSFER', 'DP Awal saat pembuatan proyek')
                    ");
                    $invNumber = sprintf("INV-%s-%03d-DP", $year, $newId);
                    $stmtDp->execute([$newId, $invNumber, $initialDp, $startDate]);
                }

                // f. Sistem Pembayaran Input Manual (Dalam Uang / Rupiah, Bukan Persen)
                $terms = $data['payment_terms'] ?? null;
                if (is_array($terms) && count($terms) > 0) {
                    $stmtTerm = $pdo->prepare("
                        INSERT INTO project_payment_terms (project_id, term_name, amount, due_date, status, paid_amount, paid_date, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    foreach ($terms as $t) {
                        $tName = trim($t['term_name'] ?? 'Termin');
                        $tAmount = (float)($t['amount'] ?? 0);
                        $tDue = !empty($t['due_date']) ? $t['due_date'] : null;
                        $tStatus = in_array($t['status'] ?? '', ['PENDING', 'PAID', 'OVERDUE']) ? $t['status'] : 'PENDING';
                        $tPaid = ($tStatus === 'PAID') ? $tAmount : (float)($t['paid_amount'] ?? 0);
                        $tPaidDate = ($tStatus === 'PAID') ? (!empty($t['paid_date']) ? $t['paid_date'] : $startDate) : null;
                        $tNotes = trim($t['notes'] ?? '');

                        if ($tAmount > 0) {
                            $stmtTerm->execute([$newId, $tName, $tAmount, $tDue, $tStatus, $tPaid, $tPaidDate, $tNotes]);
                        }
                    }
                } else {
                    // Auto-generate default terms in Rupiah (DP, Termin Pengerjaan, Pelunasan Akhir)
                    $dpAmount = ($initialDp > 0) ? $initialDp : round($contractValue * 0.25);
                    $remainingAfterDp = max(0, $contractValue - $dpAmount);
                    $term2Amount = ($remainingAfterDp > 0) ? round($remainingAfterDp * 0.50) : 0;
                    $pelunasanAmount = max(0, $remainingAfterDp - $term2Amount);

                    $stmtTerm = $pdo->prepare("
                        INSERT INTO project_payment_terms (project_id, term_name, amount, due_date, status, paid_amount, paid_date, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");

                    $dpStatus = ($initialDp > 0) ? 'PAID' : 'PENDING';
                    $dpPaidAmount = ($initialDp > 0) ? $initialDp : 0.00;
                    $dpPaidDate = ($initialDp > 0) ? $startDate : null;

                    $dpLabel = ($initialDp > 0) ? 'DP Awal' : 'DP Awal (25%)';
                    $stmtTerm->execute([$newId, $dpLabel, $dpAmount, $startDate, $dpStatus, $dpPaidAmount, $dpPaidDate, 'DP Awal Kontrak']);
                    if ($term2Amount > 0) {
                        $stmtTerm->execute([$newId, 'Termin Pengerjaan', $term2Amount, $deadlineDate, 'PENDING', 0.00, null, 'Termin Pengerjaan Inti']);
                    }
                    if ($pelunasanAmount > 0) {
                        $stmtTerm->execute([$newId, 'Pelunasan Akhir', $pelunasanAmount, $deadlineDate, 'PENDING', 0.00, null, 'Pelunasan Akhir setelah Deal']);
                    }
                }

                $pdo->commit();
            } catch (Exception $ex) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw $ex;
            }

            sendResponse(true, [
                'id' => $newId, 
                'project_code' => $projectCode,
                'contract_number' => $contractNumber,
                'client_access_token' => $clientToken
            ], 'Proyek baru & jadwal termin pembayaran berhasil dibuat!');
            break;

        // -------------------------------------------------------------
        // 4b. Update Project Information
        // -------------------------------------------------------------
        case 'update_project':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $id = (int)($data['id'] ?? ($data['project_id'] ?? 0));
            if ($id <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            $projectName = trim($data['project_name'] ?? '');
            $contractNumber = trim($data['contract_number'] ?? '');
            $contractDate = !empty($data['contract_date']) ? $data['contract_date'] : null;
            $projectDetail = trim($data['project_detail'] ?? ($data['notes'] ?? ''));
            $clientName = trim($data['client_name'] ?? '');
            $clientPhone = trim($data['client_phone'] ?? '');
            $clientEmail = trim($data['client_email'] ?? '');
            $contractValue = (float)($data['total_contract_value'] ?? 0);
            $startDate = !empty($data['start_date']) ? $data['start_date'] : null;
            $deadlineDate = !empty($data['deadline_date']) ? $data['deadline_date'] : null;
            $maxRevisions = !empty($data['max_revisions']) ? max(1, (int)$data['max_revisions']) : 3;
            $progressPercent = isset($data['progress_percent']) ? max(0, min(100, (int)$data['progress_percent'])) : null;
            $workflowStep = $data['workflow_step'] ?? null;
            $status = $data['status'] ?? ($data['project_status'] ?? null);
            $notes = trim($data['notes'] ?? '');

            if (empty($projectName) || empty($clientName) || $contractValue <= 0) {
                sendResponse(false, null, 'Nama proyek, nama klien, dan nilai kontrak (> 0) wajib diisi.', 422);
            }

            // Validasi: Nilai kontrak baru tidak boleh lebih kecil dari total pembayaran klien yang sudah diterima
            $stmtPaid = $pdo->prepare("SELECT COALESCE(SUM(amount_paid), 0) FROM client_payments WHERE project_id = ?");
            $stmtPaid->execute([$id]);
            $alreadyPaid = (float)$stmtPaid->fetchColumn();
            if ($alreadyPaid > 0 && $contractValue < $alreadyPaid) {
                sendResponse(false, null, 'Nilai kontrak baru (Rp ' . number_format($contractValue, 0, ',', '.') . ') tidak boleh lebih kecil dari total pembayaran yang sudah diterima dari klien (Rp ' . number_format($alreadyPaid, 0, ',', '.') . ').', 422);
            }

            $sql = "UPDATE projects SET 
                project_name = ?, contract_number = ?, contract_date = ?, project_detail = ?, 
                client_name = ?, client_phone = ?, client_email = ?, total_contract_value = ?, 
                start_date = ?, deadline_date = ?, max_revisions = ?, notes = ?";
            $params = [
                $projectName, $contractNumber, $contractDate, $projectDetail, 
                $clientName, $clientPhone, $clientEmail, $contractValue, 
                $startDate, $deadlineDate, $maxRevisions, $notes
            ];

            if ($progressPercent !== null) {
                $sql .= ", progress_percent = ?";
                $params[] = $progressPercent;
            }
            if ($workflowStep !== null && in_array($workflowStep, ['KONTRAK_DP', 'PENGERJAAN', 'REVISI', 'PEMBAYARAN_AKHIR', 'DONE'])) {
                $sql .= ", workflow_step = ?";
                $params[] = $workflowStep;
            }
            if ($status !== null && in_array($status, ['ACTIVE', 'COMPLETED', 'ARCHIVED'])) {
                $sql .= ", status = ?";
                $params[] = $status;
            }

            $sql .= " WHERE id = ?";
            $params[] = $id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            sendResponse(true, null, 'Data proyek berhasil diperbarui!');
            break;

        // -------------------------------------------------------------
        // 4c. Payment Terms: Get List
        // -------------------------------------------------------------
        case 'get_payment_terms':
            $projectId = (int)($_GET['project_id'] ?? 0);
            if ($projectId <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            $stmt = $pdo->prepare("SELECT * FROM project_payment_terms WHERE project_id = ? ORDER BY id ASC");
            $stmt->execute([$projectId]);
            $terms = $stmt->fetchAll();

            sendResponse(true, $terms);
            break;

        // -------------------------------------------------------------
        // 4d. Payment Terms: Save / Replace List (f. Sistem Pembayaran Manual dalam Uang)
        // -------------------------------------------------------------
        case 'save_payment_terms':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            $terms = $data['terms'] ?? [];

            if ($projectId <= 0 || !is_array($terms)) {
                sendResponse(false, null, 'Data termin pembayaran tidak valid.', 422);
            }

            $pdo->beginTransaction();
            try {
                // Delete existing terms
                $del = $pdo->prepare("DELETE FROM project_payment_terms WHERE project_id = ?");
                $del->execute([$projectId]);

                $ins = $pdo->prepare("
                    INSERT INTO project_payment_terms (project_id, term_name, amount, due_date, status, paid_amount, paid_date, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");

                foreach ($terms as $t) {
                    $tName = trim($t['term_name'] ?? 'Termin');
                    $tAmount = (float)($t['amount'] ?? 0);
                    $tDue = !empty($t['due_date']) ? $t['due_date'] : null;
                    $tStatus = in_array($t['status'] ?? '', ['PENDING', 'PAID', 'OVERDUE']) ? $t['status'] : 'PENDING';
                    $tPaid = ($tStatus === 'PAID') ? $tAmount : (float)($t['paid_amount'] ?? 0);
                    $tPaidDate = ($tStatus === 'PAID') ? (!empty($t['paid_date']) ? $t['paid_date'] : date('Y-m-d')) : null;
                    $tNotes = trim($t['notes'] ?? '');

                    if ($tAmount > 0) {
                        $ins->execute([$projectId, $tName, $tAmount, $tDue, $tStatus, $tPaid, $tPaidDate, $tNotes]);
                    }
                }

                $pdo->commit();
                sendResponse(true, null, 'Jadwal termin pembayaran berhasil disimpan!');
            } catch (Exception $e) {
                $pdo->rollBack();
                sendResponse(false, null, 'Gagal menyimpan termin pembayaran: ' . $e->getMessage(), 500);
            }
            break;

        // -------------------------------------------------------------
        // 4e. Payment Terms: Mark Term as Paid
        // -------------------------------------------------------------
        case 'mark_payment_term_paid':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $termId = (int)($data['term_id'] ?? 0);
            $paidDate = !empty($data['paid_date']) ? $data['paid_date'] : date('Y-m-d');
            $paymentMethod = trim($data['payment_method'] ?? 'TRANSFER');

            if ($termId <= 0) sendResponse(false, null, 'Invalid Term ID', 400);

            $stmt = $pdo->prepare("SELECT * FROM project_payment_terms WHERE id = ?");
            $stmt->execute([$termId]);
            $term = $stmt->fetch();
            if (!$term) sendResponse(false, null, 'Termin tidak ditemukan.', 404);

            $amount = (float)$term['amount'];
            $projectId = (int)$term['project_id'];

            // Update term status
            $up = $pdo->prepare("UPDATE project_payment_terms SET status = 'PAID', paid_amount = ?, paid_date = ? WHERE id = ?");
            $up->execute([$amount, $paidDate, $termId]);

            // Record to client_payments
            $invNum = sprintf("INV-%d-%d", $projectId, $termId);
            $payType = (stripos($term['term_name'], 'DP') !== false) ? 'DOWN_PAYMENT' : ((stripos($term['term_name'], 'Pelunasan') !== false) ? 'FULL_PAYMENT' : 'TERMIN');

            $stmtPay = $pdo->prepare("
                INSERT INTO client_payments (project_id, invoice_number, payment_type, amount_paid, payment_date, payment_method, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtPay->execute([$projectId, $invNum, $payType, $amount, $paidDate, $paymentMethod, "Pembayaran termin: {$term['term_name']}"]);

            // If this was final payment or all terms are paid, advance to DONE
            $countPending = $pdo->prepare("SELECT COUNT(*) FROM project_payment_terms WHERE project_id = ? AND status != 'PAID'");
            $countPending->execute([$projectId]);
            $pendingLeft = (int)$countPending->fetchColumn();

            if ($pendingLeft === 0) {
                $upProj = $pdo->prepare("UPDATE projects SET workflow_step = 'DONE', status = 'COMPLETED', progress_percent = 100 WHERE id = ?");
                $upProj->execute([$projectId]);
            }

            sendResponse(true, ['pending_left' => $pendingLeft], 'Pembayaran termin berhasil dicatat sebagai LUNAS!');
            break;

        // -------------------------------------------------------------
        // 4f. Revisions: Get Revision List and Quota ($max)
        // -------------------------------------------------------------
        case 'get_revisions':
            $projectId = (int)($_GET['project_id'] ?? 0);
            if ($projectId <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            $stmtP = $pdo->prepare("SELECT id, project_name, max_revisions, current_revision, revision_deal_status, workflow_step FROM projects WHERE id = ?");
            $stmtP->execute([$projectId]);
            $proj = $stmtP->fetch();
            if (!$proj) sendResponse(false, null, 'Project not found', 404);

            $stmtRev = $pdo->prepare("SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number ASC");
            $stmtRev->execute([$projectId]);
            $revisions = $stmtRev->fetchAll();

            $maxRev = (int)$proj['max_revisions'];
            $currRev = (int)$proj['current_revision'];
            $remRev = max(0, $maxRev - $currRev);

            sendResponse(true, [
                'project_id' => $projectId,
                'project_name' => $proj['project_name'],
                'max_revisions' => $maxRev,
                'current_revision' => $currRev,
                'remaining_revisions' => $remRev,
                'revision_deal_status' => $proj['revision_deal_status'],
                'workflow_step' => $proj['workflow_step'],
                'revisions' => $revisions
            ]);
            break;

        // -------------------------------------------------------------
        // 4g. Revisions: Add New Revision (Checks Kuota Max Revisi Mayor)
        // -------------------------------------------------------------
        case 'add_revision':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            $title = trim($data['title'] ?? '');
            $description = trim($data['description'] ?? '');
            $requestedBy = trim($data['requested_by'] ?? 'Client');
            $requestedDate = !empty($data['requested_date']) ? $data['requested_date'] : date('Y-m-d');

            if ($projectId <= 0 || empty($title) || empty($description)) {
                sendResponse(false, null, 'ID Proyek, judul revisi, dan detail catatan revisi wajib diisi.', 422);
            }

            $stmtP = $pdo->prepare("SELECT max_revisions, current_revision, workflow_step FROM projects WHERE id = ?");
            $stmtP->execute([$projectId]);
            $proj = $stmtP->fetch();
            if (!$proj) sendResponse(false, null, 'Project tidak ditemukan.', 404);

            $maxRev = (int)$proj['max_revisions'];
            $currRev = (int)$proj['current_revision'];

            if ($currRev >= $maxRev) {
                sendResponse(false, [
                    'max_reached' => true,
                    'current' => $currRev,
                    'max' => $maxRev
                ], "Batas maksimal revisi mayor ({$maxRev}x) telah tercapai untuk proyek ini.", 422);
            }

            $nextRevNum = $currRev + 1;

            $pdo->beginTransaction();
            try {
                // Insert revision log
                $ins = $pdo->prepare("
                    INSERT INTO project_revisions (project_id, revision_number, title, description, requested_by, status, requested_date)
                    VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', ?)
                ");
                $ins->execute([$projectId, $nextRevNum, $title, $description, $requestedBy, $requestedDate]);
                $revId = $pdo->lastInsertId();

                // Update project current revision & workflow step to REVISI
                $up = $pdo->prepare("
                    UPDATE projects 
                    SET current_revision = ?, revision_deal_status = 'IN_REVISION', workflow_step = 'REVISI'
                    WHERE id = ?
                ");
                $up->execute([$nextRevNum, $projectId]);

                $pdo->commit();
                sendResponse(true, [
                    'revision_id' => $revId,
                    'revision_number' => $nextRevNum,
                    'remaining' => max(0, $maxRev - $nextRevNum)
                ], "Revisi ke-{$nextRevNum} berhasil dicatat!");
            } catch (Exception $e) {
                $pdo->rollBack();
                sendResponse(false, null, 'Gagal menambahkan revisi: ' . $e->getMessage(), 500);
            }
            break;

        // -------------------------------------------------------------
        // 4h. Flowchart Step: Revisi sampai dengan deal / maximal revisi
        // -------------------------------------------------------------
        case 'approve_revision_deal':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            if ($projectId <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            $pdo->beginTransaction();
            try {
                // Mark all active revisions as DEAL_APPROVED
                $upRev = $pdo->prepare("UPDATE project_revisions SET status = 'DEAL_APPROVED', deal_date = CURDATE() WHERE project_id = ? AND status != 'DEAL_APPROVED'");
                $upRev->execute([$projectId]);

                // Flowchart transition: Revisi deal -> Pembayaran Akhir
                $upProj = $pdo->prepare("UPDATE projects SET revision_deal_status = 'DEAL_APPROVED', workflow_step = 'PEMBAYARAN_AKHIR', progress_percent = GREATEST(progress_percent, 90) WHERE id = ?");
                $upProj->execute([$projectId]);

                $pdo->commit();
                sendResponse(true, [
                    'workflow_step' => 'PEMBAYARAN_AKHIR',
                    'revision_deal_status' => 'DEAL_APPROVED'
                ], 'Revisi telah DEAL / disetujui! Proyek dilanjutkan ke tahap Pembayaran Akhir.');
            } catch (Exception $e) {
                $pdo->rollBack();
                sendResponse(false, null, 'Gagal memproses persetujuan revisi: ' . $e->getMessage(), 500);
            }
            break;

        // -------------------------------------------------------------
        // 4i. Flowchart Step: Pembayaran Akhir -> Done
        // -------------------------------------------------------------
        case 'finalize_project_done':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            if ($projectId <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            $up = $pdo->prepare("UPDATE projects SET workflow_step = 'DONE', status = 'COMPLETED', progress_percent = 100 WHERE id = ?");
            $up->execute([$projectId]);

            sendResponse(true, ['workflow_step' => 'DONE', 'status' => 'COMPLETED'], 'Proyek telah selesai tuntas (DONE)!');
            break;

        // -------------------------------------------------------------
        // 4j. Update Workflow Step Manually
        // -------------------------------------------------------------
        case 'update_workflow_step':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            $step = $data['workflow_step'] ?? '';

            $allowed = ['KONTRAK_DP', 'PENGERJAAN', 'REVISI', 'PEMBAYARAN_AKHIR', 'DONE'];
            if ($projectId <= 0 || !in_array($step, $allowed)) {
                sendResponse(false, null, 'Tahapan workflow tidak valid.', 422);
            }

            $sql = "UPDATE projects SET workflow_step = ?";
            if ($step === 'DONE') {
                $sql .= ", status = 'COMPLETED', progress_percent = 100";
            }
            $sql .= " WHERE id = ?";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([$step, $projectId]);

            sendResponse(true, ['workflow_step' => $step], "Tahapan workflow berhasil diperbarui menjadi {$step}!");
            break;

        // -------------------------------------------------------------
        // 4k. Update Progress Percentage (Ada Chart)
        // -------------------------------------------------------------
        case 'update_progress_percent':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            $percent = max(0, min(100, (int)($data['progress_percent'] ?? 0)));

            if ($projectId <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            $stmt = $pdo->prepare("UPDATE projects SET progress_percent = ? WHERE id = ?");
            $stmt->execute([$percent, $projectId]);

            sendResponse(true, ['progress_percent' => $percent], "Progres pengerjaan berhasil diperbarui menjadi {$percent}%!");
            break;

        // -------------------------------------------------------------
        // 4l. Client Portal: Get Complete Client Dashboard Data
        // -------------------------------------------------------------
        case 'client_portal_data':
            $token = trim($_GET['token'] ?? ($_POST['token'] ?? ''));
            $id = (int)($_GET['id'] ?? ($_POST['id'] ?? 0));

            $project = null;
            if (!empty($token)) {
                $stmt = $pdo->prepare("SELECT * FROM v_project_financial_summary WHERE client_access_token = ?");
                $stmt->execute([$token]);
                $project = $stmt->fetch();
            } elseif ($id > 0) {
                $stmt = $pdo->prepare("SELECT * FROM v_project_financial_summary WHERE project_id = ?");
                $stmt->execute([$id]);
                $project = $stmt->fetch();
            } else {
                // Default fallback: get the first active project (e.g. Jonggol)
                $stmt = $pdo->query("SELECT * FROM v_project_financial_summary WHERE project_status != 'ARCHIVED' ORDER BY project_id ASC LIMIT 1");
                $project = $stmt->fetch();
            }

            if (!$project) {
                sendResponse(false, null, 'Proyek klien tidak ditemukan atau tautan akses tidak valid.', 404);
            }

            $projectId = (int)$project['project_id'];

            // Fetch payment terms (sistem pembayaran manual dalam uang)
            $stmtPt = $pdo->prepare("SELECT * FROM project_payment_terms WHERE project_id = ? ORDER BY id ASC");
            $stmtPt->execute([$projectId]);
            $paymentTerms = $stmtPt->fetchAll();

            // Fetch revisions
            $stmtRev = $pdo->prepare("SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number ASC");
            $stmtRev->execute([$projectId]);
            $revisions = $stmtRev->fetchAll();

            // Fetch real client payments
            $stmtCp = $pdo->prepare("SELECT * FROM client_payments WHERE project_id = ? ORDER BY payment_date ASC");
            $stmtCp->execute([$projectId]);
            $clientPayments = $stmtCp->fetchAll();

            // Prepare pre-composed message templates for WA and Email
            $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? 80) == 443) ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $scriptDir = trim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
            $dirPrefix = (!empty($scriptDir) && $scriptDir !== '.') ? "/{$scriptDir}" : '';
            $portalUrl = "{$proto}://{$host}{$dirPrefix}/client.php?token={$project['client_access_token']}";

            $waText = "Halo Bpk/Ibu *{$project['client_name']}*,\n\n"
                    . "Berikut ringkasan update proyek Anda di Rahmat-Karya:\n"
                    . "• *Nama Proyek:* {$project['project_name']}\n"
                    . "• *No. Kontrak:* " . ($project['contract_number'] ?: $project['project_code']) . "\n"
                    . "• *Total Tagihan:* Rp " . number_format($project['total_contract_value'], 0, ',', '.') . "\n"
                    . "• *DP Awal Terbayar:* Rp " . number_format($project['total_dp_paid'], 0, ',', '.') . "\n"
                    . "• *Sisa Tagihan:* Rp " . number_format($project['client_receivable_remaining'], 0, ',', '.') . "\n"
                    . "• *Durasi Pengerjaan:* " . ($project['start_date'] ?: '-') . " s/d " . ($project['deadline_date'] ?: '-') . "\n"
                    . "• *Progres Saat Ini:* {$project['progress_percent']}%\n"
                    . "• *Status Revisi:* {$project['current_revision']} / {$project['max_revisions']} Revisi Mayor (Status: {$project['revision_deal_status']})\n"
                    . "• *Tahapan Alur:* {$project['workflow_step']}\n\n"
                    . "Anda dapat memantau progres & cetak invoice melalui portal klien:\n{$portalUrl}\n\n"
                    . "Terima kasih atas kerjasamanya!";

            $emailSubject = "Update Proyek & Lembar Rekap: {$project['project_name']} (" . ($project['contract_number'] ?: $project['project_code']) . ")";
            $emailBody = "Halo Bpk/Ibu {$project['client_name']},\n\n"
                       . "Berikut adalah rincian kemajuan dan penagihan proyek {$project['project_name']}:\n\n"
                       . "No. Kontrak: " . ($project['contract_number'] ?: $project['project_code']) . "\n"
                       . "Tanggal Kontrak: " . ($project['contract_date'] ?: '-') . "\n"
                       . "Total Nilai Kontrak: Rp " . number_format($project['total_contract_value'], 0, ',', '.') . "\n"
                       . "DP Awal: Rp " . number_format($project['total_dp_paid'], 0, ',', '.') . "\n"
                       . "Sisa Tagihan: Rp " . number_format($project['client_receivable_remaining'], 0, ',', '.') . "\n"
                       . "Durasi Pekerjaan: " . ($project['start_date'] ?: '-') . " s/d " . ($project['deadline_date'] ?: '-') . "\n"
                       . "Progres Pengerjaan: {$project['progress_percent']}%\n"
                       . "Status Revisi: {$project['current_revision']} dari {$project['max_revisions']} revisi mayor ({$project['revision_deal_status']})\n"
                       . "Tahapan Alur: {$project['workflow_step']}\n\n"
                       . "Tautan Dashboard Klien: {$portalUrl}\n\n"
                       . "Hormat Kami,\nTim Manajemen Proyek";

            sendResponse(true, [
                'project' => $project,
                'payment_terms' => $paymentTerms,
                'revisions' => $revisions,
                'client_payments' => $clientPayments,
                'portal_url' => $portalUrl,
                'wa_message' => $waText,
                'wa_encoded' => rawurlencode($waText),
                'email_subject' => rawurlencode($emailSubject),
                'email_body' => rawurlencode($emailBody)
            ], 'Data portal klien berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 4m. Client Portal: Get Available Projects for Client Selector
        // -------------------------------------------------------------
        case 'client_get_projects':
            $stmt = $pdo->query("SELECT id, project_code, contract_number, project_name, client_name, client_access_token, workflow_step, progress_percent FROM projects WHERE status != 'ARCHIVED' ORDER BY id ASC");
            $list = $stmt->fetchAll();
            sendResponse(true, $list);
            break;

        // -------------------------------------------------------------
        // 5. Add Client Payment (DP / Termin / Pelunasan)
        // -------------------------------------------------------------
        case 'add_client_payment':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            $amountPaid = (float)($data['amount_paid'] ?? 0);
            $paymentType = $data['payment_type'] ?? 'TERMIN';
            $paymentDate = !empty($data['payment_date']) ? $data['payment_date'] : date('Y-m-d');
            $paymentMethod = trim($data['payment_method'] ?? 'TRANSFER');
            $notes = trim($data['notes'] ?? '');

            if ($projectId <= 0 || $amountPaid <= 0) {
                sendResponse(false, null, 'ID Proyek dan nominal pembayaran (> 0) wajib diisi.', 422);
            }

            // Validasi: nominal pembayaran tidak boleh melebihi sisa piutang proyek
            $stmtPrj = $pdo->prepare("SELECT total_contract_value FROM projects WHERE id = ?");
            $stmtPrj->execute([$projectId]);
            $prjRow = $stmtPrj->fetch();
            if ($prjRow) {
                $prjContract = (float)$prjRow['total_contract_value'];
                $stmtPaid = $pdo->prepare("SELECT COALESCE(SUM(amount_paid), 0) FROM client_payments WHERE project_id = ?");
                $stmtPaid->execute([$projectId]);
                $prjAlreadyPaid = (float)$stmtPaid->fetchColumn();
                $remainingReceivable = max(0, $prjContract - $prjAlreadyPaid);

                if ($amountPaid > $remainingReceivable) {
                    sendResponse(false, null, 'Nominal pembayaran (Rp ' . number_format($amountPaid, 0, ',', '.') . ') melebihi sisa piutang proyek (Rp ' . number_format($remainingReceivable, 0, ',', '.') . ').', 422);
                }
            }

            // Generate invoice number
            $invNumber = trim($data['invoice_number'] ?? '');
            if (empty($invNumber)) {
                $countPay = $pdo->prepare("SELECT COUNT(*) FROM client_payments WHERE project_id = ?");
                $countPay->execute([$projectId]);
                $termNum = ((int)$countPay->fetchColumn()) + 1;
                $invNumber = sprintf("INV-%d-%02d", $projectId, $termNum);
            }

            $stmt = $pdo->prepare("
                INSERT INTO client_payments (project_id, invoice_number, payment_type, amount_paid, payment_date, payment_method, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$projectId, $invNumber, $paymentType, $amountPaid, $paymentDate, $paymentMethod, $notes]);

            sendResponse(true, ['payment_id' => $pdo->lastInsertId()], 'Pembayaran klien berhasil dicatat!');
            break;

        // -------------------------------------------------------------
        // 6. Add Team Member Allocation
        // -------------------------------------------------------------
        case 'add_team_member':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $projectId = (int)($data['project_id'] ?? 0);
            $memberName = trim($data['member_name'] ?? '');
            $memberRole = trim($data['member_role'] ?? 'Freelance Subkon');
            $memberPhone = trim($data['member_phone'] ?? '');
            $bankInfo = trim($data['bank_account_info'] ?? '');
            $agreedHonor = (float)($data['agreed_honor'] ?? 0);

            if ($projectId <= 0 || empty($memberName) || $agreedHonor <= 0) {
                sendResponse(false, null, 'Nama anggota tim dan komitmen honor (> 0) wajib diisi.', 422);
            }

            $stmt = $pdo->prepare("
                INSERT INTO project_team_members (project_id, member_name, member_role, member_phone, bank_account_info, agreed_honor)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$projectId, $memberName, $memberRole, $memberPhone, $bankInfo, $agreedHonor]);

            sendResponse(true, ['member_id' => $pdo->lastInsertId()], 'Anggota tim & komitmen honor berhasil ditambahkan!');
            break;

        // -------------------------------------------------------------
        // 7. Add Team Payment (Pencairan Honor ke Rekan Kerja)
        // -------------------------------------------------------------
        case 'add_team_payment':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $memberId = (int)($data['project_team_member_id'] ?? 0);
            $amountPaid = (float)($data['amount_paid'] ?? 0);
            $paymentDate = !empty($data['payment_date']) ? $data['payment_date'] : date('Y-m-d');
            $paymentMethod = trim($data['payment_method'] ?? 'TRANSFER');
            $notes = trim($data['notes'] ?? '');

            if ($memberId <= 0 || $amountPaid <= 0) {
                sendResponse(false, null, 'ID Anggota tim dan nominal bayar (> 0) wajib diisi.', 422);
            }

            $stmt = $pdo->prepare("
                INSERT INTO team_payments (project_team_member_id, amount_paid, payment_date, payment_method, notes)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$memberId, $amountPaid, $paymentDate, $paymentMethod, $notes]);

            sendResponse(true, ['payment_id' => $pdo->lastInsertId()], 'Pencairan honor tim berhasil dicatat!');
            break;

        case 'delete_team_member':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $id = (int)($data['id'] ?? 0);
            if ($id <= 0) sendResponse(false, null, 'ID anggota subkon tidak valid.', 422);

            $stmt = $pdo->prepare("DELETE FROM project_team_members WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, null, 'Data subkon berhasil dihapus.');
            break;

        case 'delete_team_payment':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $id = (int)($data['id'] ?? 0);
            if ($id <= 0) sendResponse(false, null, 'ID pembayaran tidak valid.', 422);

            $stmt = $pdo->prepare("DELETE FROM team_payments WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, null, 'Catatan pencairan honor berhasil dihapus.');
            break;

        // -------------------------------------------------------------
        // 8. Update Project Notes / Keterangan
        // -------------------------------------------------------------
        case 'update_notes':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $id = (int)($data['id'] ?? 0);
            $notes = trim($data['notes'] ?? '');

            if ($id <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            $stmt = $pdo->prepare("UPDATE projects SET notes = ? WHERE id = ?");
            $stmt->execute([$notes, $id]);

            sendResponse(true, null, 'Keterangan proyek berhasil diperbarui!');
            break;

        // -------------------------------------------------------------
        // 9. Toggle Project Status (ACTIVE, COMPLETED, ARCHIVED)
        // -------------------------------------------------------------
        case 'toggle_status':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $id = (int)($data['id'] ?? 0);
            $status = $data['status'] ?? 'COMPLETED';

            if ($id <= 0 || !in_array($status, ['ACTIVE', 'COMPLETED', 'ARCHIVED'])) {
                sendResponse(false, null, 'Status tidak valid.', 422);
            }

            $stmt = $pdo->prepare("UPDATE projects SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);

            sendResponse(true, null, "Status proyek berhasil diperbarui menjadi {$status}!");
            break;

        // -------------------------------------------------------------
        // 10. Delete Project
        // -------------------------------------------------------------
        case 'delete_project':
            requireCanEdit(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $id = (int)($data['id'] ?? ($data['project_id'] ?? 0));

            if ($id <= 0) sendResponse(false, null, 'Invalid Project ID', 400);

            try {
                $pdo->beginTransaction();
                // Explicit delete for child records to ensure cross-database compatibility
                try {
                    $stmtTp = $pdo->prepare("DELETE tp FROM team_payments tp INNER JOIN project_team_members ptm ON tp.project_team_member_id = ptm.id WHERE ptm.project_id = ?");
                    $stmtTp->execute([$id]);
                } catch (Exception $e) {}

                try {
                    $pdo->prepare("DELETE FROM project_team_members WHERE project_id = ?")->execute([$id]);
                } catch (Exception $e) {}

                try {
                    $pdo->prepare("DELETE FROM client_payments WHERE project_id = ?")->execute([$id]);
                } catch (Exception $e) {}

                try {
                    $pdo->prepare("DELETE FROM project_payment_terms WHERE project_id = ?")->execute([$id]);
                } catch (Exception $e) {}

                try {
                    $pdo->prepare("DELETE FROM project_revisions WHERE project_id = ?")->execute([$id]);
                } catch (Exception $e) {}

                $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
                $stmt->execute([$id]);
                $pdo->commit();

                sendResponse(true, null, 'Proyek berhasil dihapus beserta seluruh riwayat terkait.');
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                sendResponse(false, null, 'Gagal menghapus proyek: ' . $e->getMessage(), 500);
            }
            break;

        // -------------------------------------------------------------
        // 11. Current User Information
        // -------------------------------------------------------------
        case 'current_user':
            sendResponse(true, getCurrentUser(), 'User data retrieved.');
            break;

        // -------------------------------------------------------------
        // 12. User Management: Get All Users
        // -------------------------------------------------------------
        case 'get_users':
            requireAdmin(true);
            $stmt = $pdo->query("SELECT id, name, username, email, role, avatar, last_login, created_at, updated_at FROM users ORDER BY id ASC");
            $users = $stmt->fetchAll();
            sendResponse(true, $users, 'Daftar pengguna berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 13. User Management: Create User
        // -------------------------------------------------------------
        case 'create_user':
            requireAdmin(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $name = trim($data['name'] ?? '');
            $username = trim($data['username'] ?? '');
            $email = trim($data['email'] ?? '');
            $password = trim($data['password'] ?? '');
            $role = strtoupper(trim($data['role'] ?? 'VIEWER'));

            if (empty($name) || empty($username) || empty($email) || empty($password)) {
                sendResponse(false, null, 'Nama, username, email, dan kata sandi wajib diisi.', 422);
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendResponse(false, null, 'Format email tidak valid.', 422);
            }

            if (strlen($password) < 6) {
                sendResponse(false, null, 'Kata sandi minimal 6 karakter.', 422);
            }

            if (!in_array($role, ['ADMIN', 'FINANCE', 'VIEWER'])) {
                $role = 'VIEWER';
            }

            // Check duplicate username or email
            $checkStmt = $pdo->prepare("SELECT id, username, email FROM users WHERE username = ? OR email = ?");
            $checkStmt->execute([$username, $email]);
            $dup = $checkStmt->fetch();
            if ($dup) {
                if ($dup['username'] === $username) {
                    sendResponse(false, null, 'Username sudah digunakan oleh akun lain.', 422);
                } else {
                    sendResponse(false, null, 'Email sudah terdaftar.', 422);
                }
            }

            $hashed = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $username, $email, $hashed, $role]);
            $newId = (int)$pdo->lastInsertId();

            sendResponse(true, ['user_id' => $newId], 'Pengguna baru berhasil ditambahkan!');
            break;

        // -------------------------------------------------------------
        // 14. User Management: Update User
        // -------------------------------------------------------------
        case 'update_user':
            requireAdmin(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $id = (int)($data['id'] ?? 0);
            $name = trim($data['name'] ?? '');
            $username = trim($data['username'] ?? '');
            $email = trim($data['email'] ?? '');
            $password = trim($data['password'] ?? '');
            $role = strtoupper(trim($data['role'] ?? 'VIEWER'));

            if ($id <= 0 || empty($name) || empty($username) || empty($email)) {
                sendResponse(false, null, 'Data tidak lengkap.', 422);
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendResponse(false, null, 'Format email tidak valid.', 422);
            }

            if (!in_array($role, ['ADMIN', 'FINANCE', 'VIEWER'])) {
                $role = 'VIEWER';
            }

            // Check if user exists
            $stmtCheck = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmtCheck->execute([$id]);
            $existingUser = $stmtCheck->fetch();
            if (!$existingUser) {
                sendResponse(false, null, 'Pengguna tidak ditemukan.', 404);
            }

            // Prevent removing the last ADMIN
            if ($existingUser['role'] === 'ADMIN' && $role !== 'ADMIN') {
                $countAdmin = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'")->fetchColumn();
                if ($countAdmin <= 1) {
                    sendResponse(false, null, 'Tidak dapat mengubah role ini. Sistem harus memiliki minimal 1 Administrator.', 422);
                }
            }

            // Check duplicate username or email on OTHER users
            $dupStmt = $pdo->prepare("SELECT id, username, email FROM users WHERE (username = ? OR email = ?) AND id != ?");
            $dupStmt->execute([$username, $email, $id]);
            $dup = $dupStmt->fetch();
            if ($dup) {
                if ($dup['username'] === $username) {
                    sendResponse(false, null, 'Username sudah digunakan oleh akun lain.', 422);
                } else {
                    sendResponse(false, null, 'Email sudah terdaftar pada akun lain.', 422);
                }
            }

            // Update with or without new password
            if (!empty($password)) {
                if (strlen($password) < 6) {
                    sendResponse(false, null, 'Kata sandi minimal 6 karakter.', 422);
                }
                $hashed = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("UPDATE users SET name = ?, username = ?, email = ?, password = ?, role = ? WHERE id = ?");
                $stmt->execute([$name, $username, $email, $hashed, $role, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, username = ?, email = ?, role = ? WHERE id = ?");
                $stmt->execute([$name, $username, $email, $role, $id]);
            }

            // If updating current user's own profile, update session
            if ($id === (int)($_SESSION['user_id'] ?? 0)) {
                $_SESSION['user_name'] = $name;
                $_SESSION['user_username'] = $username;
                $_SESSION['user_email'] = $email;
                $_SESSION['user_role'] = $role;
            }

            sendResponse(true, null, 'Data pengguna berhasil diperbarui!');
            break;

        // -------------------------------------------------------------
        // 15. User Management: Delete User
        // -------------------------------------------------------------
        case 'delete_user':
            requireAdmin(true);
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $id = (int)($data['id'] ?? 0);

            if ($id <= 0) sendResponse(false, null, 'ID Pengguna tidak valid.', 400);

            // Cannot delete own active account
            if ($id === (int)($_SESSION['user_id'] ?? 0)) {
                sendResponse(false, null, 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.', 422);
            }

            // Check if user is the last ADMIN
            $stmtUser = $pdo->prepare("SELECT role FROM users WHERE id = ?");
            $stmtUser->execute([$id]);
            $targetUser = $stmtUser->fetch();
            if (!$targetUser) {
                sendResponse(false, null, 'Pengguna tidak ditemukan.', 404);
            }

            if ($targetUser['role'] === 'ADMIN') {
                $countAdmin = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'")->fetchColumn();
                if ($countAdmin <= 1) {
                    sendResponse(false, null, 'Tidak dapat menghapus Administrator terakhir.', 422);
                }
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);

            sendResponse(true, null, 'Pengguna berhasil dihapus.');
            break;

        // -------------------------------------------------------------
        // 16. AI Tracker: Comprehensive Portfolio Analysis
        // -------------------------------------------------------------
        case 'ai_analysis':
            $aiTracker = new AIPaymentTracker($pdo);
            $analysis = $aiTracker->analyzeAll();
            sendResponse(true, $analysis, 'Analisis AI Tracker berhasil dibuat.');
            break;

        // -------------------------------------------------------------
        // 17. AI Tracker: Project Deep-Dive Analysis
        // -------------------------------------------------------------
        case 'ai_project_analysis':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) sendResponse(false, null, 'ID Proyek tidak valid.', 400);

            $aiTracker = new AIPaymentTracker($pdo);
            $projectAnalysis = $aiTracker->analyzeProject($id);
            sendResponse(true, $projectAnalysis, 'Audit mendalam AI Proyek berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 18. AI Tracker: Pre-Check Payment Validator (Error Prevention)
        // -------------------------------------------------------------
        case 'ai_validate_payment':
            $data = getRequestData();
            $projectId = (int)($data['project_id'] ?? 0);
            $type = trim($data['type'] ?? 'CLIENT_PAYMENT');
            $amount = (float)($data['amount'] ?? 0);
            $memberId = !empty($data['member_id']) ? (int)$data['member_id'] : null;

            if ($projectId <= 0) {
                sendResponse(false, null, 'ID Proyek wajib disertakan untuk validasi AI.', 422);
            }

            $aiTracker = new AIPaymentTracker($pdo);
            $validation = $aiTracker->validatePaymentInput($projectId, $type, $amount, $memberId);
            sendResponse(true, $validation, 'Validasi AI berhasil dievaluasi.');
            break;

        // -------------------------------------------------------------
        // 19. Gemini AI: Get Saved API Key Status
        // -------------------------------------------------------------
        case 'get_gemini_key':
            $gemini = new GeminiService($pdo);
            $rawKey = $gemini->getSavedApiKey();
            sendResponse(true, [
                'has_key' => !empty($rawKey),
                'masked_key' => $gemini->maskApiKey($rawKey)
            ], 'Status API Key Gemini berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 20. Gemini AI: Save / Delete API Key
        // -------------------------------------------------------------
        case 'save_gemini_key':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $apiKey = trim($data['api_key'] ?? '');

            $gemini = new GeminiService($pdo);
            $saved = $gemini->saveApiKey($apiKey);

            if ($saved) {
                $msg = !empty($apiKey) ? 'API Key Gemini berhasil disimpan!' : 'API Key Gemini berhasil dihapus.';
                sendResponse(true, [
                    'has_key' => !empty($apiKey),
                    'masked_key' => $gemini->maskApiKey($apiKey)
                ], $msg);
            } else {
                sendResponse(false, null, 'Gagal menyimpan API Key Gemini.', 500);
            }
            break;

        // -------------------------------------------------------------
        // 21. Gemini AI: Test Connection
        // -------------------------------------------------------------
        case 'test_gemini_key':
            $data = getRequestData();
            $apiKey = !empty($data['api_key']) ? trim($data['api_key']) : null;

            $gemini = new GeminiService($pdo);
            $test = $gemini->testConnection($apiKey);

            if ($test['success']) {
                sendResponse(true, $test, $test['message']);
            } else {
                sendResponse(false, $test, $test['message'], 400);
            }
            break;

        // -------------------------------------------------------------
        // 22. Gemini AI: Interactive Prompt Assistant (Context Aware)
        // -------------------------------------------------------------
        case 'gemini_prompt':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();

            $prompt = trim($data['prompt'] ?? '');
            if (empty($prompt)) {
                sendResponse(false, null, 'Teks prompt tidak boleh kosong.', 422);
            }

            $apiKey = !empty($data['api_key']) ? trim($data['api_key']) : null;
            $history = is_array($data['conversation_history'] ?? null) ? $data['conversation_history'] : [];
            $includeContext = isset($data['include_context']) ? (bool)$data['include_context'] : true;
            $model = trim($data['model'] ?? 'gemini-1.5-flash');
            $sessionId = trim($data['session_id'] ?? ($_GET['session_id'] ?? ''));

            $currentUser = getCurrentUser();
            $userId = $currentUser['id'] ?? null;

            $gemini = new GeminiService($pdo);
            $res = $gemini->generateResponse($prompt, $apiKey, $history, $includeContext, $model, $userId, $sessionId ?: null);

            if ($res['success']) {
                sendResponse(true, $res, 'Respons Gemini berhasil diperoleh.');
            } else {
                sendResponse(false, $res, $res['message'], 400);
            }
            break;

        // -------------------------------------------------------------
        // 23. Gemini AI: Get Saved Chat History (Legacy / Global)
        // -------------------------------------------------------------
        case 'get_gemini_history':
            $gemini = new GeminiService($pdo);
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $history = $gemini->getChatHistory($limit);
            sendResponse(true, $history, 'Riwayat chat Gemini berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 23b. Gemini AI: Get Chat Sessions List
        // -------------------------------------------------------------
        case 'get_gemini_sessions':
            $gemini = new GeminiService($pdo);
            $search = trim($_GET['search'] ?? '');
            $sessions = $gemini->getChatSessions(null, $search);
            sendResponse(true, $sessions, 'Daftar riwayat sesi chat berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 23c. Gemini AI: Get Session Messages
        // -------------------------------------------------------------
        case 'get_gemini_session_messages':
            $sessionId = trim($_GET['session_id'] ?? '');
            if (empty($sessionId)) {
                sendResponse(false, null, 'ID sesi diperlukan.', 422);
            }
            $gemini = new GeminiService($pdo);
            $messages = $gemini->getSessionMessages($sessionId);
            sendResponse(true, $messages, 'Pesan sesi berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 23d. Gemini AI: Create New Session
        // -------------------------------------------------------------
        case 'create_gemini_session':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $title = trim($data['title'] ?? 'Obrolan Baru');
            $currentUser = getCurrentUser();
            $userId = $currentUser['id'] ?? null;
            $gemini = new GeminiService($pdo);
            $newSess = $gemini->createChatSession($title, $userId);
            sendResponse(true, $newSess, 'Sesi obrolan baru berhasil dibuat.');
            break;

        // -------------------------------------------------------------
        // 23e. Gemini AI: Delete Chat Session
        // -------------------------------------------------------------
        case 'delete_gemini_session':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $sessionId = trim($data['session_id'] ?? ($_GET['session_id'] ?? ''));
            if (empty($sessionId)) {
                sendResponse(false, null, 'ID sesi diperlukan.', 422);
            }
            $gemini = new GeminiService($pdo);
            $deleted = $gemini->deleteChatSession($sessionId);
            if ($deleted) {
                sendResponse(true, ['session_id' => $sessionId], 'Sesi obrolan berhasil dihapus.');
            } else {
                sendResponse(false, null, 'Gagal menghapus sesi obrolan.', 500);
            }
            break;

        // -------------------------------------------------------------
        // 23f. Gemini AI: Update Session Title
        // -------------------------------------------------------------
        case 'update_gemini_session_title':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            $data = getRequestData();
            $sessionId = trim($data['session_id'] ?? '');
            $title = trim($data['title'] ?? '');
            if (empty($sessionId) || empty($title)) {
                sendResponse(false, null, 'ID sesi dan judul diperlukan.', 422);
            }
            $gemini = new GeminiService($pdo);
            $updated = $gemini->updateChatSessionTitle($sessionId, $title);
            if ($updated) {
                sendResponse(true, ['session_id' => $sessionId, 'title' => $title], 'Judul sesi berhasil diperbarui.');
            } else {
                sendResponse(false, null, 'Gagal memperbarui judul sesi.', 500);
            }
            break;

        // -------------------------------------------------------------
        // 24. Gemini AI: Clear All Chat History
        // -------------------------------------------------------------
        case 'clear_gemini_history':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            requireCanEdit(true);
            $gemini = new GeminiService($pdo);
            $cleared = $gemini->clearChatHistory();
            if ($cleared) {
                sendResponse(true, null, 'Riwayat obrolan AI berhasil dibersihkan.');
            } else {
                sendResponse(false, null, 'Gagal membersihkan riwayat obrolan AI.', 500);
            }
            break;

        // -------------------------------------------------------------
        // 25. Gemini AI: Delete Single Chat Message
        // -------------------------------------------------------------
        case 'delete_gemini_message':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            requireCanEdit(true);
            $data = getRequestData();
            $msgId = (int)($data['id'] ?? ($_GET['id'] ?? 0));
            if ($msgId <= 0) {
                sendResponse(false, null, 'ID pesan tidak valid.', 422);
            }
            $gemini = new GeminiService($pdo);
            $deleted = $gemini->deleteChatMessage($msgId);
            if ($deleted) {
                sendResponse(true, ['id' => $msgId], 'Pesan berhasil dihapus.');
            } else {
                sendResponse(false, null, 'Gagal menghapus pesan.', 500);
            }
            break;

        // -------------------------------------------------------------
        // 26. App Settings: Get System Settings
        // -------------------------------------------------------------
        case 'get_settings':
            $stmt = $pdo->query("SELECT key_name, key_value FROM app_settings");
            $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $settings = [
                'company_name' => $rows['company_name'] ?? 'RAHMAT-KARYA',
                'company_tagline' => $rows['company_tagline'] ?? 'Management Proyek & Digital Arus Kas',
                'company_logo' => $rows['company_logo'] ?? '',
                'company_phone' => $rows['company_phone'] ?? '081234567890',
                'company_email' => $rows['company_email'] ?? 'admin@rahmatkarya.com',
                'company_address' => $rows['company_address'] ?? 'Jl. Raya Utama No. 123, Indonesia',
                'default_bank_name' => $rows['default_bank_name'] ?? 'Bank BCA',
                'default_bank_account_number' => $rows['default_bank_account_number'] ?? '123-456-7890',
                'default_bank_account_holder' => $rows['default_bank_account_holder'] ?? 'Tim Manajemen Keuangan',
                'default_tax_percent' => $rows['default_tax_percent'] ?? '0',
                'currency_symbol' => $rows['currency_symbol'] ?? 'Rp',
            ];

            $gemini = new GeminiService($pdo);
            $rawKey = $gemini->getSavedApiKey();
            $settings['has_gemini_key'] = !empty($rawKey);
            $settings['masked_gemini_key'] = $gemini->maskApiKey($rawKey);

            sendResponse(true, $settings, 'Pengaturan sistem berhasil dimuat.');
            break;

        // -------------------------------------------------------------
        // 27. App Settings: Save System Settings
        // -------------------------------------------------------------
        case 'save_settings':
            if ($method !== 'POST') sendResponse(false, null, 'Method Not Allowed', 405);
            requireCanEdit(true);
            $data = getRequestData();

            $allowedKeys = [
                'company_name',
                'company_tagline',
                'company_logo',
                'company_phone',
                'company_email',
                'company_address',
                'default_bank_name',
                'default_bank_account_number',
                'default_bank_account_holder',
                'default_tax_percent',
                'currency_symbol'
            ];

            $stmt = $pdo->prepare("INSERT INTO app_settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)");

            foreach ($allowedKeys as $key) {
                if (array_key_exists($key, $data)) {
                    $stmt->execute([$key, trim((string)$data[$key])]);
                }
            }

            // If gemini_api_key is explicitly updated
            if (isset($data['gemini_api_key'])) {
                $rawGemini = trim((string)$data['gemini_api_key']);
                if (!empty($rawGemini) && !str_contains($rawGemini, '••••') && !str_contains($rawGemini, '****')) {
                    $gemini = new GeminiService($pdo);
                    $gemini->saveApiKey($rawGemini);
                } elseif ($rawGemini === '') {
                    $gemini = new GeminiService($pdo);
                    $gemini->saveApiKey('');
                }
            }

            // Return latest state
            $stmt = $pdo->query("SELECT key_name, key_value FROM app_settings");
            $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $gemini = new GeminiService($pdo);
            $rawKey = $gemini->getSavedApiKey();

            $updatedSettings = [
                'company_name' => $rows['company_name'] ?? 'RAHMAT-KARYA',
                'company_tagline' => $rows['company_tagline'] ?? 'Management Proyek & Digital Arus Kas',
                'company_logo' => $rows['company_logo'] ?? '',
                'company_phone' => $rows['company_phone'] ?? '081234567890',
                'company_email' => $rows['company_email'] ?? 'admin@rahmatkarya.com',
                'company_address' => $rows['company_address'] ?? 'Jl. Raya Utama No. 123, Indonesia',
                'default_bank_name' => $rows['default_bank_name'] ?? 'Bank BCA',
                'default_bank_account_number' => $rows['default_bank_account_number'] ?? '123-456-7890',
                'default_bank_account_holder' => $rows['default_bank_account_holder'] ?? 'Tim Manajemen Keuangan',
                'default_tax_percent' => $rows['default_tax_percent'] ?? '0',
                'currency_symbol' => $rows['currency_symbol'] ?? 'Rp',
                'has_gemini_key' => !empty($rawKey),
                'masked_gemini_key' => $gemini->maskApiKey($rawKey)
            ];

            sendResponse(true, $updatedSettings, 'Pengaturan sistem berhasil disimpan!');
            break;

        default:
            sendResponse(false, null, "Aksi API '{$action}' tidak ditemukan.", 404);
            break;
    }
} catch (PDOException $e) {
    $msg = $e->getMessage();
    if ($e->getCode() == 23000 || str_contains($msg, 'Integrity constraint violation')) {
        if (str_contains($msg, 'Duplicate entry')) {
            $msg = 'Terjadi duplikasi data unik (misal: kode proyek atau SPK sudah terdaftar). Silakan periksa kembali.';
        }
    }
    sendResponse(false, null, 'Kesalahan Database: ' . $msg, 400);
} catch (Exception $e) {
    sendResponse(false, null, 'Server Error: ' . $e->getMessage(), 500);
}
