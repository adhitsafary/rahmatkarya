<?php
header('Content-Type: text/plain');
set_time_limit(300);

echo "=== IMPORTING CLEAN DATABASE (6.7MB) ===\n\n";

$dir = '/home/netdigi1/billing3.netdigitalgroup.com';
$sqlGz = $dir . '/clean_billing3.sql.gz';

$dbUser = 'netdigi1_billing3';
$dbPass = 'Billing3Pass2026Strong';
$dbName = 'netdigi1_billing3';

// 1. Verify connection
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$dbName", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Connected to MySQL successfully!\n";
} catch (Exception $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

// 2. Execute import
echo "Importing into $dbName...\n";
$cmd = "gzip -dc " . escapeshellarg($sqlGz) . " | mysql -h 127.0.0.1 -u " . escapeshellarg($dbUser) . " -p" . escapeshellarg($dbPass) . " " . escapeshellarg($dbName) . " 2>&1";
exec($cmd, $out, $ret);
echo "Import returned code: $ret\n";
if (!empty($out)) {
    echo "Output:\n" . implode("\n", $out) . "\n";
}

// 3. Verify tables and rows
$tables = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$dbName'")->fetchColumn();
echo "\nTotal tables created: $tables\n";

$checks = ['tbl_customers', 'tbl_plans', 'tbl_routers', 'tbl_users', 'tbl_transactions', 'tbl_appconfig', 'tbl_deleted_onus', 'radpostauth'];
foreach ($checks as $t) {
    try {
        $cnt = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo " - Table $t: $cnt rows\n";
    } catch (Exception $e) {
        echo " - Table $t: NOT FOUND\n";
    }
}

// 4. Update config.php
$cfg = $dir . '/config.php';
$content = file_get_contents($cfg);
$content = preg_replace('/define\("APP_URL",\s*["\'][^"\']+["\']\);/i', 'define("APP_URL", "https://billing3.netdigitalgroup.com");', $content);
$content = preg_replace('/\$db_host\s*=\s*["\'][^"\']+["\'];/', '$db_host = "127.0.0.1";', $content);
$content = preg_replace('/\$db_user\s*=\s*["\'][^"\']+["\'];/', '$db_user = "netdigi1_billing3";', $content);
$content = preg_replace('/\$db_pass\s*=\s*["\'][^"\']+["\'];/', '$db_pass = "Billing3Pass2026Strong";', $content);
$content = preg_replace('/\$db_name\s*=\s*["\'][^"\']+["\'];/', '$db_name = "netdigi1_billing3";', $content);

$content = preg_replace('/\$radius_host\s*=\s*["\'][^"\']+["\'];/', '$radius_host = "127.0.0.1";', $content);
$content = preg_replace('/\$radius_user\s*=\s*["\'][^"\']+["\'];/', '$radius_user = "netdigi1_billing3";', $content);
$content = preg_replace('/\$radius_pass\s*=\s*["\'][^"\']+["\'];/', '$radius_pass = "Billing3Pass2026Strong";', $content);
$content = preg_replace('/\$radius_name\s*=\s*["\'][^"\']+["\'];/', '$radius_name = "netdigi1_billing3";', $content);

file_put_contents($cfg, $content);
echo "\nconfig.php updated!\n";

// Cleanup temp files
@unlink($sqlGz);
@unlink($dir . '/billing3_db.sql.gz');
@unlink($dir . '/do_import.sh');
@unlink($dir . '/import.log');
@unlink($dir . '/start_import.php');
@unlink($dir . '/status_db.php');
@unlink($dir . '/tables_info.php');
@unlink($dir . '/test_cpanel_env.php');
@unlink($dir . '/import_billing3_db.php');
@unlink($dir . '/run_billing3_migration.php');

echo "Temp files cleaned!\n";
echo "=== COMPLETED! ===\n";
