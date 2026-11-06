<?php
header('Content-Type: text/plain');

$log = '/home/netdigi1/billing3.netdigitalgroup.com/import.log';
if (file_exists($log)) {
    echo "=== LOG CONTENT ===\n";
    echo file_get_contents($log) . "\n";
} else {
    echo "No log file found yet.\n";
}

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=netdigi1_billing3", "netdigi1_billing3", "Billing3Pass2026Strong");
    $cnt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'netdigi1_billing3'")->fetchColumn();
    echo "\n=== DATABASE STATUS ===\n";
    echo "Tables in netdigi1_billing3: $cnt\n";
    
    $cust = @$pdo->query("SELECT COUNT(*) FROM tbl_customers");
    if ($cust) {
        echo "tbl_customers rows: " . $cust->fetchColumn() . "\n";
    }
    
    $trx = @$pdo->query("SELECT COUNT(*) FROM tbl_transactions");
    if ($trx) {
        echo "tbl_transactions rows: " . $trx->fetchColumn() . "\n";
    }
} catch (Exception $e) {
    echo "DB PDO Error: " . $e->getMessage() . "\n";
}
