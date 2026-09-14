import sys
from pathlib import Path

backend_dir = Path(r"d:\Tool KPI\backend")
sys.path.insert(0, str(backend_dir))

from engine import KPIEngine

e = KPIEngine()
print("Testing webapp config & sync functions:")
res_get = e.get_permissions_webapp_url()
print("Get WebApp URL:", res_get)

res_save = e.set_permissions_webapp_url("https://script.google.com/macros/s/TEST_URL/exec")
print("Set WebApp URL:", res_save)

res_get2 = e.get_permissions_webapp_url()
print("Get WebApp URL after set:", res_get2)

print("Backend engine sync test completed successfully.")
