<?php
header('Content-Type: text/plain');
$f = '/home/netdigi1/billing3.netdigitalgroup.com/clean_billing3.sql.gz';
echo "clean_billing3.sql.gz: " . (file_exists($f) ? "EXISTS (" . filesize($f) . " bytes)" : "NOT FOUND") . "\n";
