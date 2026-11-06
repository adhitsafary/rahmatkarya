<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=procash_tracker', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $sql = file_get_contents(__DIR__ . '/database/schema.sql');
    
    // Execute SQL script
    $pdo->exec($sql);
    echo "schema.sql executed successfully!\n";
    
    // Query view
    $stmt = $pdo->query("SELECT * FROM v_project_financial_summary");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($rows) . " project summary records:\n";
    foreach ($rows as $r) {
        echo "- {$r['project_name']} (Total: Rp " . number_format($r['total_contract_value'], 0, ',', '.') . 
             " | Piutang: Rp " . number_format($r['client_receivable_remaining'], 0, ',', '.') . 
             " | Hutang Tim: Rp " . number_format($r['team_payable_remaining'], 0, ',', '.') . 
             " | Kas Bersih: Rp " . number_format($r['net_cash_in_hand'], 0, ',', '.') . 
             " | Status: {$r['visual_status_badge']})\n";
    }
} catch (Exception $e) {
    echo "DB Migration Error: " . $e->getMessage() . "\n";
}
