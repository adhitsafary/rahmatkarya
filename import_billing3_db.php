<?php
header('Content-Type: text/plain');
set_time_limit(600);
ini_set('memory_limit', '512M');

echo "=== IMPORTING BILLING3 DATABASE ===\n\n";

$dir = '/home/netdigi1/billing3.netdigitalgroup.com';
$sqlGz = $dir . '/billing3_db.sql.gz';

$dbUser = 'netdigi1_billing3';
$dbPass = 'Billing3Pass2026Strong';
$dbName = 'netdigi1_billing3';

// 1. Verify credentials first
echo "[1/4] Verifying MySQL connection...\n";
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$dbName", $dbUser, $dbPass);
    echo "Connection to $dbName successful!\n";
} catch (Exception $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

// 2. Import SQL
echo "\n[2/4] Importing SQL into $dbName...\n";
$importCmd = "gzip -dc " . escapeshellarg($sqlGz) . " | mysql -h 127.0.0.1 -u " . escapeshellarg($dbUser) . " -p" . escapeshellarg($dbPass) . " " . escapeshellarg($dbName) . " 2>&1";
exec($importCmd, $impOut, $impRet);
if ($impRet !== 0) {
    echo "Warning/Error during import: " . implode("\n", $impOut) . "\n";
} else {
    echo "Import command finished successfully!\n";
}

// 3. Verify Table and Data
echo "\n[3/4] Verifying tables and records...\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$dbName'");
$tableCount = $stmt->fetchColumn();
echo "Total tables in $dbName: $tableCount\n";

$tables = ['tbl_customers', 'tbl_transactions', 'tbl_plans', 'tbl_routers', 'tbl_users'];
foreach ($tables as $t) {
    $st = $pdo->query("SELECT COUNT(*) FROM `$t`");
    if ($st) {
        echo " - Table $t: " . $st->fetchColumn() . " rows\n";
    }
}

// 4. Update config.php
echo "\n[4/4] Updating config.php...\n";
$configFile = $dir . '/config.php';
$configContent = file_get_contents($configFile);

$configContent = preg_replace(
    '/define\("APP_URL",\s*["\'][^"\']+["\']\);/i',
    'define("APP_URL", "https://billing3.netdigitalgroup.com");',
    $configContent
);

$configContent = preg_replace('/\$db_host\s*=\s*["\'][^"\']+["\'];/', '$db_host = "127.0.0.1";', $configContent);
$configContent = preg_replace('/\$db_user\s*=\s*["\'][^"\']+["\'];/', '$db_user = "netdigi1_billing3";', $configContent);
$configContent = preg_replace('/\$db_pass\s*=\s*["\'][^"\']+["\'];/', '$db_pass = "Billing3Pass2026Strong";', $configContent);
$configContent = preg_replace('/\$db_name\s*=\s*["\'][^"\']+["\'];/', '$db_name = "netdigi1_billing3";', $configContent);

// Radius config: set radius to local db as well
$configContent = preg_replace('/\$radius_host\s*=\s*["\'][^"\']+["\'];/', '$radius_host = "127.0.0.1";', $configContent);
$configContent = preg_replace('/\$radius_user\s*=\s*["\'][^"\']+["\'];/', '$radius_user = "netdigi1_billing3";', $configContent);
$configContent = preg_replace('/\$radius_pass\s*=\s*["\'][^"\']+["\'];/', '$radius_pass = "Billing3Pass2026Strong";', $configContent);
$configContent = preg_replace('/\$radius_name\s*=\s*["\'][^"\']+["\'];/', '$radius_name = "netdigi1_billing3";', $configContent);

file_put_contents($configFile, $configContent);
echo "config.php updated successfully!\n";

// Cleanup sql.gz
@unlink($sqlGz);
echo "Cleaned up sql.gz!\n";

echo "\n=== ALL DONE! ===\n";
