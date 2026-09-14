import requests
import io
import pandas as pd

url = "https://docs.google.com/spreadsheets/d/10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY/export?format=csv&gid=0"
resp = requests.get(url, timeout=10)

if resp.status_code == 200:
    df = pd.read_csv(io.BytesIO(resp.content), dtype=str)
    print("Google Sheet Admin GID 0 columns:")
    for idx, col in enumerate(df.columns):
        letter = chr(65 + idx) if idx < 26 else f"Col{idx}"
        print(f"Col {letter} (Index {idx}): '{col}'")
    print("\nFirst 3 rows:")
    print(df.head(3).to_string())
else:
    print("Failed to fetch admin sheet:", resp.status_code)
