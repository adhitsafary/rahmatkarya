<?php
header('Content-Type: text/plain');
$script = '/home/netdigi1/billing3.netdigitalgroup.com/import_runner.sh';
@chmod($script, 0755);

exec("nohup bash $script > /dev/null 2>&1 &");

echo "Launched background import script!\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n";
