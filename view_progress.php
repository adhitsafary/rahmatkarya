<?php
header('Content-Type: text/plain');
$log = '/home/netdigi1/billing3.netdigitalgroup.com/import_progress.txt';
if (file_exists($log)) {
    echo file_get_contents($log);
} else {
    echo "Progress file does not exist yet.\n";
}
