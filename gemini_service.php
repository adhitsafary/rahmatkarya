<?php
// =====================================================================
// GEMINI SERVICE: Google Gemini AI Integration for ProCash Tracker
// =====================================================================
// Purpose: Handles Gemini API authentication, key storage, real-time
// prompt engineering with live financial context, and multi-turn chat.
// =====================================================================

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/ai_tracker.php';

class GeminiService {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Retrieves the stored Gemini API key from database or environment
     */
    public function getSavedApiKey(): ?string {
        try {
            $stmt = $this->pdo->prepare("SELECT key_value FROM app_settings WHERE key_name = 'gemini_api_key' LIMIT 1");
            $stmt->execute();
            $val = $stmt->fetchColumn();
            if (!empty($val)) return trim($val);
        } catch (Exception $e) {
            // Table might not exist yet
        }

        // Check environment variable fallback
        $envKey = getenv('GEMINI_API_KEY');
        if (!empty($envKey)) return trim($envKey);

        return null;
    }

    /**
     * Saves or removes the Gemini API key in app_settings table
     */
    public function saveApiKey(string $apiKey): bool {
        $this->ensureSettingsTable();
        $apiKey = trim($apiKey);

        if (empty($apiKey)) {
            $stmt = $this->pdo->prepare("DELETE FROM app_settings WHERE key_name = 'gemini_api_key'");
            return $stmt->execute();
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO app_settings (key_name, key_value) 
            VALUES ('gemini_api_key', ?)
            ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)
        ");
        return $stmt->execute([$apiKey]);
    }

    /**
     * Masks an API key for safe display in the frontend (e.g. AIzaSy...xxxx)
     */
    public function maskApiKey(?string $key): string {
        if (empty($key)) return '';
        $len = strlen($key);
        if ($len <= 8) return str_repeat('*', $len);
        return substr($key, 0, 6) . '••••••••' . substr($key, -4);
    }

