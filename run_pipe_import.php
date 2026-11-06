<?php
header('Content-Type: text/plain');
set_time_limit(300);

echo "=== STARTING IMPORT WITH MYSQL_PWD ===\n";

$dir = '/home/netdigi1/billing3.netdigitalgroup.com';
$sqlGz = $dir . '/clean_billing3.sql.gz';

if (!file_exists($sqlGz)) {
    die("File clean_billing3.sql.gz not found!\n");
}

echo "Size of clean_billing3.sql.gz: " . filesize($sqlGz) . " bytes\n";

$cmd = "gzip -dc /home/netdigi1/billing3.netdigitalgroup.com/clean_billing3.sql.gz | MYSQL_PWD='Billing3Pass2026Strong' mysql -h 127.0.0.1 -u netdigi1_billing3 netdigi1_billing3 2>&1";
exec($cmd, $out, $ret);

echo "Return code: $ret\n";
if (!empty($out)) {
    echo "Output:\n" . implode("\n", $out) . "\n";
}

// Check database via PDO
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=netdigi1_billing3", "netdigi1_billing3", "Billing3Pass2026Strong");
    $cnt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'netdigi1_billing3'")->fetchColumn();
    echo "\n=== TABLES IMPORTED: $cnt ===\n";
    
    $tables = ['tbl_customers', 'tbl_plans', 'tbl_routers', 'tbl_users', 'tbl_transactions', 'tbl_appconfig'];
    foreach ($tables as $t) {
        $st = @$pdo->query("SELECT COUNT(*) FROM `$t`");
        if ($st) {
            echo " - $t: " . $st->fetchColumn() . " rows\n";
        } else {
            echo " - $t: NOT FOUND\n";
        }
    }
} catch (Exception $e) {
    echo "PDO Error: " . $e->getMessage() . "\n";
}

// Update config.php
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
echo "config.php updated!\n";

// Remove temporary files
@unlink($sqlGz);
@unlink($dir . '/test_my_pwd.php');
@unlink($dir . '/fast_import.php');

echo "=== ALL FINISHED! ===\n";
