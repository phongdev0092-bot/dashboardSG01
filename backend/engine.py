import pandas as pd
import numpy as np
import requests
import io
import os
import sys
import time
import datetime
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
        try:
            CACHE_DIR.mkdir(exist_ok=True, parents=True)
        except Exception:
            pass
        self._load_lt_history_and_snapshot()
        self.load_cache_or_fetch()
        self._load_admin_users()

    def _save_pickle(self, df_or_obj, filename: str):
        try:
            CACHE_DIR.mkdir(exist_ok=True, parents=True)
            target = CACHE_DIR / filename
            if hasattr(df_or_obj, 'to_pickle'):
                df_or_obj.to_pickle(target)
            else:
                pd.to_pickle(df_or_obj, target)
            return
        except Exception:
            pass

        try:
            tmp_dir = Path("/tmp/data_cache")
            tmp_dir.mkdir(exist_ok=True, parents=True)
            target = tmp_dir / filename
            if hasattr(df_or_obj, 'to_pickle'):
                df_or_obj.to_pickle(target)
            else:
                pd.to_pickle(df_or_obj, target)
        except Exception:
            pass

    def _get_sheet_url(self, gid: str) -> str:
        return f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}'

    def _get_lt_sheet_url(self) -> str:
        return 'https://docs.google.com/spreadsheets/d/1qd8O1bqbtHmbPUO_HhZv07YS9c27bo1QMWh4yvmQr2U/export?format=csv&gid=0'

    def load_cache_or_fetch(self):
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

        hr_cache = _get_path("hr")
        tk_cache = _get_path("tk")
        bt_cache = _get_path("bt")
        lt_cache = _get_path("lt")
        ton_tk_cache = _get_path("ton_tk")
        ton_bt_cache = _get_path("ton_bt")
        cll30n_cache = _get_path("cll30n")
        kh_cls_cache = _get_path("kh_cls")

        if hr_cache.exists() and tk_cache.exists() and bt_cache.exists():
            try:
                print("Loading data from local cache...", flush=True)
                self.hr_df = pd.read_pickle(hr_cache)
                self.tk_df = pd.read_pickle(tk_cache)
                self.bt_df = pd.read_pickle(bt_cache)
                if lt_cache.exists():
                    self.lt_df = pd.read_pickle(lt_cache)
                if ton_tk_cache.exists():
                    self.ton_tk_df = pd.read_pickle(ton_tk_cache)
                if ton_bt_cache.exists():
                    self.ton_bt_df = pd.read_pickle(ton_bt_cache)
                if cll30n_cache.exists():
                    self.cll30n_df = pd.read_pickle(cll30n_cache)
                else:
                    try:
                        print("Fetching live CLL30N data for cache...", flush=True)
                        url_cll = 'https://docs.google.com/spreadsheets/d/1JtMBIXmgQ37ne9a_QYb6ZuN6mWwgJHIC-kSjKEb-56w/export?format=csv&gid=1484730732'
                        res_cll = requests.get(url_cll, timeout=60)
                        if res_cll.status_code == 200:
                            df_cll = pd.read_csv(io.BytesIO(res_cll.content), encoding='utf-8', low_memory=False, dtype=str, on_bad_lines='skip')
                            col_hd = df_cll.columns[0] if len(df_cll.columns) > 0 else 'Số HĐ'
                            col_kh = df_cll.columns[1] if len(df_cll.columns) > 1 else 'Khách Hàng'
                            col_nv = df_cll.columns[3] if len(df_cll.columns) > 3 else 'Nhân viên'
                            col_tg = df_cll.columns[6] if len(df_cll.columns) > 6 else 'Tg hoàn tất'
                            col_af = df_cll.columns[31] if len(df_cll.columns) > 31 else '(Cấp 1)Tình trạng đầu vào'
                            col_ai = df_cll.columns[34] if len(df_cll.columns) > 34 else '(Cấp 1)Hướng xử lý'
                            df_cll['Số HĐ'] = df_cll[col_hd].astype(str).str.strip().str.upper()
                            df_cll['Khách Hàng'] = df_cll[col_kh].astype(str).str.strip()
                            df_cll['Nhân viên'] = df_cll[col_nv].astype(str).str.strip().str.upper()
                            df_cll['Tg hoàn tất'] = df_cll[col_tg].astype(str).str.strip()
                            df_cll['tinh_trang_dau_vao'] = df_cll[col_af].fillna('-').astype(str).str.strip()
                            df_cll['huong_xu_ly'] = df_cll[col_ai].fillna('-').astype(str).str.strip()
                            df_cll['dt_complete'] = pd.to_datetime(df_cll[col_tg], dayfirst=True, errors='coerce')
                            df_cll['date_complete'] = df_cll['dt_complete'].dt.date
                            df_cll = df_cll[['Số HĐ', 'Khách Hàng', 'Nhân viên', 'Tg hoàn tất', 'tinh_trang_dau_vao', 'huong_xu_ly', 'date_complete', 'dt_complete']]
                            df_cll.to_pickle(CACHE_DIR / "cll30n.pkl.gz")
                            self.cll30n_df = df_cll
                            print(f"Fetched & cached CLL30N data! {len(df_cll)} rows", flush=True)
                    except Exception as e_cll:
                        print(f"Warning: Failed to fetch CLL30N: {e_cll}", flush=True)

                if kh_cls_cache.exists():
                    self.kh_cls_df = pd.read_pickle(kh_cls_cache)
                else:
                    try:
                        url_cls = 'https://docs.google.com/spreadsheets/d/1JtMBIXmgQ37ne9a_QYb6ZuN6mWwgJHIC-kSjKEb-56w/export?format=csv&gid=0'
                        res_cls = requests.get(url_cls, timeout=60)
                        if res_cls.status_code == 200:
                            df_cls = pd.read_csv(io.BytesIO(res_cls.content), encoding='utf-8', low_memory=False, dtype=str, on_bad_lines='skip')
                            col_hd = df_cls.columns[0] if len(df_cls.columns) > 0 else 'Số HĐ'
                            col_nv = df_cls.columns[3] if len(df_cls.columns) > 3 else 'Nhân viên'
                            col_tg = df_cls.columns[6] if len(df_cls.columns) > 6 else 'Tg hoàn tất'
                            df_cls['Số HĐ'] = df_cls[col_hd].astype(str).str.strip().str.upper()
                            df_cls['Nhân viên'] = df_cls[col_nv].astype(str).str.strip().str.upper()
                            df_cls['dt_complete'] = pd.to_datetime(df_cls[col_tg], dayfirst=True, errors='coerce')
                            df_cls['date_complete'] = df_cls['dt_complete'].dt.date
                            df_cls = df_cls[['Số HĐ', 'Nhân viên', 'date_complete', 'dt_complete']]
                            df_cls.to_pickle(CACHE_DIR / "kh_cls.pkl.gz")
                            self.kh_cls_df = df_cls
                    except Exception as e_cls:
                        print(f"Warning: Failed to fetch KH Co Cls: {e_cls}", flush=True)

                self.last_sync_time = datetime.datetime.fromtimestamp(hr_cache.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
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
            print("Fetching live HR data...", flush=True)
            res_hr = requests.get(self._get_sheet_url(GIDS['HR']), timeout=30)
            df_hr = pd.read_csv(io.BytesIO(res_hr.content), encoding='utf-8', dtype=str)
            
            print("Fetching live Trien Khai (TK) data...", flush=True)
            res_tk = requests.get(self._get_sheet_url(GIDS['TK']), timeout=60)
            df_tk = pd.read_csv(io.BytesIO(res_tk.content), encoding='utf-8', low_memory=False)

            print("Fetching live Bao Tri (BT) data...", flush=True)
            res_bt = requests.get(self._get_sheet_url(GIDS['BT']), timeout=60)
            df_bt = pd.read_csv(io.BytesIO(res_bt.content), encoding='utf-8', low_memory=False)

            # Fetch Tồn Triển Khai & Tồn Bảo Trì from Sheet 1Hihsf3_R3Z9aaqqj9vskIyveNX4UO2Ej3d26jF5-S2w
            ton_sid = '1Hihsf3_R3Z9aaqqj9vskIyveNX4UO2Ej3d26jF5-S2w'
            print("Fetching live Tồn Triển Khai (GID 0) data...", flush=True)
            url_ton_tk = f'https://docs.google.com/spreadsheets/d/{ton_sid}/export?format=csv&gid=0'
            try:
                res_ton_tk = requests.get(url_ton_tk, timeout=40)
                if res_ton_tk.status_code == 200 and not res_ton_tk.text.strip().startswith('<!DOCTYPE'):
                    df_ton_tk = pd.read_csv(io.BytesIO(res_ton_tk.content), encoding='utf-8', dtype=str, low_memory=False)
                    df_ton_tk.to_pickle(CACHE_DIR / "ton_tk.pkl.gz")
                    print(f"Loaded live Tồn Triển Khai CSV! {len(df_ton_tk)} rows", flush=True)
                else:
                    print("Tồn Triển Khai sheet requires permissions or returned HTML. (Keep existing cache or import manually)", flush=True)
            except Exception as e_ton_tk:
                print(f"Warning: Failed to fetch live Tồn Triển Khai: {e_ton_tk}", flush=True)

            print("Fetching live Tồn Bảo Trì (GID 440862556) data...", flush=True)
            url_ton_bt = f'https://docs.google.com/spreadsheets/d/{ton_sid}/export?format=csv&gid=440862556'
            try:
                res_ton_bt = requests.get(url_ton_bt, timeout=40)
                if res_ton_bt.status_code == 200 and not res_ton_bt.text.strip().startswith('<!DOCTYPE'):
                    df_ton_bt = pd.read_csv(io.BytesIO(res_ton_bt.content), encoding='utf-8', dtype=str, low_memory=False)
                    df_ton_bt.to_pickle(CACHE_DIR / "ton_bt.pkl.gz")
                    print(f"Loaded live Tồn Bảo Trì CSV! {len(df_ton_bt)} rows", flush=True)
                else:
                    print("Tồn Bảo Trì sheet requires permissions or returned HTML. (Keep existing cache or import manually)", flush=True)
            except Exception as e_ton_bt:
                print(f"Warning: Failed to fetch live Tồn Bảo Trì: {e_ton_bt}", flush=True)

            print("Fetching live Lich Truc (LT) data...", flush=True)
            df_lt = pd.DataFrame()
            try:
                res_lt = requests.get(self._get_lt_sheet_url(), timeout=30)
                if res_lt.status_code == 200 and len(res_lt.content) > 50:
                    df_lt = pd.read_csv(io.BytesIO(res_lt.content), encoding='utf-8', header=None, low_memory=False, dtype=str)
                    df_lt.to_pickle(CACHE_DIR / "lt.pkl.gz")
                    print(f"Loaded live Lịch Trực CSV! {len(df_lt)} rows", flush=True)
                else:
                    print(f"Lịch Trực sheet returned status {res_lt.status_code}. (Cần chia sẻ 'Bất kỳ ai có liên kết đều có thể xem')", flush=True)
            except Exception as e_lt:
                print(f"Warning: Failed to download Lịch Trực CSV: {e_lt}", flush=True)

            # Fetch CLL30N Sheet (GID: 1484730732)
            print("Fetching live CLL30N data...", flush=True)
            df_cll30n = pd.DataFrame()
            try:
                url_cll = 'https://docs.google.com/spreadsheets/d/1JtMBIXmgQ37ne9a_QYb6ZuN6mWwgJHIC-kSjKEb-56w/export?format=csv&gid=1484730732'
                res_cll = requests.get(url_cll, timeout=40)
                if res_cll.status_code == 200:
                    df_cll30n = pd.read_csv(io.BytesIO(res_cll.content), encoding='utf-8', low_memory=False, dtype=str, on_bad_lines='skip')
                    print(f"Loaded live CLL30N CSV! {len(df_cll30n)} rows", flush=True)
            except Exception as e_cll:
                print(f"Warning: Failed to fetch CLL30N CSV: {e_cll}", flush=True)

            # Fetch KH Co Cls Sheet (GID: 0)
            print("Fetching live KH Co Cls data...", flush=True)
            df_kh_cls = pd.DataFrame()
            try:
                url_cls = 'https://docs.google.com/spreadsheets/d/1JtMBIXmgQ37ne9a_QYb6ZuN6mWwgJHIC-kSjKEb-56w/export?format=csv&gid=0'
                res_cls = requests.get(url_cls, timeout=30)
                if res_cls.status_code == 200:
                    df_kh_cls = pd.read_csv(io.BytesIO(res_cls.content), encoding='utf-8', low_memory=False, dtype=str, on_bad_lines='skip')
                    print(f"Loaded live KH Co Cls CSV! {len(df_kh_cls)} rows", flush=True)
                else:
                    print(f"KH Co Cls sheet returned status {res_cls.status_code}.", flush=True)
            except Exception as e_cls:
                print(f"Warning: Failed to fetch KH Co Cls CSV: {e_cls}", flush=True)

            # Process HR
            df_hr['Inside Account'] = df_hr['Inside Account'].astype(str).str.strip().str.upper()
            df_hr['Họ Tên NV'] = df_hr['Họ Tên NV'].astype(str).str.strip()
            df_hr['Họ tên Đội trưởng'] = df_hr['Họ tên Đội trưởng'].astype(str).str.strip()
            df_hr['Vùng'] = df_hr['Vùng'].astype(str).str.strip()
            df_hr['Đối tác'] = df_hr['Đối tác'].astype(str).str.strip()
            df_hr['Block'] = df_hr['Block'].astype(str).str.strip()

            # Process TK
            df_tk['Nhân viên'] = df_tk['Nhân viên'].astype(str).str.strip().str.upper()
            df_tk['Số hợp đồng'] = df_tk['Số hợp đồng'].astype(str).str.strip()
            df_tk['Gói dịch vụ'] = df_tk['Gói dịch vụ'].astype(str).str.strip()
            df_tk['Loại giao dịch'] = df_tk['Loại giao dịch'].astype(str).str.strip()
            
            df_tk['is_gsafe'] = (df_tk['Số hợp đồng'].str.startswith('SGG', na=False)) & \
                                (df_tk['Gói dịch vụ'].str.lower() == 'offnet')
            df_tk['is_swap'] = df_tk['Loại giao dịch'].str.contains('Swap', case=False, na=False)
            df_tk['dung_hen'] = pd.to_numeric(df_tk['Đúng hẹn'], errors='coerce').fillna(0).astype(int)
            
            df_tk['dt_complete'] = pd.to_datetime(df_tk['Ngày hoàn tất PTC'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
            df_tk['dt_created'] = pd.to_datetime(df_tk['TG tạo PTC'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
            df_tk['date_complete'] = df_tk['dt_complete'].dt.date
            
            rt_sec = (df_tk['dt_complete'] - df_tk['dt_created']).dt.total_seconds()
            df_tk['rt_hours'] = np.where(rt_sec >= 0, rt_sec / 3600.0, np.nan)

            # Process BT
            df_bt['Nhân viên'] = df_bt['Nhân viên'].astype(str).str.strip().str.upper()
            df_bt['Số HĐ'] = df_bt['Số HĐ'].astype(str).str.strip()
            df_bt['dung_hen'] = pd.to_numeric(df_bt['Đúng hẹn'], errors='coerce').fillna(0).astype(int)
            
            df_bt['dt_complete'] = pd.to_datetime(df_bt['TG Hoàn Tất'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
            df_bt['dt_created'] = pd.to_datetime(df_bt['TG Tạo'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
            df_bt['date_complete'] = df_bt['dt_complete'].dt.date
            
            rt_sec_bt = (df_bt['dt_complete'] - df_bt['dt_created']).dt.total_seconds()
            df_bt['rt_hours'] = np.where(rt_sec_bt >= 0, rt_sec_bt / 3600.0, np.nan)

            # Process CLL30N
            if not df_cll30n.empty:
                col_hd = df_cll30n.columns[0] if len(df_cll30n.columns) > 0 else 'Số HĐ'
                col_kh = df_cll30n.columns[1] if len(df_cll30n.columns) > 1 else 'Khách Hàng'
                col_nv = df_cll30n.columns[3] if len(df_cll30n.columns) > 3 else 'Nhân viên'
                col_tg = df_cll30n.columns[6] if len(df_cll30n.columns) > 6 else 'Tg hoàn tất'
                col_af = df_cll30n.columns[31] if len(df_cll30n.columns) > 31 else '(Cấp 1)Tình trạng đầu vào'
                col_ai = df_cll30n.columns[34] if len(df_cll30n.columns) > 34 else '(Cấp 1)Hướng xử lý'
                df_cll30n['Số HĐ'] = df_cll30n[col_hd].astype(str).str.strip().str.upper()
                df_cll30n['Khách Hàng'] = df_cll30n[col_kh].astype(str).str.strip()
                df_cll30n['Nhân viên'] = df_cll30n[col_nv].astype(str).str.strip().str.upper()
                df_cll30n['Tg hoàn tất'] = df_cll30n[col_tg].astype(str).str.strip()
                df_cll30n['tinh_trang_dau_vao'] = df_cll30n[col_af].fillna('-').astype(str).str.strip()
                df_cll30n['huong_xu_ly'] = df_cll30n[col_ai].fillna('-').astype(str).str.strip()
                df_cll30n['dt_complete'] = pd.to_datetime(df_cll30n[col_tg], dayfirst=True, errors='coerce')
                df_cll30n['date_complete'] = df_cll30n['dt_complete'].dt.date
                df_cll30n = df_cll30n[['Số HĐ', 'Khách Hàng', 'Nhân viên', 'Tg hoàn tất', 'tinh_trang_dau_vao', 'huong_xu_ly', 'date_complete', 'dt_complete']]
                df_cll30n.to_pickle(CACHE_DIR / "cll30n.pkl.gz")

            # Process KH Co Cls
            if not df_kh_cls.empty:
                col_hd = df_kh_cls.columns[0] if len(df_kh_cls.columns) > 0 else 'Số HĐ'
                col_nv = df_kh_cls.columns[3] if len(df_kh_cls.columns) > 3 else 'Nhân viên'
                col_tg = df_kh_cls.columns[6] if len(df_kh_cls.columns) > 6 else 'Tg hoàn tất'
                df_kh_cls['Số HĐ'] = df_kh_cls[col_hd].astype(str).str.strip().str.upper()
                df_kh_cls['Nhân viên'] = df_kh_cls[col_nv].astype(str).str.strip().str.upper()
                df_kh_cls['dt_complete'] = pd.to_datetime(df_kh_cls[col_tg], dayfirst=True, errors='coerce')
                df_kh_cls['date_complete'] = df_kh_cls['dt_complete'].dt.date
                df_kh_cls = df_kh_cls[['Số HĐ', 'Nhân viên', 'date_complete', 'dt_complete']]
                df_kh_cls.to_pickle(CACHE_DIR / "kh_cls.pkl.gz")

            # Save to Cache
            df_hr.to_pickle(CACHE_DIR / "hr.pkl.gz")
            df_tk.to_pickle(CACHE_DIR / "tk.pkl.gz")
            df_bt.to_pickle(CACHE_DIR / "bt.pkl.gz")

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

        # Match contracts in filtered KH Co Cls against full Sheet CLL30N (pairs of NV and Số HĐ)
        cll_df_all = self.cll30n_df if hasattr(self, 'cll30n_df') and not self.cll30n_df.empty else pd.DataFrame()
        if not cll_df_all.empty and 'Nhân viên' in cll_df_all.columns and 'Số HĐ' in cll_df_all.columns:
            cll_pair_set = set(zip(cll_df_all['Nhân viên'], cll_df_all['Số HĐ']))
        else:
            cll_pair_set = set()

        if not cls.empty and 'Nhân viên' in cls.columns and 'Số HĐ' in cls.columns:
            cls['is_cll'] = [(nv, hd) in cll_pair_set for nv, hd in zip(cls['Nhân viên'], cls['Số HĐ'])]
        else:
            cls['is_cll'] = []

        # 2. Overall Aggregations
        # TK Valid (Excluding Gsafe and Swap for KPIs)
        tk_valid = tk[~tk['is_gsafe'] & ~tk['is_swap']]
        tk_swap = tk[tk['is_swap']]
        tk_gsafe = tk[tk['is_gsafe']]

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

        # CLL30N % Aggregation (Tử số: cll_tot, Mẫu số: cls_tot)
        cls_tot = len(cls)
        cll_tot = int(cls['is_cll'].sum()) if not cls.empty else 0
        cll30n_pct = round((cll_tot / cls_tot * 100), 2) if cls_tot > 0 else 0.0

        # Status rules:
        # 1. Đúng Hẹn >= 97.2% -> PASS
        # 2. RT-TK <= 18H -> PASS
        # 3. RT-BT <= 8H -> PASS
        # 4. CLL30N <= 7% -> PASS
        dung_hen_status = 'PASS' if total_dh_pct >= 97.2 else 'FAIL'
        rt_tk_status = 'PASS' if (rt_tk_avg is None or rt_tk_avg <= 18.0) else 'FAIL'
        rt_bt_status = 'PASS' if (rt_bt_avg is None or rt_bt_avg <= 8.0) else 'FAIL'
        cll30n_status = 'PASS' if cll30n_pct <= 7.0 else 'FAIL'

        # Swap breakdown by transaction type
        swap_counts = tk_swap['Loại giao dịch'].value_counts().to_dict()

        # 3. Employee-level Aggregations
        active_accs = set(tk['Nhân viên'].dropna().unique()) | set(bt['Nhân viên'].dropna().unique())
        if not cls.empty and 'Nhân viên' in cls.columns:
            active_accs |= set(cls['Nhân viên'].dropna().unique())

        if team_lead or region or partner or block or search:
            active_accs &= allowed_accounts

        emp_rows = []
        
        # Group by employee for fast computation
        tk_valid_grp = tk_valid.groupby('Nhân viên')
        tk_swap_grp = tk_swap.groupby('Nhân viên')
        tk_gsafe_grp = tk_gsafe.groupby('Nhân viên')
        bt_grp = bt.groupby('Nhân viên')
        cls_grp = cls.groupby('Nhân viên') if not cls.empty and 'Nhân viên' in cls.columns else {}

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

        cll_dict = {acc: int(group['is_cll'].sum()) for acc, group in cls_grp} if not isinstance(cls_grp, dict) else {}
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

            # Employee CLL30N calculation (strictly using KH Co Cls denominator)
            e_cll_count = cll_dict.get(acc, 0)
            e_cls_count = cls_dict.get(acc, 0)
            e_cll30n_pct = round((e_cll_count / e_cls_count * 100), 2) if e_cls_count > 0 else 0.0

            # Employee evaluation rule statuses
            e_dh_status = 'PASS' if e_tot_dh >= 97.2 else 'FAIL'
            e_rt_tk_status = 'PASS' if (rt_tk_val is not None and not pd.isna(rt_tk_val) and rt_tk_val <= 18.0) else ('FAIL' if (rt_tk_val is not None and not pd.isna(rt_tk_val)) else 'NONE')
            e_rt_bt_status = 'PASS' if (rt_bt_val is not None and not pd.isna(rt_bt_val) and rt_bt_val <= 8.0) else ('FAIL' if (rt_bt_val is not None and not pd.isna(rt_bt_val)) else 'NONE')
            e_cll30n_status = 'PASS' if e_cll30n_pct <= 7.0 else 'FAIL'

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
                'kh_cls_count': e_cls_count,
                'cll30n_pct': e_cll30n_pct,
                'cll30n_status': e_cll30n_status,

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
                'kh_cls_count': cls_tot,
                'cll30n_pct': cll30n_pct,
                'cll30n_status': cll30n_status,

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
                    'dt_complete': str(row.get('Tg hoàn tất', '')),
                    'tinh_trang_dau_vao': str(row.get('tinh_trang_dau_vao', '-')),
                    'huong_xu_ly': str(row.get('huong_xu_ly', '-'))
                })

        return {
            'employee_info': meta,
            'tk_tickets': tk_list,
            'bt_tickets': bt_list,
            'cll_tickets': cll_list
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
        if df_ton_tk.empty:
            df_ton_tk = self.tk_df
        if df_ton_tk.empty:
            return []
        
        cols = list(df_ton_tk.columns)
        col_f_block = cols[5] if len(cols) > 5 else 'Block'
        ns_col = cols[17] if len(cols) > 17 else 'Nhân sự'
        s_col = cols[18] if len(cols) > 18 else 'TG Hẹn xanh'
        t_col = cols[19] if len(cols) > 19 else 'TG Hẹn đỏ'

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
        if df_ton_bt.empty:
            return []
        
        cols = list(df_ton_bt.columns)
        col_e_block = cols[4] if len(cols) > 4 else 'Block'
        k_col = cols[10] if len(cols) > 10 else 'Ngày hẹn Xanh'
        l_col = cols[11] if len(cols) > 11 else 'Ngày hẹn đỏ'
        ns_col = cols[18] if len(cols) > 18 else 'Nhân sự'

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

    def get_lich_truc_dashboard(self, date_str=None):
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
        
        df_idx = row_number - 2
        if 0 <= df_idx < len(self.lt_df):
            for i, val in enumerate(values_b_to_al):
                col_target = i + 1
                if col_target < self.lt_df.shape[1]:
                    self.lt_df.iloc[df_idx, col_target] = str(val)
            self.lt_df.to_pickle(CACHE_DIR / "lt.pkl.gz")
            self._snapshot_and_detect_lt_changes(source_label="Chỉnh sửa")
            return {"ok": True}
        return {"ok": False, "error": "Invalid row index"}

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

                old_ca1 = is_ca1(old_val)
                new_ca1 = is_ca1(new_val)

                if old_ca1 != new_ca1:
                    info = row_info_map.get((mail, row_month, row_year), {})
                    change_type = 'CA1 ➔ OFF' if old_ca1 else 'OFF ➔ CA1'
                    
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
        if df_tk.empty:
            df_tk = self.tk_df
        df_bt = getattr(self, 'ton_bt_df', pd.DataFrame())
        if df_bt.empty:
            df_bt = self.bt_df

        now = datetime.datetime.now()

        # Parse TK list
        tk_list = []
        if not df_tk.empty:
            cols = list(df_tk.columns)
            col_f_block = cols[5] if len(cols) > 5 else 'Block'
            ns_col = cols[17] if len(cols) > 17 else 'Nhân sự'
            hd_col = cols[3] if len(cols) > 3 else 'Số HĐ'
            kh_col = cols[6] if len(cols) > 6 else 'Tên KH'
            time_created_col = cols[11] if len(cols) > 11 else 'TG tạo PTC'
            loai_col = cols[12] if len(cols) > 12 else (cols[9] if len(cols) > 9 else 'Loại triển khai')
            note_col = cols[21] if len(cols) > 21 else 'Ghi chú triển khai TIN/PNC'

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
            cols = list(df_bt.columns)
            col_e_block = cols[4] if len(cols) > 4 else 'Block'
            ns_col = cols[18] if len(cols) > 18 else 'Nhân sự'
            hd_col = cols[5] if len(cols) > 5 else 'Số HĐ'
            kh_col = cols[6] if len(cols) > 6 else 'Tên đầy đủ'
            time_created_col = cols[7] if len(cols) > 7 else 'Thời gian tạo'
            ton_hrs_col = cols[8] if len(cols) > 8 else 'Tồn giờ'
            tinh_trang_col = cols[28] if len(cols) > 28 else (cols[19] if len(cols) > 19 else 'TTSCBĐ 1')
            note_cc_col = cols[22] if len(cols) > 22 else 'Ghi Chú CC'
            note_ktv_col = cols[23] if len(cols) > 23 else 'Ghi Chú KTV Gần Nhất'

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
        filename_lower = filename.lower()
        try:
            if filename_lower.endswith('.csv'):
                try:
                    df = pd.read_csv(io.BytesIO(file_bytes), encoding='utf-8', dtype=str, low_memory=False, on_bad_lines='skip')
                except Exception:
                    try:
                        df = pd.read_csv(io.BytesIO(file_bytes), encoding='utf-8-sig', dtype=str, low_memory=False, on_bad_lines='skip')
                    except Exception:
                        df = pd.read_csv(io.BytesIO(file_bytes), encoding='cp1252', dtype=str, low_memory=False, on_bad_lines='skip')
            elif filename_lower.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(file_bytes), dtype=str)
            else:
                return {"ok": False, "error": "Định dạng file không hỗ trợ. Vui lòng sử dụng file CSV hoặc Excel (.xlsx, .xls)"}
        except Exception as e:
            return {"ok": False, "error": f"Lỗi đọc file: {str(e)}"}

        if df is None or df.empty:
            return {"ok": False, "error": "File rỗng, không có dữ liệu."}

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
            self._save_pickle(df, "ton_tk.pkl.gz")
            label = "Tồn Triển Khai (TK)"
        else:
            self.ton_bt_df = df
            self._save_pickle(df, "ton_bt.pkl.gz")
            label = "Tồn Bảo Trì (BT)"

        return {
            "ok": True,
            "mode": detected_mode,
            "count": imported_count,
            "message": f"Đã cập nhật thành công {imported_count} dòng cho {label}!"
        }

    # =========================================================================
    # ADMIN USERS & AUTHENTICATION SYSTEM
    # =========================================================================
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

        admin_cache = _get_path("admin_users")
        if admin_cache.exists():
            try:
                self.admin_users_df = pd.read_pickle(admin_cache)
                print(f"Loaded {len(self.admin_users_df)} admin users from cache.", flush=True)
                return
            except Exception as e:
                print(f"Failed to read admin users cache: {e}", flush=True)

        # Initialize default seed admin dataset
        default_data = [{
            "ID": 1,
            "MSNV": "PNC01.PHONGNH5",
            "Họ và Tên": "Nguyễn Hồng Phong",
            "Mail": "phuongnam.phongnh5@fpt.net",
            "User": "phuongnam.phongnh5",
            "Mật Khẩu": "Benngo@@2026",
            "Quyền": "admin",
            "Ứng dụng được xem": "kpis,lich_truc,ton_tk_bt,admin,hr,user_mgmt,import,luong",
            "is_password_set": True
        }]
        self.admin_users_df = pd.DataFrame(default_data)
        self._save_admin_users()

    def _save_admin_users(self):
        self._save_pickle(self.admin_users_df, "admin_users.pkl.gz")

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

            if (target == r_mail or target == r_user) and pwd == r_pass:
                allowed_apps_raw = str(r.get('Ứng dụng được xem', '')).strip()
                if not allowed_apps_raw:
                    allowed_apps_raw = "kpis,lich_truc,ton_tk_bt,admin,hr,user_mgmt,import,luong" if str(r.get('Quyền', 'user')).strip().lower() == 'admin' else "luong"

                return {
                    "ok": True,
                    "user": {
                        "id": int(r.get('ID', 1)),
                        "msnv": str(r.get('MSNV', '')).strip(),
                        "name": str(r.get('Họ và Tên', '')).strip(),
                        "mail": str(r.get('Mail', '')).strip(),
                        "user": str(r.get('User', '')).strip(),
                        "role": str(r.get('Quyền', 'user')).strip().lower(),
                        "allowed_apps": [x.strip() for x in allowed_apps_raw.split(',') if x.strip()],
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
        msnv = hr_info.get('msnv', '') if hr_info.get('ok') and hr_info.get('found') else ''
        name = hr_info.get('name', '') if hr_info.get('ok') and hr_info.get('found') else clean_user

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
            "Ứng dụng được xem": "luong",
            "is_password_set": True
        }

        self.admin_users_df = pd.concat([self.admin_users_df, pd.DataFrame([new_row])], ignore_index=True)
        self._save_admin_users()

        return {
            "ok": True,
            "message": f"Đăng ký tài khoản thành công cho {name} ({clean_mail})!",
            "user": {
                "id": new_id,
                "msnv": msnv,
                "name": name,
                "mail": clean_mail,
                "user": clean_user,
                "role": "user",
                "allowed_apps": ["luong"]
            }
        }

    def get_admin_users(self):
        if self.admin_users_df.empty:
            self._load_admin_users()

        res = []
        for _, r in self.admin_users_df.iterrows():
            apps_raw = str(r.get('Ứng dụng được xem', '')).strip()
            if not apps_raw:
                apps_raw = "kpis,lich_truc,ton_tk_bt,admin,hr,user_mgmt,import,luong" if str(r.get('Quyền', 'user')).strip().lower() == 'admin' else "luong"

            res.append({
                "id": int(r.get('ID', 0)),
                "msnv": str(r.get('MSNV', '')).strip(),
                "name": str(r.get('Họ và Tên', '')).strip(),
                "mail": str(r.get('Mail', '')).strip(),
                "user": str(r.get('User', '')).strip(),
                "password": str(r.get('Mật Khẩu', '')).strip(),
                "role": str(r.get('Quyền', 'user')).strip().lower(),
                "allowed_apps": [x.strip() for x in apps_raw.split(',') if x.strip()]
            })
        return res

    def add_admin_user(self, payload: dict):
        mail = str(payload.get('mail', '')).strip().lower()
        user_alias = str(payload.get('user', '')).strip().lower() or mail.split('@')[0]
        password = str(payload.get('password', '')).strip()
        role = str(payload.get('role', 'user')).strip().lower()
        msnv = str(payload.get('msnv', '')).strip()
        name = str(payload.get('name', '')).strip()
        allowed_apps = payload.get('allowed_apps', ["luong"])
        allowed_str = ",".join(allowed_apps) if isinstance(allowed_apps, list) else str(allowed_apps)

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
            if int(r.get('ID', 0)) == user_id:
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
        if 'allowed_apps' in payload:
            allowed = payload['allowed_apps']
            self.admin_users_df.at[idx_to_update, 'Ứng dụng được xem'] = ",".join(allowed) if isinstance(allowed, list) else str(allowed)

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




