<?php
header('Content-Type: text/plain');
$log = '/home/netdigi1/billing3.netdigitalgroup.com/test_bg.log';
@unlink($log);
exec("nohup bash -c 'echo Started at `date`; sleep 3; echo Finished at `date`' > $log 2>&1 &");
echo "Launched background process!\n";
sleep(1);
if (file_exists($log)) {
    echo "Log contents:\n" . file_get_contents($log);
} else {
    echo "Log file not created yet\n";
}
