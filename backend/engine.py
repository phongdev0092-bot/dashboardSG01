import pandas as pd
import numpy as np
import requests
import io
import os
import sys
import time
import datetime
import json
from pathlib import Path
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


SHEET_ID = '17QLc9SlfpPPrR-d1R2BkBxA7DmCI5ZCuhmQffP5F6pY'
GIDS = {
    'HR': '32204814',
    'TK': '0',
    'BT': '1109348771'
}

CACHE_DIR = Path(__file__).parent / "data_cache"

class KPIEngine:
    def __init__(self):
        self.hr_df = pd.DataFrame()
        self.tk_df = pd.DataFrame()
        self.bt_df = pd.DataFrame()
        self.ton_tk_df = pd.DataFrame()
        self.ton_bt_df = pd.DataFrame()
        self.lt_df = pd.DataFrame()
        self.cll30n_df = pd.DataFrame()
        self.kh_cls_df = pd.DataFrame()
        self.emp_map = {}
        self.team_leads = []
        self.regions = []
        self.partners = []
        self.blocks = []
        self.last_sync_time = None
        self.is_syncing = False
        self.sync_error = None
        self.lt_history = []
        self.lt_snapshot_map = {}
        self.admin_users_df = pd.DataFrame()
        self.DEFAULT_PERMISSIONS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxoVMX_hW1hTH82gyyRgKACTAo4TpPf_cmAK7gRZJxP5v2ZX-VmSS4u4J-YIoBWlFKJ/exec"
        self.PERMISSIONS_WEBAPP_URL = os.environ.get("PERMISSIONS_WEBAPP_URL", "") or self.DEFAULT_PERMISSIONS_WEBAPP_URL
        self.LT_SHEET_ID = os.environ.get("LT_SHEET_ID", "1qd8O1bqbtHmbPUO_HhZv07YS9c27bo1QMWh4yvmQr2U").strip()
        self.LT_GID = os.environ.get("LT_GID", "0").strip()
        self.TON_TK_SHEET_ID = os.environ.get("TON_TK_SHEET_ID", "1Hihsf3_R3Z9aaqqj9vskIyveNX4UO2Ej3d26jF5-S2w").strip()
        self.TON_TK_GID = os.environ.get("TON_TK_GID", "0").strip()
        self.TON_BT_SHEET_ID = os.environ.get("TON_BT_SHEET_ID", "1Hihsf3_R3Z9aaqqj9vskIyveNX4UO2Ej3d26jF5-S2w").strip()
        self.TON_BT_GID = os.environ.get("TON_BT_GID", "440862556").strip()
        try:
            CACHE_DIR.mkdir(exist_ok=True, parents=True)
            cfg_file = CACHE_DIR / "webapp_config.json"
            if cfg_file.exists():
                with open(cfg_file, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
                    if cfg.get('PERMISSIONS_WEBAPP_URL'):
                        self.PERMISSIONS_WEBAPP_URL = cfg['PERMISSIONS_WEBAPP_URL']
                    if cfg.get('LT_SHEET_ID'):
                        self.LT_SHEET_ID = cfg['LT_SHEET_ID']
                    if cfg.get('LT_GID'):
                        self.LT_GID = str(cfg['LT_GID'])
        except Exception:
            pass
        self._load_lt_history_and_snapshot()
        self.load_cache_or_fetch()

    def _find_col(self, df, candidate_names, default_idx=None):
        if df is None or df.empty:
            return None
        cols = list(df.columns)
        cols_clean = [str(c).strip().lower() for c in cols]
        # Pass 1: Exact match
        for name in candidate_names:
            name_lower = name.strip().lower()
            for idx, col_c in enumerate(cols_clean):
                if name_lower == col_c:
                    return cols[idx]
        # Pass 2: Substring match
        for name in candidate_names:
            name_lower = name.strip().lower()
            for idx, col_c in enumerate(cols_clean):
                if name_lower in col_c:
                    return cols[idx]
        if default_idx is not None and 0 <= default_idx < len(cols):
            return cols[default_idx]
        return candidate_names[0] if candidate_names else None

    def _get_required_col(self, df, candidate_names):
        if df is None or df.empty:
            return None
        cols = list(df.columns)
        cols_clean = [str(c).strip().lower() for c in cols]
        # Pass 1: Exact match
        for name in candidate_names:
            name_lower = name.strip().lower()
            for idx, col_c in enumerate(cols_clean):
                if name_lower == col_c:
                    return cols[idx]
        # Pass 2: Substring match
        for name in candidate_names:
            name_lower = name.strip().lower()
            for idx, col_c in enumerate(cols_clean):
                if name_lower in col_c:
                    return cols[idx]
        return None

    def _read_any_dataframe(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        import re
        filename_lower = str(filename or '').lower()
        df = None

        def _parse_html_table_bytes(b_data):
            try:
                text = b_data.decode('utf-8', errors='ignore')
                table_match = re.search(r'<table[^>]*>(.*?)</table>', text, re.DOTALL | re.IGNORECASE)
                if not table_match:
                    return None
                rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table_match.group(1), re.DOTALL | re.IGNORECASE)
                parsed_rows = []
                for r in rows:
                    cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.DOTALL | re.IGNORECASE)
                    clean_cells = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
                    if any(clean_cells):
                        parsed_rows.append(clean_cells)
                if len(parsed_rows) > 1:
                    return pd.DataFrame(parsed_rows[1:], columns=parsed_rows[0])
                elif len(parsed_rows) == 1:
                    return pd.DataFrame(parsed_rows)
            except Exception:
                pass
            return None

        # 1. Try Excel read (openpyxl / xlrd)
        if filename_lower.endswith(('.xlsx', '.xls', '.xlsm', '.xlsb', '.html', '.htm')):
            try:
                df = pd.read_excel(io.BytesIO(file_bytes), dtype=str)
            except Exception:
                df = _parse_html_table_bytes(file_bytes)

        # 2. Try CSV read with various separators and encodings
        if df is None:
            separators = [',', ';', '\t', '|']
            encodings = ['utf-8', 'utf-8-sig', 'cp1252', 'utf-16', 'utf-16le', 'latin1']
            for enc in encodings:
                for sep in separators:
                    try:
                        candidate = pd.read_csv(
                            io.BytesIO(file_bytes),
                            sep=sep,
                            encoding=enc,
                            dtype=str,
                            low_memory=False,
                            on_bad_lines='skip'
                        )
                        if candidate is not None and len(candidate.columns) >= 2:
                            df = candidate
                            break
                    except Exception:
                        continue
                if df is not None and len(df.columns) >= 2:
                    break

        # 3. Fallback attempts
        if df is None:
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, low_memory=False, on_bad_lines='skip')
            except Exception:
                try:
                    df = pd.read_excel(io.BytesIO(file_bytes), dtype=str)
                except Exception:
                    df = _parse_html_table_bytes(file_bytes)

        if df is None or df.empty:
            return pd.DataFrame()

        # Clean column headers
        df.columns = [str(c).strip() for c in df.columns]

        # 4. Header Row Auto Detection:
        keywords = ['số hđ', 'số hợp đồng', 'nhân viên', 'nhân sự', 'inside account', 'mã nv', 'tg hoàn tất', 'ngày hoàn tất', 'tght', 'khách hàng', 'block']
        cols_clean = [str(c).strip().lower() for c in df.columns]
        has_keyword = any(any(kw in c for kw in keywords) for c in cols_clean)
        
        if not has_keyword and len(df) > 1:
            for idx in range(min(10, len(df))):
                row_vals = [str(v).strip().lower() for v in df.iloc[idx].values]
                if any(any(kw in v for kw in keywords) for v in row_vals):
                    new_cols = [str(v).strip() for v in df.iloc[idx].values]
                    df = df.iloc[idx + 1:].reset_index(drop=True)
                    df.columns = new_cols
                    break

        df.columns = [str(c).strip() for c in df.columns]
        return df

    def _save_pickle(self, df_or_obj, filename: str):
        comp = 'gzip' if filename.endswith('.gz') else None
        try:
            CACHE_DIR.mkdir(exist_ok=True, parents=True)
            target = CACHE_DIR / filename
            tmp_target = CACHE_DIR / f"{filename}.tmp"
            if hasattr(df_or_obj, 'to_pickle'):
                df_or_obj.to_pickle(tmp_target, compression=comp)
            else:
                pd.to_pickle(df_or_obj, tmp_target, compression=comp)
            if tmp_target.exists():
                try:
                    if target.exists():
                        try: target.unlink()
                        except Exception: pass
                    tmp_target.replace(target)
                except Exception:
                    try:
                        import shutil
                        shutil.copyfile(str(tmp_target), str(target))
                        if tmp_target.exists():
                            try: tmp_target.unlink()
                            except Exception: pass
                    except Exception:
                        pass
                if filename.endswith('.pkl.gz'):
                    uncomp = CACHE_DIR / filename[:-3]
                    if uncomp.exists():
                        try: uncomp.unlink()
                        except Exception: pass
            return
        except Exception as e:
            print(f"Warning in _save_pickle: {e}", flush=True)

        try:
            tmp_dir = Path("/tmp/data_cache")
            tmp_dir.mkdir(exist_ok=True, parents=True)
            target = tmp_dir / filename
            if hasattr(df_or_obj, 'to_pickle'):
                df_or_obj.to_pickle(target, compression=comp)
            else:
                pd.to_pickle(df_or_obj, target, compression=comp)
        except Exception:
            pass

    def _load_pickle_file(self, filepath: Path):
        if not filepath or not filepath.exists():
            return None
        for comp in ['infer', None, 'gzip']:
            try:
                df = pd.read_pickle(filepath, compression=comp)
                if df is not None:
                    return df
            except Exception:
                continue
        return None

    def _process_cll30n_df(self, df_raw: pd.DataFrame) -> pd.DataFrame:
        if df_raw is None or df_raw.empty:
            return pd.DataFrame()
        
        col_hd = self._get_required_col(df_raw, [
            'Số HĐ', 'Số hợp đồng', 'so_hd', 'so_hop_dong', 'mã hđ', 'hđ', 'hd', 'contract', 'mã hợp đồng', 'so hd'
        ]) or (df_raw.columns[0] if len(df_raw.columns) > 0 else 'Số HĐ')
        
        col_kh = self._get_required_col(df_raw, [
            'Khách Hàng', 'Tên KH', 'Tên khách hàng', 'khach_hang', 'ten_kh', 'customer'
        ]) or (df_raw.columns[1] if len(df_raw.columns) > 1 else 'Khách Hàng')
        
        col_nv = self._get_required_col(df_raw, [
            'Nhân viên', 'Nhân sự', 'nhan_vien', 'inside account', 'mã nv', 'inside', 'ktv', 'user', 'account', 'nhanvien', 'tài khoản', 'acc', 'ktv xử lý'
        ]) or (df_raw.columns[3] if len(df_raw.columns) > 3 else 'Nhân viên')
        
        col_g = self._get_required_col(df_raw, [
            'Tg hoàn tất', 'Thời gian hoàn tất', 'Ngày hoàn tất', 'tg hoàn tất', 'tght', 'ngày ht', 'ngay_hoan_tat', 'thời gian nghiệm thu', 'tg nghiệm thu', 'date_complete', 'tg_hoan_tat', 'ngày ht ptc', 'tg ht', 'hoàn tất', 'tg tạo'
        ]) or (df_raw.columns[6] if len(df_raw.columns) > 6 else 'Tg hoàn tất')
        
        col_lap = self._find_col(df_raw, ['Số lần lặp', 'Số lần Lặp', 'so_lan_lap', 'số lần lặp', 'lap', 'lặp'], default_idx=24 if len(df_raw.columns) > 24 else None)
        col_ab = self._find_col(df_raw, ['Tg tạo CLPS', 'Thời gian tạo CLPS', 'tg_tao_clps', 'tg tạo clps'], default_idx=27 if len(df_raw.columns) > 27 else None)
        col_ac = self._find_col(df_raw, ['Tg hoàn tất CLPS', 'Thời gian hoàn tất CLPS', 'tg_hoan_tat_clps', 'tg hoàn tất clps'], default_idx=28 if len(df_raw.columns) > 28 else None)
        col_af = self._find_col(df_raw, ['(Cấp 1)Tình trạng đầu vào', 'Tình trạng đầu vào', 'tinh_trang_dau_vao'], default_idx=31 if len(df_raw.columns) > 31 else None)
        col_ai = self._find_col(df_raw, ['(Cấp 1)Hướng xử lý', 'Hướng xử lý', 'huong_xu_ly'], default_idx=34 if len(df_raw.columns) > 34 else None)

        df = pd.DataFrame()
        df['Số HĐ'] = df_raw[col_hd].astype(str).str.strip().str.upper()
        df['Khách Hàng'] = df_raw[col_kh].astype(str).str.strip() if col_kh and col_kh in df_raw.columns else ''
        df['Nhân viên'] = df_raw[col_nv].astype(str).str.strip().str.upper()
        df['Tg hoàn tất'] = df_raw[col_g].astype(str).str.strip() if col_g and col_g in df_raw.columns else ''
        df['Tg tạo CLPS'] = df_raw[col_ab].astype(str).str.strip() if col_ab and col_ab in df_raw.columns else ''
        df['Tg hoàn tất CLPS'] = df_raw[col_ac].astype(str).str.strip() if col_ac and col_ac in df_raw.columns else ''
        df['tinh_trang_dau_vao'] = df_raw[col_af].fillna('-').astype(str).str.strip() if col_af and col_af in df_raw.columns else '-'
        df['huong_xu_ly'] = df_raw[col_ai].fillna('-').astype(str).str.strip() if col_ai and col_ai in df_raw.columns else '-'
        df['so_lan_lap'] = pd.to_numeric(df_raw[col_lap], errors='coerce').fillna(1).astype(int) if col_lap and col_lap in df_raw.columns else 1

        dt_g = pd.to_datetime(df['Tg hoàn tất'], dayfirst=True, errors='coerce')
        dt_ab = pd.to_datetime(df['Tg tạo CLPS'], dayfirst=True, errors='coerce')
        dt_ac = pd.to_datetime(df['Tg hoàn tất CLPS'], dayfirst=True, errors='coerce')

        df['dt_created'] = dt_ab.fillna(dt_g)
        df['dt_complete'] = dt_ac.fillna(dt_g)
        df['date_complete'] = df['dt_complete'].dt.date

        df = df[df['date_complete'].notna()].copy()

        # CLPS 7N BT: Trong data CLL30N nếu cột AC (Tg hoàn tất CLPS) - cột G (Tg hoàn tất) <= 7 ngày
        dt_clps_target = dt_ac.fillna(dt_ab)
        gap_days_ac_g = (dt_clps_target - dt_g).dt.total_seconds() / 86400.0
        df['is_clps_7n_bt'] = (dt_clps_target.notna()) & (dt_g.notna()) & (gap_days_ac_g >= 0) & (gap_days_ac_g <= 7.0)

        # CLL30N (Tử số): repeat ticket within <= 30 days OR flagged with so_lan_lap >= 2
        sort_dt = dt_ab.fillna(dt_g)
        df['sort_dt'] = sort_dt
        df = df.sort_values(['Số HĐ', 'sort_dt'])
        prev_complete = df.groupby('Số HĐ')['dt_complete'].shift(1)
        gap_days_30 = (df['sort_dt'] - prev_complete).dt.total_seconds() / 86400.0
        df['is_cll30n'] = (prev_complete.notna()) & (gap_days_30 >= 0) & (gap_days_30 <= 30.0) | (df['so_lan_lap'] >= 2)

        return df[['Số HĐ', 'Khách Hàng', 'Nhân viên', 'Tg hoàn tất', 'Tg tạo CLPS', 'Tg hoàn tất CLPS', 'tinh_trang_dau_vao', 'huong_xu_ly', 'date_complete', 'dt_complete', 'dt_created', 'is_clps_7n_bt', 'is_cll30n', 'so_lan_lap']]

    def _get_sheet_url(self, gid: str) -> str:
        return f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}'

    def _get_lt_sheet_url(self) -> str:
        return f'https://docs.google.com/spreadsheets/d/{self.LT_SHEET_ID}/export?format=csv&gid={self.LT_GID}'

    def _get_ton_tk_sheet_url(self) -> str:
        return f'https://docs.google.com/spreadsheets/d/{self.TON_TK_SHEET_ID}/export?format=csv&gid={self.TON_TK_GID}'

    def _get_ton_bt_sheet_url(self) -> str:
        return f'https://docs.google.com/spreadsheets/d/{self.TON_BT_SHEET_ID}/export?format=csv&gid={self.TON_BT_GID}'

    def load_cache_or_fetch(self):
        def _get_df(name):
            tmp_dir = Path("/tmp/data_cache")
            candidates = [
                CACHE_DIR / f"{name}.pkl.gz",
                CACHE_DIR / f"{name}.pkl",
                tmp_dir / f"{name}.pkl.gz",
                tmp_dir / f"{name}.pkl"
            ]
            for p in candidates:
                df = self._load_pickle_file(p)
                if df is not None and not (isinstance(df, pd.DataFrame) and df.empty):
                    return p, df
            return None, pd.DataFrame()

        hr_path, hr_df = _get_df("hr")
        tk_path, tk_df = _get_df("tk")
        bt_path, bt_df = _get_df("bt")
        lt_path, lt_df = _get_df("lt")
        ton_tk_path, ton_tk_df = _get_df("ton_tk")
        ton_bt_path, ton_bt_df = _get_df("ton_bt")
        cll30n_path, cll30n_df = _get_df("cll30n")
        kh_cls_path, kh_cls_df = _get_df("kh_cls")

        if not hr_df.empty and not tk_df.empty and not bt_df.empty:
            try:
                print("Loading data from local cache...", flush=True)
                self.hr_df = hr_df
                self.tk_df = tk_df
                self.bt_df = bt_df
                self.lt_df = lt_df
                self.ton_tk_df = ton_tk_df
                self.ton_bt_df = ton_bt_df
                self.kh_cls_df = kh_cls_df
                self.cll30n_df = cll30n_df

                mtime = hr_path.stat().st_mtime if hr_path else time.time()
                self.last_sync_time = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                self._process_metadata()
                print(f"Cache loaded successfully! Sync time: {self.last_sync_time}", flush=True)
                return
            except Exception as e:
                print(f"Cache load failed: {e}. Fetching live data...", flush=True)

        self.sync_live_data()

    def sync_live_data(self):
        if self.is_syncing:
            return False, "Sync already in progress"
        
        self.is_syncing = True
        self.sync_error = None
        t0 = time.time()
        
        try:
            def _get_df_local(name):
                tmp_dir = Path("/tmp/data_cache")
                candidates = [
                    CACHE_DIR / f"{name}.pkl.gz",
                    CACHE_DIR / f"{name}.pkl",
                    tmp_dir / f"{name}.pkl.gz",
                    tmp_dir / f"{name}.pkl"
                ]
                for p in candidates:
                    df = self._load_pickle_file(p)
                    if df is not None and not (isinstance(df, pd.DataFrame) and df.empty):
                        return df
                return pd.DataFrame()

            # Load datasets strictly from App Data Base (in-memory or local cache)
            df_hr = self.hr_df if hasattr(self, 'hr_df') and not self.hr_df.empty else _get_df_local("hr")
            df_tk = self.tk_df if hasattr(self, 'tk_df') and not self.tk_df.empty else _get_df_local("tk")
            df_bt = self.bt_df if hasattr(self, 'bt_df') and not self.bt_df.empty else _get_df_local("bt")
            df_ton_tk = self.ton_tk_df if hasattr(self, 'ton_tk_df') and not self.ton_tk_df.empty else _get_df_local("ton_tk")
            df_ton_bt = self.ton_bt_df if hasattr(self, 'ton_bt_df') and not self.ton_bt_df.empty else _get_df_local("ton_bt")
            df_lt = self.lt_df if hasattr(self, 'lt_df') and not self.lt_df.empty else _get_df_local("lt")
            df_cll30n = self.cll30n_df if hasattr(self, 'cll30n_df') and not self.cll30n_df.empty else _get_df_local("cll30n")
            df_kh_cls = self.kh_cls_df if hasattr(self, 'kh_cls_df') and not self.kh_cls_df.empty else _get_df_local("kh_cls")
            # Fallback to online Google Sheets ONLY if App DB for core datasets is completely empty (e.g., initial Vercel deploy)
            if df_hr.empty:
                try:
                    print("App DB HR is empty. Fetching live HR data from Sheet...", flush=True)
                    res_hr = requests.get(self._get_sheet_url(GIDS['HR']), timeout=20)
                    if res_hr.status_code == 200 and not res_hr.text.strip().startswith('<!DOCTYPE'):
                        df_hr = pd.read_csv(io.BytesIO(res_hr.content), encoding='utf-8', dtype=str)
                except Exception as e_hr:
                    print(f"Warning: HR sheet fetch failed: {e_hr}", flush=True)

            if df_tk.empty:
                try:
                    print("App DB TK is empty. Fetching live TK data from Sheet...", flush=True)
                    res_tk = requests.get(self._get_sheet_url(GIDS['TK']), timeout=30)
                    if res_tk.status_code == 200 and not res_tk.text.strip().startswith('<!DOCTYPE'):
                        df_tk = pd.read_csv(io.BytesIO(res_tk.content), encoding='utf-8', low_memory=False)
                except Exception as e_tk:
                    print(f"Warning: TK sheet fetch failed: {e_tk}", flush=True)

            if df_bt.empty:
                try:
                    print("App DB BT is empty. Fetching live BT data from Sheet...", flush=True)
                    res_bt = requests.get(self._get_sheet_url(GIDS['BT']), timeout=30)
                    if res_bt.status_code == 200 and not res_bt.text.strip().startswith('<!DOCTYPE'):
                        df_bt = pd.read_csv(io.BytesIO(res_bt.content), encoding='utf-8', low_memory=False)
                except Exception as e_bt:
                    print(f"Warning: BT sheet fetch failed: {e_bt}", flush=True)

            # Fetch live Lịch Trực, Tồn TK, Tồn BT from designated Google Sheets
            try:
                print("Fetching live Lịch Trực data from Sheet...", flush=True)
                res_lt = requests.get(self._get_lt_sheet_url(), timeout=30)
                if res_lt.status_code == 200 and not res_lt.text.strip().startswith('<!DOCTYPE'):
                    df_lt_fetched = self._read_any_dataframe(res_lt.content, "lt.csv")
                    if not df_lt_fetched.empty:
                        df_lt = df_lt_fetched
                        self._save_pickle(df_lt, "lt.pkl.gz")
            except Exception as e_lt:
                print(f"Warning: Lịch Trực sheet fetch failed: {e_lt}", flush=True)

            try:
                print("Fetching live Tồn TK data from Sheet...", flush=True)
                res_ton_tk = requests.get(self._get_ton_tk_sheet_url(), timeout=30)
                if res_ton_tk.status_code == 200 and not res_ton_tk.text.strip().startswith('<!DOCTYPE'):
                    df_ton_tk_fetched = self._read_any_dataframe(res_ton_tk.content, "ton_tk.csv")
                    if not df_ton_tk_fetched.empty:
                        df_ton_tk = df_ton_tk_fetched
                        self._save_pickle(df_ton_tk, "ton_tk.pkl.gz")
            except Exception as e_ton_tk:
                print(f"Warning: Tồn TK sheet fetch failed: {e_ton_tk}", flush=True)

            try:
                print("Fetching live Tồn BT data from Sheet...", flush=True)
                res_ton_bt = requests.get(self._get_ton_bt_sheet_url(), timeout=30)
                if res_ton_bt.status_code == 200 and not res_ton_bt.text.strip().startswith('<!DOCTYPE'):
                    df_ton_bt_fetched = self._read_any_dataframe(res_ton_bt.content, "ton_bt.csv")
                    if not df_ton_bt_fetched.empty:
                        df_ton_bt = df_ton_bt_fetched
                        self._save_pickle(df_ton_bt, "ton_bt.pkl.gz")
            except Exception as e_ton_bt:
                print(f"Warning: Tồn BT sheet fetch failed: {e_ton_bt}", flush=True)

            # Process HR
            if not df_hr.empty:
                if 'Inside Account' in df_hr.columns: df_hr['Inside Account'] = df_hr['Inside Account'].astype(str).str.strip().str.upper()
                if 'Họ Tên NV' in df_hr.columns: df_hr['Họ Tên NV'] = df_hr['Họ Tên NV'].astype(str).str.strip()
                if 'Họ tên Đội trưởng' in df_hr.columns: df_hr['Họ tên Đội trưởng'] = df_hr['Họ tên Đội trưởng'].astype(str).str.strip()
                if 'Vùng' in df_hr.columns: df_hr['Vùng'] = df_hr['Vùng'].astype(str).str.strip()
                if 'Đối tác' in df_hr.columns: df_hr['Đối tác'] = df_hr['Đối tác'].astype(str).str.strip()
                if 'Block' in df_hr.columns: df_hr['Block'] = df_hr['Block'].astype(str).str.strip()

            # Process TK
            if not df_tk.empty:
                if 'Nhân viên' in df_tk.columns: df_tk['Nhân viên'] = df_tk['Nhân viên'].astype(str).str.strip().str.upper()
                if 'Số hợp đồng' in df_tk.columns: df_tk['Số hợp đồng'] = df_tk['Số hợp đồng'].astype(str).str.strip()
                if 'Gói dịch vụ' in df_tk.columns: df_tk['Gói dịch vụ'] = df_tk['Gói dịch vụ'].astype(str).str.strip()
                if 'Loại giao dịch' in df_tk.columns: df_tk['Loại giao dịch'] = df_tk['Loại giao dịch'].astype(str).str.strip()
                
                if 'Số hợp đồng' in df_tk.columns and 'Gói dịch vụ' in df_tk.columns:
                    df_tk['is_gsafe'] = (df_tk['Số hợp đồng'].str.startswith('SGG', na=False)) & (df_tk['Gói dịch vụ'].str.lower() == 'offnet')
                if 'Loại giao dịch' in df_tk.columns:
                    df_tk['is_swap'] = df_tk['Loại giao dịch'].str.contains('Swap', case=False, na=False)
                if 'Đúng hẹn' in df_tk.columns:
                    df_tk['dung_hen'] = pd.to_numeric(df_tk['Đúng hẹn'], errors='coerce').fillna(0).astype(int)
                
                if 'Ngày hoàn tất PTC' in df_tk.columns:
                    df_tk['dt_complete'] = pd.to_datetime(df_tk['Ngày hoàn tất PTC'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
                if 'TG tạo PTC' in df_tk.columns:
                    df_tk['dt_created'] = pd.to_datetime(df_tk['TG tạo PTC'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
                if 'dt_complete' in df_tk.columns:
                    df_tk['date_complete'] = df_tk['dt_complete'].dt.date
                
                if 'dt_complete' in df_tk.columns and 'dt_created' in df_tk.columns:
                    rt_sec = (df_tk['dt_complete'] - df_tk['dt_created']).dt.total_seconds()
                    df_tk['rt_hours'] = np.where(rt_sec >= 0, rt_sec / 3600.0, np.nan)

            # Process BT
            if not df_bt.empty:
                if 'Nhân viên' in df_bt.columns: df_bt['Nhân viên'] = df_bt['Nhân viên'].astype(str).str.strip().str.upper()
                if 'Số HĐ' in df_bt.columns: df_bt['Số HĐ'] = df_bt['Số HĐ'].astype(str).str.strip()
                if 'Đúng hẹn' in df_bt.columns: df_bt['dung_hen'] = pd.to_numeric(df_bt['Đúng hẹn'], errors='coerce').fillna(0).astype(int)
                
                if 'TG Hoàn Tất' in df_bt.columns:
                    df_bt['dt_complete'] = pd.to_datetime(df_bt['TG Hoàn Tất'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
                if 'TG Tạo' in df_bt.columns:
                    df_bt['dt_created'] = pd.to_datetime(df_bt['TG Tạo'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
                if 'dt_complete' in df_bt.columns:
                    df_bt['date_complete'] = df_bt['dt_complete'].dt.date
                
                if 'dt_complete' in df_bt.columns and 'dt_created' in df_bt.columns:
                    rt_sec_bt = (df_bt['dt_complete'] - df_bt['dt_created']).dt.total_seconds()
                    df_bt['rt_hours'] = np.where(rt_sec_bt >= 0, rt_sec_bt / 3600.0, np.nan)

            # Save to Cache
            self._save_pickle(df_cll30n, "cll30n.pkl.gz")
            self._save_pickle(df_kh_cls, "kh_cls.pkl.gz")

            # Save to Cache
            self._save_pickle(df_hr, "hr.pkl.gz")
            self._save_pickle(df_tk, "tk.pkl.gz")
            self._save_pickle(df_bt, "bt.pkl.gz")

            self.hr_df = df_hr
            self.tk_df = df_tk
            self.bt_df = df_bt
            self.ton_tk_df = df_ton_tk
            self.ton_bt_df = df_ton_bt
            self.lt_df = df_lt
            self.cll30n_df = df_cll30n
            self.kh_cls_df = df_kh_cls
            self.last_sync_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            self._process_metadata()
            elapsed = time.time() - t0
            print(f"Synced live data in {elapsed:.2f}s!", flush=True)
            self.is_syncing = False
            return True, f"Synced in {elapsed:.2f}s"

        except Exception as e:
            self.sync_error = str(e)
            self.is_syncing = False
            print(f"Sync error: {e}", flush=True)
            return False, str(e)

    def _process_metadata(self):
        # Build employee metadata map
        self.emp_map = {}
        for _, row in self.hr_df.iterrows():
            acc = row.get('Inside Account', '')
            if acc and acc != 'NAN':
                self.emp_map[acc] = {
                    'account': acc,
                    'name': row.get('Họ Tên NV', acc),
                    'code': row.get('Mã NV', ''),
                    'team_lead': row.get('Họ tên Đội trưởng', ''),
                    'region': row.get('Vùng', ''),
                    'partner': row.get('Đối tác', ''),
                    'block': row.get('Block', ''),
                    'position': row.get('Chức danh', ''),
                    'status': row.get('Tình trạng Hợp đồng', '')
                }

        # Dynamic dropdown options
        self.team_leads = sorted([x for x in self.hr_df['Họ tên Đội trưởng'].dropna().unique() if str(x).strip() and str(x) != 'nan'])
        self.regions = sorted([x for x in self.hr_df['Vùng'].dropna().unique() if str(x).strip() and str(x) != 'nan'])
        self.partners = sorted([x for x in self.hr_df['Đối tác'].dropna().unique() if str(x).strip() and str(x) != 'nan'])
        self.blocks = sorted([x for x in self.hr_df['Block'].dropna().unique() if str(x).strip() and str(x) != 'nan'])

    def format_rt(self, val_hours):
        if pd.isna(val_hours) or val_hours is None or val_hours < 0:
            return "-"
        return f"{val_hours:.2f}H"

    def get_kpi_report(self, start_date=None, end_date=None, team_lead=None, region=None, partner=None, block=None, search=None):
        t0 = time.time()
        
        # 1. Date Filtering
        tk = self.tk_df.copy()
        bt = self.bt_df.copy()

        if start_date:
            s_d = pd.to_datetime(start_date).date()
            tk = tk[tk['date_complete'] >= s_d]
            bt = bt[bt['date_complete'] >= s_d]

        if end_date:
            e_d = pd.to_datetime(end_date).date()
            tk = tk[tk['date_complete'] <= e_d]
            bt = bt[bt['date_complete'] <= e_d]

        # Filter KH Co Cls by date range
        cls = self.kh_cls_df.copy() if hasattr(self, 'kh_cls_df') and not self.kh_cls_df.empty else pd.DataFrame()

        if not cls.empty and 'date_complete' in cls.columns:
            if start_date:
                s_d = pd.to_datetime(start_date).date()
                cls = cls[cls['date_complete'] >= s_d]
            if end_date:
                e_d = pd.to_datetime(end_date).date()
                cls = cls[cls['date_complete'] <= e_d]

        # Get list of accounts matching metadata filters
        allowed_accounts = set(self.emp_map.keys())

        if team_lead:
            allowed_accounts &= {k for k, v in self.emp_map.items() if v['team_lead'] == team_lead}
        if region:
            allowed_accounts &= {k for k, v in self.emp_map.items() if v['region'] == region}
        if partner:
            allowed_accounts &= {k for k, v in self.emp_map.items() if v['partner'] == partner}
        if block:
            allowed_accounts &= {k for k, v in self.emp_map.items() if v['block'] == block}
        if search:
            s = search.strip().upper()
            allowed_accounts &= {
                k for k, v in self.emp_map.items() 
                if s in k or s in v['name'].upper() or s in str(v['code']).upper()
            }

        # Filter TK & BT & CLS by allowed accounts if any filter is set
        if team_lead or region or partner or block or search:
            tk = tk[tk['Nhân viên'].isin(allowed_accounts)]
            bt = bt[bt['Nhân viên'].isin(allowed_accounts)]
            if not cls.empty and 'Nhân viên' in cls.columns:
                cls = cls[cls['Nhân viên'].isin(allowed_accounts)]

        # Filter CLL30N dataset by date range (derived from Column AC: Tg hoàn tất CLPS)
        cll = self.cll30n_df.copy() if hasattr(self, 'cll30n_df') and not self.cll30n_df.empty else pd.DataFrame()
        if not cll.empty and 'date_complete' in cll.columns:
            if start_date:
                s_d = pd.to_datetime(start_date).date()
                cll = cll[cll['date_complete'] >= s_d]
            if end_date:
                e_d = pd.to_datetime(end_date).date()
                cll = cll[cll['date_complete'] <= e_d]

        if team_lead or region or partner or block or search:
            if not cll.empty and 'Nhân viên' in cll.columns:
                cll = cll[cll['Nhân viên'].isin(allowed_accounts)]

        # Safety checks for tk columns
        if not tk.empty:
            if 'is_gsafe' not in tk.columns or tk['is_gsafe'].dtype != bool:
                tk['is_gsafe'] = False
            if 'is_swap' not in tk.columns or tk['is_swap'].dtype != bool:
                tk['is_swap'] = False
            if 'dung_hen' not in tk.columns:
                tk['dung_hen'] = 0
            else:
                tk['dung_hen'] = pd.to_numeric(tk['dung_hen'], errors='coerce').fillna(0).astype(int)
            if 'rt_hours' not in tk.columns:
                tk['rt_hours'] = np.nan
        else:
            tk['is_gsafe'] = []
            tk['is_swap'] = []
            tk['dung_hen'] = []
            tk['rt_hours'] = []

        # 2. Overall Aggregations
        # TK Valid (Excluding Gsafe and Swap for KPIs)
        tk_valid = tk[~tk['is_gsafe'] & ~tk['is_swap']] if not tk.empty else tk
        tk_swap = tk[tk['is_swap']] if not tk.empty else tk
        tk_gsafe = tk[tk['is_gsafe']] if not tk.empty else tk

        tk_1 = int((tk_valid['dung_hen'] == 1).sum())
        tk_0 = int((tk_valid['dung_hen'] == 0).sum())
        tk_tot = tk_1 + tk_0
        tk_dh_pct = round((tk_1 / tk_tot * 100), 2) if tk_tot > 0 else 0.0
        rt_tk_avg = float(tk_valid['rt_hours'].mean()) if len(tk_valid) > 0 else None

        # BT Valid
        bt_1 = int((bt['dung_hen'] == 1).sum())
        bt_0 = int((bt['dung_hen'] == 0).sum())
        bt_tot = bt_1 + bt_0
        bt_dh_pct = round((bt_1 / bt_tot * 100), 2) if bt_tot > 0 else 0.0
        rt_bt_avg = float(bt['rt_hours'].mean()) if len(bt) > 0 else None

        # Total Đúng Hẹn %
        tot_1 = tk_1 + bt_1
        tot_all = tk_tot + bt_tot
        total_dh_pct = round((tot_1 / tot_all * 100), 2) if tot_all > 0 else 0.0

        # CLL30N % Aggregation (Tử số: cll_tot, CLPS 7N BT: clps7n_tot, Mẫu số: cls_tot if loaded, else cll_tot)
        cll_tot = len(cll)
        cls_tot = len(cls) if not cls.empty else cll_tot
        clps7n_tot = int((cll['is_clps_7n_bt'] == True).sum()) if not cll.empty and 'is_clps_7n_bt' in cll.columns else 0
        cll30n_pct = round((cll_tot / cls_tot * 100), 2) if cls_tot > 0 else 0.0
        clps7n_pct = round((clps7n_tot / cls_tot * 100), 2) if cls_tot > 0 else 0.0

        # Status rules:
        # 1. Đúng Hẹn >= 97.2% -> PASS
        # 2. RT-TK <= 18H -> PASS
        # 3. RT-BT <= 8H -> PASS
        # 4. CLL30N <= 7% -> PASS
        # 5. CLPS 7N BT <= 3% -> PASS
        dung_hen_status = 'PASS' if total_dh_pct >= 97.2 else 'FAIL'
        rt_tk_status = 'PASS' if (rt_tk_avg is None or rt_tk_avg <= 18.0) else 'FAIL'
        rt_bt_status = 'PASS' if (rt_bt_avg is None or rt_bt_avg <= 8.0) else 'FAIL'
        cll30n_status = 'PASS' if cll30n_pct <= 7.0 else 'FAIL'
        clps7n_status = 'PASS' if clps7n_pct <= 3.0 else 'FAIL'

        # Swap breakdown by transaction type
        swap_counts = tk_swap['Loại giao dịch'].value_counts().to_dict()

        # 3. Employee-level Aggregations
        active_accs = set(tk['Nhân viên'].dropna().unique()) | set(bt['Nhân viên'].dropna().unique())
        if not cls.empty and 'Nhân viên' in cls.columns:
            active_accs |= set(cls['Nhân viên'].dropna().unique())
        if not cll.empty and 'Nhân viên' in cll.columns:
            active_accs |= set(cll['Nhân viên'].dropna().unique())

        if team_lead or region or partner or block or search:
            active_accs &= allowed_accounts

        emp_rows = []
        
        # Group by employee for fast computation
        tk_valid_grp = tk_valid.groupby('Nhân viên')
        tk_swap_grp = tk_swap.groupby('Nhân viên')
        tk_gsafe_grp = tk_gsafe.groupby('Nhân viên')
        bt_grp = bt.groupby('Nhân viên')
        cls_grp = cls.groupby('Nhân viên') if not cls.empty and 'Nhân viên' in cls.columns else {}
        cll_grp = cll.groupby('Nhân viên') if not cll.empty and 'Nhân viên' in cll.columns else {}

        # Cache pre-aggregated dicts
        tk_v_dict = {
            acc: {
                'c1': (group['dung_hen'] == 1).sum(),
                'c0': (group['dung_hen'] == 0).sum(),
                'rt_avg': group['rt_hours'].mean(),
                'total': len(group)
            } for acc, group in tk_valid_grp
        }

        tk_s_dict = {
            acc: {
                'total': len(group),
                'breakdown': group['Loại giao dịch'].value_counts().to_dict()
            } for acc, group in tk_swap_grp
        }

        tk_g_dict = {acc: len(group) for acc, group in tk_gsafe_grp}

        bt_v_dict = {
            acc: {
                'c1': (group['dung_hen'] == 1).sum(),
                'c0': (group['dung_hen'] == 0).sum(),
                'rt_avg': group['rt_hours'].mean(),
                'total': len(group)
            } for acc, group in bt_grp
        }

        cll_dict = {acc: len(group) for acc, group in cll_grp} if not isinstance(cll_grp, dict) else {}
        clps7n_dict = {acc: int((group['is_clps_7n_bt'] == True).sum()) for acc, group in cll_grp} if not isinstance(cll_grp, dict) else {}
        cls_dict = {acc: len(group) for acc, group in cls_grp} if not isinstance(cls_grp, dict) else {}

        for acc in sorted(active_accs):
            meta = self.emp_map.get(acc, {
                'account': acc,
                'name': acc,
                'code': '-',
                'team_lead': '-',
                'region': '-',
                'partner': '-',
                'block': '-'
            })

            e_tk_v = tk_v_dict.get(acc, {'c1': 0, 'c0': 0, 'rt_avg': None, 'total': 0})
            e_tk_s = tk_s_dict.get(acc, {'total': 0, 'breakdown': {}})
            e_tk_g = tk_g_dict.get(acc, 0)
            e_bt = bt_v_dict.get(acc, {'c1': 0, 'c0': 0, 'rt_avg': None, 'total': 0})

            e_tk_1 = int(e_tk_v['c1'])
            e_tk_0 = int(e_tk_v['c0'])
            e_tk_tot = e_tk_1 + e_tk_0
            e_tk_dh = round((e_tk_1 / e_tk_tot * 100), 2) if e_tk_tot > 0 else 0.0

            e_bt_1 = int(e_bt['c1'])
            e_bt_0 = int(e_bt['c0'])
            e_bt_tot = e_bt_1 + e_bt_0
            e_bt_dh = round((e_bt_1 / e_bt_tot * 100), 2) if e_bt_tot > 0 else 0.0

            e_tot_1 = e_tk_1 + e_bt_1
            e_tot_all = e_tk_tot + e_bt_tot
            e_tot_dh = round((e_tot_1 / e_tot_all * 100), 2) if e_tot_all > 0 else 0.0

            rt_tk_val = e_tk_v['rt_avg']
            rt_bt_val = e_bt['rt_avg']

            # Employee CLL30N calculation (using KH Co Cls denominator if available, fallback to CLL30N count)
            e_cll_count = cll_dict.get(acc, 0)
            e_clps7n_count = clps7n_dict.get(acc, 0)
            e_cls_count = cls_dict.get(acc, 0)
            e_denom = e_cls_count if e_cls_count > 0 else e_cll_count
            e_cll30n_pct = round((e_cll_count / e_denom * 100), 2) if e_denom > 0 else 0.0
            e_clps7n_pct = round((e_clps7n_count / e_denom * 100), 2) if e_denom > 0 else 0.0

            # Employee evaluation rule statuses
            e_dh_status = 'PASS' if e_tot_dh >= 97.2 else 'FAIL'
            e_rt_tk_status = 'PASS' if (rt_tk_val is not None and not pd.isna(rt_tk_val) and rt_tk_val <= 18.0) else ('FAIL' if (rt_tk_val is not None and not pd.isna(rt_tk_val)) else 'NONE')
            e_rt_bt_status = 'PASS' if (rt_bt_val is not None and not pd.isna(rt_bt_val) and rt_bt_val <= 8.0) else ('FAIL' if (rt_bt_val is not None and not pd.isna(rt_bt_val)) else 'NONE')
            e_cll30n_status = 'PASS' if e_cll30n_pct <= 7.0 else 'FAIL'
            e_clps7n_status = 'PASS' if e_clps7n_pct <= 3.0 else 'FAIL'

            emp_rows.append({
                'account': acc,
                'name': meta['name'],
                'code': meta['code'],
                'team_lead': meta['team_lead'],
                'region': meta['region'],
                'partner': meta['partner'],
                'block': meta['block'],
                
                # Triển Khai KPIs
                'tk_kpi_volume': e_tk_tot,
                'tk_dung_hen_1': e_tk_1,
                'tk_dung_hen_0': e_tk_0,
                'tk_dung_hen_pct': e_tk_dh,
                'rt_tk_hours': round(float(rt_tk_val), 2) if pd.notna(rt_tk_val) else None,
                'rt_tk_fmt': self.format_rt(rt_tk_val),
                'rt_tk_status': e_rt_tk_status,
                
                # Swap & Gsafe counts
                'tk_swap_volume': e_tk_s['total'],
                'tk_swap_breakdown': e_tk_s['breakdown'],
                'tk_gsafe_volume': e_tk_g,
                'tk_total_all_types': e_tk_tot + e_tk_s['total'] + e_tk_g,

                # Bảo Trì KPIs
                'bt_volume': e_bt_tot,
                'bt_dung_hen_1': e_bt_1,
                'bt_dung_hen_0': e_bt_0,
                'bt_dung_hen_pct': e_bt_dh,
                'rt_bt_hours': round(float(rt_bt_val), 2) if pd.notna(rt_bt_val) else None,
                'rt_bt_fmt': self.format_rt(rt_bt_val),
                'rt_bt_status': e_rt_bt_status,

                # CLL30N KPIs
                'cll30n_count': e_cll_count,
                'clps7n_count': e_clps7n_count,
                'kh_cls_count': e_cls_count,
                'cll30n_pct': e_cll30n_pct,
                'clps7n_pct': e_clps7n_pct,
                'cll30n_status': e_cll30n_status,
                'clps7n_status': e_clps7n_status,

                # Overall Total
                'total_dung_hen_pct': e_tot_dh,
                'dung_hen_status': e_dh_status,
                'total_completed_work': e_tk_tot + e_tk_s['total'] + e_bt_tot
            })

        execution_time_ms = round((time.time() - t0) * 1000, 2)

        col_as_bt = next((c for c in bt.columns if 'phi' in str(c).lower() and 'trang' in str(c).lower()), None)
        if not col_as_bt and len(bt.columns) > 44:
            col_as_bt = bt.columns[44]

        all_bt_type_counts = {}
        if not bt.empty and col_as_bt and col_as_bt in bt.columns:
            all_bt_type_counts = bt[col_as_bt].fillna('(Trống / Không xác định)').astype(str).str.strip().value_counts().to_dict()

        return {
            'metadata': {
                'last_sync_time': self.last_sync_time,
                'execution_time_ms': execution_time_ms,
                'total_employees_count': len(emp_rows),
                'filters_applied': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'team_lead': team_lead,
                    'region': region,
                    'partner': partner,
                    'block': block,
                    'search': search
                }
            },
            'overall_summary': {
                'total_nv_active': len(emp_rows),
                
                # TK
                'tk_volume_kpi': tk_tot,
                'tk_dung_hen_pct': tk_dh_pct,
                'tk_dung_hen_1': tk_1,
                'tk_dung_hen_0': tk_0,
                'rt_tk_hours': round(float(rt_tk_avg), 2) if rt_tk_avg and pd.notna(rt_tk_avg) else None,
                'rt_tk_fmt': self.format_rt(rt_tk_avg),
                'rt_tk_status': rt_tk_status,
                
                # Swap & Gsafe & All Transaction Breakdown
                'tk_swap_volume': len(tk_swap),
                'tk_swap_counts': swap_counts,
                'tk_gsafe_volume': len(tk_gsafe),
                'all_tx_type_counts': tk['Loại giao dịch'].value_counts().to_dict() if 'Loại giao dịch' in tk.columns else {},
                'tk_valid_tx_type_counts': tk_valid['Loại giao dịch'].value_counts().to_dict() if 'Loại giao dịch' in tk_valid.columns else {},

                # BT
                'bt_volume': len(bt),
                'bt_dung_hen_pct': bt_dh_pct,
                'bt_dung_hen_1': bt_1,
                'bt_dung_hen_0': bt_0,
                'rt_bt_hours': round(float(rt_bt_avg), 2) if rt_bt_avg and pd.notna(rt_bt_avg) else None,
                'rt_bt_fmt': self.format_rt(rt_bt_avg),
                'rt_bt_status': rt_bt_status,
                'all_bt_type_counts': all_bt_type_counts,

                # CLL30N
                'cll30n_count': cll_tot,
                'clps7n_count': clps7n_tot,
                'kh_cls_count': cls_tot,
                'cll30n_pct': cll30n_pct,
                'clps7n_pct': clps7n_pct,
                'cll30n_status': cll30n_status,
                'clps7n_status': clps7n_status,

                # Total
                'total_dung_hen_pct': total_dh_pct,
                'dung_hen_status': dung_hen_status,
                'total_work_volume': len(tk) + len(bt)
            },
            'employees': emp_rows
        }

    def get_employee_details(self, account: str, start_date=None, end_date=None):
        acc = account.strip().upper()
        meta = self.emp_map.get(acc, {'account': acc, 'name': acc})

        tk = self.tk_df[self.tk_df['Nhân viên'] == acc].copy()
        bt = self.bt_df[self.bt_df['Nhân viên'] == acc].copy()

        if start_date:
            s_d = pd.to_datetime(start_date).date()
            tk = tk[tk['date_complete'] >= s_d]
            bt = bt[bt['date_complete'] >= s_d]

        if end_date:
            e_d = pd.to_datetime(end_date).date()
            tk = tk[tk['date_complete'] <= e_d]
            bt = bt[bt['date_complete'] <= e_d]

        # TK tickets list
        tk_list = []
        for _, row in tk.iterrows():
            tk_list.append({
                'contract_no': str(row.get('Số hợp đồng', '')),
                'customer_name': str(row.get('Tên khách hàng', '')),
                'service_package': str(row.get('Gói dịch vụ', '')),
                'tx_type': str(row.get('Loại giao dịch', '')),
                'dt_created': str(row.get('TG tạo PTC', '')),
                'dt_complete': str(row.get('Ngày hoàn tất PTC', '')),
                'dung_hen': int(row.get('dung_hen', 0)),
                'rt_fmt': self.format_rt(row.get('rt_hours')),
                'is_gsafe': bool(row.get('is_gsafe', False)),
                'is_swap': bool(row.get('is_swap', False))
            })

        # BT tickets list
        col_as_bt = next((c for c in bt.columns if 'phi' in str(c).lower() and 'trang' in str(c).lower()), None)
        if not col_as_bt and len(bt.columns) > 44:
            col_as_bt = bt.columns[44]
        bt_list = []
        for _, row in bt.iterrows():
            bt_list.append({
                'contract_no': str(row.get('Số HĐ', '')),
                'customer_name': str(row.get('Khách hàng', '') or row.get('Tên khách hàng', '')),
                'dt_created': str(row.get('TG Tạo', '')),
                'dt_complete': str(row.get('TG Hoàn Tất', '')),
                'dung_hen': int(row.get('dung_hen', 0)),
                'rt_fmt': self.format_rt(row.get('rt_hours')),
                'tx_type': str(row.get(col_as_bt, '-')) if col_as_bt else '-'
            })

        # CLL tickets list
        cll = self.cll30n_df[self.cll30n_df['Nhân viên'] == acc].copy() if hasattr(self, 'cll30n_df') and not self.cll30n_df.empty else pd.DataFrame()

        if not cll.empty and 'date_complete' in cll.columns:
            if start_date:
                s_d = pd.to_datetime(start_date).date()
                cll = cll[cll['date_complete'] >= s_d]
            if end_date:
                e_d = pd.to_datetime(end_date).date()
                cll = cll[cll['date_complete'] <= e_d]

        cll_list = []
        if not cll.empty:
            for _, row in cll.iterrows():
                cll_list.append({
                    'contract_no': str(row.get('Số HĐ', '')),
                    'customer_name': str(row.get('Khách Hàng', '')),
                    'dt_complete': str(row.get('Tg hoàn tất CLPS', '') or row.get('Tg hoàn tất', '')),
                    'tinh_trang_dau_vao': str(row.get('tinh_trang_dau_vao', '-')),
                    'huong_xu_ly': str(row.get('huong_xu_ly', '-')),
                    'is_clps_7n_bt': bool(row.get('is_clps_7n_bt', False))
                })

        return {
            'employee_info': meta,
            'tk_tickets': tk_list,
            'bt_tickets': bt_list,
            'cll_tickets': cll_list,
            'clps7n_tickets': [t for t in cll_list if t.get('is_clps_7n_bt')]
        }

    # =========================================================================
    # LỊCH TRỰC ENGINE METHODS (CONNECTED TO LIVE HR, TK, BT & LỊCH TRỰC DATA)
    # =========================================================================
    def get_thresholds(self):
        return getattr(self, 'thresholds', {'tiLeTrucMin': 50.0, 'tonPerNsMax': 5.0})

    def save_thresholds(self, ti_le_truc_min: float, ton_per_ns_max: float):
        self.thresholds = {
            'tiLeTrucMin': float(ti_le_truc_min),
            'tonPerNsMax': float(ton_per_ns_max)
        }
        return self.thresholds

    def _parse_date_str(self, val):
        import re
        s = str(val or '').strip()
        if not s or s == 'nan' or s == 'Chưa có lịch hẹn':
            return None
        m = re.search(r'(\d{1,4})[/\-](\d{1,2})[/\-](\d{1,4})', s)
        if m:
            p1, p2, p3 = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if p1 > 1000: # yyyy-mm-dd
                y, m_val, d = p1, p2, p3
            else: # dd-mm-yyyy
                d, m_val, y = p1, p2, p3
            try:
                return datetime.date(y, m_val, d)
            except Exception:
                return None
        return None

    def _get_nhan_su_by_block(self):
        if self.hr_df.empty:
            return {}, {}
        
        df_hr = self.hr_df.copy()
        
        # Build HR account map from Cột G (Inside Account), Cột F (Mã NV), Cột K (Email)
        hr_map = {}
        block_ns_info = {}

        for _, row in df_hr.iterrows():
            acc = str(row.get('Inside Account', '')).strip().upper()
            ma_nv = str(row.get('Mã NV', '')).strip().upper()
            email = str(row.get('Email', '')).strip().upper()
            block = str(row.get('Block', '')).strip()
            dt = str(row.get('Họ tên Đội trưởng', '')).strip()
            status = str(row.get('Tình trạng Tài khoản', '')).strip().upper()
            is_active = (status == 'ACTIVE' or status == 'BÌNH THƯỜNG' or not status)

            info = {
                'block': block,
                'truong': dt,
                'is_active': is_active,
                'email': email,
                'acc': acc,
                'ma_nv': ma_nv
            }

            if acc: hr_map[acc] = info
            if ma_nv: hr_map[ma_nv] = info
            if email: hr_map[email] = info

            if block:
                if block not in block_ns_info:
                    block_ns_info[block] = {'truongActive': '', 'truongAny': '', 'activeCount': 0, 'totalCount': 0}
                block_ns_info[block]['totalCount'] += 1
                if not block_ns_info[block]['truongAny'] and dt:
                    block_ns_info[block]['truongAny'] = dt
                if is_active:
                    block_ns_info[block]['activeCount'] += 1
                    if not block_ns_info[block]['truongActive'] and dt:
                        block_ns_info[block]['truongActive'] = dt

        res_blocks = {}
        for b, v in block_ns_info.items():
            res_blocks[b] = {
                'truong': v['truongActive'] or v['truongAny'] or '(chưa rõ)',
                'activeCount': v['activeCount'],
                'totalCount': v['totalCount']
            }

        return res_blocks, hr_map

    def _get_ton_tk_parsed(self, hr_map):
        df_ton_tk = getattr(self, 'ton_tk_df', pd.DataFrame())
        if df_ton_tk.empty and (CACHE_DIR / "ton_tk.pkl.gz").exists():
            try:
                df_ton_tk = pd.read_pickle(CACHE_DIR / "ton_tk.pkl.gz")
                self.ton_tk_df = df_ton_tk
            except Exception:
                pass
        if df_ton_tk.empty:
            try:
                res_ton_tk = requests.get(self._get_ton_tk_sheet_url(), timeout=15)
                if res_ton_tk.status_code == 200 and not res_ton_tk.text.strip().startswith('<!DOCTYPE'):
                    df_ton_tk = self._read_any_dataframe(res_ton_tk.content, "ton_tk.csv")
                    if not df_ton_tk.empty:
                        self.ton_tk_df = df_ton_tk
                        self._save_pickle(df_ton_tk, "ton_tk.pkl.gz")
            except Exception:
                pass
        if df_ton_tk.empty:
            return []

        df_ton_bt = getattr(self, 'ton_bt_df', pd.DataFrame())
        if df_ton_bt.empty and (CACHE_DIR / "ton_bt.pkl.gz").exists():
            try:
                df_ton_bt = pd.read_pickle(CACHE_DIR / "ton_bt.pkl.gz")
                self.ton_bt_df = df_ton_bt
            except Exception:
                pass
        if df_ton_bt.empty:
            try:
                res_ton_bt = requests.get(self._get_ton_bt_sheet_url(), timeout=15)
                if res_ton_bt.status_code == 200 and not res_ton_bt.text.strip().startswith('<!DOCTYPE'):
                    df_ton_bt = self._read_any_dataframe(res_ton_bt.content, "ton_bt.csv")
                    if not df_ton_bt.empty:
                        self.ton_bt_df = df_ton_bt
                        self._save_pickle(df_ton_bt, "ton_bt.pkl.gz")
            except Exception:
                pass
        
        col_f_block = self._find_col(df_ton_tk, ['Block', 'Block nhân sự'], default_idx=5)
        ns_col = self._find_col(df_ton_tk, ['Nhân sự', 'Nhân viên'], default_idx=17)
        s_col = self._find_col(df_ton_tk, ['TG Hẹn xanh', 'Ngày hẹn Xanh'], default_idx=18)
        t_col = self._find_col(df_ton_tk, ['TG Hẹn đỏ', 'Ngày hẹn đỏ'], default_idx=19)

        tk_rows = []
        for _, r in df_ton_tk.iterrows():
            ns = str(r.get(ns_col, '')).strip().upper()
            if ns in ('NAN', 'NONE', '-', 'NULL'):
                ns = ''
            s = str(r.get(s_col, '')).strip()
            t = str(r.get(t_col, '')).strip()
            hen_raw = s if (s and s != 'nan') else (t if (t and t != 'nan') else 'Chưa có lịch hẹn')
            dt_hen = self._parse_date_str(hen_raw)

            block_f = str(r.get(col_f_block, '')).strip()
            if block_f and block_f.upper() not in ('NAN', 'NONE', '-', 'NULL'):
                block = block_f
            elif ns and hr_map.get(ns, {}).get('block'):
                block = hr_map.get(ns, {}).get('block')
            else:
                block = '(Không xác định)'

            tk_rows.append({
                'ns': ns,
                'block': block,
                'hen_raw': hen_raw,
                'dt_hen': dt_hen
            })
        return tk_rows

    def _get_ton_bt_parsed(self, hr_map):
        df_ton_bt = getattr(self, 'ton_bt_df', pd.DataFrame())
        if df_ton_bt.empty and (CACHE_DIR / "ton_bt.pkl.gz").exists():
            try:
                df_ton_bt = pd.read_pickle(CACHE_DIR / "ton_bt.pkl.gz")
                self.ton_bt_df = df_ton_bt
            except Exception:
                pass
        if df_ton_bt.empty:
            return []
        
        col_e_block = self._find_col(df_ton_bt, ['Block'], default_idx=4)
        k_col = self._find_col(df_ton_bt, ['Ngày hẹn Xanh', 'TG Hẹn xanh'], default_idx=10)
        l_col = self._find_col(df_ton_bt, ['Ngày hẹn đỏ', 'TG Hẹn đỏ'], default_idx=11)
        ns_col = self._find_col(df_ton_bt, ['Nhân sự', 'Nhân viên'], default_idx=18)

        bt_rows = []
        for _, r in df_ton_bt.iterrows():
            ns = str(r.get(ns_col, '')).strip().upper()
            if ns in ('NAN', 'NONE', '-', 'NULL'):
                ns = ''
            k = str(r.get(k_col, '')).strip()
            l = str(r.get(l_col, '')).strip()
            hen_raw = k if (k and k != 'nan') else (l if (l and l != 'nan') else 'Chưa có lịch hẹn')
            dt_hen = self._parse_date_str(hen_raw)

            block_e = str(r.get(col_e_block, '')).strip()
            if block_e and block_e.upper() not in ('NAN', 'NONE', '-', 'NULL'):
                block = block_e
            elif ns and hr_map.get(ns, {}).get('block'):
                block = hr_map.get(ns, {}).get('block')
            else:
                block = '(Không xác định)'

            bt_rows.append({
                'ns': ns,
                'block': block,
                'hen_raw': hen_raw,
                'dt_hen': dt_hen
            })
        return bt_rows

    def _compute_shift_for_date(self, date_obj):
        day = date_obj.day
        month = date_obj.month
        year = date_obj.year
        day_col_idx = 4 + day # Day1 = index 5, Day13 = index 17

        res = {}
        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            return res

        _, hr_map = self._get_nhan_su_by_block()

        for idx, r in self.lt_df.iterrows():
            vals = list(r.values)
            if len(vals) < 38:
                continue

            m_raw = str(vals[36] or '').strip()
            y_raw = str(vals[37] or '').strip()

            m_match = re.search(r'\d+', m_raw)
            y_match = re.search(r'\d+', y_raw)

            if not m_match or not y_match:
                continue

            row_month = int(m_match.group(0))
            row_year = int(y_match.group(0))

            if row_month != month or row_year != year:
                continue

            shift = str(vals[day_col_idx] or '').strip().upper()
            if shift == 'CA1':
                mail = str(vals[0] or '').strip().upper()
                info = hr_map.get(mail, {})
                block = info.get('block') or str(vals[4] or '').strip() or '(Không xác định)'
                res[block] = res.get(block, 0) + 1

        return res

    def _refresh_lt_from_sheet(self, force=False):
        now = time.time()
        last_fetch = getattr(self, '_last_lt_fetch_time', 0)
        if force or (now - last_fetch > 60) or not hasattr(self, 'lt_df') or self.lt_df.empty:
            try:
                res_lt = requests.get(self._get_lt_sheet_url(), timeout=15)
                if res_lt.status_code == 200 and not res_lt.text.strip().startswith('<!DOCTYPE'):
                    df_lt_fetched = self._read_any_dataframe(res_lt.content, "lt.csv")
                    if not df_lt_fetched.empty:
                        self.lt_df = df_lt_fetched
                        self._last_lt_fetch_time = now
                        self._save_pickle(self.lt_df, "lt.pkl.gz")
                        try:
                            self._snapshot_and_detect_lt_changes(source_label="Google Sheet Sync")
                        except Exception as e_snap:
                            print(f"Warning: snapshot detection failed: {e_snap}", flush=True)
            except Exception as e:
                print(f"Auto-refresh Lịch Trực error: {e}", flush=True)

    def get_lich_truc_dashboard(self, date_str=None):
        self._refresh_lt_from_sheet()
        if not date_str:
            base_date = datetime.date.today()
        else:
            try:
                base_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except Exception:
                base_date = datetime.date.today()

        d0 = base_date
        d1 = base_date + datetime.timedelta(days=1)
        d2 = base_date + datetime.timedelta(days=2)

        ns_by_block, hr_map = self._get_nhan_su_by_block()
        tk_list = self._get_ton_tk_parsed(hr_map)
        bt_list = self._get_ton_bt_parsed(hr_map)

        df_tk_p = pd.DataFrame(tk_list) if tk_list else pd.DataFrame(columns=['ns', 'block', 'hen_raw', 'dt_hen'])
        df_bt_p = pd.DataFrame(bt_list) if bt_list else pd.DataFrame(columns=['ns', 'block', 'hen_raw', 'dt_hen'])

        d0_shifts = self._compute_shift_for_date(d0)
        d1_shifts = self._compute_shift_for_date(d1)
        d2_shifts = self._compute_shift_for_date(d2)

        all_blocks = sorted(list(set(
            list(ns_by_block.keys()) +
            list(d0_shifts.keys()) +
            list(df_tk_p['block'].unique() if not df_tk_p.empty else []) +
            list(df_bt_p['block'].unique() if not df_bt_p.empty else [])
        )))

        tot_tk_map = df_tk_p.groupby('block').size().to_dict() if not df_tk_p.empty else {}
        tot_bt_map = df_bt_p.groupby('block').size().to_dict() if not df_bt_p.empty else {}

        tk_0_map = df_tk_p[df_tk_p['dt_hen'] == d0].groupby('block').size().to_dict() if not df_tk_p.empty else {}
        bt_0_map = df_bt_p[df_bt_p['dt_hen'] == d0].groupby('block').size().to_dict() if not df_bt_p.empty else {}

        tk_1_map = df_tk_p[df_tk_p['dt_hen'] == d1].groupby('block').size().to_dict() if not df_tk_p.empty else {}
        bt_1_map = df_bt_p[df_bt_p['dt_hen'] == d1].groupby('block').size().to_dict() if not df_bt_p.empty else {}

        tk_2_map = df_tk_p[df_tk_p['dt_hen'] == d2].groupby('block').size().to_dict() if not df_tk_p.empty else {}
        bt_2_map = df_bt_p[df_bt_p['dt_hen'] == d2].groupby('block').size().to_dict() if not df_bt_p.empty else {}

        summary_table = []
        for block in all_blocks:
            if not block or block == 'nan':
                continue
            ns_info = ns_by_block.get(block, {'truong': '(chưa rõ)', 'activeCount': 0})
            sl_active = ns_info['activeCount']
            doi_truong = ns_info['truong']

            # Total Backlog Across All Dates
            tot_tk = tot_tk_map.get(block, 0)
            tot_bt = tot_bt_map.get(block, 0)
            tot_all = tot_tk + tot_bt

            # Date X (d0)
            ca1_0 = d0_shifts.get(block, 0)
            tk_0 = tk_0_map.get(block, 0)
            bt_0 = bt_0_map.get(block, 0)
            ton_0 = tk_0 + bt_0

            ti_le_truc = round((ca1_0 / sl_active) * 100.0, 1) if sl_active > 0 else 0.0
            ton_per_ns = round(ton_0 / ca1_0, 2) if ca1_0 > 0 else ("∞" if ton_0 > 0 else 0)
            ton_du_kien = round(tot_all / sl_active, 2) if sl_active > 0 else ("∞" if tot_all > 0 else 0)

            # Date X+1 (d1)
            ca1_1 = d1_shifts.get(block, 0)
            tk_1 = tk_1_map.get(block, 0)
            bt_1 = bt_1_map.get(block, 0)
            ton_1 = tk_1 + bt_1
            ton_du_kien_1 = round(ton_1 / ca1_1, 2) if ca1_1 > 0 else ("∞" if ton_1 > 0 else 0)

            # Date X+2 (d2)
            ca1_2 = d2_shifts.get(block, 0)
            tk_2 = tk_2_map.get(block, 0)
            bt_2 = bt_2_map.get(block, 0)
            ton_2 = tk_2 + bt_2
            ton_du_kien_2 = round(ton_2 / ca1_2, 2) if ca1_2 > 0 else ("∞" if ton_2 > 0 else 0)

            summary_table.append({
                'block': block,
                'doiTruong': doi_truong,
                'slActive': sl_active,
                'totTK': tot_tk,
                'totBT': tot_bt,
                'totAll': tot_all,
                'tonTK0': tk_0,
                'tonBT0': bt_0,
                'ton0': ton_0,
                'ca1Ngay0': ca1_0,
                'tiLeTruc': ti_le_truc,
                'tonPerNs': ton_per_ns,
                'tonDuKien': ton_du_kien,
                'ca1Ngay1': ca1_1,
                'ton1': ton_1,
                'tonDuKien1': ton_du_kien_1,
                'ca1Ngay2': ca1_2,
                'ton2': ton_2,
                'tonDuKien2': ton_du_kien_2
            })

        ca1_total_0 = sum(r['ca1Ngay0'] for r in summary_table)
        active_total = sum(r['slActive'] for r in summary_table)
        ton_total_sum = sum(r['totAll'] for r in summary_table)

        return {
            'generatedAt': datetime.datetime.now().strftime('%d/%m/%Y %H:%M'),
            'date0': d0.strftime('%d/%m/%Y'),
            'date1': d1.strftime('%d/%m/%Y'),
            'date2': d2.strftime('%d/%m/%Y'),
            'ca1Total0': ca1_total_0,
            'activeTotal': active_total,
            'tonTotal': ton_total_sum,
            'summaryTable': summary_table
        }

    def get_lich_truc_chitiet(self, month=0, year=0, doi_truong="__ALL__"):
        self._refresh_lt_from_sheet()
        header = ['CodeStaff', 'Name', 'Partner', 'Block'] + [f'Day{i}' for i in range(1, 32)] + ['Months', 'Years']
        data = []

        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            return {'header': header, 'data': []}

        _, hr_map = self._get_nhan_su_by_block()
        target_month = int(month) if month and int(month) > 0 else datetime.datetime.now().month
        target_year = int(year) if year and int(year) > 0 else datetime.datetime.now().year

        for idx, r in self.lt_df.iterrows():
            vals = list(r.values)
            if len(vals) < 38:
                continue

            m_raw = str(vals[36] or '').strip()
            y_raw = str(vals[37] or '').strip()

            m_match = re.search(r'\d+', m_raw)
            y_match = re.search(r'\d+', y_raw)

            if not m_match or not y_match:
                continue

            row_month = int(m_match.group(0))
            row_year = int(y_match.group(0))

            if target_month > 0 and row_month != target_month:
                continue
            if target_year > 0 and row_year != target_year:
                continue

            mail = str(vals[0] or '').strip().upper()
            info = hr_map.get(mail, {})
            lead = info.get('truong') or ''

            if doi_truong and doi_truong != "__ALL__" and lead != doi_truong:
                continue

            # Extract values B..AL (indices 1 to 37)
            vals_b_al = [str(vals[i] or '').strip() for i in range(1, 38)]

            data.append({
                'row': idx + 2,
                'mail': mail,
                'doiTruong': lead,
                'values': vals_b_al
            })

        return {
            'header': header,
            'data': data
        }

    def add_lich_truc_row(self, mail: str, values_b_to_al: list):
        new_row = [mail] + [str(v) for v in values_b_to_al]
        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            header = ['Mail', 'CodeStaff', 'Name', 'Partner', 'Block'] + [f'Day{i}' for i in range(1, 32)] + ['Months', 'Years']
            self.lt_df = pd.DataFrame([header, new_row])
        else:
            new_df = pd.DataFrame([new_row])
            self.lt_df = pd.concat([self.lt_df, new_df], ignore_index=True)
        
        self.lt_df.to_pickle(CACHE_DIR / "lt.pkl.gz")
        self._snapshot_and_detect_lt_changes(source_label="Thêm mới")
        return {"ok": True}

    def update_lich_truc_row(self, row_number: int, values_b_to_al: list):
        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            return {"ok": False, "error": "No Lịch Trực data loaded"}
        
        try:
            df_idx = int(row_number) - 2
            if 0 <= df_idx < len(self.lt_df):
                for i, val in enumerate(values_b_to_al):
                    col_target = i + 1
                    if col_target < self.lt_df.shape[1]:
                        self.lt_df.iloc[df_idx, col_target] = str(val)
                self._save_pickle(self.lt_df, "lt.pkl.gz")
                try:
                    self._snapshot_and_detect_lt_changes(source_label="Chỉnh sửa")
                except Exception as snap_err:
                    print(f"Warning: snapshot update warning: {snap_err}", flush=True)
                return {"ok": True, "message": "Đã lưu thay đổi lịch trực thành công!"}
            return {"ok": False, "error": f"Invalid row index ({row_number})"}
        except Exception as e:
            return {"ok": False, "error": f"Lỗi lưu lịch trực: {str(e)}"}

    def delete_lich_truc_row(self, row_number: int):
        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            return {"ok": False, "error": "No Lịch Trực data loaded"}
        
        df_idx = row_number - 2
        if 0 <= df_idx < len(self.lt_df):
            self.lt_df = self.lt_df.drop(self.lt_df.index[df_idx]).reset_index(drop=True)
            self.lt_df.to_pickle(CACHE_DIR / "lt.pkl.gz")
            self._snapshot_and_detect_lt_changes(source_label="Xóa dòng")
            return {"ok": True}
        return {"ok": False, "error": "Invalid row index"}

    def import_lich_truc_rows(self, rows_data: list):
        new_rows = []
        for r in rows_data:
            if isinstance(r, list) and len(r) >= 38:
                new_rows.append([str(v) for v in r[:38]])
            elif isinstance(r, dict):
                m = str(r.get('mail', '')).strip()
                v = r.get('valuesBtoAL', [])
                if m and len(v) >= 37:
                    new_rows.append([m] + [str(x) for x in v[:37]])
        
        if new_rows:
            new_df = pd.DataFrame(new_rows)
            if not hasattr(self, 'lt_df') or self.lt_df.empty:
                header = ['Mail', 'CodeStaff', 'Name', 'Partner', 'Block'] + [f'Day{i}' for i in range(1, 32)] + ['Months', 'Years']
                self.lt_df = pd.DataFrame([header] + new_rows)
            else:
                self.lt_df = pd.concat([self.lt_df, new_df], ignore_index=True)
            self.lt_df.to_pickle(CACHE_DIR / "lt.pkl.gz")
            self._snapshot_and_detect_lt_changes(source_label="Import")
            return {"ok": True, "count": len(new_rows)}
        return {"ok": False, "error": "No valid rows to import"}

    def _load_lt_history_and_snapshot(self):
        lt_hist_cache = CACHE_DIR / "lt_history.pkl.gz"
        lt_snap_cache = CACHE_DIR / "lt_snapshot.pkl.gz"
        if lt_hist_cache.exists():
            try:
                self.lt_history = pd.read_pickle(lt_hist_cache)
                if not isinstance(self.lt_history, list):
                    self.lt_history = []
            except Exception:
                self.lt_history = []
        else:
            self.lt_history = []

        if lt_snap_cache.exists():
            try:
                self.lt_snapshot_map = pd.read_pickle(lt_snap_cache)
                if not isinstance(self.lt_snapshot_map, dict):
                    self.lt_snapshot_map = {}
            except Exception:
                self.lt_snapshot_map = {}

    def _save_lt_history_and_snapshot(self):
        try:
            pd.to_pickle(self.lt_history, CACHE_DIR / "lt_history.pkl.gz")
            pd.to_pickle(self.lt_snapshot_map, CACHE_DIR / "lt_snapshot.pkl.gz")
        except Exception as e:
            print(f"Warning: Failed to save lt history/snapshot: {e}", flush=True)

    def _snapshot_and_detect_lt_changes(self, source_label="Auto-Sync"):
        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            return

        if not hasattr(self, 'lt_history') or self.lt_history is None:
            self._load_lt_history_and_snapshot()

        _, hr_map = self._get_nhan_su_by_block()
        current_matrix = {}
        row_info_map = {}

        for idx, r in self.lt_df.iterrows():
            vals = list(r.values)
            if len(vals) < 38:
                continue

            m_raw = str(vals[36] or '').strip()
            y_raw = str(vals[37] or '').strip()

            m_match = re.search(r'\d+', m_raw)
            y_match = re.search(r'\d+', y_raw)
            if not m_match or not y_match:
                continue

            row_month = int(m_match.group(0))
            row_year = int(y_match.group(0))
            mail = str(vals[0] or '').strip().upper()
            code = str(vals[1] or '').strip()
            name = str(vals[2] or '').strip()
            partner = str(vals[3] or '').strip()
            block = str(vals[4] or '').strip()

            info = hr_map.get(mail, {})
            doi_truong = info.get('truong') or ''
            if not block and info.get('block'):
                block = info.get('block')

            staff_key = (mail, row_month, row_year)
            row_info_map[staff_key] = {
                'mail': mail, 'code': code, 'name': name,
                'partner': partner, 'block': block, 'doiTruong': doi_truong,
                'month': row_month, 'year': row_year
            }

            for day_idx in range(1, 32):
                col_idx = 4 + day_idx
                if col_idx < len(vals):
                    shift_val = str(vals[col_idx] or '').strip()
                else:
                    shift_val = ''
                current_matrix[(mail, row_month, row_year, day_idx)] = shift_val

        # If previous snapshot exists, compare
        if self.lt_snapshot_map:
            now_dt = datetime.datetime.now()
            time_str = now_dt.strftime('%Y-%m-%d %H:%M:%S')
            time_display = now_dt.strftime('%d/%m/%Y %H:%M')

            def is_ca1(v):
                return str(v or '').strip().upper() == 'CA1'

            for key, new_val in current_matrix.items():
                mail, row_month, row_year, day_idx = key
                old_val = self.lt_snapshot_map.get(key, '')
                
                # Skip if key was not present in snapshot
                if key not in self.lt_snapshot_map:
                    continue

                old_clean = str(old_val or '').strip().upper()
                new_clean = str(new_val or '').strip().upper()

                if old_clean != new_clean:
                    info = row_info_map.get((mail, row_month, row_year), {})
                    change_type = f"{old_clean or 'O'} ➔ {new_clean or 'O'}"
                    
                    rec = {
                        'id': len(self.lt_history) + 1,
                        'timestamp': time_str,
                        'timeDisplay': time_display,
                        'milestone': source_label,
                        'mail': mail,
                        'codeStaff': info.get('code', ''),
                        'name': info.get('name', ''),
                        'partner': info.get('partner', ''),
                        'block': info.get('block', ''),
                        'doiTruong': info.get('doiTruong', ''),
                        'month': row_month,
                        'year': row_year,
                        'day': day_idx,
                        'dateStr': f"{day_idx:02d}/{row_month:02d}/{row_year}",
                        'oldVal': old_val if old_val else 'O',
                        'newVal': new_val if new_val else 'O',
                        'changeType': change_type
                    }
                    self.lt_history.append(rec)

        self.lt_snapshot_map = current_matrix
        self._save_lt_history_and_snapshot()

    def get_lich_truc_history(self, month=0, year=0, doi_truong="__ALL__", search="", limit_latest=False):
        if not hasattr(self, 'lt_history') or self.lt_history is None:
            self._load_lt_history_and_snapshot()

        res = []
        target_month = int(month) if month and int(month) > 0 else 0
        target_year = int(year) if year and int(year) > 0 else 0
        search_kw = str(search or '').strip().upper()

        for rec in self.lt_history:
            if target_month > 0 and rec.get('month') != target_month:
                continue
            if target_year > 0 and rec.get('year') != target_year:
                continue
            if doi_truong and doi_truong != "__ALL__" and rec.get('doiTruong') != doi_truong:
                continue

            if search_kw:
                combined = f"{rec.get('mail','')} {rec.get('codeStaff','')} {rec.get('name','')} {rec.get('block','')}".upper()
                if search_kw not in combined:
                    continue

            res.append(rec)

        # Sort descending by timestamp / id
        res.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

        if limit_latest:
            grouped = {}
            filtered = []
            for r in res:
                key = (r.get('mail'), r.get('year'), r.get('month'), r.get('day'))
                if key not in grouped:
                    grouped[key] = []
                if len(grouped[key]) < 2:
                    grouped[key].append(r)
                    filtered.append(r)
            res = filtered

        return {
            'totalCount': len(res),
            'data': res
        }

    def clear_lich_truc_history(self):
        self.lt_history = []
        self._save_lt_history_and_snapshot()
        return {"ok": True}

    def get_ton_tk_bt_dashboard(self):
        ns_by_block, hr_map = self._get_nhan_su_by_block()
        import unicodedata
        df_tk = getattr(self, 'ton_tk_df', pd.DataFrame())
        if df_tk.empty and (CACHE_DIR / "ton_tk.pkl.gz").exists():
            try:
                df_tk = pd.read_pickle(CACHE_DIR / "ton_tk.pkl.gz")
                self.ton_tk_df = df_tk
            except Exception:
                pass

        df_bt = getattr(self, 'ton_bt_df', pd.DataFrame())
        if df_bt.empty and (CACHE_DIR / "ton_bt.pkl.gz").exists():
            try:
                df_bt = pd.read_pickle(CACHE_DIR / "ton_bt.pkl.gz")
                self.ton_bt_df = df_bt
            except Exception:
                pass

        now = datetime.datetime.now()

        # Parse TK list
        tk_list = []
        if not df_tk.empty:
            col_f_block = self._find_col(df_tk, ['Block', 'Block nhân sự'], default_idx=5)
            ns_col = self._find_col(df_tk, ['Nhân sự', 'Nhân viên'], default_idx=17)
            hd_col = self._find_col(df_tk, ['Số HĐ', 'Số hợp đồng'], default_idx=3)
            kh_col = self._find_col(df_tk, ['Tên KH', 'Khách Hàng'], default_idx=6)
            time_created_col = self._find_col(df_tk, ['TG tạo PTC', 'Thời gian tạo', 'TG Tạo'], default_idx=11)
            loai_col = self._find_col(df_tk, ['Loại triển khai', 'Loại giao dịch', 'Đơn hàng & Dịch Vụ'], default_idx=12)
            note_col = self._find_col(df_tk, ['Ghi chú triển khai TIN/PNC', 'Ghi chú triển khai', 'Ghi chú'], default_idx=21)

            for _, r in df_tk.iterrows():
                ns = str(r.get(ns_col, '')).strip().upper()
                if ns in ('NAN', 'NONE', '-', 'NULL'):
                    ns = ''
                
                block_f = str(r.get(col_f_block, '')).strip()
                if block_f and block_f.upper() not in ('NAN', 'NONE', '-', 'NULL'):
                    block = block_f
                elif ns and hr_map.get(ns, {}).get('block'):
                    block = hr_map.get(ns, {}).get('block')
                else:
                    block = '(Không xác định)'

                info = hr_map.get(ns, {})
                doi_truong = info.get('truong') or ns_by_block.get(block, {}).get('truong') or '(chưa rõ)'

                raw_created = str(r.get(time_created_col, '')).strip()
                dt_created = pd.to_datetime(raw_created, dayfirst=True, errors='coerce')
                
                ton_hrs = 0.0
                if pd.notnull(dt_created):
                    ton_hrs = round((now - dt_created).total_seconds() / 3600.0, 1)

                note_raw = str(r.get(note_col, '')).strip()
                has_note = bool(note_raw and note_raw.upper() not in ('NAN', 'NONE', '-', 'NULL', ''))

                tk_list.append({
                    'id': f"TK_{len(tk_list) + 1}",
                    'type': 'TK',
                    'typeLabel': 'Triển Khai',
                    'soHd': str(r.get(hd_col, '')).strip(),
                    'tenKh': str(r.get(kh_col, '')).strip(),
                    'block': block,
                    'doiTruong': doi_truong,
                    'nhanSu': ns,
                    'loaiGd': str(r.get(loai_col, '')).strip(),
                    'createdAt': raw_created,
                    'tonHrs': ton_hrs,
                    'isOver72h': ton_hrs > 72,
                    'isOver24h': ton_hrs > 24,
                    'hasNote': has_note,
                    'noteStatus': 'Có ghi chú' if has_note else 'Chưa ghi chú',
                    'noteContent': note_raw if has_note else ''
                })

        # Parse BT list
        bt_list = []
        if not df_bt.empty:
            col_e_block = self._find_col(df_bt, ['Block'], default_idx=4)
            ns_col = self._find_col(df_bt, ['Nhân sự', 'Nhân viên'], default_idx=18)
            hd_col = self._find_col(df_bt, ['Số HĐ', 'Số hợp đồng'], default_idx=5)
            kh_col = self._find_col(df_bt, ['Tên đầy đủ', 'Tên KH', 'Khách Hàng'], default_idx=6)
            time_created_col = self._find_col(df_bt, ['Thời gian tạo', 'TG Tạo', 'TG tạo'], default_idx=7)
            ton_hrs_col = self._find_col(df_bt, ['Tồn giờ', 'Giờ tồn'], default_idx=8)
            tinh_trang_col = self._find_col(df_bt, ['TTSCBĐ 1', 'TTSCBĐ', 'Tình trạng'], default_idx=28)
            note_cc_col = self._find_col(df_bt, ['Ghi Chú CC', 'Ghi chú CC'], default_idx=22)
            note_ktv_col = self._find_col(df_bt, ['Ghi Chú KTV Gần Nhất', 'Ghi chú KTV'], default_idx=23)

            for _, r in df_bt.iterrows():
                ns = str(r.get(ns_col, '')).strip().upper()
                if ns in ('NAN', 'NONE', '-', 'NULL'):
                    ns = ''
                
                block_e = str(r.get(col_e_block, '')).strip()
                if block_e and block_e.upper() not in ('NAN', 'NONE', '-', 'NULL'):
                    block = block_e
                elif ns and hr_map.get(ns, {}).get('block'):
                    block = hr_map.get(ns, {}).get('block')
                else:
                    block = '(Không xác định)'

                info = hr_map.get(ns, {})
                doi_truong = info.get('truong') or ns_by_block.get(block, {}).get('truong') or '(chưa rõ)'

                raw_hrs = str(r.get(ton_hrs_col, '')).strip()
                ton_hrs = 0.0
                try:
                    ton_hrs = float(raw_hrs)
                except Exception:
                    raw_created = str(r.get(time_created_col, '')).strip()
                    dt_created = pd.to_datetime(raw_created, dayfirst=True, errors='coerce')
                    if pd.notnull(dt_created):
                        ton_hrs = round((now - dt_created).total_seconds() / 3600.0, 1)

                raw_created = str(r.get(time_created_col, '')).strip()

                note_cc = str(r.get(note_cc_col, '')).strip()
                note_ktv = str(r.get(note_ktv_col, '')).strip()
                parts = []
                if note_cc and note_cc.upper() not in ('NAN', 'NONE', '-', 'NULL'):
                    parts.append(f"Ghi chú CC: {note_cc}")
                if note_ktv and note_ktv.upper() not in ('NAN', 'NONE', '-', 'NULL'):
                    parts.append(f"Ghi chú KTV: {note_ktv}")

                note_raw = "\n".join(parts)
                has_note = len(parts) > 0

                bt_list.append({
                    'id': f"BT_{len(bt_list) + 1}",
                    'type': 'BT',
                    'typeLabel': 'Bảo Trì',
                    'soHd': str(r.get(hd_col, '')).strip(),
                    'tenKh': str(r.get(kh_col, '')).strip(),
                    'block': block,
                    'doiTruong': doi_truong,
                    'nhanSu': ns,
                    'loaiGd': str(r.get(tinh_trang_col, '')).strip() or 'Sự cố bảo trì',
                    'createdAt': raw_created,
                    'tonHrs': ton_hrs,
                    'isOver72h': ton_hrs > 72,
                    'isOver24h': ton_hrs > 24,
                    'hasNote': has_note,
                    'noteStatus': 'Có Thông Tin' if has_note else 'Chưa có Thông Tin',
                    'noteContent': note_raw if has_note else ''
                })

        # Calculate Overall Metrics
        count_tk_total = len(tk_list)
        count_bt_total = len(bt_list)
        count_all = count_tk_total + count_bt_total

        count_tk_72h = sum(1 for r in tk_list if r['isOver72h'])
        count_bt_24h = sum(1 for r in bt_list if r['isOver24h'])

        has_note_count = sum(1 for r in tk_list if r['hasNote']) + sum(1 for r in bt_list if r['hasNote'])
        note_pct = round((has_note_count / count_all) * 100.0, 1) if count_all > 0 else 0.0

        # Summary grouped by Block
        all_blocks = sorted(list(set(
            list(ns_by_block.keys()) +
            [r['block'] for r in tk_list] +
            [r['block'] for r in bt_list]
        )))

        summary_table = []
        for b in all_blocks:
            if not b or b == 'nan':
                continue

            info = ns_by_block.get(b, {})
            lead = info.get('truong') or '(chưa rõ)'
            
            b_tk = [r for r in tk_list if r['block'] == b]
            b_bt = [r for r in bt_list if r['block'] == b]

            if not b_tk and not b_bt:
                continue

            tk_count = len(b_tk)
            bt_count = len(b_bt)
            all_count = tk_count + bt_count

            tk_72h = sum(1 for r in b_tk if r['isOver72h'])
            bt_24h = sum(1 for r in b_bt if r['isOver24h'])
            
            b_notes = sum(1 for r in b_tk if r['hasNote']) + sum(1 for r in b_bt if r['hasNote'])
            b_note_pct = round((b_notes / all_count) * 100.0, 1) if all_count > 0 else 0.0

            summary_table.append({
                'block': b,
                'doiTruong': lead,
                'slActive': info.get('activeCount', 0),
                'totTK': tk_count,
                'totBT': bt_count,
                'totAll': all_count,
                'tk72h': tk_72h,
                'bt24h': bt_24h,
                'bNotes': b_notes,
                'bNotePct': b_note_pct
            })

        return {
            'generatedAt': datetime.datetime.now().strftime('%d/%m/%Y %H:%M'),
            'totalAll': count_all,
            'totalTK': count_tk_total,
            'totalBT': count_bt_total,
            'countTK72h': count_tk_72h,
            'countBT24h': count_bt_24h,
            'hasNoteCount': has_note_count,
            'notePct': note_pct,
            'summaryTable': summary_table,
            'tkList': tk_list,
            'btList': bt_list
        }

    def import_ton_tk_bt(self, file_bytes: bytes, filename: str, mode: str = "AUTO"):
        try:
            df = self._read_any_dataframe(file_bytes, filename)
        except Exception as e:
            return {"ok": False, "error": f"Lỗi đọc file: {str(e)}"}

        if df is None or df.empty:
            return {"ok": False, "error": "File rỗng hoặc không đọc được dữ liệu. Vui lòng kiểm tra định dạng file (.xlsx, .xls, .csv)."}

        cols_str = " ".join([str(c).strip().upper() for c in df.columns])
        
        detected_mode = mode
        if mode == "AUTO":
            if any(k in cols_str for k in ['TG TẠO PTC', 'LOẠI TRIỂN KHAI', 'TIN/PNC', 'PTC']):
                detected_mode = "TK"
            elif any(k in cols_str for k in ['TTSCBĐ', 'TỒN GIỜ', 'KTV GẦN NHẤT', 'BẢO TRÌ']):
                detected_mode = "BT"
            else:
                detected_mode = "TK"

        imported_count = len(df)

        if detected_mode == "TK":
            self.ton_tk_df = df
            try:
                df.to_pickle(CACHE_DIR / "ton_tk.pkl.gz")
            except Exception as e:
                print(f"Warning saving ton_tk cache: {e}", flush=True)
            label = "Tồn Triển Khai (TK)"
        else:
            self.ton_bt_df = df
            try:
                df.to_pickle(CACHE_DIR / "ton_bt.pkl.gz")
            except Exception as e:
                print(f"Warning saving ton_bt cache: {e}", flush=True)
            label = "Tồn Bảo Trì (BT)"

        return {
            "ok": True,
            "mode": detected_mode,
            "count": imported_count,
            "message": f"Đã cập nhật thành công {imported_count} dòng cho {label}!"
        }

    def get_dataset_counts(self):
        # Ensure dataset dataframes are loaded from cache if empty
        for target, cache_name, attr in [
            ("kh_cls", "kh_cls.pkl.gz", "kh_cls_df"),
            ("cll30n", "cll30n.pkl.gz", "cll30n_df"),
            ("tk", "tk.pkl.gz", "tk_df"),
            ("bt", "bt.pkl.gz", "bt_df"),
            ("ton_tk", "ton_tk.pkl.gz", "ton_tk_df"),
            ("ton_bt", "ton_bt.pkl.gz", "ton_bt_df")
        ]:
            df = getattr(self, attr, pd.DataFrame())
            if (df is None or df.empty) and (CACHE_DIR / cache_name).exists():
                try:
                    df = pd.read_pickle(CACHE_DIR / cache_name)
                    setattr(self, attr, df)
                except Exception:
                    pass

        return {
            "ok": True,
            "counts": {
                "kh_cls": len(getattr(self, 'kh_cls_df', pd.DataFrame())),
                "cll30n": len(getattr(self, 'cll30n_df', pd.DataFrame())),
                "tk": len(getattr(self, 'tk_df', pd.DataFrame())),
                "bt": len(getattr(self, 'bt_df', pd.DataFrame())),
                "ton_tk": len(getattr(self, 'ton_tk_df', pd.DataFrame())),
                "ton_bt": len(getattr(self, 'ton_bt_df', pd.DataFrame()))
            }
        }

    def _enrich_tk_df(self, df_tk: pd.DataFrame) -> pd.DataFrame:
        if df_tk is None or df_tk.empty:
            return pd.DataFrame()
        df = df_tk.copy()
        col_nv = self._get_required_col(df, ['Nhân viên', 'Nhân sự', 'nhan_vien']) or (df.columns[0] if len(df.columns) > 0 else 'Nhân viên')
        col_hd = self._get_required_col(df, ['Số hợp đồng', 'Số HĐ', 'so_hd']) or (df.columns[1] if len(df.columns) > 1 else 'Số hợp đồng')
        col_goi = self._find_col(df, ['Gói dịch vụ', 'goi_dich_vu'], default_idx=None)
        col_loai = self._find_col(df, ['Loại giao dịch', 'loai_giao_dich'], default_idx=None)
        col_dh = self._find_col(df, ['Đúng hẹn', 'dung_hen'], default_idx=None)
        col_complete = self._find_col(df, ['Ngày hoàn tất PTC', 'TG hoàn tất PTC', 'TG hoàn tất', 'Ngày online'], default_idx=None)
        col_created = self._find_col(df, ['TG tạo PTC', 'TG tạo', 'Ngày tạo'], default_idx=None)

        if col_nv and col_nv in df.columns: df['Nhân viên'] = df[col_nv].astype(str).str.strip().str.upper()
        if col_hd and col_hd in df.columns: df['Số hợp đồng'] = df[col_hd].astype(str).str.strip()
        goi_str = df[col_goi].astype(str) if col_goi and col_goi in df.columns else pd.Series('', index=df.index)
        loai_str = df[col_loai].astype(str) if col_loai and col_loai in df.columns else pd.Series('', index=df.index)

        df['is_gsafe'] = (df['Số hợp đồng'].astype(str).str.startswith('SGG', na=False)) & (goi_str.str.lower() == 'offnet')
        df['is_swap'] = loai_str.str.contains('Swap', case=False, na=False)

        dh_series = df[col_dh] if col_dh and col_dh in df.columns else pd.Series(0, index=df.index)
        df['dung_hen'] = pd.to_numeric(dh_series, errors='coerce').fillna(0).astype(int)

        complete_series = df[col_complete] if col_complete and col_complete in df.columns else pd.Series('', index=df.index)
        created_series = df[col_created] if col_created and col_created in df.columns else pd.Series('', index=df.index)

        df['dt_complete'] = pd.to_datetime(complete_series, dayfirst=True, errors='coerce')
        df['dt_created'] = pd.to_datetime(created_series, dayfirst=True, errors='coerce')
        df['date_complete'] = df['dt_complete'].dt.date

        rt_sec = (df['dt_complete'] - df['dt_created']).dt.total_seconds()
        df['rt_hours'] = np.where(rt_sec >= 0, rt_sec / 3600.0, np.nan)
        return df

    def _enrich_bt_df(self, df_bt: pd.DataFrame) -> pd.DataFrame:
        if df_bt is None or df_bt.empty:
            return pd.DataFrame()
        df = df_bt.copy()
        col_nv = self._get_required_col(df, ['Nhân viên', 'Nhân sự', 'nhan_vien']) or (df.columns[0] if len(df.columns) > 0 else 'Nhân viên')
        col_hd = self._get_required_col(df, ['Số HĐ', 'Số hợp đồng', 'so_hd']) or (df.columns[1] if len(df.columns) > 1 else 'Số HĐ')
        col_dh = self._find_col(df, ['Đúng hẹn', 'dung_hen'], default_idx=None)
        col_complete = self._find_col(df, ['TG Hoàn Tất', 'Thời gian hoàn tất', 'TG hoàn tất'], default_idx=None)
        col_created = self._find_col(df, ['TG Tạo', 'Thời gian tạo', 'TG tạo'], default_idx=None)

        if col_nv and col_nv in df.columns: df['Nhân viên'] = df[col_nv].astype(str).str.strip().str.upper()
        if col_hd and col_hd in df.columns: df['Số HĐ'] = df[col_hd].astype(str).str.strip()

        dh_series = df[col_dh] if col_dh and col_dh in df.columns else pd.Series(0, index=df.index)
        df['dung_hen'] = pd.to_numeric(dh_series, errors='coerce').fillna(0).astype(int)

        complete_series = df[col_complete] if col_complete and col_complete in df.columns else pd.Series('', index=df.index)
        created_series = df[col_created] if col_created and col_created in df.columns else pd.Series('', index=df.index)

        df['dt_complete'] = pd.to_datetime(complete_series, dayfirst=True, errors='coerce')
        df['dt_created'] = pd.to_datetime(created_series, dayfirst=True, errors='coerce')
        df['date_complete'] = df['dt_complete'].dt.date

        rt_sec_bt = (df['dt_complete'] - df['dt_created']).dt.total_seconds()
        df['rt_hours'] = np.where(rt_sec_bt >= 0, rt_sec_bt / 3600.0, np.nan)
        return df

    def import_database_dataset(self, file_bytes: bytes, filename: str, target: str = "kh_cls", rule: str = "MERGE_NO_OVERWRITE"):
        try:
            df_incoming = self._read_any_dataframe(file_bytes, filename)
        except Exception as e:
            return {"ok": False, "error": f"Lỗi đọc file: {str(e)}"}

        if df_incoming is None or df_incoming.empty:
            return {"ok": False, "error": "File rỗng hoặc không đọc được dữ liệu. Vui lòng kiểm tra định dạng file (.xlsx, .xls, .csv)."}

        total_incoming = len(df_incoming)
        cols_lower = [str(c).strip().lower() for c in df_incoming.columns]

        if target in ("kh_cls", "cll30n"):
            target_label = "KH Có Cls / CLL30N (Data Base)"

            df_inc_processed = self._process_cll30n_df(df_incoming)
            if df_inc_processed.empty:
                return {
                    "ok": False,
                    "error": "❌ Lỗi Cấu Trúc File Import! File tải lên không tìm thấy các cột bắt buộc (Số HĐ, Nhân viên, hoặc Thời gian hoàn tất)."
                }

            if target == "kh_cls":
                # Mẫu số: kh_cls_df contains ALL rows from df_inc_processed
                inc_cls = df_inc_processed.copy()
                existing_cls = getattr(self, 'kh_cls_df', pd.DataFrame())
                if existing_cls.empty and (CACHE_DIR / "kh_cls.pkl.gz").exists():
                    try: existing_cls = pd.read_pickle(CACHE_DIR / "kh_cls.pkl.gz")
                    except Exception: existing_cls = pd.DataFrame()
                
                added_count = total_incoming
                skipped_count = 0
                if rule == "OVERWRITE" or existing_cls.empty:
                    merged_cls = inc_cls.drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                else:
                    merged_cls = pd.concat([existing_cls, inc_cls], ignore_index=True).drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                self._save_pickle(merged_cls, "kh_cls.pkl.gz")
                self.kh_cls_df = merged_cls

                # Tử số: cll30n_df contains rows from df_inc_processed where is_cll30n == True
                inc_cll = df_inc_processed[df_inc_processed['is_cll30n'] == True]
                existing_cll = getattr(self, 'cll30n_df', pd.DataFrame())
                if existing_cll.empty and (CACHE_DIR / "cll30n.pkl.gz").exists():
                    try: existing_cll = pd.read_pickle(CACHE_DIR / "cll30n.pkl.gz")
                    except Exception: existing_cll = pd.DataFrame()

                if rule == "OVERWRITE" or existing_cll.empty:
                    merged_cll = inc_cll.drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                else:
                    merged_cll = pd.concat([existing_cll, inc_cll], ignore_index=True).drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                self._save_pickle(merged_cll, "cll30n.pkl.gz")
                self.cll30n_df = merged_cll
                db_total = len(merged_cls)

            else: # target == "cll30n"
                existing_cll = getattr(self, 'cll30n_df', pd.DataFrame())
                if existing_cll.empty and (CACHE_DIR / "cll30n.pkl.gz").exists():
                    try: existing_cll = pd.read_pickle(CACHE_DIR / "cll30n.pkl.gz")
                    except Exception: existing_cll = pd.DataFrame()

                added_count = total_incoming
                skipped_count = 0
                if rule == "OVERWRITE" or existing_cll.empty:
                    merged_cll = df_inc_processed.drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                else:
                    merged_cll = pd.concat([existing_cll, df_inc_processed], ignore_index=True).drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                self._save_pickle(merged_cll, "cll30n.pkl.gz")
                self.cll30n_df = merged_cll
                db_total = len(merged_cll)

        elif target == "tk":
            target_label = "Data Triển Khai (TK)"
            col_hd = self._get_required_col(df_incoming, ['Số hợp đồng', 'Số HĐ', 'so_hd'])
            col_nv = self._get_required_col(df_incoming, ['Nhân viên', 'Nhân sự', 'nhan_vien'])

            missing_cols = []
            if not col_hd: missing_cols.append("Số hợp đồng")
            if not col_nv: missing_cols.append("Nhân viên")

            if missing_cols:
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File Import! File tải lên không đúng cấu trúc dataset [{target_label}]. Thiếu các cột bắt buộc: [{', '.join(missing_cols)}]."
                }

            sample_hds = df_incoming[col_hd].dropna().astype(str).str.strip()
            if sample_hds.empty or (sample_hds.str.len() < 3).all():
                return {
                    "ok": False,
                    "error": "❌ Lỗi Dữ Liệu! Cột 'Số hợp đồng' trong file rỗng hoặc chứa dữ liệu không hợp lệ."
                }

            existing_df = getattr(self, 'tk_df', pd.DataFrame())
            if existing_df.empty and (CACHE_DIR / "tk.pkl.gz").exists():
                try:
                    existing_df = pd.read_pickle(CACHE_DIR / "tk.pkl.gz")
                except Exception:
                    existing_df = pd.DataFrame()

            if rule == "MERGE_NO_OVERWRITE" and not existing_df.empty:
                ex_hd = self._find_col(existing_df, ['Số hợp đồng', 'Số HĐ'], default_idx=0)
                ex_nv = self._find_col(existing_df, ['Nhân viên', 'Nhân sự'], default_idx=1)
                existing_keys = set(existing_df[ex_hd].astype(str).str.strip().str.upper() + "||" + existing_df[ex_nv].astype(str).str.strip().str.upper())
                df_incoming['_comp_key'] = df_incoming[col_hd].astype(str).str.strip().str.upper() + "||" + df_incoming[col_nv].astype(str).str.strip().str.upper()

                new_rows = df_incoming[~df_incoming['_comp_key'].isin(existing_keys)].drop(columns=['_comp_key'])
                added_count = len(new_rows)
                skipped_count = total_incoming - added_count
                merged_df = pd.concat([existing_df, new_rows], ignore_index=True) if added_count > 0 else existing_df
            else:
                added_count = total_incoming
                skipped_count = 0
                merged_df = df_incoming if existing_df.empty else pd.concat([existing_df, df_incoming], ignore_index=True)

            merged_df = self._enrich_tk_df(merged_df)
            self._save_pickle(merged_df, "tk.pkl.gz")
            self.tk_df = merged_df
            db_total = len(merged_df)

        elif target == "bt":
            target_label = "Data Bảo Trì (BT)"
            col_hd = self._get_required_col(df_incoming, ['Số HĐ', 'Số hợp đồng', 'so_hd'])
            col_nv = self._get_required_col(df_incoming, ['Nhân viên', 'Nhân sự', 'nhan_vien'])

            missing_cols = []
            if not col_hd: missing_cols.append("Số HĐ")
            if not col_nv: missing_cols.append("Nhân viên")

            if missing_cols:
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File Import! File tải lên không đúng cấu trúc dataset [{target_label}]. Thiếu các cột bắt buộc: [{', '.join(missing_cols)}]."
                }

            sample_hds = df_incoming[col_hd].dropna().astype(str).str.strip()
            if sample_hds.empty or (sample_hds.str.len() < 3).all():
                return {
                    "ok": False,
                    "error": "❌ Lỗi Dữ Liệu! Cột 'Số HĐ' trong file rỗng hoặc chứa dữ liệu không hợp lệ."
                }

            existing_df = getattr(self, 'bt_df', pd.DataFrame())
            if existing_df.empty and (CACHE_DIR / "bt.pkl.gz").exists():
                try:
                    existing_df = pd.read_pickle(CACHE_DIR / "bt.pkl.gz")
                except Exception:
                    existing_df = pd.DataFrame()

            if rule == "MERGE_NO_OVERWRITE" and not existing_df.empty:
                ex_hd = self._find_col(existing_df, ['Số HĐ', 'Số hợp đồng'], default_idx=0)
                ex_nv = self._find_col(existing_df, ['Nhân viên', 'Nhân sự'], default_idx=3)
                existing_keys = set(existing_df[ex_hd].astype(str).str.strip().str.upper() + "||" + existing_df[ex_nv].astype(str).str.strip().str.upper())
                df_incoming['_comp_key'] = df_incoming[col_hd].astype(str).str.strip().str.upper() + "||" + df_incoming[col_nv].astype(str).str.strip().str.upper()

                new_rows = df_incoming[~df_incoming['_comp_key'].isin(existing_keys)].drop(columns=['_comp_key'])
                added_count = len(new_rows)
                skipped_count = total_incoming - added_count
                merged_df = pd.concat([existing_df, new_rows], ignore_index=True) if added_count > 0 else existing_df
            else:
                added_count = total_incoming
                skipped_count = 0
                merged_df = df_incoming if existing_df.empty else pd.concat([existing_df, df_incoming], ignore_index=True)

            merged_df = self._enrich_bt_df(merged_df)
            self._save_pickle(merged_df, "bt.pkl.gz")
            self.bt_df = merged_df
            db_total = len(merged_df)

        elif target == "ton_tk":
            target_label = "Tồn Triển Khai (TK)"
            if len(df_incoming.columns) < 3:
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File! File tải lên chỉ có {len(df_incoming.columns)} cột, không đủ cấu trúc chuẩn tối thiểu của dataset [{target_label}]."
                }

            # Check cross-dataset markers
            if any(m in cols_lower for m in ['tồn giờ', 'hạn còn lại', 'múi hẹn xanh', 'cl lặp']):
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File Import! File tải lên chứa các cột của Tồn Bảo Trì (Tồn giờ / Hạn còn lại). Vui lòng chọn đúng đối tượng Tồn Bảo Trì!"
                }

            hd_col_in = self._get_required_col(df_incoming, ['Số HĐ', 'Số hợp đồng'])
            if not hd_col_in:
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File Import! File tải lên không đúng cấu trúc hiện hành của [{target_label}]. Thiếu cột bắt buộc 'Số HĐ'."
                }

            sample_hds = df_incoming[hd_col_in].dropna().astype(str).str.strip()
            if sample_hds.empty or (sample_hds.str.len() < 3).all():
                return {
                    "ok": False,
                    "error": "❌ Lỗi Dữ Liệu! Cột 'Số HĐ' trong file rỗng hoặc chứa dữ liệu số hợp đồng không hợp lệ."
                }

            existing_df = getattr(self, 'ton_tk_df', pd.DataFrame())
            if existing_df.empty and (CACHE_DIR / "ton_tk.pkl.gz").exists():
                try:
                    existing_df = pd.read_pickle(CACHE_DIR / "ton_tk.pkl.gz")
                except Exception:
                    existing_df = pd.DataFrame()

            if rule == "MERGE_NO_OVERWRITE" and not existing_df.empty:
                hd_col_ex = self._find_col(existing_df, ['Số HĐ', 'Số hợp đồng'], default_idx=3)
                existing_keys = set(existing_df[hd_col_ex].astype(str).str.strip().str.upper())
                df_incoming['_comp_key'] = df_incoming[hd_col_in].astype(str).str.strip().str.upper()
                
                new_rows = df_incoming[~df_incoming['_comp_key'].isin(existing_keys)].drop(columns=['_comp_key'])
                added_count = len(new_rows)
                skipped_count = total_incoming - added_count
                merged_df = pd.concat([existing_df, new_rows], ignore_index=True) if added_count > 0 else existing_df
            else:
                added_count = total_incoming
                skipped_count = 0
                merged_df = df_incoming

            self._save_pickle(merged_df, "ton_tk.pkl.gz")
            self.ton_tk_df = merged_df
            db_total = len(merged_df)

        elif target == "ton_bt":
            target_label = "Tồn Bảo Trì (BT)"
            if len(df_incoming.columns) < 3:
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File! File tải lên chỉ có {len(df_incoming.columns)} cột, không đủ cấu trúc chuẩn tối thiểu của dataset [{target_label}]."
                }

            # Check cross-dataset markers
            if any(m in cols_lower for m in ['ghi chú triển khai tin/pnc', 'loại triển khai', 'thông số thi công']):
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File Import! File tải lên chứa các cột của Tồn Triển Khai (Thông số thi công / Loại triển khai). Vui lòng chọn đúng đối tượng Tồn Triển Khai!"
                }

            hd_col_in = self._get_required_col(df_incoming, ['Số HĐ', 'Số hợp đồng'])
            if not hd_col_in:
                return {
                    "ok": False,
                    "error": f"❌ Lỗi Cấu Trúc File Import! File tải lên không đúng cấu trúc hiện hành của [{target_label}]. Thiếu cột bắt buộc 'Số HĐ'."
                }

            sample_hds = df_incoming[hd_col_in].dropna().astype(str).str.strip()
            if sample_hds.empty or (sample_hds.str.len() < 3).all():
                return {
                    "ok": False,
                    "error": "❌ Lỗi Dữ Liệu! Cột 'Số HĐ' trong file rỗng hoặc chứa dữ liệu số hợp đồng không hợp lệ."
                }

            existing_df = getattr(self, 'ton_bt_df', pd.DataFrame())
            if existing_df.empty and (CACHE_DIR / "ton_bt.pkl.gz").exists():
                try:
                    existing_df = pd.read_pickle(CACHE_DIR / "ton_bt.pkl.gz")
                except Exception:
                    existing_df = pd.DataFrame()

            if rule == "MERGE_NO_OVERWRITE" and not existing_df.empty:
                hd_col_ex = self._find_col(existing_df, ['Số HĐ', 'Số hợp đồng'], default_idx=5)
                existing_keys = set(existing_df[hd_col_ex].astype(str).str.strip().str.upper())
                df_incoming['_comp_key'] = df_incoming[hd_col_in].astype(str).str.strip().str.upper()
                
                new_rows = df_incoming[~df_incoming['_comp_key'].isin(existing_keys)].drop(columns=['_comp_key'])
                added_count = len(new_rows)
                skipped_count = total_incoming - added_count
                merged_df = pd.concat([existing_df, new_rows], ignore_index=True) if added_count > 0 else existing_df
            else:
                added_count = total_incoming
                skipped_count = 0
                merged_df = df_incoming

            self._save_pickle(merged_df, "ton_bt.pkl.gz")
            self.ton_bt_df = merged_df
            db_total = len(merged_df)
        else:
            return {"ok": False, "error": "Bảng dữ liệu mục tiêu không hợp lệ."}

        return {
            "ok": True,
            "target": target,
            "target_label": target_label,
            "total": total_incoming,
            "added": added_count,
            "skipped": skipped_count,
            "db_total": db_total,
            "message": f"Nạp dữ liệu [{target_label}] vào Kho Data Base thành công! Thêm mới {added_count} dòng, bỏ qua {skipped_count} dòng trùng lặp (giữ nguyên dữ liệu cũ). Tổng dữ liệu DB hệ thống hiện tại: {db_total} dòng."
        }

    def clear_database_dataset(self, target: str, confirm_password: str):
        if not confirm_password or confirm_password.strip() != "phongnh5":
            return {"ok": False, "error": "❌ Mật khẩu xác nhận Quản trị viên không đúng! Vui lòng thử lại."}

        def _safe_remove_cache(fname):
            base_name = fname.replace('.pkl.gz', '').replace('.pkl', '')
            targets = [
                CACHE_DIR / f"{base_name}.pkl.gz",
                CACHE_DIR / f"{base_name}.pkl",
                CACHE_DIR / f"{base_name}.pkl.gz.tmp",
                CACHE_DIR / f"{base_name}.pkl.tmp",
                Path("/tmp/data_cache") / f"{base_name}.pkl.gz",
                Path("/tmp/data_cache") / f"{base_name}.pkl",
                Path("/tmp/data_cache") / f"{base_name}.pkl.gz.tmp",
                Path("/tmp/data_cache") / f"{base_name}.pkl.tmp"
            ]
            for filepath in targets:
                try:
                    if filepath.exists():
                        filepath.unlink()
                except Exception as e:
                    print(f"Warning: Could not unlink {filepath}: {e}. Overwriting with empty DataFrame.", flush=True)
                    try:
                        pd.DataFrame().to_pickle(filepath)
                    except Exception:
                        pass

        target_clean = str(target).strip().lower()
        if target_clean == "kh_cls":
            self.kh_cls_df = pd.DataFrame()
            self.cll30n_df = pd.DataFrame()
            _safe_remove_cache("kh_cls.pkl.gz")
            _safe_remove_cache("cll30n.pkl.gz")
            label = "KH Có Cls & CLL30N (Data Base)"
        elif target_clean == "cll30n":
            self.cll30n_df = pd.DataFrame()
            _safe_remove_cache("cll30n.pkl.gz")
            label = "CLL30N (Data Base)"
        elif target_clean == "tk":
            self.tk_df = pd.DataFrame()
            _safe_remove_cache("tk.pkl.gz")
            label = "Data Triển Khai (TK)"
        elif target_clean == "bt":
            self.bt_df = pd.DataFrame()
            _safe_remove_cache("bt.pkl.gz")
            label = "Data Bảo Trì (BT)"
        elif target_clean == "ton_tk":
            self.ton_tk_df = pd.DataFrame()
            _safe_remove_cache("ton_tk.pkl.gz")
            label = "Tồn Triển Khai"
        elif target_clean == "ton_bt":
            self.ton_bt_df = pd.DataFrame()
            _safe_remove_cache("ton_bt.pkl.gz")
            label = "Tồn Bảo Trì"
        elif target_clean == "all":
            self.kh_cls_df = pd.DataFrame()
            self.cll30n_df = pd.DataFrame()
            self.tk_df = pd.DataFrame()
            self.bt_df = pd.DataFrame()
            self.ton_tk_df = pd.DataFrame()
            self.ton_bt_df = pd.DataFrame()
            for fname in ["kh_cls.pkl.gz", "cll30n.pkl.gz", "tk.pkl.gz", "bt.pkl.gz", "ton_tk.pkl.gz", "ton_bt.pkl.gz"]:
                _safe_remove_cache(fname)
            label = "TẤT CẢ DỮ LIỆU DATA BASE"
        else:
            return {"ok": False, "error": "Dataset mục tiêu không hợp lệ."}

        return {
            "ok": True,
            "target": target,
            "message": f"🗑️ Đã xóa sạch thành công toàn bộ dữ liệu [{label}]! Kho dữ liệu hiện tại là 0 dòng. Bạn có thể tiến hành import nạp lại từ đầu.",
            "db_total": 0
        }

    # =========================================================================
    # ADMIN USERS & AUTHENTICATION SYSTEM
    # =========================================================================
    PERMISSIONS_SHEET_URL = "https://docs.google.com/spreadsheets/d/10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY/export?format=csv&gid=0"

    def _load_admin_users(self):
        def _get_path(name):
            tmp_dir = Path("/tmp/data_cache")
            tmp_gz = tmp_dir / f"{name}.pkl.gz"
            if tmp_gz.exists():
                return tmp_gz
            tmp_pkl = tmp_dir / f"{name}.pkl"
            if tmp_pkl.exists():
                return tmp_pkl
            gz = CACHE_DIR / f"{name}.pkl.gz"
            if gz.exists():
                return gz
            return CACHE_DIR / f"{name}.pkl"

        sheet_fetched = False
        try:
            resp = requests.get(self.PERMISSIONS_SHEET_URL, timeout=8)
            if resp.status_code == 200 and resp.content:
                df = pd.read_csv(io.BytesIO(resp.content), dtype=str)
                if not df.empty:
                    col_map = {}
                    for col in df.columns:
                        c_clean = str(col).strip()
                        if 'id' in c_clean.lower():
                            col_map[col] = 'ID'
                        elif 'msnv' in c_clean.lower():
                            col_map[col] = 'MSNV'
                        elif 'họ' in c_clean.lower() or 'ho' in c_clean.lower():
                            col_map[col] = 'Họ và Tên'
                        elif 'mail' in c_clean.lower():
                            col_map[col] = 'Mail'
                        elif 'user' in c_clean.lower():
                            col_map[col] = 'User'
                        elif 'mật' in c_clean.lower() or 'mat' in c_clean.lower():
                            col_map[col] = 'Mật Khẩu'
                        elif 'quyền' in c_clean.lower() or 'quyen' in c_clean.lower():
                            col_map[col] = 'Quyền'
                        elif 'ứng dụng' in c_clean.lower() or 'ung dung' in c_clean.lower():
                            col_map[col] = 'Ứng dụng được xem'
                        elif 'trạng thái' in c_clean.lower() or 'trang thai' in c_clean.lower():
                            col_map[col] = 'Trạng thái'

                    df = df.rename(columns=col_map)
                    self.admin_users_df = df
                    sheet_fetched = True
                    print(f"Loaded {len(self.admin_users_df)} admin users from Google Sheet.", flush=True)
        except Exception as e:
            print(f"Google Sheet admin fetch failed: {e}", flush=True)

        if not sheet_fetched:
            admin_cache = _get_path("admin_users")
            if admin_cache.exists():
                try:
                    self.admin_users_df = pd.read_pickle(admin_cache)
                    print(f"Loaded {len(self.admin_users_df)} admin users from cache.", flush=True)
                except Exception as e:
                    print(f"Failed to read admin users cache: {e}", flush=True)

        if self.admin_users_df.empty:
            default_data = [{
                "ID": 1,
                "MSNV": "00110827",
                "Họ và Tên": "Nguyễn Hồng Phong",
                "Mail": "phuongnam.phongnh5@fpt.net",
                "User": "phuongnam.phongnh5",
                "Mật Khẩu": "Benngo@@2026",
                "Quyền": "admin",
                "Ứng dụng được xem": "Salary;KPIs;LichTruc;TonTKBT;Admin;HR;UserMgmt;ImportDB",
                "Trạng thái": "Active",
                "is_password_set": True
            }]
            self.admin_users_df = pd.DataFrame(default_data)

        for col in ['ID', 'MSNV', 'Họ và Tên', 'Mail', 'User', 'Mật Khẩu', 'Quyền', 'Ứng dụng được xem', 'Trạng thái']:
            if col not in self.admin_users_df.columns:
                self.admin_users_df[col] = ''

        self.admin_users_df['Trạng thái'] = self.admin_users_df['Trạng thái'].replace({'nan': 'Active', 'None': 'Active', '': 'Active'}).fillna('Active')
        self._sanitize_admin_users_df()
        self._save_admin_users()

    def _sanitize_admin_users_df(self):
        """Auto-fix MSNV and Name for admin users by matching against HR dataframe."""
        if self.admin_users_df.empty or self.hr_df.empty:
            return

        cols = list(self.hr_df.columns)
        col_email = cols[10] if len(cols) > 10 else 'Email' # Email (Column K)
        col_code = cols[5] if len(cols) > 5 else 'Mã NV'    # Numeric MSNV (Column F)
        col_name = cols[4] if len(cols) > 4 else 'Họ Tên NV' # Full Name (Column E)
        col_acc = cols[6] if len(cols) > 6 else 'Inside Account' # Inside Acc (Column G)

        modified = False
        for i, row in self.admin_users_df.iterrows():
            current_msnv = str(row.get('MSNV', '')).strip()
            mail = str(row.get('Mail', '')).strip().lower()
            user_alias = str(row.get('User', '')).strip().lower()

            # If MSNV is missing or contains Inside Account (like PNC01... or letters)
            if not current_msnv or not current_msnv.isdigit() or 'pnc' in current_msnv.lower() or '.' in current_msnv:
                for _, hr_row in self.hr_df.iterrows():
                    hr_mail = str(hr_row.get(col_email, '')).strip().lower()
                    hr_acc = str(hr_row.get(col_acc, '')).strip().lower()
                    if (mail and mail == hr_mail) or (user_alias and (user_alias == hr_acc or hr_acc.endswith(user_alias) or user_alias in hr_mail)):
                        true_msnv = str(hr_row.get(col_code, '')).strip()
                        true_name = str(hr_row.get(col_name, '')).strip()
                        if true_msnv and true_msnv != current_msnv:
                            self.admin_users_df.at[i, 'MSNV'] = true_msnv
                            modified = True
                        if true_name and (not row.get('Họ và Tên') or str(row.get('Họ và Tên')).lower() in ('nan', 'none', '')):
                            self.admin_users_df.at[i, 'Họ và Tên'] = true_name
                            modified = True
                        break

        if modified:
            self._save_pickle(self.admin_users_df, "admin_users.pkl.gz")

    def _save_admin_users(self):
        self._save_pickle(self.admin_users_df, "admin_users.pkl.gz")
        self.sync_admin_users_to_sheet()

    def set_permissions_webapp_url(self, url: str):
        self.PERMISSIONS_WEBAPP_URL = str(url).strip()
        try:
            cfg_file = CACHE_DIR / "webapp_config.json"
            cfg = {}
            if cfg_file.exists():
                try:
                    with open(cfg_file, 'r', encoding='utf-8') as f:
                        cfg = json.load(f)
                except Exception:
                    pass
            cfg['PERMISSIONS_WEBAPP_URL'] = self.PERMISSIONS_WEBAPP_URL
            with open(cfg_file, 'w', encoding='utf-8') as f:
                json.dump(cfg, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving webapp_config.json: {e}", flush=True)
        return {"ok": True, "url": self.PERMISSIONS_WEBAPP_URL, "msg": "Đã lưu Google Apps Script Web App URL!"}

    def get_permissions_webapp_url(self):
        return {"ok": True, "url": getattr(self, 'PERMISSIONS_WEBAPP_URL', '')}

    def sync_admin_users_to_sheet(self):
        url = getattr(self, 'PERMISSIONS_WEBAPP_URL', '') or os.environ.get("PERMISSIONS_WEBAPP_URL", "") or getattr(self, 'DEFAULT_PERMISSIONS_WEBAPP_URL', '')
        if not url:
            print("Notice: PERMISSIONS_WEBAPP_URL not set yet. Saved admin users locally.", flush=True)
            return {"ok": False, "msg": "Chưa cấu hình Google Apps Script Web App URL."}
        try:
            cols = ['ID', 'MSNV', 'Họ và Tên', 'Mail', 'User', 'Mật Khẩu', 'Quyền', 'Ứng dụng được xem', 'Trạng thái']
            records = []
            for idx, row in self.admin_users_df.iterrows():
                item = {}
                for col in cols:
                    val = row.get(col, '')
                    if pd.isna(val) or val is None:
                        val = ''
                    item[col] = str(val).strip()
                if not item['ID']:
                    item['ID'] = str(idx + 1)
                records.append(item)

            payload = {"action": "sync", "users": records}
            resp = requests.post(
                url,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'},
                allow_redirects=True,
                timeout=15
            )

            if resp.status_code == 200:
                res_data = {}
                try:
                    res_data = resp.json()
                except Exception:
                    pass
                print(f"Synced {len(records)} admin users to Google Sheet WebApp successfully.", flush=True)
                return {
                    "ok": True,
                    "count": len(records),
                    "msg": f"✅ Đã lưu và đồng bộ {len(records)} tài khoản lên Data Base hệ thống thành công!",
                    "response": res_data
                }
            elif resp.status_code == 403:
                return {
                    "ok": False,
                    "msg": "❌ Lỗi HTTP 403: Cần kiểm tra lại quyền kết nối WebApp API Data Base!"
                }
            else:
                print(f"Failed to sync to WebApp: status {resp.status_code}", flush=True)
                return {"ok": False, "msg": f"WebApp API trả về lỗi HTTP {resp.status_code}"}
        except Exception as e:
            print(f"Error calling WebApp sync: {e}", flush=True)
            return {"ok": False, "msg": f"Lỗi kết nối WebApp API: {e}"}

    def check_hr_email(self, email: str):
        if not email or not isinstance(email, str):
            return {"ok": False, "found": False, "msg": "Vui lòng nhập Email hợp lệ!"}

        target_mail = email.strip().lower()
        if self.hr_df.empty:
            return {"ok": False, "found": False, "msg": "Dữ liệu Nhân sự HR chưa sẵn sàng!"}

        cols = list(self.hr_df.columns)
        col_email = cols[10] if len(cols) > 10 else 'Email'
        col_code = cols[5] if len(cols) > 5 else 'Mã NV'
        col_name = cols[4] if len(cols) > 4 else 'Họ Tên NV'
        col_acc = cols[6] if len(cols) > 6 else 'Inside Account'

        for _, r in self.hr_df.iterrows():
            r_mail = str(r.get(col_email, '')).strip().lower()
            r_acc = str(r.get(col_acc, '')).strip().lower()
            if target_mail == r_mail or target_mail == r_acc or (r_acc and target_mail.startswith(r_acc)):
                msnv = str(r.get(col_code, '')).strip()
                name = str(r.get(col_name, '')).strip()
                full_mail = str(r.get(col_email, '')).strip() or email.strip()
                return {
                    "ok": True,
                    "found": True,
                    "msnv": msnv,
                    "name": name,
                    "mail": full_mail
                }

        return {"ok": True, "found": False, "msg": "Không tìm thấy thông tin nhân sự khớp với Email này trong hệ thống HR."}

    def authenticate_user(self, login_id: str, password: str):
        if not login_id or not password:
            return {"ok": False, "error": "Vui lòng nhập đầy đủ Tên đăng nhập (Mail/User) và Mật khẩu!"}

        target = login_id.strip().lower()
        pwd = str(password).strip()

        if self.admin_users_df.empty:
            self._load_admin_users()

        df = self.admin_users_df
        for _, r in df.iterrows():
            r_mail = str(r.get('Mail', '')).strip().lower()
            r_user = str(r.get('User', '')).strip().lower()
            r_pass = str(r.get('Mật Khẩu', '')).strip()
            r_status = str(r.get('Trạng thái', 'Active')).strip()

            if (target == r_mail or target == r_user) and pwd == r_pass:
                if r_status.lower() in ('inactive', 'ngưng hoạt động', 'khóa'):
                    return {
                        "ok": False,
                        "error": "Tài khoản của bạn đang ở trạng thái Inactive (Không hoạt động). Vui lòng liên hệ Admin để chuyển trạng thái sang Active!"
                    }

                allowed_apps_raw = str(r.get('Ứng dụng được xem', '')).strip()
                if not allowed_apps_raw:
                    allowed_apps_raw = "KPIs;LichTruc;TonTKBT;Admin;HR;UserMgmt;ImportDB;Salary" if str(r.get('Quyền', 'user')).strip().lower() == 'admin' else "Salary"

                import re
                apps_list = [x.strip() for x in re.split(r'[;,]', allowed_apps_raw) if x.strip()]

                return {
                    "ok": True,
                    "user": {
                        "id": int(r.get('ID', 1)) if str(r.get('ID', '')).isdigit() else 1,
                        "msnv": str(r.get('MSNV', '')).strip(),
                        "name": str(r.get('Họ và Tên', '')).strip(),
                        "mail": str(r.get('Mail', '')).strip(),
                        "user": str(r.get('User', '')).strip(),
                        "role": str(r.get('Quyền', 'user')).strip().lower(),
                        "status": r_status if r_status else 'Active',
                        "allowed_apps": apps_list,
                        "is_password_set": bool(r.get('is_password_set', True))
                    }
                }

        return {"ok": False, "error": "Tên đăng nhập (Mail/User) hoặc Mật khẩu không chính xác!"}

    def setup_initial_admin_password(self, mail_or_user: str, new_password: str):
        if not new_password or len(new_password) < 4:
            return {"ok": False, "error": "Mật khẩu mới phải có ít nhất 4 ký tự!"}

        target = mail_or_user.strip().lower()
        matched = False
        for i, r in self.admin_users_df.iterrows():
            r_mail = str(r.get('Mail', '')).strip().lower()
            r_user = str(r.get('User', '')).strip().lower()
            if target == r_mail or target == r_user or r_mail == 'phuongnam.phongnh5@fpt.net':
                self.admin_users_df.at[i, 'Mật Khẩu'] = new_password.strip()
                self.admin_users_df.at[i, 'is_password_set'] = True
                matched = True
                break

        if matched:
            self._save_admin_users()
            return {"ok": True, "message": "Đã cài đặt mật khẩu thành công!"}

        return {"ok": False, "error": "Không tìm thấy tài khoản admin tương ứng để cài mật khẩu!"}

    def register_user(self, mail: str, user_alias: str, password: str):
        if not mail or not password:
            return {"ok": False, "error": "Vui lòng nhập đầy đủ Email và Mật khẩu!"}

        clean_mail = mail.strip().lower()
        clean_user = (user_alias.strip() if user_alias else clean_mail.split('@')[0]).lower()

        for _, r in self.admin_users_df.iterrows():
            if str(r.get('Mail', '')).strip().lower() == clean_mail:
                return {"ok": False, "error": f"Email '{mail}' đã được đăng ký tài khoản trước đó!"}
            if str(r.get('User', '')).strip().lower() == clean_user:
                return {"ok": False, "error": f"User (mật danh) '{user_alias}' đã tồn tại! Vui lòng chọn mật danh khác."}

        hr_info = self.check_hr_email(clean_mail)
        found_in_hr = hr_info.get('ok') and hr_info.get('found')
        msnv = hr_info.get('msnv', '') if found_in_hr else ''
        name = hr_info.get('name', '') if found_in_hr else clean_user
        
        user_status = "Active" if found_in_hr else "Inactive"
        allowed_apps = "Salary"

        existing_ids = [int(x) for x in self.admin_users_df['ID'].dropna() if str(x).isdigit()]
        new_id = (max(existing_ids) + 1) if existing_ids else 1

        new_row = {
            "ID": new_id,
            "MSNV": msnv,
            "Họ và Tên": name,
            "Mail": clean_mail,
            "User": clean_user,
            "Mật Khẩu": password.strip(),
            "Quyền": "user",
            "Ứng dụng được xem": allowed_apps,
            "Trạng thái": user_status,
            "is_password_set": True
        }

        self.admin_users_df = pd.concat([self.admin_users_df, pd.DataFrame([new_row])], ignore_index=True)
        self._save_admin_users()

        msg = f"Đăng ký tài khoản thành công cho {name} ({clean_mail})! Trạng thái: Active (Đã xác thực HR)." if user_status == "Active" else f"Tài khoản {name} ({clean_mail}) đã đăng ký thành công! Nhưng do chưa nằm trong danh sách HR nên trạng thái là Inactive (Vui lòng chờ Admin kích hoạt Active)."

        return {
            "ok": True,
            "message": msg,
            "user": {
                "id": new_id,
                "msnv": msnv,
                "name": name,
                "mail": clean_mail,
                "user": clean_user,
                "role": "user",
                "status": user_status,
                "allowed_apps": ["Salary"]
            }
        }

    def get_admin_users(self):
        if self.admin_users_df.empty:
            self._load_admin_users()
        else:
            self._sanitize_admin_users_df()

        import re
        res = []
        for _, r in self.admin_users_df.iterrows():
            apps_raw = str(r.get('Ứng dụng được xem', '')).strip()
            if not apps_raw:
                apps_raw = "KPIs;LichTruc;TonTKBT;Admin;HR;UserMgmt;ImportDB;Salary" if str(r.get('Quyền', 'user')).strip().lower() == 'admin' else "Salary"

            status_val = str(r.get('Trạng thái', 'Active')).strip()
            if not status_val or status_val.lower() in ('nan', 'none', 'null'):
                status_val = 'Active'

            res.append({
                "id": int(r.get('ID', 0)) if str(r.get('ID', '')).isdigit() else 0,
                "msnv": str(r.get('MSNV', '')).strip(),
                "name": str(r.get('Họ và Tên', '')).strip(),
                "mail": str(r.get('Mail', '')).strip(),
                "user": str(r.get('User', '')).strip(),
                "password": str(r.get('Mật Khẩu', '')).strip(),
                "role": str(r.get('Quyền', 'user')).strip().lower(),
                "status": status_val,
                "allowed_apps": [x.strip() for x in re.split(r'[;,]', apps_raw) if x.strip()]
            })
        return res

    def add_admin_user(self, payload: dict):
        mail = str(payload.get('mail', '')).strip().lower()
        user_alias = str(payload.get('user', '')).strip().lower() or mail.split('@')[0]
        password = str(payload.get('password', '')).strip()
        role = str(payload.get('role', 'user')).strip().lower()
        status = str(payload.get('status', 'Active')).strip() or 'Active'
        msnv = str(payload.get('msnv', '')).strip()
        name = str(payload.get('name', '')).strip()
        allowed_apps = payload.get('allowed_apps', ["Salary"])
        allowed_str = ";".join(allowed_apps) if isinstance(allowed_apps, list) else str(allowed_apps)

        if not mail or not password:
            return {"ok": False, "error": "Vui lòng nhập Mail và Mật khẩu!"}

        existing_ids = [int(x) for x in self.admin_users_df['ID'].dropna() if str(x).isdigit()]
        new_id = (max(existing_ids) + 1) if existing_ids else 1

        new_row = {
            "ID": new_id,
            "MSNV": msnv,
            "Họ và Tên": name,
            "Mail": mail,
            "User": user_alias,
            "Mật Khẩu": password,
            "Quyền": role,
            "Ứng dụng được xem": allowed_str,
            "Trạng thái": status,
            "is_password_set": True
        }

        self.admin_users_df = pd.concat([self.admin_users_df, pd.DataFrame([new_row])], ignore_index=True)
        self._save_admin_users()
        return {"ok": True, "message": f"Đã thêm tài khoản {name} ({mail}) thành công!"}

    def update_admin_user(self, user_id: int, payload: dict):
        if self.admin_users_df.empty:
            self._load_admin_users()

        idx_to_update = None
        for i, r in self.admin_users_df.iterrows():
            if str(r.get('ID', '')).isdigit() and int(r.get('ID', 0)) == user_id:
                idx_to_update = i
                break

        if idx_to_update is None:
            return {"ok": False, "error": f"Không tìm thấy tài khoản với ID {user_id}!"}

        if 'msnv' in payload:
            self.admin_users_df.at[idx_to_update, 'MSNV'] = str(payload['msnv']).strip()
        if 'name' in payload:
            self.admin_users_df.at[idx_to_update, 'Họ và Tên'] = str(payload['name']).strip()
        if 'mail' in payload:
            self.admin_users_df.at[idx_to_update, 'Mail'] = str(payload['mail']).strip().lower()
        if 'user' in payload:
            self.admin_users_df.at[idx_to_update, 'User'] = str(payload['user']).strip().lower()
        if 'password' in payload and payload['password']:
            self.admin_users_df.at[idx_to_update, 'Mật Khẩu'] = str(payload['password']).strip()
        if 'role' in payload:
            self.admin_users_df.at[idx_to_update, 'Quyền'] = str(payload['role']).strip().lower()
        if 'status' in payload:
            self.admin_users_df.at[idx_to_update, 'Trạng thái'] = str(payload['status']).strip()
        if 'allowed_apps' in payload:
            allowed = payload['allowed_apps']
            self.admin_users_df.at[idx_to_update, 'Ứng dụng được xem'] = ";".join(allowed) if isinstance(allowed, list) else str(allowed)

        self._save_admin_users()
        return {"ok": True, "message": "Đã cập nhật thông tin tài khoản thành công!"}

    def delete_admin_user(self, user_id: int):
        if self.admin_users_df.empty:
            self._load_admin_users()

        self.admin_users_df = self.admin_users_df[self.admin_users_df['ID'].astype(int) != user_id]
        self._save_admin_users()
        return {"ok": True, "message": f"Đã xóa tài khoản ID {user_id} thành công!"}

    def get_hr_list(self, search: str = "", block: str = "__ALL__", team_lead: str = "__ALL__"):
        if self.hr_df.empty:
            return []

        cols = list(self.hr_df.columns)
        col_code = cols[5] if len(cols) > 5 else 'Mã NV'
        col_name = cols[4] if len(cols) > 4 else 'Họ Tên NV'
        col_acc = cols[6] if len(cols) > 6 else 'Inside Account'
        col_mail = cols[10] if len(cols) > 10 else 'Email'
        col_phone = cols[11] if len(cols) > 11 else 'Số điện thoại'
        col_block = cols[3] if len(cols) > 3 else 'Block'
        col_tl = cols[24] if len(cols) > 24 else 'Họ tên Đội trưởng'
        col_title = cols[14] if len(cols) > 14 else 'Chức danh'
        col_status = cols[13] if len(cols) > 13 else 'Tình trạng Hợp đồng'
        col_mobi = cols[28] if len(cols) > 28 else 'Mobisale'

        kw = search.strip().upper()
        res = []

        for idx, r in self.hr_df.iterrows():
            c_code = str(r.get(col_code, '')).strip()
            c_name = str(r.get(col_name, '')).strip()
            c_acc = str(r.get(col_acc, '')).strip()
            c_mobi = str(r.get(col_mobi, '')).strip()
            if c_mobi.upper() in ('NAN', 'NONE', '-', 'NULL'):
                c_mobi = ''
            c_mail = str(r.get(col_mail, '')).strip()
            c_block = str(r.get(col_block, '')).strip()
            c_tl = str(r.get(col_tl, '')).strip()
            c_title = str(r.get(col_title, '')).strip()
            c_status = str(r.get(col_status, '')).strip()

            if block != "__ALL__" and c_block != block:
                continue
            if team_lead != "__ALL__" and c_tl != team_lead:
                continue

            if kw:
                text = f"{c_code} {c_name} {c_acc} {c_mobi} {c_mail} {c_block} {c_tl}".upper()
                if kw not in text:
                    continue

            res.append({
                "stt": idx + 1,
                "code": c_code,
                "name": c_name,
                "account": c_acc,
                "mobisale": c_mobi,
                "mail": c_mail,
                "phone": str(r.get(col_phone, '')).strip(),
                "block": c_block,
                "team_lead": c_tl,
                "title": c_title,
                "status": c_status
            })

        return res

    def get_hr_detail(self, code: str):
        if self.hr_df.empty:
            return {"ok": False, "error": "Dữ liệu HR rỗng"}

        c = str(code).strip().upper()
        cols = list(self.hr_df.columns)
        col_code = cols[5] if len(cols) > 5 else 'Mã NV'
        col_acc = cols[6] if len(cols) > 6 else 'Inside Account'

        for _, r in self.hr_df.iterrows():
            if str(r.get(col_code, '')).strip().upper() == c or str(r.get(col_acc, '')).strip().upper() == c:
                detail = {}
                for k, v in r.items():
                    val = str(v).strip()
                    if val.upper() in ('NAN', 'NONE', 'NULL'):
                        val = ''
                    detail[str(k)] = val
                return {"ok": True, "detail": detail}

        return {"ok": False, "error": f"Không tìm thấy hồ sơ cho nhân sự {code}"}

    def add_hr_employee(self, payload: dict):
        if self.hr_df.empty:
            return {"ok": False, "error": "Chưa có dữ liệu HR!"}

        cols = list(self.hr_df.columns)
        new_row = {col: str(payload.get(col, '')).strip() for col in cols}
        self.hr_df = pd.concat([self.hr_df, pd.DataFrame([new_row])], ignore_index=True)
        self._save_pickle(self.hr_df, "hr.pkl.gz")
        self._process_metadata()
        return {"ok": True, "message": "Đã thêm mới nhân sự thành công!"}

    def update_hr_employee(self, code: str, payload: dict):
        if self.hr_df.empty:
            return {"ok": False, "error": "Chưa có dữ liệu HR!"}

        c = str(code).strip().upper()
        cols = list(self.hr_df.columns)
        col_code = cols[5] if len(cols) > 5 else 'Mã NV'
        col_acc = cols[6] if len(cols) > 6 else 'Inside Account'

        matched_idx = None
        for i, r in self.hr_df.iterrows():
            if str(r.get(col_code, '')).strip().upper() == c or str(r.get(col_acc, '')).strip().upper() == c:
                matched_idx = i
                break

        if matched_idx is None:
            return {"ok": False, "error": f"Không tìm thấy nhân sự {code}!"}

        for k, v in payload.items():
            if k in cols:
                self.hr_df.at[matched_idx, k] = str(v).strip()

        self._save_pickle(self.hr_df, "hr.pkl.gz")
        self._process_metadata()
        return {"ok": True, "message": "Đã cập nhật hồ sơ nhân sự thành công!"}

    def delete_hr_employee(self, code: str):
        if self.hr_df.empty:
            return {"ok": False, "error": "Chưa có dữ liệu HR!"}

        c = str(code).strip().upper()
        cols = list(self.hr_df.columns)
        col_code = cols[5] if len(cols) > 5 else 'Mã NV'
        col_acc = cols[6] if len(cols) > 6 else 'Inside Account'

        self.hr_df = self.hr_df[
            (self.hr_df[col_code].astype(str).str.strip().str.upper() != c) &
            (self.hr_df[col_acc].astype(str).str.strip().str.upper() != c)
        ]
        self._save_pickle(self.hr_df, "hr.pkl.gz")
        self._process_metadata()
        return {"ok": True, "message": f"Đã xóa nhân sự {code} thành công!"}

    def get_luong_list(self, search: str = "", block: str = "__ALL__", team_lead: str = "__ALL__"):
        if self.hr_df.empty:
            return []

        cols = list(self.hr_df.columns)
        col_code = cols[5] if len(cols) > 5 else 'Mã NV'
        col_name = cols[4] if len(cols) > 4 else 'Họ Tên NV'
        col_acc = cols[6] if len(cols) > 6 else 'Inside Account'
        col_mobi = cols[28] if len(cols) > 28 else 'Mobisale'
        col_block = cols[3] if len(cols) > 3 else 'Block'
        col_tl = cols[24] if len(cols) > 24 else 'Họ tên Đội trưởng'
        col_hd = cols[16] if len(cols) > 16 else 'Loại HĐLĐ'
        col_tinh_luong = cols[18] if len(cols) > 18 else 'Tính lương'
        col_phan_cong = cols[17] if len(cols) > 17 else 'Phân công'

        kw = search.strip().upper()
        res = []

        for idx, r in self.hr_df.iterrows():
            c_code = str(r.get(col_code, '')).strip()
            c_name = str(r.get(col_name, '')).strip()
            c_acc = str(r.get(col_acc, '')).strip()
            c_mobi = str(r.get(col_mobi, '')).strip()
            if c_mobi.upper() in ('NAN', 'NONE', '-', 'NULL'):
                c_mobi = ''
            c_block = str(r.get(col_block, '')).strip()
            c_tl = str(r.get(col_tl, '')).strip()
            c_hd = str(r.get(col_hd, '')).strip()
            c_luong = str(r.get(col_tinh_luong, '')).strip()
            c_pc = str(r.get(col_phan_cong, '')).strip()

            if block != "__ALL__" and c_block != block:
                continue
            if team_lead != "__ALL__" and c_tl != team_lead:
                continue

            if kw:
                text = f"{c_code} {c_name} {c_acc} {c_mobi} {c_block} {c_tl}".upper()
                if kw not in text:
                    continue

            res.append({
                "stt": idx + 1,
                "code": c_code,
                "name": c_name,
                "account": c_acc,
                "mobisale": c_mobi,
                "block": c_block,
                "team_lead": c_tl,
                "contract_type": c_hd,
                "calc_salary": c_luong,
                "assignment": c_pc
            })

        return res




