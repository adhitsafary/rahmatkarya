<?php
// =====================================================================
// CRON RUNNER: Daily Notifications & Reminders Runner
// Can be executed via CLI: `php cron_daily_notifications.php`
// Or via cPanel Cron: `curl -s "https://yourdomain.com/cron_daily_notifications.php?key=ProCashDaily2026"`
// =====================================================================

$isCli = (php_sapi_name() === 'cli' || empty($_SERVER['REMOTE_ADDR']));
$secretKey = 'ProCashDaily2026';

if (!$isCli) {
    header('Content-Type: application/json; charset=UTF-8');
    $providedKey = $_GET['key'] ?? ($_POST['key'] ?? '');
    if ($providedKey !== $secretKey) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Unauthorized cron access. Invalid key.']);
        exit;
    }
}

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/notification_service.php';

try {
    $pdo = Database::getConnection();
    $service = new NotificationService($pdo);
    $data = $service->getDailyNotifications(null, true);

    $summary = $data['summary'];
    $logMessage = sprintf(
        "[%s] CRON DAILY NOTIFICATIONS RUN: %d alerts (%d urgent). Terms: %s, Receivables: %s, Subkon: %s\n",
        date('Y-m-d H:i:s'),
        $summary['total_alerts'],
        $summary['urgent_count'],
        $summary['total_terms_amount_formatted'],
        $summary['total_receivables_amount_formatted'],
        $summary['total_subkon_amount_formatted']
    );

    // Write to a daily reminder log
    @file_put_contents(__DIR__ . '/daily_notifications.log', $logMessage, FILE_APPEND);

    $response = [
        'success' => true,
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => 'ProCash Daily Notifications processed successfully.',
        'data' => $data
    ];

    if ($isCli) {
        echo $logMessage;
        echo "Details:\n";
        foreach ($data['items'] as $idx => $it) {
            echo sprintf("  %d. [%s] %s: %s (%s)\n", $idx + 1, strtoupper($it['urgency']), $it['badge_text'], $it['title'], $it['amount_formatted'] ?: '-');
        }
    } else {
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    if ($isCli) {
        echo "Error in daily notifications cron: " . $e->getMessage() . "\n";
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit(1);
}
