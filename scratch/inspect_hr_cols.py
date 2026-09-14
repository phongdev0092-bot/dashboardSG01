import sys
from pathlib import Path

backend_dir = Path(r"d:\Tool KPI\backend")
sys.path.insert(0, str(backend_dir))

from engine import KPIEngine

e = KPIEngine()
print("HR DataFrame columns:")
for idx, col in enumerate(e.hr_df.columns):
    letter = chr(65 + idx) if idx < 26 else f"Col{idx}"
    print(f"Col {letter} (Index {idx}): '{col}'")

print("\nFirst 3 rows of F (idx 5) and G (idx 6):")
if not e.hr_df.empty:
    for idx, row in e.hr_df.head(3).iterrows():
        print(f"Row {idx}: F (idx 5)='{row.iloc[5]}', G (idx 6)='{row.iloc[6]}'")
