<?php
header('Content-Type: text/plain');

$script = "#!/bin/bash
echo 'Starting import at $(date)' > /home/netdigi1/billing3.netdigitalgroup.com/import.log
gzip -dc /home/netdigi1/billing3.netdigitalgroup.com/billing3_db.sql.gz | mysql -h 127.0.0.1 -u netdigi1_billing3 -pBilling3Pass2026Strong netdigi1_billing3 >> /home/netdigi1/billing3.netdigitalgroup.com/import.log 2>&1
echo 'IMPORT_FINISHED_SUCCESS' >> /home/netdigi1/billing3.netdigitalgroup.com/import.log
";

file_put_contents('/home/netdigi1/billing3.netdigitalgroup.com/do_import.sh', $script);
chmod('/home/netdigi1/billing3.netdigitalgroup.com/do_import.sh', 0755);

// Launch in background
exec("nohup /bin/bash /home/netdigi1/billing3.netdigitalgroup.com/do_import.sh > /dev/null 2>&1 &");

echo "Background import process launched successfully!\n";