    /**
     * Tests connectivity and API key validity against Google Gemini API
     */
    public function testConnection(?string $apiKey = null): array {
        $key = !empty($apiKey) ? trim($apiKey) : $this->getSavedApiKey();

        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'API Key Gemini belum diatur. Masukkan API Key Anda terlebih dahulu.'
            ];
        }

        $testPrompt = "Balas dalam satu kalimat singkat: Halo, koneksi Gemini API aktif dan siap membantu ProCash Tracker.";
        $modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];

        $lastError = '';
        foreach ($modelsToTry as $m) {
            $res = $this->callGeminiApi($key, $m, [
                ['role' => 'user', 'parts' => [['text' => $testPrompt]]]
            ], null, 150);

            if ($res['success']) {
                return [
                    'success' => true,
                    'message' => 'Koneksi ke Google Gemini AI berhasil terhubung!',
                    'model' => $m,
                    'sample_reply' => $res['reply']
                ];
            } else {
                $lastError = $res['message'];
            }
        }

        return [
            'success' => false,
            'message' => 'Koneksi gagal: ' . $lastError
        ];
    }

    /**
     * Generates an intelligent, context-aware AI response from Google Gemini
     */
    public function generateResponse(
        string $userPrompt, 
        ?string $apiKey = null, 
        array $history = [], 
        bool $includeContext = true,
        string $model = 'gemini-1.5-flash',
        ?int $userId = null,
        ?string $sessionId = null
    ): array {
        $key = !empty($apiKey) ? trim($apiKey) : $this->getSavedApiKey();

        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'API Key Gemini belum dimasukkan. Silakan masukkan Google Gemini API Key Anda pada pengaturan di atas.'
            ];
        }

        // Ensure session exists or create a new session
        $this->ensureChatHistoryTable();
        $sessionTitle = 'Obrolan Baru';
        if (empty($sessionId)) {
            $sessionId = 'sess_' . bin2hex(random_bytes(8));
            $cleanTitle = trim(preg_replace('/\s+/', ' ', $userPrompt));
            $sessionTitle = mb_substr($cleanTitle, 0, 48) . (mb_strlen($cleanTitle) > 48 ? '...' : '');
            $this->createChatSession($sessionTitle, $userId, $sessionId);
        } else {
            $stmt = $this->pdo->prepare("SELECT title FROM ai_chat_sessions WHERE session_id = ?");
            $stmt->execute([$sessionId]);
            $existingTitle = $stmt->fetchColumn();
            if (!$existingTitle) {
                $cleanTitle = trim(preg_replace('/\s+/', ' ', $userPrompt));
                $sessionTitle = mb_substr($cleanTitle, 0, 48) . (mb_strlen($cleanTitle) > 48 ? '...' : '');
                $this->createChatSession($sessionTitle, $userId, $sessionId);
            } else {
                $sessionTitle = $existingTitle;
            }
        }

        // 1. Build System Instruction with Live Cashflow Context if requested
        $systemInstruction = null;
        if ($includeContext) {
            $systemInstruction = $this->buildFinancialContext();
        }

        // 2. Format conversation contents array for Gemini API
        $cleanHistory = [];
        foreach ($history as $msg) {
            $role = ($msg['role'] ?? 'user') === 'assistant' ? 'model' : ($msg['role'] ?? 'user');
            $text = trim($msg['content'] ?? ($msg['text'] ?? ($msg['message'] ?? '')));
            if (!empty($text)) {
                $cleanHistory[] = [
                    'role' => $role,
                    'text' => $text
                ];
            }
        }

        // Gemini API multi-turn requires the first turn to be 'user'
        while (!empty($cleanHistory) && $cleanHistory[0]['role'] !== 'user') {
            array_shift($cleanHistory);
        }

        // Limit past history to last 16 turns to keep payload fast and within tokens
        if (count($cleanHistory) > 16) {
            $cleanHistory = array_slice($cleanHistory, -16);
            while (!empty($cleanHistory) && $cleanHistory[0]['role'] !== 'user') {
                array_shift($cleanHistory);
            }
        }

        $contents = [];
        $lastRole = null;
        foreach ($cleanHistory as $msg) {
            if ($msg['role'] !== $lastRole) {
                $contents[] = [
                    'role' => $msg['role'],
                    'parts' => [['text' => $msg['text']]]
                ];
                $lastRole = $msg['role'];
            }
        }

        // Append current user prompt
        if ($lastRole === 'user' && !empty($contents)) {
            $lastIndex = count($contents) - 1;
            $contents[$lastIndex]['parts'][] = ['text' => $userPrompt];
        } else {
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => $userPrompt]]
            ];
        }

        // 3. Call Gemini with fallback models if needed
        $models = array_unique([$model, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash']);
        $lastError = '';

        foreach ($models as $m) {
            $res = $this->callGeminiApi($key, $m, $contents, $systemInstruction, 2048);
            if ($res['success']) {
                // Automatically save both user prompt and Gemini response to database
                $userMsgId = $this->saveChatMessage('user', $userPrompt, $userId, $m, $sessionId);
                $modelMsgId = $this->saveChatMessage('model', $res['reply'], $userId, $m, $sessionId);

                return [
                    'success' => true,
                    'reply' => $res['reply'],
                    'model_used' => $m,
                    'context_included' => $includeContext,
                    'session_id' => $sessionId,
                    'session_title' => $sessionTitle,
                    'user_message_id' => $userMsgId,
                    'model_message_id' => $modelMsgId,
                    'time' => date('H:i'),
                    'date' => date('d M Y')
                ];
            } else {
                $lastError = $res['message'];
            }
        }

        return [
            'success' => false,
            'message' => 'Gagal memproses prompt ke Gemini: ' . $lastError
        ];
    }

    /**
     * Low-level cURL call to Google Gemini REST endpoint
     */
    private function callGeminiApi(
        string $apiKey, 
        string $model, 
        array $contents, 
        ?string $systemInstruction = null,
        int $maxTokens = 2048
    ): array {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => $maxTokens,
                'topP' => 0.95
            ]
        ];

        if (!empty($systemInstruction)) {
            $payload['systemInstruction'] = [
                'parts' => [
                    ['text' => $systemInstruction]
                ]
            ];
        }

        $jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json; charset=UTF-8',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

        $responseBody = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if (!empty($curlError)) {
            return [
                'success' => false,
                'message' => 'Koneksi jaringan gagal (cURL error): ' . $curlError
            ];
        }

        $decoded = json_decode($responseBody, true);

        if ($httpCode >= 200 && $httpCode < 300) {
            if (isset($decoded['candidates'][0]['content']['parts'][0]['text'])) {
                $reply = $decoded['candidates'][0]['content']['parts'][0]['text'];
                return [
                    'success' => true,
                    'reply' => trim($reply)
                ];
            }
            return [
                'success' => false,
                'message' => 'Format balasan Gemini tidak memiliki teks jawaban.'
            ];
        }

        // Handle Google API Error
        $errMsg = $decoded['error']['message'] ?? ("HTTP {$httpCode}: Respons tidak valid.");
        if (str_contains(strtolower($errMsg), 'api key not valid') || str_contains(strtolower($errMsg), 'invalid api key')) {
            $errMsg = "API Key Gemini tidak valid. Pastikan Anda menyalin API Key yang benar dari Google AI Studio (aistudio.google.com).";
        } elseif (str_contains(strtolower($errMsg), 'quota')) {
            $errMsg = "Batas kuota Gemini API tercapai (Rate Limit/Quota Exceeded). Silakan coba lagi beberapa saat.";
        }

        return [
            'success' => false,
            'message' => $errMsg
        ];
    }

    /**
     * Builds live financial context to feed into Gemini System Instructions
     */
    public function buildFinancialContext(): string {
        $aiTracker = new AIPaymentTracker($this->pdo);
        $analysis = $aiTracker->analyzeAll();

        $projectsStmt = $this->pdo->query("SELECT * FROM v_project_financial_summary WHERE project_status != 'ARCHIVED'");
        $projects = $projectsStmt->fetchAll(PDO::FETCH_ASSOC);

        $totalKas = array_reduce($projects, fn($c, $p) => $c + (float)$p['net_cash_in_hand'], 0.0);
        $totalPiutang = array_reduce($projects, fn($c, $p) => $c + (float)$p['client_receivable_remaining'], 0.0);
        $totalHutangTim = array_reduce($projects, fn($c, $p) => $c + (float)$p['team_payable_remaining'], 0.0);
        $totalKontrak = array_reduce($projects, fn($c, $p) => $c + (float)$p['total_contract_value'], 0.0);

        $projRows = [];
        foreach ($projects as $p) {
            $projRows[] = sprintf(
                "- Proyek #%d [%s]: Klien='%s', No WA='%s', Nilai Kontrak=Rp %s, Diterima=Rp %s, Sisa Piutang=Rp %s, Plafon Honor Tim=Rp %s, Disalurkan ke Tim=Rp %s, Sisa Hutang Tim=Rp %s, Kas Riil di Tangan=Rp %s, Margin Laba=%s%%, Status Badge=%s, Deadline=%s, Catatan='%s'",
                $p['project_id'],
                $p['project_name'],
                $p['client_name'],
                $p['client_phone'] ?: 'Belum diisi',
                number_format((float)$p['total_contract_value'], 0, ',', '.'),
                number_format((float)$p['total_paid_by_client'], 0, ',', '.'),
                number_format((float)$p['client_receivable_remaining'], 0, ',', '.'),
                number_format((float)$p['total_agreed_team_honor'], 0, ',', '.'),
                number_format((float)$p['total_disbursed_to_team'], 0, ',', '.'),
                number_format((float)$p['team_payable_remaining'], 0, ',', '.'),
                number_format((float)$p['net_cash_in_hand'], 0, ',', '.'),
                $p['profit_margin_percentage'],
                $p['visual_status_badge'],
                $p['deadline_date'] ?: 'Tidak ada',
                $p['notes'] ?: '-'
            );
        }

        $anomalyRows = [];
        foreach ($analysis['anomalies'] as $a) {
            $anomalyRows[] = sprintf(
                "• [%s] %s (Proyek: %s): %s | Dampak: %s | Saran: %s",
                $a['severity'],
                $a['title'],
                $a['project_name'],
                $a['description'],
                $a['impact'],
                $a['solution']
            );
        }

        $context = "Anda adalah 'ProCash Gemini AI Consultant', asisten analis keuangan & pelacak pembayaran cerdas untuk aplikasi ProCash Tracker yang digunakan oleh Pak Rahmat & Tim IT.\n\n";
        $context .= "Peran & Karakter Anda:\n";
        $context .= "1. Berbicaralah dengan nada profesional, hangat, solutif, dan berbasis data riil keuangan proyek.\n";
        $context .= "2. Jika ditanya tentang risiko, sebutkan proyek spesifik, nominal uang yang terlibat, dan konsekuensi finansialnya (misal: defisit kas talangan pribadi, risiko double transfer, overpayment).\n";
        $context .= "3. Jika diminta membuat draf pesan WhatsApp atau penagihan, buatkan template pesan sopan, jelas, persuasif, dan siap salin (lengkap dengan placeholder nama klien & nominal tagihan).\n";
        $context .= "4. Gunakan format Markdown yang rapi (bold, bullet points, numbering) agar mudah dibaca.\n\n";
        $context .= "=== RINGKASAN PORTOFOLIO KEUANGAN SAAT INI ===\n";
        $context .= "- Tanggal & Waktu Server: " . date('d F Y, H:i') . " WIB\n";
        $context .= "- Skor Integritas Keuangan AI: " . $analysis['system_health_score'] . "/100 (" . $analysis['risk_badge_text'] . ")\n";
        $context .= "- Total Nilai Kontrak Seluruh Proyek: Rp " . number_format($totalKontrak, 0, ',', '.') . "\n";
        $context .= "- Total Kas Riil di Tangan (Aman Dibelanjakan): Rp " . number_format($totalKas, 0, ',', '.') . "\n";
        $context .= "- Total Piutang Belum Tertagih ke Klien: Rp " . number_format($totalPiutang, 0, ',', '.') . "\n";
        $context .= "- Total Kewajiban Hak Tim Belum Dibayarkan: Rp " . number_format($totalHutangTim, 0, ',', '.') . "\n\n";

        $context .= "=== DAFTAR RINCIAN PROYEK AKTIF ===\n" . implode("\n", $projRows) . "\n\n";

        if (!empty($anomalyRows)) {
            $context .= "=== TEMUAN ANOMALI & KESALAHAN PEMBAYARAN SAAT INI ===\n" . implode("\n", $anomalyRows) . "\n\n";
        }

        $context .= "Jawablah pertanyaan pengguna dengan mengacu secara tepat pada data riil di atas.";

        return $context;
    }

    private function ensureSettingsTable(): void {
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `app_settings` (
                    `key_name` VARCHAR(100) NOT NULL PRIMARY KEY,
                    `key_value` TEXT NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
        } catch (Exception $e) {
            // Ignore if exists
        }
    }

    /**
     * Ensures the ai_chat_sessions and ai_chat_messages tables exist in the database
     */
    public function ensureChatHistoryTable(): void {
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `ai_chat_sessions` (
                    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `session_id` VARCHAR(64) NOT NULL UNIQUE,
                    `user_id` INT UNSIGNED NULL,
                    `title` VARCHAR(255) NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_session_user` (`user_id`),
                    INDEX `idx_session_updated` (`updated_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `ai_chat_messages` (
                    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT UNSIGNED NULL,
                    `session_id` VARCHAR(64) NULL,
                    `role` ENUM('user', 'model') NOT NULL,
                    `message` LONGTEXT NOT NULL,
                    `model` VARCHAR(50) NULL DEFAULT 'gemini-1.5-flash',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_chat_user` (`user_id`),
                    INDEX `idx_chat_session` (`session_id`),
                    INDEX `idx_chat_created` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $chk = $this->pdo->query("SHOW COLUMNS FROM `ai_chat_messages` LIKE 'session_id'");
            if (!$chk->fetch()) {
                $this->pdo->exec("ALTER TABLE `ai_chat_messages` ADD COLUMN `session_id` VARCHAR(64) NULL AFTER `user_id`, ADD INDEX `idx_chat_session` (`session_id`)");
            }
        } catch (Exception $e) {
            // Ignore if exists
        }
    }

    /**
     * Retrieves all chat sessions
     */
    public function getChatSessions(?int $userId = null, string $search = ''): array {
        $this->ensureChatHistoryTable();
        try {
            $sql = "
                SELECT 
                    s.id,
                    s.session_id,
                    s.user_id,
                    s.title,
                    s.created_at,
                    s.updated_at,
                    COUNT(m.id) AS message_count,
                    DATE_FORMAT(s.updated_at, '%H:%i') AS formatted_time,
                    DATE_FORMAT(s.updated_at, '%d %b %Y') AS formatted_date
                FROM `ai_chat_sessions` s
                LEFT JOIN `ai_chat_messages` m ON s.session_id = m.session_id
            ";

            $where = [];
            $params = [];

            if ($userId !== null) {
                $where[] = " (s.user_id = ? OR s.user_id IS NULL) ";
                $params[] = $userId;
            }

            if (!empty($search)) {
                $where[] = " s.title LIKE ? ";
                $params[] = '%' . $search . '%';
            }

            if (!empty($where)) {
                $sql .= " WHERE " . implode(' AND ', $where);
            }

            $sql .= " GROUP BY s.id ORDER BY s.updated_at DESC, s.id DESC LIMIT 100 ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Retrieves messages for a specific session
     */
    public function getSessionMessages(string $sessionId): array {
        $this->ensureChatHistoryTable();
        try {
            $sql = "
                SELECT 
                    m.id,
                    m.user_id,
                    m.session_id,
                    u.name AS user_name,
                    u.role AS user_role,
                    m.role,
                    m.message,
                    m.model,
                    m.created_at,
                    DATE_FORMAT(m.created_at, '%H:%i') AS formatted_time,
                    DATE_FORMAT(m.created_at, '%d %b %Y') AS formatted_date
                FROM `ai_chat_messages` m
                LEFT JOIN `users` u ON m.user_id = u.id
                WHERE m.session_id = ?
                ORDER BY m.id ASC
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$sessionId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(function($r) {
                return [
                    'id' => (int)$r['id'],
                    'user_id' => $r['user_id'] ? (int)$r['user_id'] : null,
                    'session_id' => $r['session_id'],
                    'user_name' => $r['user_name'] ?? null,
                    'user_role' => $r['user_role'] ?? null,
                    'role' => $r['role'],
                    'text' => $r['message'],
                    'message' => $r['message'],
                    'model' => $r['model'],
                    'time' => $r['formatted_time'] ?: date('H:i', strtotime($r['created_at'])),
                    'date' => $r['formatted_date'] ?: date('d M Y', strtotime($r['created_at'])),
                    'created_at' => $r['created_at']
                ];
            }, $rows);
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Creates or initializes a chat session
     */
    public function createChatSession(string $title, ?int $userId = null, ?string $sessionId = null): array {
        $this->ensureChatHistoryTable();
        $sessionId = $sessionId ?: ('sess_' . bin2hex(random_bytes(8)));
        $title = trim($title) ?: 'Obrolan Baru';

        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO `ai_chat_sessions` (`session_id`, `user_id`, `title`, `created_at`, `updated_at`)
                VALUES (?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `updated_at` = NOW()
            ");
            $stmt->execute([$sessionId, $userId, $title]);

            return [
                'session_id' => $sessionId,
                'title' => $title,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
                'message_count' => 0
            ];
        } catch (Exception $e) {
            return [
                'session_id' => $sessionId,
                'title' => $title
            ];
        }
    }

    /**
     * Deletes a chat session and all its messages
     */
    public function deleteChatSession(string $sessionId): bool {
        $this->ensureChatHistoryTable();
        try {
            $stmt1 = $this->pdo->prepare("DELETE FROM `ai_chat_messages` WHERE `session_id` = ?");
            $stmt1->execute([$sessionId]);

            $stmt2 = $this->pdo->prepare("DELETE FROM `ai_chat_sessions` WHERE `session_id` = ?");
            return $stmt2->execute([$sessionId]);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Updates session title
     */
    public function updateChatSessionTitle(string $sessionId, string $newTitle): bool {
        $this->ensureChatHistoryTable();
        $newTitle = trim($newTitle);
        if (empty($newTitle)) return false;

        try {
            $stmt = $this->pdo->prepare("UPDATE `ai_chat_sessions` SET `title` = ?, `updated_at` = NOW() WHERE `session_id` = ?");
            return $stmt->execute([$newTitle, $sessionId]);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Saves a single chat message (user prompt or AI model response) to database
     */
    public function saveChatMessage(string $role, string $message, ?int $userId = null, ?string $model = null, ?string $sessionId = null): int {
        $this->ensureChatHistoryTable();
        
        $role = ($role === 'assistant' || $role === 'model') ? 'model' : 'user';
        $message = trim($message);
        if (empty($message)) return 0;

        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO `ai_chat_messages` (`user_id`, `session_id`, `role`, `message`, `model`, `created_at`)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $userId,
                $sessionId,
                $role,
                $message,
                $model ?: 'gemini-1.5-flash'
            ]);
            $insertId = (int)$this->pdo->lastInsertId();

            if (!empty($sessionId)) {
                $this->pdo->prepare("UPDATE `ai_chat_sessions` SET `updated_at` = NOW() WHERE `session_id` = ?")->execute([$sessionId]);
            }

            return $insertId;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Retrieves stored chat history from database
     */
    public function getChatHistory(int $limit = 100, ?int $userId = null): array {
        $this->ensureChatHistoryTable();

        try {
            $sql = "
                SELECT 
                    m.id,
                    m.user_id,
                    u.name AS user_name,
                    u.role AS user_role,
                    m.role,
                    m.message,
                    m.model,
                    m.created_at,
                    DATE_FORMAT(m.created_at, '%H:%i') AS formatted_time,
                    DATE_FORMAT(m.created_at, '%d %b %Y') AS formatted_date
                FROM `ai_chat_messages` m
                LEFT JOIN `users` u ON m.user_id = u.id
            ";

            $params = [];
            if ($userId !== null) {
                $sql .= " WHERE m.user_id = ? ";
                $params[] = $userId;
            }

            $sql .= " ORDER BY m.id ASC LIMIT " . (int)$limit;

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(function($r) {
                return [
                    'id' => (int)$r['id'],
                    'user_id' => $r['user_id'] ? (int)$r['user_id'] : null,
                    'user_name' => $r['user_name'] ?? null,
                    'user_role' => $r['user_role'] ?? null,
                    'role' => $r['role'],
                    'text' => $r['message'],
                    'message' => $r['message'],
                    'model' => $r['model'],
                    'time' => $r['formatted_time'] ?: date('H:i', strtotime($r['created_at'])),
                    'date' => $r['formatted_date'] ?: date('d M Y', strtotime($r['created_at'])),
                    'created_at' => $r['created_at']
                ];
            }, $rows);
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Clears chat history from database
     */
    public function clearChatHistory(?int $userId = null): bool {
        $this->ensureChatHistoryTable();

        try {
            if ($userId !== null) {
                $stmt = $this->pdo->prepare("DELETE FROM `ai_chat_messages` WHERE `user_id` = ?");
                return $stmt->execute([$userId]);
            } else {
                return $this->pdo->exec("DELETE FROM `ai_chat_messages`") !== false;
            }
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Deletes a single chat message by ID
     */
    public function deleteChatMessage(int $messageId): bool {
        $this->ensureChatHistoryTable();

        try {
            $stmt = $this->pdo->prepare("DELETE FROM `ai_chat_messages` WHERE `id` = ?");
            return $stmt->execute([$messageId]);
        } catch (Exception $e) {
            return false;
        }
    }
}
