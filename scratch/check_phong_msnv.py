import sys
from pathlib import Path

backend_dir = Path(r"d:\Tool KPI\backend")
sys.path.insert(0, str(backend_dir))

from engine import KPIEngine

e = KPIEngine()
print("Searching for phongnh5 in self.hr_df:")
for idx, r in e.hr_df.iterrows():
    mail = str(r.get('Email', '')).strip().lower()
    acc = str(r.get('Inside Account', '')).strip().lower()
    name = str(r.get('Họ Tên NV', '')).strip()
    code = str(r.get('Mã NV', '')).strip()
    if 'phongnh5' in mail or 'phongnh5' in acc or 'hồng phong' in name.lower():
        print(f"FOUND: Mã NV='{code}', Họ Tên='{name}', Inside Acc='{acc}', Email='{mail}'")
