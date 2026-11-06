import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

auth = ('netdigi1', '9V2)2#aboc8ZOX')
base = 'https://103.30.147.68:2083/execute/Mysql'

print('1. Killing threads on database...')
try:
    r = requests.get('http://billing3.netdigitalgroup.com/kill_old_processes.php', timeout=5)
    print(r.text.strip())
except Exception as e:
    print('Kill script error:', e)

print('2. Deleting database netdigi1_billing3...')
r = requests.get(f'{base}/delete_database', params={'name': 'netdigi1_billing3'}, auth=auth, verify=False)
print('Delete response:', r.json().get('status'), r.json().get('errors'))

print('3. Creating fresh database netdigi1_billing3...')
r = requests.get(f'{base}/create_database', params={'name': 'netdigi1_billing3'}, auth=auth, verify=False)
print('Create response:', r.json().get('status'), r.json().get('errors'))

print('4. Setting privileges on database for netdigi1_billing3...')
r = requests.get(f'{base}/set_privileges_on_database', params={
    'user': 'netdigi1_billing3',
    'database': 'netdigi1_billing3',
    'privileges': 'ALL PRIVILEGES'
}, auth=auth, verify=False)
print('Privileges response:', r.json().get('status'), r.json().get('errors'))
