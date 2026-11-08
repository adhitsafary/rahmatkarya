<?php
// =====================================================================
// DATABASE CONFIGURATION: ProCash Tracker
// =====================================================================

// Environment-aware Database Credentials
$hostHeader = $_SERVER['HTTP_HOST'] ?? '';
$isLocalHost = str_contains($hostHeader, 'localhost') || str_contains($hostHeader, '127.0.0.1');
$isLocalPath = str_contains(str_replace('\\', '/', __DIR__), '/xampp/') || str_contains(__DIR__, 'C:\\xampp');

$isLocal = $isLocalHost || ($isLocalPath && empty($hostHeader));

if ($isLocal) {
    define('DB_HOST', '127.0.0.1');
    define('DB_PORT', '3306');
    define('DB_NAME', 'procash_tracker');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    // Production cPanel (Sesuaikan jika nama DB/User berbeda di cPanel Anda)
    define('DB_HOST', '127.0.0.1');
    define('DB_PORT', '3306');
    define('DB_NAME', 'netdigi1_procash');
    define('DB_USER', 'netdigi1_procash');
    define('DB_PASS', 'ProCash2026!#Secure');
}

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ]);
                exit;
            }
        }
        return self::$instance;
    }
}
