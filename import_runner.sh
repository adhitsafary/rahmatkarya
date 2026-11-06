#!/bin/bash
DIR="/home/netdigi1/billing3.netdigitalgroup.com"
SQLGZ="$DIR/clean_billing3.sql.gz"
LOG="$DIR/import_progress.txt"

echo "=== STARTING FAST IMPORT ===" > "$LOG"
echo "Date: $(date)" >> "$LOG"

if [ ! -f "$SQLGZ" ]; then
    echo "ERROR: $SQLGZ not found!" >> "$LOG"
    exit 1
fi

echo "1. Importing $(ls -lh "$SQLGZ" | awk '{print $5}')..." >> "$LOG"
gzip -dc "$SQLGZ" | MYSQL_PWD='Billing3Pass2026Strong' mysql --force -h 127.0.0.1 -u netdigi1_billing3 netdigi1_billing3 2>> "$LOG"
RET=$?
echo "Import finished with exit code: $RET" >> "$LOG"

echo "2. Verifying database..." >> "$LOG"
TABLE_COUNT=$(MYSQL_PWD='Billing3Pass2026Strong' mysql -h 127.0.0.1 -u netdigi1_billing3 netdigi1_billing3 -Nse 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema="netdigi1_billing3"')
echo "Total tables in database: $TABLE_COUNT" >> "$LOG"

MYSQL_PWD='Billing3Pass2026Strong' mysql -h 127.0.0.1 -u netdigi1_billing3 netdigi1_billing3 -e '
SELECT "tbl_customers" as tbl, count(*) as count from tbl_customers
UNION ALL SELECT "tbl_transactions", count(*) from tbl_transactions
UNION ALL SELECT "tbl_plans", count(*) from tbl_plans
UNION ALL SELECT "tbl_routers", count(*) from tbl_routers
UNION ALL SELECT "tbl_users", count(*) from tbl_users
UNION ALL SELECT "tbl_appconfig", count(*) from tbl_appconfig
UNION ALL SELECT "radcheck", count(*) from radcheck;
' >> "$LOG" 2>&1

echo "3. Updating config.php..." >> "$LOG"
sed -i 's/define("APP_URL",\s*".*");/define("APP_URL", "https:\/\/billing3.netdigitalgroup.com");/g' "$DIR/config.php"
sed -i 's/\$db_host\s*=\s*".*";/$db_host = "127.0.0.1";/g' "$DIR/config.php"
sed -i 's/\$db_user\s*=\s*".*";/$db_user = "netdigi1_billing3";/g' "$DIR/config.php"
sed -i 's/\$db_pass\s*=\s*".*";/$db_pass = "Billing3Pass2026Strong";/g' "$DIR/config.php"
sed -i 's/\$db_name\s*=\s*".*";/$db_name = "netdigi1_billing3";/g' "$DIR/config.php"
sed -i 's/\$radius_host\s*=\s*".*";/$radius_host = "127.0.0.1";/g' "$DIR/config.php"
sed -i 's/\$radius_user\s*=\s*".*";/$radius_user = "netdigi1_billing3";/g' "$DIR/config.php"
sed -i 's/\$radius_pass\s*=\s*".*";/$radius_pass = "Billing3Pass2026Strong";/g' "$DIR/config.php"
sed -i 's/\$radius_name\s*=\s*".*";/$radius_name = "netdigi1_billing3";/g' "$DIR/config.php"
echo "config.php updated successfully." >> "$LOG"

rm -f "$SQLGZ"
echo "=== ALL FINISHED SUCCESSFULLY at $(date) ===" >> "$LOG"
