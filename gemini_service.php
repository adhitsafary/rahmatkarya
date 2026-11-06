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
        string $model = 'gemini-1.5-flash'
    ): array {
        $key = !empty($apiKey) ? trim($apiKey) : $this->getSavedApiKey();

        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'API Key Gemini belum dimasukkan. Silakan masukkan Google Gemini API Key Anda pada pengaturan di atas.'
            ];
        }

        // 1. Build System Instruction with Live Cashflow Context if requested
        $systemInstruction = null;
        if ($includeContext) {
            $systemInstruction = $this->buildFinancialContext();
        }

        // 2. Format conversation contents array for Gemini API
        $contents = [];

        // Append past conversation history if provided
        foreach ($history as $msg) {
            $role = ($msg['role'] ?? 'user') === 'assistant' ? 'model' : ($msg['role'] ?? 'user');
            $text = trim($msg['content'] ?? ($msg['text'] ?? ''));
            if (!empty($text)) {
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $text]]
                ];
            }
        }

        // Append current user prompt
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userPrompt]]
        ];

        // 3. Call Gemini with fallback models if needed
        $models = array_unique([$model, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash']);
        $lastError = '';

        foreach ($models as $m) {
            $res = $this->callGeminiApi($key, $m, $contents, $systemInstruction, 2048);
            if ($res['success']) {
                return [
                    'success' => true,
                    'reply' => $res['reply'],
                    'model_used' => $m,
                    'context_included' => $includeContext
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
}
