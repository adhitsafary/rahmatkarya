import subprocess
import os

no_data = [
    'tbl_deleted_onus', 'radpostauth', 'tbl_logs', 'tbl_user_location_logs',
    'tbl_transactions_bak_20261031_000946', 'tbl_user_recharges_bak_20261029_000202',
    'tbl_user_recharges_bak_20261031_000947', 'tbl_user_recharges_bak_fix_20261031_045728',
    'tbl_page_visit_logs'
]

sql_file = '/tmp/billing3_fast.sql'
if os.path.exists(sql_file):
    os.remove(sql_file)
if os.path.exists(sql_file + '.gz'):
    os.remove(sql_file + '.gz')

print('1. Dumping schema for large log/backup tables...')
cmd1 = ['mysqldump', 'phpnuxbill', '--no-data'] + no_data
with open(sql_file, 'wb') as f:
    subprocess.check_call(cmd1, stdout=f)

print('2. Dumping full data for all other tables...')
ignore_args = ['--ignore-table=phpnuxbill.' + t for t in no_data]
cmd2 = ['mysqldump', 'phpnuxbill'] + ignore_args
with open(sql_file, 'ab') as f:
    subprocess.check_call(cmd2, stdout=f)

print('3. Compressing with gzip...')
subprocess.check_call(['gzip', '-9', sql_file])
size = os.path.getsize(sql_file + '.gz')
print(f'Done! Dump size: {size / (1024*1024):.2f} MB')

print('4. Uploading directly from VPS to cPanel FTP...')
ftp_cmd = [
    'curl', '-s', '-T', sql_file + '.gz',
    '--user', 'netdigi1:9V2)2#aboc8ZOX',
    'ftp://103.30.147.68/billing3.netdigitalgroup.com/clean_billing3.sql.gz'
]
subprocess.check_call(ftp_cmd)
print('Successfully uploaded clean_billing3.sql.gz to cPanel!')
