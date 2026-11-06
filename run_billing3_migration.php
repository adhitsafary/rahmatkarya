<?php
header('Content-Type: text/plain');
set_time_limit(600);
ini_set('memory_limit', '512M');

echo "=== STARTING BILLING3 MIGRATION ON CPANEL ===\n\n";

$dir = '/home/netdigi1/billing3.netdigitalgroup.com';
$tarFile = $dir . '/billing3_web.tar.gz';
$sqlGz = $dir . '/billing3_db.sql.gz';

// 1. Extract tar.gz
echo "[1/4] Extracting web files...\n";
if (!file_exists($tarFile)) {
    die("ERROR: $tarFile does not exist!\n");
}

$extractCmd = "tar -xzf " . escapeshellarg($tarFile) . " --strip-components=1 -C " . escapeshellarg($dir) . " 2>&1";
exec($extractCmd, $extOut, $extRet);
if ($extRet !== 0) {
    echo "Extract warning/error: " . implode("\n", $extOut) . "\n";
} else {
    echo "Web files extracted successfully!\n";
}

// 2. Import Database
echo "\n[2/4] Importing database into netdigi1_billing3...\n";
if (!file_exists($sqlGz)) {
    die("ERROR: $sqlGz does not exist!\n");
}

$dbUser = 'netdigi1_billing3';
$dbPass = 'Billing3_2026!#Strong';
$dbName = 'netdigi1_billing3';

$importCmd = "gzip -dc " . escapeshellarg($sqlGz) . " | mysql -u " . escapeshellarg($dbUser) . " -p" . escapeshellarg($dbPass) . " " . escapeshellarg($dbName) . " 2>&1";
exec($importCmd, $impOut, $impRet);
if ($impRet !== 0) {
    echo "MySQL Import warning/error: " . implode("\n", $impOut) . "\n";
} else {
    echo "Database imported successfully!\n";
}

// Check database tables count
try {
    $pdo = new PDO("mysql:host=localhost;dbname=$dbName", $dbUser, $dbPass);
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$dbName'");
    $tableCount = $stmt->fetchColumn();
    echo "Total tables in $dbName: $tableCount\n";
    
    // Check some sample tables
    $stmt2 = $pdo->query("SELECT COUNT(*) FROM tbl_customers");
    if ($stmt2) {
        echo "Total customers: " . $stmt2->fetchColumn() . "\n";
    }
} catch (Exception $e) {
    echo "PDO Check failed: " . $e->getMessage() . "\n";
}

// 3. Update config.php
echo "\n[3/4] Updating config.php...\n";
$configFile = $dir . '/config.php';
if (file_exists($configFile)) {
    $configContent = file_get_contents($configFile);
    
    // Replace APP_URL
    $configContent = preg_replace(
        '/define\("APP_URL",\s*["\'][^"\']+["\']\);/i',
        'define("APP_URL", "https://billing3.netdigitalgroup.com");',
        $configContent
    );
    
    // Replace DB credentials
    $configContent = preg_replace('/\$db_host\s*=\s*["\'][^"\']+["\'];/', '$db_host = "localhost";', $configContent);
    $configContent = preg_replace('/\$db_user\s*=\s*["\'][^"\']+["\'];/', '$db_user = "netdigi1_billing3";', $configContent);
    $configContent = preg_replace('/\$db_pass\s*=\s*["\'][^"\']+["\'];/', '$db_pass = "Billing3_2026!#Strong";', $configContent);
    $configContent = preg_replace('/\$db_name\s*=\s*["\'][^"\']+["\'];/', '$db_name = "netdigi1_billing3";', $configContent);
    
    file_put_contents($configFile, $configContent);
    echo "config.php updated successfully!\n";
} else {
    echo "Warning: config.php not found at $configFile\n";
}

// 4. Cleanup archives
echo "\n[4/4] Cleaning up archives...\n";
@unlink($tarFile);
@unlink($sqlGz);
echo "Cleanup complete!\n";

echo "\n=== BILLING3 CLONE COMPLETED SUCCESSFULLY ===\n";
