import sys
from pathlib import Path

backend_dir = Path(r"d:\Tool KPI\backend")
sys.path.insert(0, str(backend_dir))

from engine import KPIEngine

e = KPIEngine()
print("Testing default sync execution:")
res = e.sync_admin_users_to_sheet()
print("Sync Result:", res)
