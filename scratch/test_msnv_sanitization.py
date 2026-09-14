import sys
from pathlib import Path

backend_dir = Path(r"d:\Tool KPI\backend")
sys.path.insert(0, str(backend_dir))

from engine import KPIEngine

e = KPIEngine()
users = e.get_admin_users()
print("Get Admin Users Output:")
for u in users:
    print(f"ID={u.get('id')}, MSNV='{u.get('msnv')}', Name='{u.get('name')}', Mail='{u.get('mail')}', User='{u.get('user')}'")
