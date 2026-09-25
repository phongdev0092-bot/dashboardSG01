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

IS_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
if IS_VERCEL:
    CACHE_DIR = Path("/tmp/data_cache")
else:
    CACHE_DIR = Path(__file__).parent / "data_cache"

try:
    CACHE_DIR.mkdir(exist_ok=True, parents=True)
except Exception:
    CACHE_DIR = Path("/tmp/data_cache")
    CACHE_DIR.mkdir(exist_ok=True, parents=True)

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
        # Tracks datasets that were manually cleared (so auto-sync won't overwrite them)
        # NOTE: _load_cleared_flags() is called AFTER DATABASE_URL is set (see below)
        self._manually_cleared_datasets: set = set()
        # Auto-load .env file if present
        for env_path in [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]:
            if env_path.exists():
                try:
                    with open(env_path, 'r', encoding='utf-8') as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith('#') and '=' in line:
                                k, v = line.split('=', 1)
                                k_str = k.strip()
                                v_str = v.strip().strip("'\"")
                                if k_str and v_str and k_str not in os.environ:
                                    os.environ[k_str] = v_str
                except Exception:
                    pass

        self.DEFAULT_PERMISSIONS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby-1nRM3wwMbYwbLWxc-VxiIRsMGglhnd8J2KXSNkFICAZpqVvyC1It2lbJiJxtLBNw/exec"
        self.PERMISSIONS_WEBAPP_URL = os.environ.get("PERMISSIONS_WEBAPP_URL", "").strip() or self.DEFAULT_PERMISSIONS_WEBAPP_URL
        self.LT_SHEET_ID = os.environ.get("LT_SHEET_ID", "1qd8O1bqbtHmbPUO_HhZv07YS9c27bo1QMWh4yvmQr2U").strip()
        self.LT_GID = os.environ.get("LT_GID", "0").strip()
        self.TON_TK_SHEET_ID = os.environ.get("TON_TK_SHEET_ID", "1Hihsf3_R3Z9aaqqj9vskIyveNX4UO2Ej3d26jF5-S2w").strip()
        self.TON_TK_GID = os.environ.get("TON_TK_GID", "0").strip()
        self.TON_BT_SHEET_ID = os.environ.get("TON_BT_SHEET_ID", "1Hihsf3_R3Z9aaqqj9vskIyveNX4UO2Ej3d26jF5-S2w").strip()
        self.TON_BT_GID = os.environ.get("TON_BT_GID", "440862556").strip()

        # Google Sheets IDs for Dashboard KPIs
        self.TK_SHEET_ID = os.environ.get("TK_SHEET_ID", "1UhOfDJ99n01nYr577fQC-LPlMd8ByP5APJcBXSUXyoQ").strip()
        self.TK_GID = os.environ.get("TK_GID", "0").strip()

        self.BT_SHEET_ID = os.environ.get("BT_SHEET_ID", "1GC7Z4nmLf6fFr-eE6epazkan8mJ2QcUv5ThUdT4usI0").strip()
        self.BT_GID = os.environ.get("BT_GID", "0").strip()

        self.KH_CLS_SHEET_ID = os.environ.get("KH_CLS_SHEET_ID", "1pDv3KT3OlgIDGcjBtwl0TNHxn2shjkMABISwVRC2d5U").strip()
        self.KH_CLS_GID = os.environ.get("KH_CLS_GID", "0").strip()

        self.CLL30N_SHEET_ID = os.environ.get("CLL30N_SHEET_ID", "1iNzByTpTVARldj9ggWyv-FKe_vzpeDKyHeYZt4vYU94").strip()
        self.CLL30N_GID = os.environ.get("CLL30N_GID", "0").strip()

        self.DATABASE_URL = os.environ.get("DATABASE_URL", "").strip() or os.environ.get("SUPABASE_DB_URL", "").strip()
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
                    if cfg.get('TK_SHEET_ID'):
                        self.TK_SHEET_ID = cfg['TK_SHEET_ID']
                    if cfg.get('BT_SHEET_ID'):
                        self.BT_SHEET_ID = cfg['BT_SHEET_ID']
                    if cfg.get('KH_CLS_SHEET_ID'):
                        self.KH_CLS_SHEET_ID = cfg['KH_CLS_SHEET_ID']
                    if cfg.get('CLL30N_SHEET_ID'):
                        self.CLL30N_SHEET_ID = cfg['CLL30N_SHEET_ID']
                    if cfg.get('DATABASE_URL'):
                        self.DATABASE_URL = str(cfg['DATABASE_URL']).strip()
        except Exception:
            pass
        # Load cleared flags AFTER DATABASE_URL is fully set, so Supabase fallback works
        self._load_cleared_flags()
        self._load_lt_history_and_snapshot()
        self.load_cache_or_fetch()

    # -------------------------------------------------------------------------
    # Cleared-dataset flag helpers
    # Flags are persisted to BOTH local JSON and Supabase _system_flags table
    # so they survive container restarts on cloud deployments (Render/Vercel).
    # -------------------------------------------------------------------------
    def _cleared_flags_path(self):
        return CACHE_DIR / "cleared_datasets.json"

    def _load_cleared_flags(self):
        """Load cleared flags: local JSON first, then fallback to Supabase."""
        loaded = set()
        # 1. Try local JSON
        try:
            p = self._cleared_flags_path()
            if p.exists():
                with open(p, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    loaded = set(data.get('cleared', []))
                    print(f"Loaded cleared-dataset flags from local file: {loaded}", flush=True)
        except Exception:
            pass

        # 2. Fallback / supplement from Supabase _system_flags table
        try:
            db_engine = self.get_db_engine()
            if db_engine:
                from sqlalchemy import text
                with db_engine.connect() as conn:
                    result = conn.execute(text(
                        "SELECT flag_name FROM _system_flags WHERE flag_type = 'cleared_dataset'"
                    ))
                    for row in result:
                        loaded.add(row[0])
                print(f"Loaded cleared-dataset flags from Supabase: {loaded}", flush=True)
        except Exception as e:
            # Table may not exist yet — that is OK
            print(f"Info: Could not load cleared flags from Supabase (may not exist yet): {e}", flush=True)

        self._manually_cleared_datasets = loaded

    def _save_cleared_flags(self):
        """Persist cleared flags to local JSON (synchronous, fast)."""
        try:
            CACHE_DIR.mkdir(exist_ok=True, parents=True)
            p = self._cleared_flags_path()
            with open(p, 'w', encoding='utf-8') as f:
                json.dump({'cleared': list(self._manually_cleared_datasets)}, f)
        except Exception as e:
            print(f"Warning: could not save cleared-dataset flags to file: {e}", flush=True)

    def _save_cleared_flags_to_supabase(self):
        """Persist cleared flags to Supabase _system_flags table (async-safe helper)."""
        try:
            db_engine = self.get_db_engine()
            if not db_engine:
                return
            from sqlalchemy import text
            with db_engine.connect() as conn:
                # Ensure table exists
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS _system_flags (
                        flag_type TEXT NOT NULL,
                        flag_name TEXT NOT NULL,
                        updated_at TIMESTAMP DEFAULT NOW(),
                        PRIMARY KEY (flag_type, flag_name)
                    )
                """))
                # Remove all cleared_dataset flags then re-insert current set
                conn.execute(text("DELETE FROM _system_flags WHERE flag_type = 'cleared_dataset'"))
                for name in self._manually_cleared_datasets:
                    conn.execute(text(
                        "INSERT INTO _system_flags (flag_type, flag_name) VALUES ('cleared_dataset', :name)"
                        " ON CONFLICT (flag_type, flag_name) DO NOTHING"
                    ), {"name": name})
                conn.commit()
            print(f"Saved cleared-dataset flags to Supabase: {self._manually_cleared_datasets}", flush=True)
        except Exception as e:
            print(f"Warning: could not save cleared flags to Supabase: {e}", flush=True)

    def _set_cleared_flag(self, name: str):
        self._manually_cleared_datasets.add(name)
        self._save_cleared_flags()  # fast local save
        if IS_VERCEL:
            self._save_cleared_flags_to_supabase()
        else:
            import threading
            t = threading.Thread(target=self._save_cleared_flags_to_supabase, daemon=True)
            t.start()

    def _clear_cleared_flag(self, name: str):
        self._manually_cleared_datasets.discard(name)
        self._save_cleared_flags()  # fast local save
        if IS_VERCEL:
            self._save_cleared_flags_to_supabase()
        else:
            import threading
            t = threading.Thread(target=self._save_cleared_flags_to_supabase, daemon=True)
            t.start()

    def _is_cleared(self, name: str) -> bool:
        try:
            p = self._cleared_flags_path()
            if p.exists():
                with open(p, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._manually_cleared_datasets = set(data.get('cleared', []))
        except Exception:
            pass
        return name in self._manually_cleared_datasets

    def get_db_engine(self):
        db_url = getattr(self, 'DATABASE_URL', '') or os.environ.get("DATABASE_URL", "").strip() or os.environ.get("SUPABASE_DB_URL", "").strip()
        if not db_url or '[YOUR-PASSWORD]' in db_url:
            return None
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        # Tự động URL-encode ký tự @ trong mật khẩu nếu bị trùng với ký tự phân cách host
        try:
            from urllib.parse import quote_plus
            if db_url.count('@') > 1:
                prefix, host_part = db_url.rsplit('@', 1)
                if '://' in prefix:
                    scheme, user_pass = prefix.split('://', 1)
                    if ':' in user_pass:
                        user, password = user_pass.split(':', 1)
                        db_url = f"{scheme}://{user}:{quote_plus(password)}@{host_part}"
        except Exception:
            pass

        try:
            from sqlalchemy import create_engine
            from sqlalchemy.pool import NullPool
            return create_engine(
                db_url,
                poolclass=NullPool,
                connect_args={"connect_timeout": 15}
            )
        except Exception as e:
            print(f"Warning: Failed to create SQLAlchemy DB engine: {e}", flush=True)
            return None

    def _save_df_to_supabase(self, df: pd.DataFrame, table_name: str) -> bool:
        """Save DataFrame to Supabase safely.
        Uses DELETE + INSERT (chunked) instead of if_exists='replace' to avoid
        dropping the entire table (which would lose data on concurrent access).
        """
        if df is None or df.empty:
            return False
        engine = self.get_db_engine()
        if engine is None:
            return False

        if not hasattr(self, '_sp_save_lock'):
            import threading
            self._sp_save_lock = threading.Lock()

        with self._sp_save_lock:
            # --- Prepare DataFrame ---
            df_to_save = df.copy()
            clean_cols = []
            seen = set()
            for c in df_to_save.columns:
                c_clean = str(c).strip().replace(".", "_").replace(" ", "_")
                base = c_clean
                idx = 1
                while c_clean in seen:
                    c_clean = f"{base}_{idx}"
                    idx += 1
                seen.add(c_clean)
                clean_cols.append(c_clean)
            df_to_save.columns = clean_cols
            for c in df_to_save.columns:
                df_to_save[c] = df_to_save[c].astype(str)

            total_rows = len(df_to_save)
            CHUNK_SIZE = 1000

            for attempt in range(2):
                try:
                    from sqlalchemy import text as sa_text
                    with engine.begin() as conn:
                        # Truncate then bulk-insert — all in one transaction so no data is lost
                        # on failure (transaction rolls back automatically).
                        conn.execute(sa_text(f'DELETE FROM "{table_name}"'))
                        df_to_save.to_sql(table_name, conn, if_exists='append', index=False, chunksize=CHUNK_SIZE)
                    print(f"[Supabase] Successfully saved {total_rows} rows to '{table_name}'", flush=True)
                    return True
                except Exception as e:
                    if attempt == 0:
                        # Table may not exist yet — create it on first attempt
                        try:
                            df_to_save.to_sql(table_name, engine, if_exists='replace', index=False, chunksize=CHUNK_SIZE)
                            print(f"[Supabase] Created and saved {total_rows} rows to '{table_name}'", flush=True)
                            return True
                        except Exception as e2:
                            print(f"[Supabase] Create-and-save failed for '{table_name}': {e2}", flush=True)
                            time.sleep(0.5)
                    else:
                        print(f"Warning: Failed to save to Supabase table '{table_name}': {e}", flush=True)
                        return False

    # Column names that are stored with underscores natively (not space-replaced)
    _NATIVE_UNDERSCORE_COLS = {
        'is_gsafe', 'is_swap', 'dung_hen', 'dt_complete', 'dt_created', 'sort_dt',
        'date_complete', 'rt_hours', 'tinh_trang_dau_vao', 'huong_xu_ly', 'so_lan_lap',
        'is_clps_7n_bt', 'is_cll30n', 'tg_hoan_tat', 'ngay_hoan_tat'
    }

    def _load_df_from_supabase(self, table_name: str) -> pd.DataFrame:
        engine = self.get_db_engine()
        if engine is None:
            return pd.DataFrame()
        try:
            df = pd.read_sql(f'SELECT * FROM "{table_name}"', engine)
            if df is not None and not df.empty:
                print(f"Successfully loaded {len(df)} rows from Supabase table '{table_name}'", flush=True)
                # Restore original column names: undo the space->underscore replacement done during save
                # Only rename columns that are NOT natively underscore-named
                new_cols = []
                for c in df.columns:
                    if c in self._NATIVE_UNDERSCORE_COLS:
                        new_cols.append(c)
                    else:
                        new_cols.append(c.replace('_', ' '))
                df.columns = new_cols
                # Normalize datetime columns to pandas datetime64 to avoid type mismatch
                for dt_col in ['dt_complete', 'dt_created', 'sort_dt', 'date_complete']:
                    if dt_col in df.columns:
                        df[dt_col] = pd.to_datetime(df[dt_col], errors='coerce')
                # Normalize boolean columns
                for bool_col in ['is_clps_7n_bt', 'is_cll30n', 'is_gsafe', 'is_swap']:
                    if bool_col in df.columns:
                        df[bool_col] = df[bool_col].astype(str).str.strip().str.lower().isin(['true', '1', 't'])
                return df
        except Exception as e:
            print(f"Info: Could not load table '{table_name}' from Supabase: {e}", flush=True)
        return pd.DataFrame()


    def set_database_url(self, url: str):
        url = (url or '').strip()
        self.DATABASE_URL = url
        try:
            CACHE_DIR.mkdir(exist_ok=True, parents=True)
            cfg_file = CACHE_DIR / "webapp_config.json"
            cfg = {}
            if cfg_file.exists():
                try:
                    with open(cfg_file, 'r', encoding='utf-8') as f:
                        cfg = json.load(f)
                except Exception:
                    cfg = {}
            cfg['DATABASE_URL'] = url
            with open(cfg_file, 'w', encoding='utf-8') as f:
                json.dump(cfg, f, ensure_ascii=False, indent=2)
            print(f"Saved DATABASE_URL configuration to {cfg_file}", flush=True)
        except Exception as e:
            print(f"Warning saving DATABASE_URL config: {e}", flush=True)
        return {"ok": True, "url": self.DATABASE_URL, "msg": "Đã lưu Supabase Database Connection String!"}

    def get_database_url(self):
        return {"ok": True, "url": getattr(self, 'DATABASE_URL', '')}

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

    def _get_tk_sheet_url(self) -> str:
        return f'https://docs.google.com/spreadsheets/d/{self.TK_SHEET_ID}/export?format=csv&gid={self.TK_GID}'

    def _get_bt_sheet_url(self) -> str:
        return f'https://docs.google.com/spreadsheets/d/{self.BT_SHEET_ID}/export?format=csv&gid={self.BT_GID}'

    def _get_kh_cls_sheet_url(self) -> str:
        return f'https://docs.google.com/spreadsheets/d/{self.KH_CLS_SHEET_ID}/export?format=csv&gid={self.KH_CLS_GID}'

    def _get_cll30n_sheet_url(self) -> str:
        return f'https://docs.google.com/spreadsheets/d/{self.CLL30N_SHEET_ID}/export?format=csv&gid={self.CLL30N_GID}'

    def _push_dataset_to_google_sheet(self, target: str, df: pd.DataFrame) -> bool:
        """
        Đẩy dữ liệu đã cập nhật về Google Apps Script WebApp nếu PERMISSIONS_WEBAPP_URL khả dụng.
        """
        if df is None:
            df = pd.DataFrame()
        webapp_url = getattr(self, 'PERMISSIONS_WEBAPP_URL', '') or os.environ.get("PERMISSIONS_WEBAPP_URL", "").strip()
        if not webapp_url:
            print(f"Info: Push back dataset '{target}' skipped (No WebApp URL configured).", flush=True)
            return False
        try:
            records = df.head(5000).astype(str).to_dict(orient='records') if not df.empty else []
            payload = {
                "action": "update_dataset",
                "target": target,
                "data": records
            }
            resp = requests.post(webapp_url, json=payload, timeout=15)
            print(f"Push back dataset '{target}' to Google Sheet: status={resp.status_code}", flush=True)
            return resp.status_code == 200
        except Exception as e:
            print(f"Warning: Failed to push dataset '{target}' to Google Sheet: {e}", flush=True)
            return False

    def _async_sync_after_import(self, target_name: str, df_target: pd.DataFrame):
        """Trigger Supabase + Google Sheet sync in a true background thread.
        The import API call returns immediately; upload happens asynchronously.
        """
        import threading

        def _do_sync():
            try:
                self._save_df_to_supabase(df_target, target_name)
            except Exception as e:
                print(f"Post-import Supabase save warning for '{target_name}': {e}", flush=True)
            # kh_cls, cll30n, tk, bt are 100% on Supabase — ZERO connection with Google Sheet.
            # No data is pushed to Google Sheet.

        if IS_VERCEL:
            _do_sync()
        else:
            t = threading.Thread(target=_do_sync, daemon=True)
            t.start()
        print(f"[Import] Sync completed/started for '{target_name}' ({len(df_target) if df_target is not None else 0} rows)", flush=True)


    def _is_custom_ton_imported(self, name: str) -> bool:
        tmp_dir = Path("/tmp/data_cache")
        for p in [CACHE_DIR / f"{name}_imported.json", tmp_dir / f"{name}_imported.json"]:
            try:
                if p.exists():
                    return True
            except Exception:
                pass
        return False

    def _set_custom_ton_imported(self, name: str):
        tmp_dir = Path("/tmp/data_cache")
        data = json.dumps({"imported": True, "time": time.time()})
        for d in [CACHE_DIR, tmp_dir]:
            try:
                d.mkdir(parents=True, exist_ok=True)
                with open(d / f"{name}_imported.json", "w", encoding="utf-8") as f:
                    f.write(data)
            except Exception:
                pass

    def _clear_custom_ton_imported(self, name: str):
        tmp_dir = Path("/tmp/data_cache")
        for p in [CACHE_DIR / f"{name}_imported.json", tmp_dir / f"{name}_imported.json"]:
            try:
                if p.exists():
                    p.unlink()
            except Exception:
                pass

    def load_cache_or_fetch(self):
        def _get_df(name):
            if self._is_cleared(name):
                return None, pd.DataFrame()
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

        # If local cache is empty (e.g. cold start on Vercel/Render), load from Supabase fallback
        if hr_df.empty:
            sp_hr = self._load_df_from_supabase("hr")
            if not sp_hr.empty:
                hr_df = sp_hr
                self._save_pickle(hr_df, "hr.pkl.gz")

        self.hr_df = hr_df
        self.lt_df = lt_df

        # If local cache is empty for ton_tk/ton_bt, load from Supabase
        if ton_tk_df.empty and not self._is_cleared('ton_tk'):
            sp_ton_tk = self._load_df_from_supabase("ton_tk")
            if not sp_ton_tk.empty:
                ton_tk_df = sp_ton_tk
                self._save_pickle(ton_tk_df, "ton_tk.pkl.gz")

        if ton_bt_df.empty and not self._is_cleared('ton_bt'):
            sp_ton_bt = self._load_df_from_supabase("ton_bt")
            if not sp_ton_bt.empty:
                ton_bt_df = sp_ton_bt
                self._save_pickle(ton_bt_df, "ton_bt.pkl.gz")

        self.ton_tk_df = ton_tk_df
        self.ton_bt_df = ton_bt_df

        if not self.hr_df.empty:
            self._process_metadata()

        # On Vercel serverless functions, defer loading big tables until requested to keep cold start fast (<1s)
        if IS_VERCEL:
            return

        if tk_df.empty and not self._is_cleared('tk'):
            sp_tk = self._load_df_from_supabase("tk")
            if not sp_tk.empty:
                tk_df = self._enrich_tk_df(sp_tk)
                self._save_pickle(tk_df, "tk.pkl.gz")

        if bt_df.empty and not self._is_cleared('bt'):
            sp_bt = self._load_df_from_supabase("bt")
            if not sp_bt.empty:
                bt_df = self._enrich_bt_df(sp_bt)
                self._save_pickle(bt_df, "bt.pkl.gz")

        # If local cache is empty for kh_cls and cll30n, load from Supabase (unless manually cleared)
        if kh_cls_df.empty and not self._is_cleared('kh_cls'):
            sp_kh_cls = self._load_df_from_supabase("kh_cls")
            if not sp_kh_cls.empty:
                kh_cls_df = sp_kh_cls
                self._save_pickle(kh_cls_df, "kh_cls.pkl.gz")

        if cll30n_df.empty and not self._is_cleared('cll30n'):
            sp_cll = self._load_df_from_supabase("cll30n")
            if not sp_cll.empty:
                cll30n_df = sp_cll
                self._save_pickle(cll30n_df, "cll30n.pkl.gz")

        self.tk_df = tk_df
        self.bt_df = bt_df
        self.kh_cls_df = kh_cls_df
        self.cll30n_df = cll30n_df

        mtime = hr_path.stat().st_mtime if hr_path else time.time()
        self.last_sync_time = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
        print(f"Cache/Supabase data loaded successfully! Sync time: {self.last_sync_time}", flush=True)

        if hr_df.empty or tk_df.empty or bt_df.empty:
            self.sync_live_data()

    def sync_live_data(self):
        if self.is_syncing:
            return False, "Sync already in progress"
        
        self.is_syncing = True
        self.sync_error = None
        t0 = time.time()
        
        try:
            def _get_df_local(name):
                if self._is_cleared(name):
                    return pd.DataFrame()
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
            df_tk = pd.DataFrame() if self._is_cleared('tk') else (self.tk_df if hasattr(self, 'tk_df') and not self.tk_df.empty else _get_df_local("tk"))
            df_bt = pd.DataFrame() if self._is_cleared('bt') else (self.bt_df if hasattr(self, 'bt_df') and not self.bt_df.empty else _get_df_local("bt"))
            df_ton_tk = pd.DataFrame() if self._is_cleared('ton_tk') else (self.ton_tk_df if hasattr(self, 'ton_tk_df') and not self.ton_tk_df.empty else _get_df_local("ton_tk"))
            df_ton_bt = pd.DataFrame() if self._is_cleared('ton_bt') else (self.ton_bt_df if hasattr(self, 'ton_bt_df') and not self.ton_bt_df.empty else _get_df_local("ton_bt"))
            df_lt = self.lt_df if hasattr(self, 'lt_df') and not self.lt_df.empty else _get_df_local("lt")
            df_cll30n = pd.DataFrame() if self._is_cleared('cll30n') else (self.cll30n_df if hasattr(self, 'cll30n_df') and not self.cll30n_df.empty else _get_df_local("cll30n"))
            df_kh_cls = pd.DataFrame() if self._is_cleared('kh_cls') else (self.kh_cls_df if hasattr(self, 'kh_cls_df') and not self.kh_cls_df.empty else _get_df_local("kh_cls"))

            # kh_cls & cll30n are IMPORT-ONLY datasets.
            # If empty and NOT cleared, load from Supabase fallback (e.g. cold restart)
            if df_cll30n.empty and not self._is_cleared('cll30n'):
                sp_cll = self._load_df_from_supabase("cll30n")
                if not sp_cll.empty:
                    df_cll30n = sp_cll
                    self._save_pickle(df_cll30n, "cll30n.pkl.gz")

            if df_kh_cls.empty and not self._is_cleared('kh_cls'):
                sp_kh_cls = self._load_df_from_supabase("kh_cls")
                if not sp_kh_cls.empty:
                    df_kh_cls = sp_kh_cls
                    self._save_pickle(df_kh_cls, "kh_cls.pkl.gz")

            # Fetch live data from designated Google Sheets for Dashboard KPIs & Lịch trực
            try:
                print("Fetching live HR data from Sheet...", flush=True)
                res_hr = requests.get(self._get_sheet_url(GIDS['HR']), timeout=20)
                if res_hr.status_code == 200 and not res_hr.text.strip().startswith('<!DOCTYPE'):
                    df_hr = self._read_any_dataframe(res_hr.content, "hr.csv")
            except Exception as e_hr:
                print(f"Warning: HR sheet fetch failed: {e_hr}", flush=True)

            # Data Triển Khai (TK) and Bảo Trì (BT) are managed via Supabase (Phương Án B).
            # They are loaded from Supabase and NOT fetched from Google Sheet.
            if df_tk.empty and not self._is_cleared('tk'):
                sp_tk = self._load_df_from_supabase("tk")
                if not sp_tk.empty:
                    df_tk = self._enrich_tk_df(sp_tk)
                    self._save_pickle(df_tk, "tk.pkl.gz")

            if df_bt.empty and not self._is_cleared('bt'):
                sp_bt = self._load_df_from_supabase("bt")
                if not sp_bt.empty:
                    df_bt = self._enrich_bt_df(sp_bt)
                    self._save_pickle(df_bt, "bt.pkl.gz")

            # kh_cls and cll30n are IMPORT-ONLY datasets.
            # They must NOT be auto-fetched from Google Sheets during sync.
            # Their data is preserved from the last manual import and saved to Supabase by import operations.
            # df_kh_cls and df_cll30n already set from self.kh_cls_df / self.cll30n_df above.

            # Fetch live Lịch Trực from Google Sheet (unchanged – no Supabase)
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

            # Fetch live Tồn TK from Google Sheet (unchanged – no Supabase)
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

            # Fetch live Tồn BT from Google Sheet (unchanged – no Supabase)
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

            # NOTE: TK and BT are already enriched when loaded from Supabase (lines above).
            # Do NOT call _enrich_tk_df / _enrich_bt_df again here to avoid double-processing
            # (which corrupts is_gsafe, is_swap, dung_hen, rt_hours).

            # Save to Cache
            self._save_pickle(df_cll30n, "cll30n.pkl.gz")
            self._save_pickle(df_kh_cls, "kh_cls.pkl.gz")
            self._save_pickle(df_hr, "hr.pkl.gz")
            self._save_pickle(df_tk, "tk.pkl.gz")
            self._save_pickle(df_bt, "bt.pkl.gz")

            # TK, BT, kh_cls, cll30n are managed via Supabase (saved during import operations)
            # lt, ton_tk, ton_bt: Google Sheet is source of truth – no Supabase persistence

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
            self._auto_enrich_hr_from_tickets()
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
        if self.hr_df is None or self.hr_df.empty:
            self.team_leads = []
            self.regions = []
            self.partners = []
            self.blocks = []
            return

        col_acc = self._find_col(self.hr_df, ['Inside Account', 'account', 'inside'], default_idx=6 if len(self.hr_df.columns) > 6 else None) or 'Inside Account'
        col_name = self._find_col(self.hr_df, ['Họ Tên NV', 'name', 'ho_ten'], default_idx=4 if len(self.hr_df.columns) > 4 else None) or 'Họ Tên NV'
        col_code = self._find_col(self.hr_df, ['Mã NV', 'code', 'ma_nv'], default_idx=5 if len(self.hr_df.columns) > 5 else None) or 'Mã NV'
        col_tl = self._find_col(self.hr_df, ['Họ tên Đội trưởng', 'team_lead', 'doi_truong'], default_idx=24 if len(self.hr_df.columns) > 24 else None) or 'Họ tên Đội trưởng'
        col_reg = self._find_col(self.hr_df, ['Vùng', 'region', 'vung'], default_idx=1 if len(self.hr_df.columns) > 1 else None) or 'Vùng'
        col_part = self._find_col(self.hr_df, ['Đối tác', 'partner', 'doi_tac'], default_idx=2 if len(self.hr_df.columns) > 2 else None) or 'Đối tác'
        col_blk = self._find_col(self.hr_df, ['Block', 'block'], default_idx=3 if len(self.hr_df.columns) > 3 else None) or 'Block'
        col_pos = self._find_col(self.hr_df, ['Chức danh', 'position', 'chuc_danh'], default_idx=14 if len(self.hr_df.columns) > 14 else None) or 'Chức danh'
        col_stat = self._find_col(self.hr_df, ['Tình trạng Hợp đồng', 'status'], default_idx=13 if len(self.hr_df.columns) > 13 else None) or 'Tình trạng Hợp đồng'

        for _, row in self.hr_df.iterrows():
            acc = str(row.get(col_acc, '') or '').strip()
            if acc and acc.upper() != 'NAN':
                tl = str(row.get(col_tl, '') or '').strip()
                if not tl or tl.lower() in ('nan', 'none', '-', '', 'null'):
                    tl = 'Chưa xác nhận'
                self.emp_map[acc] = {
                    'account': acc,
                    'name': str(row.get(col_name, acc) or acc).strip(),
                    'code': str(row.get(col_code, '') or '').strip(),
                    'team_lead': tl,
                    'region': str(row.get(col_reg, '') or '').strip(),
                    'partner': str(row.get(col_part, '') or '').strip(),
                    'block': str(row.get(col_blk, '') or '').strip(),
                    'position': str(row.get(col_pos, '') or '').strip(),
                    'status': str(row.get(col_stat, '') or '').strip()
                }

        # Dynamic dropdown options
        tl_list = [
            str(x).strip() 
            for x in self.hr_df[col_tl].dropna().unique() 
            if str(x).strip() and str(x).strip().lower() not in ('nan', 'none', '-', '', 'null')
        ]
        has_unconfirmed = any(v.get('team_lead') == 'Chưa xác nhận' for v in self.emp_map.values())
        if has_unconfirmed and 'Chưa xác nhận' not in tl_list:
            tl_list.append('Chưa xác nhận')
        self.team_leads = sorted(list(set(tl_list)))
        self.regions = sorted([str(x).strip() for x in self.hr_df[col_reg].dropna().unique() if str(x).strip() and str(x).strip().lower() not in ('nan', 'none', '-', '', 'null')])
        self.partners = sorted([str(x).strip() for x in self.hr_df[col_part].dropna().unique() if str(x).strip() and str(x).strip().lower() not in ('nan', 'none', '-', '', 'null')])
        self.blocks = sorted([str(x).strip() for x in self.hr_df[col_blk].dropna().unique() if str(x).strip() and str(x).strip().lower() not in ('nan', 'none', '-', '', 'null')])

        # Build blocks_by_teamlead map: team_lead -> sorted list of blocks they manage
        btl = {}
        for v in self.emp_map.values():
            tl = v.get('team_lead', '')
            blk = v.get('block', '')
            if tl and blk and blk.lower() not in ('nan', 'none', '-', '', 'null'):
                if tl not in btl:
                    btl[tl] = set()
                btl[tl].add(blk)
        self.blocks_by_teamlead = {tl: sorted(list(blks)) for tl, blks in btl.items()}

    def _auto_enrich_hr_from_tickets(self):
        """
        Tự động phát hiện và bổ sung nhân sự kỹ thuật từ các ca hoàn tất TK / BT vào dữ liệu HR.
        Quy tắc nghiệp vụ FPT SG01:
        1. Mỗi Đội Trưởng quản lý các Block tương ứng cố định (1 block chỉ có 1 đội trưởng).
        2. Nếu một nhân sự có ca hoàn tất TK/BT nhưng chưa có trong danh sách HR:
           - Xác định Block từ phiếu thi công / bảo trì của nhân sự đó.
           - Tra cứu Đội Trưởng quản lý Block đó trong dữ liệu HR:
             + Nếu Block chỉ gắn với đúng 1 Đội Trưởng: tự động gán Đội Trưởng đó cho nhân sự.
             + Nếu Block gắn nhiều hơn 1 Đội Trưởng (hoặc Block mới chưa có Đội Trưởng): gán Đội Trưởng = 'Chưa xác nhận'.
           - Tự động thêm Inside Account, Block, Đội Trưởng vào HR data, lưu cache và đồng bộ Supabase.
        3. Tự động đưa 'Chưa xác nhận' vào danh sách filter Đội Trưởng để người dùng lọc và quản lý đầy đủ.
        """
        if self.hr_df is None or self.hr_df.empty:
            return

        col_blk_hr = self._find_col(self.hr_df, ['Block', 'block'], default_idx=3 if len(self.hr_df.columns) > 3 else None)
        col_tl_hr = self._find_col(self.hr_df, ['Họ tên Đội trưởng', 'team_lead', 'doi_truong'], default_idx=24 if len(self.hr_df.columns) > 24 else None)
        col_acc_hr = self._find_col(self.hr_df, ['Inside Account', 'account', 'inside'], default_idx=6 if len(self.hr_df.columns) > 6 else None) or 'Inside Account'

        if not col_blk_hr or not col_tl_hr:
            return

        # 1. Build mapping Block -> Đội Trưởng từ dữ liệu HR hiện hữu
        block_to_tls = {}
        for _, row in self.hr_df.iterrows():
            blk = str(row.get(col_blk_hr, '') or '').strip()
            tl = str(row.get(col_tl_hr, '') or '').strip()
            if not blk or blk.lower() in ('nan', 'none', '-', '', 'null'):
                continue
            if not tl or tl.lower() in ('nan', 'none', '-', '', 'null', 'chưa xác nhận', 'chua xac nhan'):
                continue
            if blk not in block_to_tls:
                block_to_tls[blk] = set()
            block_to_tls[blk].add(tl)

        block_to_single_tl = {}
        for blk, tls in block_to_tls.items():
            if len(tls) == 1:
                block_to_single_tl[blk] = list(tls)[0]
            else:
                # 1 block nhiều đội trưởng -> coi như Chưa xác nhận
                block_to_single_tl[blk] = 'Chưa xác nhận'

        # 2. Danh sách Inside Account hiện có trong HR
        existing_accs = {
            str(x).strip().upper() 
            for x in self.hr_df[col_acc_hr].dropna() 
            if str(x).strip() and str(x).strip().upper() not in ('NAN', 'NONE', '-', 'NULL')
        }

        # 3. Quét các dataset ca vụ (TK, BT, KH_CLS, CLL30N)
        candidate_datasets = []
        if self.tk_df is not None and not self.tk_df.empty:
            candidate_datasets.append(('tk', self.tk_df))
        if self.bt_df is not None and not self.bt_df.empty:
            candidate_datasets.append(('bt', self.bt_df))
        if hasattr(self, 'kh_cls_df') and self.kh_cls_df is not None and not self.kh_cls_df.empty:
            candidate_datasets.append(('kh_cls', self.kh_cls_df))
        if hasattr(self, 'cll30n_df') and self.cll30n_df is not None and not self.cll30n_df.empty:
            candidate_datasets.append(('cll30n', self.cll30n_df))

        new_staff_info = {}

        for ds_name, df in candidate_datasets:
            col_nv = self._get_required_col(df, ['Nhân viên', 'Nhân sự', 'nhan_vien', 'Account hoàn tất', 'Inside Account'])
            if not col_nv or col_nv not in df.columns:
                continue

            col_blk = self._find_col(df, ['Block', 'Block quản lý', 'block'])
            col_dt = self._find_col(df, ['Đối tác', 'Đối tác quản lý', 'doi_tac'])
            col_vung = self._find_col(df, ['Vùng', 'vung', 'Chi nhánh', 'chi_nhanh'])

            for _, row in df.iterrows():
                acc = str(row.get(col_nv, '') or '').strip().upper()
                if not acc or acc in ('NAN', 'NONE', '-', '', 'NULL'):
                    continue
                if acc in existing_accs:
                    continue

                blk = str(row.get(col_blk, '') or '').strip() if col_blk else ''
                dt = str(row.get(col_dt, '') or '').strip() if col_dt else ''
                vung = str(row.get(col_vung, '') or '').strip() if col_vung else 'SG01'

                if acc not in new_staff_info:
                    new_staff_info[acc] = {
                        'blocks': {},
                        'partners': {},
                        'regions': {}
                    }
                
                if blk and blk.lower() not in ('nan', 'none', '-', 'null'):
                    new_staff_info[acc]['blocks'][blk] = new_staff_info[acc]['blocks'].get(blk, 0) + 1
                if dt and dt.lower() not in ('nan', 'none', '-', 'null'):
                    new_staff_info[acc]['partners'][dt] = new_staff_info[acc]['partners'].get(dt, 0) + 1
                if vung and vung.lower() not in ('nan', 'none', '-', 'null'):
                    new_staff_info[acc]['regions'][vung] = new_staff_info[acc]['regions'].get(vung, 0) + 1

        has_changes = False

        # 4. Bổ sung nhân viên mới phát sinh
        if new_staff_info:
            print(f"[Auto-Enrich HR] Phát hiện {len(new_staff_info)} nhân sự kỹ thuật từ ca vụ TK/BT chưa có trong HR data!", flush=True)
            new_rows = []
            for acc, info in new_staff_info.items():
                best_blk = '-'
                if info['blocks']:
                    best_blk = max(info['blocks'].items(), key=lambda x: x[1])[0]

                best_dt = ''
                if info['partners']:
                    best_dt = max(info['partners'].items(), key=lambda x: x[1])[0]
                if not best_dt:
                    if acc.startswith('PNC01'): best_dt = 'Phương Nam-01'
                    elif acc.startswith('PNC03'): best_dt = 'Phương Nam-03'
                    elif acc.startswith('PNC04'): best_dt = 'Phương Nam-04'
                    elif acc.startswith('PNFTI'): best_dt = 'PN-FTI'
                    else: best_dt = 'Phương Nam'

                best_vung = 'SG01'
                if info['regions']:
                    best_vung = max(info['regions'].items(), key=lambda x: x[1])[0]

                # Quy tắc: Nếu Block đó gán nhiều đội trưởng thì xem như chưa xác nhận đội trưởng -> 'Chưa xác nhận'
                assigned_tl = block_to_single_tl.get(best_blk, 'Chưa xác nhận')

                new_record = {col: '' for col in self.hr_df.columns}
                new_record[col_acc_hr] = acc
                if 'Họ Tên NV' in self.hr_df.columns:
                    new_record['Họ Tên NV'] = acc
                if col_blk_hr in self.hr_df.columns:
                    new_record[col_blk_hr] = best_blk
                if col_tl_hr in self.hr_df.columns:
                    new_record[col_tl_hr] = assigned_tl
                if 'Đối tác' in self.hr_df.columns:
                    new_record['Đối tác'] = best_dt
                if 'Vùng' in self.hr_df.columns:
                    new_record['Vùng'] = best_vung
                if 'Chức danh' in self.hr_df.columns:
                    new_record['Chức danh'] = 'Kỹ thuật viên'
                if 'Tình trạng Hợp đồng' in self.hr_df.columns:
                    new_record['Tình trạng Hợp đồng'] = 'Đang hoạt động'
                if 'Tình trạng Tài khoản' in self.hr_df.columns:
                    new_record['Tình trạng Tài khoản'] = 'Active'
                if 'Phân công' in self.hr_df.columns:
                    new_record['Phân công'] = 'Tính lương'

                new_rows.append(new_record)
                existing_accs.add(acc)

            if new_rows:
                self.hr_df = pd.concat([self.hr_df, pd.DataFrame(new_rows)], ignore_index=True)
                has_changes = True

        # 5. Rà soát lại các nhân sự HR hiện có nhưng bị trống Đội Trưởng
        for idx, row in self.hr_df.iterrows():
            current_tl = str(row.get(col_tl_hr, '') or '').strip()
            blk = str(row.get(col_blk_hr, '') or '').strip()
            if not current_tl or current_tl.lower() in ('nan', 'none', '-', '', 'null'):
                new_tl = block_to_single_tl.get(blk, 'Chưa xác nhận')
                self.hr_df.at[idx, col_tl_hr] = new_tl
                has_changes = True

        if has_changes:
            self._save_pickle(self.hr_df, "hr.pkl.gz")
            self._async_sync_after_import("hr", self.hr_df)
            self._process_metadata()
            print(f"[Auto-Enrich HR] Đã hoàn tất đồng bộ HR: {len(self.hr_df)} nhân sự!", flush=True)

    def format_rt(self, val_hours):
        if pd.isna(val_hours) or val_hours is None or val_hours < 0:
            return "-"
        return f"{val_hours:.2f}H"

    def _parse_date_param(self, val):
        if val is None:
            return None
        if not isinstance(val, (str, datetime.date, datetime.datetime, pd.Timestamp)):
            return None
        s_val = str(val).strip()
        if not s_val or s_val.lower() in ('none', 'null', 'nan', 'undefined', 'query'):
            return None
        try:
            return pd.to_datetime(s_val)  # Return Timestamp, compatible with both datetime64 and date columns
        except Exception:
            return None

    def _clean_str_param(self, val):
        if val is None or not isinstance(val, str):
            return None
        s = val.strip()
        if not s or s.lower() in ('none', 'null', 'nan', 'undefined', 'query', '__all__', 'all'):
            return None
        return s

    def _ensure_kpi_datasets_loaded(self):
        """Ensure HR metadata and database-backed datasets are loaded in memory."""
        # 1. HR
        if self.hr_df is None or self.hr_df.empty:
            if (CACHE_DIR / "hr.pkl.gz").exists():
                try: self.hr_df = pd.read_pickle(CACHE_DIR / "hr.pkl.gz")
                except Exception: pass
            if (self.hr_df is None or self.hr_df.empty):
                sp_hr = self._load_df_from_supabase("hr")
                if sp_hr is not None and not sp_hr.empty:
                    self.hr_df = sp_hr
                    self._save_pickle(self.hr_df, "hr.pkl.gz")
            if self.hr_df is not None and not self.hr_df.empty:
                self._process_metadata()

        # 2. TK
        if (self.tk_df is None or self.tk_df.empty) and not self._is_cleared('tk'):
            if (CACHE_DIR / "tk.pkl.gz").exists():
                try: self.tk_df = pd.read_pickle(CACHE_DIR / "tk.pkl.gz")
                except Exception: pass
            if (self.tk_df is None or self.tk_df.empty):
                sp_tk = self._load_df_from_supabase("tk")
                if not sp_tk.empty:
                    self.tk_df = self._enrich_tk_df(sp_tk)
                    self._save_pickle(self.tk_df, "tk.pkl.gz")

        # 3. BT
        if (self.bt_df is None or self.bt_df.empty) and not self._is_cleared('bt'):
            if (CACHE_DIR / "bt.pkl.gz").exists():
                try: self.bt_df = pd.read_pickle(CACHE_DIR / "bt.pkl.gz")
                except Exception: pass
            if (self.bt_df is None or self.bt_df.empty):
                sp_bt = self._load_df_from_supabase("bt")
                if not sp_bt.empty:
                    self.bt_df = self._enrich_bt_df(sp_bt)
                    self._save_pickle(self.bt_df, "bt.pkl.gz")

        # 4. KH_CLS
        if (self.kh_cls_df is None or self.kh_cls_df.empty) and not self._is_cleared('kh_cls'):
            if (CACHE_DIR / "kh_cls.pkl.gz").exists():
                try: self.kh_cls_df = pd.read_pickle(CACHE_DIR / "kh_cls.pkl.gz")
                except Exception: pass
            if (self.kh_cls_df is None or self.kh_cls_df.empty):
                sp_kh = self._load_df_from_supabase("kh_cls")
                if not sp_kh.empty:
                    self.kh_cls_df = sp_kh
                    self._save_pickle(self.kh_cls_df, "kh_cls.pkl.gz")

        # 5. CLL30N
        if (self.cll30n_df is None or self.cll30n_df.empty) and not self._is_cleared('cll30n'):
            if (CACHE_DIR / "cll30n.pkl.gz").exists():
                try: self.cll30n_df = pd.read_pickle(CACHE_DIR / "cll30n.pkl.gz")
                except Exception: pass
            if (self.cll30n_df is None or self.cll30n_df.empty):
                sp_cll = self._load_df_from_supabase("cll30n")
                if not sp_cll.empty:
                    self.cll30n_df = sp_cll
                    self._save_pickle(self.cll30n_df, "cll30n.pkl.gz")

        # 6. Auto-enrich missing staff from tickets into HR data
        self._auto_enrich_hr_from_tickets()

    def get_kpi_report(self, start_date=None, end_date=None, team_lead=None, region=None, partner=None, block=None, search=None):
        t0 = time.time()
        self._ensure_kpi_datasets_loaded()
        
        team_lead = self._clean_str_param(team_lead)
        region = self._clean_str_param(region)
        partner = self._clean_str_param(partner)
        block = self._clean_str_param(block)
        search = self._clean_str_param(search)

        # 1. Date Filtering
        tk = self.tk_df.copy()
        bt = self.bt_df.copy()

        # Normalize date_complete to datetime64 (handles both datetime.date from pickle and datetime64 from Supabase)
        if 'date_complete' in tk.columns:
            tk['date_complete'] = pd.to_datetime(tk['date_complete'], errors='coerce')
        if 'date_complete' in bt.columns:
            bt['date_complete'] = pd.to_datetime(bt['date_complete'], errors='coerce')

        s_d = self._parse_date_param(start_date)
        e_d = self._parse_date_param(end_date)

        if s_d:
            tk = tk[tk['date_complete'] >= s_d]
            bt = bt[bt['date_complete'] >= s_d]

        if e_d:
            # Include the full end day (up to 23:59:59) so tickets completed on end_date are included
            e_d_end = e_d + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
            tk = tk[tk['date_complete'] <= e_d_end]
            bt = bt[bt['date_complete'] <= e_d_end]

        # Filter KH Co Cls by date range
        cls = self.kh_cls_df.copy() if hasattr(self, 'kh_cls_df') and not self.kh_cls_df.empty else pd.DataFrame()

        if not cls.empty and 'date_complete' in cls.columns:
            cls['date_complete'] = pd.to_datetime(cls['date_complete'], errors='coerce')
            if s_d:
                cls = cls[cls['date_complete'] >= s_d]
            if e_d:
                e_d_end_cls = e_d + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
                cls = cls[cls['date_complete'] <= e_d_end_cls]

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
            s = search.upper()
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
            cll['date_complete'] = pd.to_datetime(cll['date_complete'], errors='coerce')
            if s_d:
                cll = cll[cll['date_complete'] >= s_d]
            if e_d:
                e_d_end_cll = e_d + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
                cll = cll[cll['date_complete'] <= e_d_end_cll]

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
            if 'rt_hours' not in tk.columns or tk['rt_hours'].dropna().empty:
                col_c = self._find_col(tk, ['Ngày hoàn tất PTC', 'TG hoàn tất PTC', 'TG hoàn tất', 'Ngày online'])
                col_t = self._find_col(tk, ['TG tạo PTC', 'TG tạo', 'Ngày tạo'])
                if col_c and col_t:
                    dt_c = pd.to_datetime(tk[col_c], dayfirst=True, errors='coerce')
                    dt_t = pd.to_datetime(tk[col_t], dayfirst=True, errors='coerce')
                    rt_s = (dt_c - dt_t).dt.total_seconds()
                    tk['rt_hours'] = np.where(rt_s >= 0, rt_s / 3600.0, np.nan)
                else:
                    tk['rt_hours'] = np.nan
        else:
            tk['is_gsafe'] = []
            tk['is_swap'] = []
            tk['dung_hen'] = []
            tk['rt_hours'] = []

        if not bt.empty:
            if 'dung_hen' not in bt.columns:
                bt['dung_hen'] = 0
            else:
                bt['dung_hen'] = pd.to_numeric(bt['dung_hen'], errors='coerce').fillna(0).astype(int)
            if 'rt_hours' not in bt.columns or bt['rt_hours'].dropna().empty:
                col_c = self._find_col(bt, ['TG Hoàn Tất', 'Ngày hoàn tất', 'TG hoàn tất'])
                col_t = self._find_col(bt, ['TG Tạo', 'Ngày tạo', 'TG tạo'])
                if col_c and col_t:
                    dt_c = pd.to_datetime(bt[col_c], dayfirst=True, errors='coerce')
                    dt_t = pd.to_datetime(bt[col_t], dayfirst=True, errors='coerce')
                    rt_s = (dt_c - dt_t).dt.total_seconds()
                    bt['rt_hours'] = np.where(rt_s >= 0, rt_s / 3600.0, np.nan)
                else:
                    bt['rt_hours'] = np.nan

        # 2. Overall Aggregations
        # TK Valid (Excluding Gsafe and Swap for KPIs)
        tk_valid = tk[~tk['is_gsafe'] & ~tk['is_swap']] if not tk.empty else tk
        tk_swap = tk[tk['is_swap']] if not tk.empty else tk
        tk_gsafe = tk[tk['is_gsafe']] if not tk.empty else tk

        tk_1 = int((tk_valid['dung_hen'] == 1).sum())
        tk_0 = int((tk_valid['dung_hen'] == 0).sum())
        tk_tot = tk_1 + tk_0
        tk_dh_pct = round((tk_1 / tk_tot * 100), 2) if tk_tot > 0 else 0.0
        
        rt_tk_ser = pd.to_numeric(tk_valid['rt_hours'], errors='coerce')
        rt_tk_avg = float(rt_tk_ser.mean()) if len(tk_valid) > 0 and not rt_tk_ser.dropna().empty else None
        tk_gt_24h = int((rt_tk_ser > 24.0).sum()) if len(tk_valid) > 0 else 0
        tk_gt_72h = int((rt_tk_ser > 72.0).sum()) if len(tk_valid) > 0 else 0

        # BT Valid
        bt_1 = int((bt['dung_hen'] == 1).sum())
        bt_0 = int((bt['dung_hen'] == 0).sum())
        bt_tot = bt_1 + bt_0
        bt_dh_pct = round((bt_1 / bt_tot * 100), 2) if bt_tot > 0 else 0.0
        
        rt_bt_ser = pd.to_numeric(bt['rt_hours'], errors='coerce')
        rt_bt_avg = float(rt_bt_ser.mean()) if len(bt) > 0 and not rt_bt_ser.dropna().empty else None
        bt_gt_24h = int((rt_bt_ser > 24.0).sum()) if len(bt) > 0 else 0
        bt_gt_72h = int((rt_bt_ser > 72.0).sum()) if len(bt) > 0 else 0

        # Total Đúng Hẹn %
        tot_1 = tk_1 + bt_1
        tot_all = tk_tot + bt_tot
        total_dh_pct = round((tot_1 / tot_all * 100), 2) if tot_all > 0 else 0.0

        # CLL30N % Aggregation
        # Tử số CLL30N: chỉ đếm rows có is_cll30n=True (ca lặp thực sự ≤30 ngày)
        # Mẫu số: tổng KH Có Cls (kh_cls dataset), fallback sang len(cll) nếu kh_cls trống
        cll_tot = int((cll['is_cll30n'] == True).sum()) if not cll.empty and 'is_cll30n' in cll.columns else 0
        cls_tot = len(cls) if not cls.empty else (len(cll) if not cll.empty else 0)
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
        _loai_col = 'Loại giao dịch' if 'Loại giao dịch' in tk_swap.columns else None
        swap_counts = tk_swap[_loai_col].value_counts().to_dict() if _loai_col and not tk_swap.empty else {}

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
        tk_v_dict = {}
        for acc, group in tk_valid_grp:
            rt_s = pd.to_numeric(group['rt_hours'], errors='coerce')
            tk_v_dict[acc] = {
                'c1': (group['dung_hen'] == 1).sum(),
                'c0': (group['dung_hen'] == 0).sum(),
                'rt_avg': rt_s.mean() if not rt_s.dropna().empty else None,
                'gt_24h': int((rt_s > 24.0).sum()),
                'gt_72h': int((rt_s > 72.0).sum()),
                'total': len(group)
            }

        _loai_col2 = 'Loại giao dịch' if not tk_swap.empty and 'Loại giao dịch' in tk_swap.columns else None
        tk_s_dict = {
            acc: {
                'total': len(group),
                'breakdown': group[_loai_col2].value_counts().to_dict() if _loai_col2 else {}
            } for acc, group in tk_swap_grp
        }

        tk_g_dict = {acc: len(group) for acc, group in tk_gsafe_grp}

        bt_v_dict = {}
        for acc, group in bt_grp:
            rt_s = pd.to_numeric(group['rt_hours'], errors='coerce')
            bt_v_dict[acc] = {
                'c1': (group['dung_hen'] == 1).sum(),
                'c0': (group['dung_hen'] == 0).sum(),
                'rt_avg': rt_s.mean() if not rt_s.dropna().empty else None,
                'gt_24h': int((rt_s > 24.0).sum()),
                'gt_72h': int((rt_s > 72.0).sum()),
                'total': len(group)
            }

        # Employee CLL30N: đếm chỉ rows is_cll30n=True (ca lặp thực sự), không đếm tất cả rows
        if not isinstance(cll_grp, dict):
            cll_dict = {
                acc: int((group['is_cll30n'] == True).sum()) if 'is_cll30n' in group.columns else len(group)
                for acc, group in cll_grp
            }
            clps7n_dict = {acc: int((group['is_clps_7n_bt'] == True).sum()) for acc, group in cll_grp}
        else:
            cll_dict = {}
            clps7n_dict = {}
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

            e_tk_gt_24h = int(e_tk_v.get('gt_24h', 0))
            e_tk_gt_72h = int(e_tk_v.get('gt_72h', 0))
            e_bt_gt_24h = int(e_bt.get('gt_24h', 0))
            e_bt_gt_72h = int(e_bt.get('gt_72h', 0))

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
                'tk_gt_24h': e_tk_gt_24h,
                'tk_gt_72h': e_tk_gt_72h,
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
                'bt_gt_24h': e_bt_gt_24h,
                'bt_gt_72h': e_bt_gt_72h,
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
                'total_gt_24h': e_tk_gt_24h + e_bt_gt_24h,
                'total_gt_72h': e_tk_gt_72h + e_bt_gt_72h,
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
                'tk_total_volume': len(tk),
                'tk_volume_kpi': tk_tot,
                'tk_dung_hen_pct': tk_dh_pct,
                'tk_dung_hen_1': tk_1,
                'tk_dung_hen_0': tk_0,
                'tk_gt_24h': tk_gt_24h,
                'tk_gt_72h': tk_gt_72h,
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
                'bt_gt_24h': bt_gt_24h,
                'bt_gt_72h': bt_gt_72h,
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
                'total_gt_24h': tk_gt_24h + bt_gt_24h,
                'total_gt_72h': tk_gt_72h + bt_gt_72h,
                'total_work_volume': len(tk) + len(bt)
            },
            'employees': emp_rows
        }

    def get_employee_details(self, account: str, start_date=None, end_date=None):
        acc = account.strip().upper()
        meta = self.emp_map.get(acc, {'account': acc, 'name': acc})

        tk = self.tk_df[self.tk_df['Nhân viên'] == acc].copy()
        bt = self.bt_df[self.bt_df['Nhân viên'] == acc].copy()

        # Normalize date_complete to datetime64 (handles both datetime.date from pickle and datetime64 from Supabase)
        if 'date_complete' in tk.columns:
            tk['date_complete'] = pd.to_datetime(tk['date_complete'], errors='coerce')
        if 'date_complete' in bt.columns:
            bt['date_complete'] = pd.to_datetime(bt['date_complete'], errors='coerce')

        s_d = self._parse_date_param(start_date)
        e_d = self._parse_date_param(end_date)

        if s_d:
            tk = tk[tk['date_complete'] >= s_d]
            bt = bt[bt['date_complete'] >= s_d]

        if e_d:
            tk = tk[tk['date_complete'] <= e_d]
            bt = bt[bt['date_complete'] <= e_d]

        # TK tickets list
        tk_list = []
        for _, row in tk.iterrows():
            rt_val = row.get('rt_hours')
            try:
                rt_float = float(rt_val) if pd.notna(rt_val) else None
            except Exception:
                rt_float = None
            tk_list.append({
                'contract_no': str(row.get('Số hợp đồng', '')),
                'customer_name': str(row.get('Tên khách hàng', '')),
                'service_package': str(row.get('Gói dịch vụ', '')),
                'tx_type': str(row.get('Loại giao dịch', '')),
                'dt_created': str(row.get('TG tạo PTC', '')),
                'dt_complete': str(row.get('Ngày hoàn tất PTC', '')),
                'dung_hen': int(row.get('dung_hen', 0)),
                'rt_hours': round(rt_float, 2) if rt_float is not None else None,
                'rt_fmt': self.format_rt(rt_val),
                'is_gsafe': bool(row.get('is_gsafe', False)),
                'is_swap': bool(row.get('is_swap', False))
            })

        # BT tickets list
        col_as_bt = next((c for c in bt.columns if 'phi' in str(c).lower() and 'trang' in str(c).lower()), None)
        if not col_as_bt and len(bt.columns) > 44:
            col_as_bt = bt.columns[44]
        bt_list = []
        for _, row in bt.iterrows():
            rt_val = row.get('rt_hours')
            try:
                rt_float = float(rt_val) if pd.notna(rt_val) else None
            except Exception:
                rt_float = None
            bt_list.append({
                'contract_no': str(row.get('Số HĐ', '')),
                'customer_name': str(row.get('Khách hàng', '') or row.get('Tên khách hàng', '')),
                'dt_created': str(row.get('TG Tạo', '')),
                'dt_complete': str(row.get('TG Hoàn Tất', '')),
                'dung_hen': int(row.get('dung_hen', 0)),
                'rt_hours': round(rt_float, 2) if rt_float is not None else None,
                'rt_fmt': self.format_rt(rt_val),
                'tx_type': str(row.get(col_as_bt, '-')) if col_as_bt else '-'
            })

        # CLL tickets list
        cll = self.cll30n_df[self.cll30n_df['Nhân viên'] == acc].copy() if hasattr(self, 'cll30n_df') and not self.cll30n_df.empty else pd.DataFrame()

        if not cll.empty and 'date_complete' in cll.columns:
            cll['date_complete'] = pd.to_datetime(cll['date_complete'], errors='coerce')
            if s_d:
                cll = cll[cll['date_complete'] >= s_d]
            if e_d:
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

    def _clean_block_name(self, raw, ns='', hr_map=None):
        import re
        s = re.sub(r'\s*-\s*L\d+.*$', '', str(raw or '').strip(), flags=re.I).strip()
        if not s or s.upper() in ('NAN', 'NONE', '-', 'NULL'):
            if hr_map and ns and hr_map.get(ns, {}).get('block'):
                return hr_map[ns]['block']
            return '(Không xác định)'
        return s

    def _get_ton_tk_parsed(self, hr_map):
        self._refresh_lt_from_sheet()
        df_ton_tk = getattr(self, 'ton_tk_df', pd.DataFrame())
        if df_ton_tk.empty:
            try:
                self.sync_ton_tk_bt(force=False)
                df_ton_tk = getattr(self, 'ton_tk_df', pd.DataFrame())
            except Exception as e_sync:
                print(f"Warning: sync_ton_tk_bt in _get_ton_tk_parsed failed: {e_sync}", flush=True)

        if df_ton_tk.empty:
            return []
        
        col_block_ns = self._find_col(df_ton_tk, ['Block nhân sự', 'Block nhân viên', 'Block nhận sự'], default_idx=16)
        col_block_raw = self._find_col(df_ton_tk, ['Block'], default_idx=5)
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

            b_ns = str(r.get(col_block_ns, '')).strip()
            b_raw = str(r.get(col_block_raw, '')).strip()
            candidate = b_ns if (b_ns and b_ns.upper() not in ('NAN', 'NONE', '-', 'NULL')) else b_raw
            block = self._clean_block_name(candidate, ns, hr_map)

            tk_rows.append({
                'ns': ns,
                'block': block,
                'hen_raw': hen_raw,
                'dt_hen': dt_hen
            })
        return tk_rows

    def _get_ton_bt_parsed(self, hr_map):
        self._refresh_lt_from_sheet()
        df_ton_bt = getattr(self, 'ton_bt_df', pd.DataFrame())
        if df_ton_bt.empty:
            try:
                self.sync_ton_tk_bt(force=False)
                df_ton_bt = getattr(self, 'ton_bt_df', pd.DataFrame())
            except Exception as e_sync:
                print(f"Warning: sync_ton_tk_bt in _get_ton_bt_parsed failed: {e_sync}", flush=True)

        if df_ton_bt.empty:
            return []
        
        col_e_block = self._find_col(df_ton_bt, ['Block nhân sự', 'Block nhân viên', 'Block'], default_idx=4)
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

            block_raw = str(r.get(col_e_block, '')).strip()
            block = self._clean_block_name(block_raw, ns, hr_map)

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
            if shift in ('CA1', '1'):
                mail = str(vals[0] or '').strip().upper()
                info = hr_map.get(mail, {})
                raw_b = info.get('block') or str(vals[4] or '').strip()
                block = self._clean_block_name(raw_b, mail, hr_map)
                res[block] = res.get(block, 0) + 1

        return res

    def _load_lt_manual_edits(self):
        edits_path = CACHE_DIR / "lt_manual_edits.pkl.gz"
        if edits_path.exists():
            try:
                self.lt_manual_edits = pd.read_pickle(edits_path)
                if not isinstance(self.lt_manual_edits, dict):
                    self.lt_manual_edits = {}
            except Exception:
                self.lt_manual_edits = {}
        else:
            self.lt_manual_edits = {}

    def _save_lt_manual_edits(self):
        try:
            pd.to_pickle(getattr(self, 'lt_manual_edits', {}), CACHE_DIR / "lt_manual_edits.pkl.gz")
        except Exception as e:
            print(f"Warning: Failed to save lt_manual_edits: {e}", flush=True)

    def _apply_manual_lt_edits(self, df):
        if not hasattr(self, 'lt_manual_edits') or not self.lt_manual_edits or df.empty:
            return
        for (mail, month, year, day), new_shift in self.lt_manual_edits.items():
            mail_clean = str(mail or '').strip().upper()
            for idx, r in df.iterrows():
                row_mail = str(r.iloc[0] or '').strip().upper()
                if row_mail == mail_clean:
                    m_raw = str(r.iloc[36] or '').strip()
                    y_raw = str(r.iloc[37] or '').strip()
                    m_match = re.search(r'\d+', m_raw)
                    y_match = re.search(r'\d+', y_raw)
                    if m_match and y_match:
                        if int(m_match.group(0)) == month and int(y_match.group(0)) == year:
                            col_idx = 4 + day
                            if col_idx < df.shape[1]:
                                df.iloc[idx, col_idx] = str(new_shift)

    def _refresh_lt_from_sheet(self, force=False):
        if force:
            self._clear_custom_ton_imported("ton_tk")
            self._clear_custom_ton_imported("ton_bt")

        now = time.time()
        last_fetch = getattr(self, '_last_lt_fetch_time', 0)
        need_fetch = force or (now - last_fetch > 120) or not hasattr(self, 'lt_df') or self.lt_df.empty
        if need_fetch:
            self._last_lt_fetch_time = now
            # 1. Fetch Lịch Trực live from Google Sheet
            try:
                res_lt = requests.get(self._get_lt_sheet_url(), timeout=15)
                if res_lt.status_code == 200 and not res_lt.text.strip().startswith('<!DOCTYPE'):
                    df_lt_fetched = self._read_any_dataframe(res_lt.content, "lt.csv")
                    if not df_lt_fetched.empty:
                        if hasattr(self, 'lt_manual_edits') and self.lt_manual_edits:
                            self._apply_manual_lt_edits(df_lt_fetched)
                        self.lt_df = df_lt_fetched
                        self._save_pickle(self.lt_df, "lt.pkl.gz")
                        try:
                            self._snapshot_and_detect_lt_changes(source_label="Google Sheet Sync")
                        except Exception as e_snap:
                            print(f"Warning: snapshot detection failed: {e_snap}", flush=True)
            except Exception as e:
                print(f"Auto-refresh Lịch Trực error: {e}", flush=True)

            # 2. Fetch Tồn TK live from Google Sheet (only if user hasn't imported custom file or force=True or ton_tk_df is empty)
            if force or not self._is_custom_ton_imported("ton_tk") or not hasattr(self, 'ton_tk_df') or getattr(self, 'ton_tk_df', pd.DataFrame()).empty:
                try:
                    res_ton_tk = requests.get(self._get_ton_tk_sheet_url(), timeout=15)
                    if res_ton_tk.status_code == 200 and not res_ton_tk.text.strip().startswith('<!DOCTYPE'):
                        df_ton_tk_fetched = self._read_any_dataframe(res_ton_tk.content, "ton_tk.csv")
                        if not df_ton_tk_fetched.empty:
                            self.ton_tk_df = df_ton_tk_fetched
                            self._save_pickle(self.ton_tk_df, "ton_tk.pkl.gz")
                except Exception as e_ton_tk:
                    print(f"Auto-refresh Tồn TK error: {e_ton_tk}", flush=True)

            # 3. Fetch Tồn BT live from Google Sheet (only if user hasn't imported custom file or force=True or ton_bt_df is empty)
            if force or not self._is_custom_ton_imported("ton_bt") or not hasattr(self, 'ton_bt_df') or getattr(self, 'ton_bt_df', pd.DataFrame()).empty:
                try:
                    res_ton_bt = requests.get(self._get_ton_bt_sheet_url(), timeout=15)
                    if res_ton_bt.status_code == 200 and not res_ton_bt.text.strip().startswith('<!DOCTYPE'):
                        df_ton_bt_fetched = self._read_any_dataframe(res_ton_bt.content, "ton_bt.csv")
                        if not df_ton_bt_fetched.empty:
                            self.ton_bt_df = df_ton_bt_fetched
                            self._save_pickle(self.ton_bt_df, "ton_bt.pkl.gz")
                except Exception as e_ton_bt:
                    print(f"Auto-refresh Tồn BT error: {e_ton_bt}", flush=True)

    def get_lich_truc_dashboard(self, date_str=None, force=False):
        self._refresh_lt_from_sheet(force=force)

        # Luôn đảm bảo Tồn TK & Tồn BT sẵn sàng và đồng bộ
        now_ts = time.time()
        last_ton_fetch = getattr(self, '_last_ton_fetch_time', 0)
        if force or (now_ts - last_ton_fetch > 120) or getattr(self, 'ton_tk_df', pd.DataFrame()).empty or getattr(self, 'ton_bt_df', pd.DataFrame()).empty:
            try:
                self.sync_ton_tk_bt(force=force)
                self._last_ton_fetch_time = now_ts
            except Exception as e_sync:
                print(f"Warning: sync_ton_tk_bt in get_lich_truc_dashboard failed: {e_sync}", flush=True)

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

        # Thu thập danh sách Nhân Sự có ca trực là O (nghỉ trực) trong ngày d0
        off_staff_list = []
        if hasattr(self, 'lt_df') and not self.lt_df.empty:
            day_0 = d0.day
            month_0 = d0.month
            year_0 = d0.year
            day_col_idx_0 = 4 + day_0

            for idx, r in self.lt_df.iterrows():
                vals = list(r.values)
                if len(vals) < 38 or day_col_idx_0 >= len(vals):
                    continue

                m_raw = str(vals[36] or '').strip()
                y_raw = str(vals[37] or '').strip()
                m_match = re.search(r'\d+', m_raw)
                y_match = re.search(r'\d+', y_raw)
                if not m_match or not y_match:
                    continue

                if int(m_match.group(0)) != month_0 or int(y_match.group(0)) != year_0:
                    continue

                shift = str(vals[day_col_idx_0] or '').strip().upper()
                if shift == 'O':
                    mail = str(vals[0] or '').strip()
                    code = str(vals[1] or '').strip()
                    name = str(vals[2] or '').strip()
                    partner = str(vals[3] or '').strip()
                    raw_b = str(vals[4] or '').strip()

                    info = hr_map.get(mail.upper(), {}) or hr_map.get(code.upper(), {})
                    clean_b = self._clean_block_name(info.get('block') or raw_b, mail, hr_map)
                    doi_truong = info.get('truong') or ns_by_block.get(clean_b, {}).get('truong') or '(chưa rõ)'
                    status = 'Active' if info.get('is_active', True) else 'Inactive'

                    off_staff_list.append({
                        'code': code,
                        'name': name,
                        'mail': mail,
                        'partner': partner,
                        'block': clean_b,
                        'doiTruong': doi_truong,
                        'caTruc': 'O',
                        'status': status
                    })

            # Sắp xếp theo Đội Trưởng, sau đó theo Tên
            off_staff_list.sort(key=lambda x: (x.get('doiTruong', ''), x.get('block', ''), x.get('name', '')))

        all_blocks = sorted(list(set(
            list(ns_by_block.keys()) +
            list(d0_shifts.keys()) +
            list(df_tk_p['block'].unique() if not df_tk_p.empty else []) +
            list(df_bt_p['block'].unique() if not df_bt_p.empty else [])
        )))

        # Total Backlog Across All Dates
        tot_tk_map = df_tk_p.groupby('block').size().to_dict() if not df_tk_p.empty else {}
        tot_bt_map = df_bt_p.groupby('block').size().to_dict() if not df_bt_p.empty else {}

        # Date X (d0): Tickets scheduled for d0, plus overdue tickets before d0, plus unassigned tickets
        cond_0_tk = (df_tk_p['dt_hen'].isna()) | (df_tk_p['dt_hen'] <= d0) if not df_tk_p.empty else pd.Series(dtype=bool)
        cond_0_bt = (df_bt_p['dt_hen'].isna()) | (df_bt_p['dt_hen'] <= d0) if not df_bt_p.empty else pd.Series(dtype=bool)
        tk_0_map = df_tk_p[cond_0_tk].groupby('block').size().to_dict() if not df_tk_p.empty else {}
        bt_0_map = df_bt_p[cond_0_bt].groupby('block').size().to_dict() if not df_bt_p.empty else {}

        # Date X+1 (d1): Tickets booked specifically for d1
        cond_1_tk = (df_tk_p['dt_hen'] == d1) if not df_tk_p.empty else pd.Series(dtype=bool)
        cond_1_bt = (df_bt_p['dt_hen'] == d1) if not df_bt_p.empty else pd.Series(dtype=bool)
        tk_1_map = df_tk_p[cond_1_tk].groupby('block').size().to_dict() if not df_tk_p.empty else {}
        bt_1_map = df_bt_p[cond_1_bt].groupby('block').size().to_dict() if not df_bt_p.empty else {}

        # Date X+2 (d2): Tickets booked specifically for d2
        cond_2_tk = (df_tk_p['dt_hen'] == d2) if not df_tk_p.empty else pd.Series(dtype=bool)
        cond_2_bt = (df_bt_p['dt_hen'] == d2) if not df_bt_p.empty else pd.Series(dtype=bool)
        tk_2_map = df_tk_p[cond_2_tk].groupby('block').size().to_dict() if not df_tk_p.empty else {}
        bt_2_map = df_bt_p[cond_2_bt].groupby('block').size().to_dict() if not df_bt_p.empty else {}

        summary_table = []
        for block in all_blocks:
            if not block or block in ('nan', '(Không xác định)'):
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
            'summaryTable': summary_table,
            'offStaffList': off_staff_list,
            'totalOff': len(off_staff_list)
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
        
        self._save_pickle(self.lt_df, "lt.pkl.gz")
        self._snapshot_and_detect_lt_changes(source_label="Thêm mới")
        return {"ok": True}

    def update_lich_truc_row(self, row_number: int, values_b_to_al: list, target_mail: str = None):
        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            return {"ok": False, "error": "No Lịch Trực data loaded"}
        
        if not hasattr(self, 'lt_history') or self.lt_history is None:
            self._load_lt_history_and_snapshot()
        if not hasattr(self, 'lt_manual_edits'):
            self._load_lt_manual_edits()

        try:
            df_idx = int(row_number) - 2
            matched_idx = None
            clean_target_mail = str(target_mail or '').strip().upper()

            if clean_target_mail:
                for pos, r in enumerate(self.lt_df.itertuples(index=False)):
                    if str(r[0] or '').strip().upper() == clean_target_mail:
                        matched_idx = pos
                        break

            if matched_idx is None and 0 <= df_idx < len(self.lt_df):
                matched_idx = df_idx

            if matched_idx is not None and 0 <= matched_idx < len(self.lt_df):
                old_row = list(self.lt_df.iloc[matched_idx].values)
                mail = str(old_row[0] or clean_target_mail).strip().upper()

                m_raw = str(values_b_to_al[35] if len(values_b_to_al) > 35 else old_row[36] or '').strip()
                y_raw = str(values_b_to_al[36] if len(values_b_to_al) > 36 else old_row[37] or '').strip()
                m_match = re.search(r'\d+', m_raw)
                y_match = re.search(r'\d+', y_raw)
                row_month = int(m_match.group(0)) if m_match else datetime.datetime.now().month
                row_year = int(y_match.group(0)) if y_match else datetime.datetime.now().year

                _, hr_map = self._get_nhan_su_by_block()
                info = hr_map.get(mail, {})
                doi_truong = info.get('truong') or ''
                code_staff = str(values_b_to_al[0] if len(values_b_to_al) > 0 else old_row[1] or '').strip()
                name = str(values_b_to_al[1] if len(values_b_to_al) > 1 else old_row[2] or '').strip()
                partner = str(values_b_to_al[2] if len(values_b_to_al) > 2 else old_row[3] or '').strip()
                block = str(values_b_to_al[3] if len(values_b_to_al) > 3 else old_row[4] or '').strip()

                now_dt = datetime.datetime.now()
                time_str = now_dt.strftime('%Y-%m-%d %H:%M:%S')
                time_display = now_dt.strftime('%d/%m/%Y %H:%M')

                def norm_shift(v):
                    s = str(v or '').strip().upper()
                    if s in ('', 'NAN', 'NONE', 'NULL', 'O', 'OFF', '0', '-'):
                        return 'O'
                    if 'CA1' in s or s == '1':
                        return 'CA1'
                    return s

                # Apply updates to lt_df
                for i, val in enumerate(values_b_to_al):
                    col_target = i + 1
                    if col_target < self.lt_df.shape[1]:
                        self.lt_df.iloc[matched_idx, col_target] = str(val)

                # Check Day 1 to Day 31 shift differences and record directly into audit history
                for day_idx in range(1, 32):
                    old_shift_raw = old_row[4 + day_idx] if (4 + day_idx) < len(old_row) else ''
                    new_val_idx = 3 + day_idx # index 4 is Day1 in values_b_to_al
                    new_shift_raw = values_b_to_al[new_val_idx] if new_val_idx < len(values_b_to_al) else ''

                    old_clean = norm_shift(old_shift_raw)
                    new_clean = norm_shift(new_shift_raw)

                    if old_clean != new_clean:
                        rec = {
                            'id': len(self.lt_history) + 1,
                            'timestamp': time_str,
                            'timeDisplay': time_display,
                            'milestone': 'Chỉnh sửa',
                            'mail': mail,
                            'codeStaff': code_staff,
                            'name': name,
                            'partner': partner,
                            'block': block,
                            'doiTruong': doi_truong,
                            'month': row_month,
                            'year': row_year,
                            'day': day_idx,
                            'dateStr': f"{day_idx:02d}/{row_month:02d}/{row_year}",
                            'oldVal': old_clean,
                            'newVal': new_clean,
                            'changeType': f"{old_clean} ➔ {new_clean}"
                        }
                        self.lt_history.append(rec)
                        # Record in persistent manual edits dict so Google Sheet sync won't revert
                        self.lt_manual_edits[(mail, row_month, row_year, day_idx)] = new_clean
                        if hasattr(self, 'lt_snapshot_map') and isinstance(self.lt_snapshot_map, dict):
                            self.lt_snapshot_map[(mail, row_month, row_year, day_idx)] = new_clean

                self._last_lt_fetch_time = time.time()
                self._save_pickle(self.lt_df, "lt.pkl.gz")
                self._save_lt_history_and_snapshot()
                self._save_lt_manual_edits()
                return {"ok": True, "message": "Đã lưu thay đổi lịch trực và ghi nhận timeline thành công!"}

            return {"ok": False, "error": f"Invalid row index ({row_number})"}
        except Exception as e:
            return {"ok": False, "error": f"Lỗi lưu lịch trực: {str(e)}"}

    def delete_lich_truc_row(self, row_number: int):
        if not hasattr(self, 'lt_df') or self.lt_df.empty:
            return {"ok": False, "error": "No Lịch Trực data loaded"}
        
        df_idx = row_number - 2
        if 0 <= df_idx < len(self.lt_df):
            self.lt_df = self.lt_df.drop(self.lt_df.index[df_idx]).reset_index(drop=True)
            self._save_pickle(self.lt_df, "lt.pkl.gz")
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
            self._save_pickle(self.lt_df, "lt.pkl.gz")
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

    def sync_ton_tk_bt(self, force=False):
        """
        Sync Tồn TK & BT datasets between Local, Supabase Cloud, and Google Sheet fallback.
        Ensures updates made on Vercel are immediately pulled when running locally.
        """
        now_str = datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        sources = []

        # 1. Check Supabase for Tồn TK
        if not self._is_cleared('ton_tk'):
            try:
                sp_tk = self._load_df_from_supabase("ton_tk")
                if sp_tk is not None and not sp_tk.empty:
                    self.ton_tk_df = sp_tk
                    self._save_pickle(self.ton_tk_df, "ton_tk.pkl.gz")
                    self._set_custom_ton_imported("ton_tk")
                    sources.append(f"Supabase Tồn TK ({len(sp_tk)} phiếu)")
            except Exception as e_sp_tk:
                print(f"Warning loading ton_tk from Supabase: {e_sp_tk}", flush=True)

        # 2. Check Supabase for Tồn BT
        if not self._is_cleared('ton_bt'):
            try:
                sp_bt = self._load_df_from_supabase("ton_bt")
                if sp_bt is not None and not sp_bt.empty:
                    self.ton_bt_df = sp_bt
                    self._save_pickle(self.ton_bt_df, "ton_bt.pkl.gz")
                    self._set_custom_ton_imported("ton_bt")
                    sources.append(f"Supabase Tồn BT ({len(sp_bt)} phiếu)")
            except Exception as e_sp_bt:
                print(f"Warning loading ton_bt from Supabase: {e_sp_bt}", flush=True)

        # 3. If Tồn TK is still empty (or force and no Supabase data), fallback to Google Sheet
        if (getattr(self, 'ton_tk_df', pd.DataFrame()).empty or (force and not any('Tồn TK' in s for s in sources))) and not self._is_cleared('ton_tk'):
            try:
                res_ton_tk = requests.get(self._get_ton_tk_sheet_url(), timeout=15)
                if res_ton_tk.status_code == 200 and not res_ton_tk.text.strip().startswith('<!DOCTYPE'):
                    df_ton_tk_fetched = self._read_any_dataframe(res_ton_tk.content, "ton_tk.csv")
                    if not df_ton_tk_fetched.empty:
                        self.ton_tk_df = df_ton_tk_fetched
                        self._save_pickle(self.ton_tk_df, "ton_tk.pkl.gz")
                        sources.append(f"Google Sheet Tồn TK ({len(df_ton_tk_fetched)} phiếu)")
                        try:
                            self._save_df_to_supabase(self.ton_tk_df, "ton_tk")
                        except Exception as e_sp_save:
                            print(f"Warning: Failed to save fetched ton_tk to Supabase: {e_sp_save}", flush=True)
            except Exception as e_sheet_tk:
                print(f"Fallback Tồn TK Sheet error: {e_sheet_tk}", flush=True)

        # 4. If Tồn BT is still empty (or force and no Supabase data), fallback to Google Sheet
        if (getattr(self, 'ton_bt_df', pd.DataFrame()).empty or (force and not any('Tồn BT' in s for s in sources))) and not self._is_cleared('ton_bt'):
            try:
                res_ton_bt = requests.get(self._get_ton_bt_sheet_url(), timeout=15)
                if res_ton_bt.status_code == 200 and not res_ton_bt.text.strip().startswith('<!DOCTYPE'):
                    df_ton_bt_fetched = self._read_any_dataframe(res_ton_bt.content, "ton_bt.csv")
                    if not df_ton_bt_fetched.empty:
                        self.ton_bt_df = df_ton_bt_fetched
                        self._save_pickle(self.ton_bt_df, "ton_bt.pkl.gz")
                        sources.append(f"Google Sheet Tồn BT ({len(df_ton_bt_fetched)} phiếu)")
                        try:
                            self._save_df_to_supabase(self.ton_bt_df, "ton_bt")
                        except Exception as e_sp_save:
                            print(f"Warning: Failed to save fetched ton_bt to Supabase: {e_sp_save}", flush=True)
            except Exception as e_sheet_bt:
                print(f"Fallback Tồn BT Sheet error: {e_sheet_bt}", flush=True)

        self.ton_last_sync_time = now_str
        self.ton_sync_source = ", ".join(sources) if sources else "Local Cache"
        return {
            "ok": True,
            "message": f"Đồng bộ thành công lúc {now_str} [{self.ton_sync_source}]",
            "lastSyncTime": self.ton_last_sync_time,
            "syncSource": self.ton_sync_source,
            "totalTK": len(getattr(self, 'ton_tk_df', pd.DataFrame())),
            "totalBT": len(getattr(self, 'ton_bt_df', pd.DataFrame()))
        }

    def get_ton_tk_bt_dashboard(self, force=False):
        now = time.time()
        last_fetch = getattr(self, '_last_ton_fetch_time', 0)
        if force or (now - last_fetch > 60) or getattr(self, 'ton_tk_df', pd.DataFrame()).empty or getattr(self, 'ton_bt_df', pd.DataFrame()).empty:
            self.sync_ton_tk_bt(force=force)
            self._last_ton_fetch_time = now

        self._refresh_lt_from_sheet()
        ns_by_block, hr_map = self._get_nhan_su_by_block()
        import unicodedata
        df_tk = getattr(self, 'ton_tk_df', pd.DataFrame())
        df_bt = getattr(self, 'ton_bt_df', pd.DataFrame())

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

                raw_created = str(r.get(time_created_col, '')).strip()
                dt_created = pd.to_datetime(raw_created, dayfirst=True, errors='coerce')
                ton_hrs = 0.0
                if pd.notnull(dt_created):
                    ton_hrs = round((now - dt_created).total_seconds() / 3600.0, 1)
                else:
                    raw_hrs = str(r.get(ton_hrs_col, '')).strip()
                    try:
                        ton_hrs = float(raw_hrs)
                    except Exception:
                        ton_hrs = 0.0

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
            'generatedAt': datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
            'lastSyncTime': getattr(self, 'ton_last_sync_time', None) or datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
            'syncSource': getattr(self, 'ton_sync_source', 'Local Cache'),
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
        now_str = datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')

        if detected_mode == "TK":
            self.ton_tk_df = df
            self._set_custom_ton_imported("ton_tk")
            self._clear_cleared_flag('ton_tk')
            try:
                df.to_pickle(CACHE_DIR / "ton_tk.pkl.gz")
            except Exception as e:
                print(f"Warning saving ton_tk cache: {e}", flush=True)
            try:
                self._save_df_to_supabase(df, "ton_tk")
            except Exception as e_sp:
                print(f"Warning saving ton_tk to Supabase: {e_sp}", flush=True)
            try:
                self._sync_ton_dataset_to_webapp("ton_tk", df)
            except Exception as e_w:
                print(f"Warning: WebApp background sync error: {e_w}", flush=True)
            label = "Tồn Triển Khai (TK)"
            self.ton_last_sync_time = now_str
            self.ton_sync_source = f"Import TK File ({imported_count} phiếu)"
        else:
            self.ton_bt_df = df
            self._set_custom_ton_imported("ton_bt")
            self._clear_cleared_flag('ton_bt')
            try:
                df.to_pickle(CACHE_DIR / "ton_bt.pkl.gz")
            except Exception as e:
                print(f"Warning saving ton_bt cache: {e}", flush=True)
            try:
                self._save_df_to_supabase(df, "ton_bt")
            except Exception as e_sp:
                print(f"Warning saving ton_bt to Supabase: {e_sp}", flush=True)
            try:
                self._sync_ton_dataset_to_webapp("ton_bt", df)
            except Exception as e_w:
                print(f"Warning: WebApp background sync error: {e_w}", flush=True)
            label = "Tồn Bảo Trì (BT)"
            self.ton_last_sync_time = now_str
            self.ton_sync_source = f"Import BT File ({imported_count} phiếu)"

        return {
            "ok": True,
            "mode": detected_mode,
            "count": imported_count,
            "message": f"Đã cập nhật thành công {imported_count} dòng cho {label}!"
        }

    def get_dataset_counts(self):
        counts = {}
        for target, cache_name, attr in [
            ("kh_cls", "kh_cls.pkl.gz", "kh_cls_df"),
            ("cll30n", "cll30n.pkl.gz", "cll30n_df"),
            ("tk", "tk.pkl.gz", "tk_df"),
            ("bt", "bt.pkl.gz", "bt_df"),
            ("ton_tk", "ton_tk.pkl.gz", "ton_tk_df"),
            ("ton_bt", "ton_bt.pkl.gz", "ton_bt_df")
        ]:
            if self._is_cleared(target):
                counts[target] = 0
                continue
            df = getattr(self, attr, pd.DataFrame())
            if df is not None and not df.empty:
                counts[target] = len(df)
                continue
            if (CACHE_DIR / cache_name).exists():
                try:
                    df = pd.read_pickle(CACHE_DIR / cache_name)
                    setattr(self, attr, df)
                    counts[target] = len(df)
                    continue
                except Exception:
                    pass
            # Fast count from Supabase for database-backed datasets
            if target in ("kh_cls", "cll30n", "tk", "bt"):
                try:
                    from sqlalchemy import text
                    engine_db = self.get_db_engine()
                    if engine_db:
                        with engine_db.connect() as conn:
                            res = conn.execute(text(f'SELECT count(*) FROM "{target}"')).fetchone()
                            cnt = int(res[0]) if res else 0
                            counts[target] = cnt
                            continue
                except Exception as e:
                    print(f"Fast count error for {target}: {e}", flush=True)
            counts[target] = 0

        return {
            "ok": True,
            "counts": counts
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
                inc_cls = df_inc_processed.copy()
                existing_cls = getattr(self, 'kh_cls_df', pd.DataFrame())
                if existing_cls.empty and (CACHE_DIR / "kh_cls.pkl.gz").exists():
                    try: existing_cls = pd.read_pickle(CACHE_DIR / "kh_cls.pkl.gz")
                    except Exception: existing_cls = pd.DataFrame()
                # [FIX] Supabase fallback: nếu cold start (Vercel) không có local cache, load từ Supabase
                # để cơ chế dedup MERGE_NO_OVERWRITE hoạt động đúng — tránh mất data hoặc nhân đôi
                if existing_cls.empty and rule != "OVERWRITE":
                    try:
                        sp_cls = self._load_df_from_supabase("kh_cls")
                        if not sp_cls.empty:
                            existing_cls = sp_cls
                            self._save_pickle(existing_cls, "kh_cls.pkl.gz")
                            self.kh_cls_df = existing_cls
                    except Exception as e_sp:
                        print(f"[Import] kh_cls Supabase fallback load warning: {e_sp}", flush=True)

                if rule == "OVERWRITE":
                    # Ghi đè hoàn toàn: chỉ giữ data mới upload
                    merged_cls = inc_cls.drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                    added_count = len(merged_cls)
                    skipped_count = total_incoming - added_count
                else:
                    # MERGE_NO_OVERWRITE: luôn giữ data cũ, chỉ thêm rows chưa có
                    # (dù existing_cls có rỗng hay không — tránh mất data khi cold-start)
                    if existing_cls.empty:
                        merged_cls = inc_cls.drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                    else:
                        merged_cls = pd.concat([existing_cls, inc_cls], ignore_index=True).drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                    added_count = len(merged_cls) - (len(existing_cls) if not existing_cls.empty else 0)
                    added_count = max(0, added_count)
                    skipped_count = total_incoming - added_count
                    skipped_count = max(0, skipped_count)
                self._save_pickle(merged_cls, "kh_cls.pkl.gz")
                self.kh_cls_df = merged_cls
                self._clear_cleared_flag('kh_cls')
                self._async_sync_after_import("kh_cls", merged_cls)
                db_total = len(merged_cls)

            else: # target == "cll30n"
                inc_cll = df_inc_processed.copy()
                # If file has non-CLL rows (e.g. user imported a full raw sheet into CLL30N), filter only CLL30N rows
                if 'is_cll30n' in inc_cll.columns and inc_cll['is_cll30n'].any() and not inc_cll['is_cll30n'].all():
                    inc_cll = inc_cll[inc_cll['is_cll30n'] == True]

                existing_cll = getattr(self, 'cll30n_df', pd.DataFrame())
                if existing_cll.empty and (CACHE_DIR / "cll30n.pkl.gz").exists():
                    try: existing_cll = pd.read_pickle(CACHE_DIR / "cll30n.pkl.gz")
                    except Exception: existing_cll = pd.DataFrame()
                # [FIX] Supabase fallback: tránh mất data hoặc nhân đôi khi cold start
                if existing_cll.empty and rule != "OVERWRITE":
                    try:
                        sp_cll = self._load_df_from_supabase("cll30n")
                        if not sp_cll.empty:
                            existing_cll = sp_cll
                            self._save_pickle(existing_cll, "cll30n.pkl.gz")
                            self.cll30n_df = existing_cll
                    except Exception as e_sp:
                        print(f"[Import] cll30n Supabase fallback load warning: {e_sp}", flush=True)

                if rule == "OVERWRITE":
                    # Ghi đè hoàn toàn: chỉ giữ data mới upload
                    merged_cll = inc_cll.drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                    added_count = len(merged_cll)
                    skipped_count = total_incoming - added_count
                else:
                    # MERGE_NO_OVERWRITE: luôn giữ data cũ, chỉ thêm rows chưa có
                    # (dù existing_cll có rỗng hay không — tránh mất data khi cold-start)
                    if existing_cll.empty:
                        merged_cll = inc_cll.drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                    else:
                        merged_cll = pd.concat([existing_cll, inc_cll], ignore_index=True).drop_duplicates(subset=['Số HĐ', 'Nhân viên', 'date_complete'], keep='first')
                    added_count = len(merged_cll) - (len(existing_cll) if not existing_cll.empty else 0)
                    added_count = max(0, added_count)
                    skipped_count = total_incoming - len(inc_cll) + (len(inc_cll) - added_count)
                    skipped_count = max(0, skipped_count)
                self._save_pickle(merged_cll, "cll30n.pkl.gz")
                self.cll30n_df = merged_cll
                self._clear_cleared_flag('cll30n')
                self._async_sync_after_import("cll30n", merged_cll)
                db_total = len(merged_cll)

        elif target == "tk":
            target_label = "Data Triển Khai (TK)"
            col_hd = self._get_required_col(df_incoming, ['Số hợp đồng', 'Số HĐ', 'so_hd'])
            col_nv = self._get_required_col(df_incoming, ['Nhân viên', 'Nhân sự', 'nhan_vien'])

            # Cross-dataset guard: reject BT file khi import vào TK
            # BT files thường có cột TG Tạo/TG Hoàn Tất nhưng KHÔNG có TG tạo PTC
            bt_signature_cols = ['ttscbđ', 'tg hoàn tất', 'tg tạo', 'tồn giờ', 'hạn còn lại']
            tk_signature_cols = ['tg tạo ptc', 'ngày tạo ptc', 'tg hoàn tất ptc', 'loại triển khai', 'tin/pnc', 'ptc']
            has_bt_sig = any(m in cols_lower for m in bt_signature_cols)
            has_tk_sig = any(m in cols_lower for m in tk_signature_cols)
            if has_bt_sig and not has_tk_sig:
                return {
                    "ok": False,
                    "error": f"❌ Sai Loại File! File có vẻ là dữ liệu Bảo Trì (BT) (phát hiện cột: TG Tạo/TG Hoàn Tất) nhưng bạn đang import vào Triển Khai (TK). Vui lòng chọn đúng loại dataset!"
                }

            missing_cols = []
            if not col_hd: missing_cols.append("Số hợp đồng")
            if not col_nv: missing_cols.append("Nhân viên")

            # Kiểm tra cột Đúng hẹn (bắt buộc để tính KPI)
            col_dh = self._find_col(df_incoming, ['Đúng hẹn', 'dung_hen', 'Đúng Hẹn'])
            if not col_dh:
                missing_cols.append("Đúng hẹn (cột xác định kết quả đúng/trễ hẹn)")

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
            # [FIX] Supabase fallback: tránh mất data hoặc nhân đôi khi cold start trên Vercel
            if existing_df.empty and rule != "OVERWRITE":
                try:
                    sp_tk = self._load_df_from_supabase("tk")
                    if not sp_tk.empty:
                        existing_df = self._enrich_tk_df(sp_tk)
                        self._save_pickle(existing_df, "tk.pkl.gz")
                        self.tk_df = existing_df
                except Exception as e_sp:
                    print(f"[Import] tk Supabase fallback load warning: {e_sp}", flush=True)

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
            self._clear_cleared_flag('tk')
            self._async_sync_after_import("tk", merged_df)
            db_total = len(merged_df)

        elif target == "bt":
            target_label = "Data Bảo Trì (BT)"
            col_hd = self._get_required_col(df_incoming, ['Số HĐ', 'Số hợp đồng', 'so_hd'])
            col_nv = self._get_required_col(df_incoming, ['Nhân viên', 'Nhân sự', 'nhan_vien'])

            # Cross-dataset guard: reject TK file khi import vào BT
            tk_signature_cols = ['tg tạo ptc', 'ngày tạo ptc', 'tg hoàn tất ptc', 'loại triển khai', 'tin/pnc']
            bt_signature_cols = ['ttscbđ', 'tg hoàn tất', 'tg tạo']
            has_tk_sig = any(m in cols_lower for m in tk_signature_cols)
            has_bt_sig = any(m in cols_lower for m in bt_signature_cols)
            if has_tk_sig and not has_bt_sig:
                return {
                    "ok": False,
                    "error": f"❌ Sai Loại File! File có vẻ là dữ liệu Triển Khai (TK) (phát hiện cột: TG tạo PTC/Loại triển khai) nhưng bạn đang import vào Bảo Trì (BT). Vui lòng chọn đúng loại dataset!"
                }

            missing_cols = []
            if not col_hd: missing_cols.append("Số HĐ")
            if not col_nv: missing_cols.append("Nhân viên")

            # Kiểm tra cột Đúng hẹn (bắt buộc để tính KPI)
            col_dh = self._find_col(df_incoming, ['Đúng hẹn', 'dung_hen', 'Đúng Hẹn'])
            if not col_dh:
                missing_cols.append("Đúng hẹn (cột xác định kết quả đúng/trễ hẹn)")

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
            # [FIX] Supabase fallback: tránh mất data hoặc nhân đôi khi cold start trên Vercel
            if existing_df.empty and rule != "OVERWRITE":
                try:
                    sp_bt = self._load_df_from_supabase("bt")
                    if not sp_bt.empty:
                        existing_df = self._enrich_bt_df(sp_bt)
                        self._save_pickle(existing_df, "bt.pkl.gz")
                        self.bt_df = existing_df
                except Exception as e_sp:
                    print(f"[Import] bt Supabase fallback load warning: {e_sp}", flush=True)

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
            self._clear_cleared_flag('bt')
            self._async_sync_after_import("bt", merged_df)
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
            # [FIX] Supabase fallback: tránh mất data hoặc nhân đôi khi cold start trên Vercel
            if existing_df.empty and rule != "OVERWRITE":
                try:
                    sp_ton_tk = self._load_df_from_supabase("ton_tk")
                    if not sp_ton_tk.empty:
                        existing_df = sp_ton_tk
                        self._save_pickle(existing_df, "ton_tk.pkl.gz")
                        self.ton_tk_df = existing_df
                except Exception as e_sp:
                    print(f"[Import] ton_tk Supabase fallback load warning: {e_sp}", flush=True)

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
            self._set_custom_ton_imported("ton_tk")
            self._clear_cleared_flag('ton_tk')
            try:
                self._save_df_to_supabase(merged_df, "ton_tk")
            except Exception as e_sp:
                print(f"Warning saving ton_tk to Supabase in import_database_dataset: {e_sp}", flush=True)

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
            # [FIX] Supabase fallback: tránh mất data hoặc nhân đôi khi cold start trên Vercel
            if existing_df.empty and rule != "OVERWRITE":
                try:
                    sp_ton_bt = self._load_df_from_supabase("ton_bt")
                    if not sp_ton_bt.empty:
                        existing_df = sp_ton_bt
                        self._save_pickle(existing_df, "ton_bt.pkl.gz")
                        self.ton_bt_df = existing_df
                except Exception as e_sp:
                    print(f"[Import] ton_bt Supabase fallback load warning: {e_sp}", flush=True)

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
            self._set_custom_ton_imported("ton_bt")
            self._clear_cleared_flag('ton_bt')
            try:
                self._save_df_to_supabase(merged_df, "ton_bt")
            except Exception as e_sp:
                print(f"Warning saving ton_bt to Supabase in import_database_dataset: {e_sp}", flush=True)
        else:
            return {"ok": False, "error": "Bảng dữ liệu mục tiêu không hợp lệ."}

        # Auto-enrich HR metadata if imported ticket datasets
        if target in ("tk", "bt", "kh_cls", "cll30n"):
            self._auto_enrich_hr_from_tickets()

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
        def _drop_sp_table(tbl):
            engine_db = self.get_db_engine()
            if engine_db:
                try:
                    from sqlalchemy import text
                    with engine_db.connect() as conn:
                        conn.execute(text(f'DROP TABLE IF EXISTS "{tbl}" CASCADE'))
                        conn.commit()
                    print(f"Successfully dropped Supabase table '{tbl}'", flush=True)
                except Exception as e:
                    print(f"Warning dropping Supabase table '{tbl}': {e}", flush=True)

        if target_clean == "kh_cls":
            # Only clear kh_cls; cll30n is an independent dataset and must NOT be auto-cleared
            self.kh_cls_df = pd.DataFrame()
            _safe_remove_cache("kh_cls.pkl.gz")
            _drop_sp_table("kh_cls")
            self._set_cleared_flag('kh_cls')
            label = "KH Có Cls (Data Base)"
        elif target_clean == "cll30n":
            self.cll30n_df = pd.DataFrame()
            _safe_remove_cache("cll30n.pkl.gz")
            _drop_sp_table("cll30n")
            self._set_cleared_flag('cll30n')
            label = "CLL30N (Data Base)"
        elif target_clean == "tk":
            self.tk_df = pd.DataFrame()
            _safe_remove_cache("tk.pkl.gz")
            _drop_sp_table("tk")
            self._set_cleared_flag('tk')
            label = "Data Triển Khai (TK)"
        elif target_clean == "bt":
            self.bt_df = pd.DataFrame()
            _safe_remove_cache("bt.pkl.gz")
            _drop_sp_table("bt")
            self._set_cleared_flag('bt')
            label = "Data Bảo Trì (BT)"
        elif target_clean == "ton_tk":
            self.ton_tk_df = pd.DataFrame()
            self._set_custom_ton_imported("ton_tk")
            _safe_remove_cache("ton_tk.pkl.gz")
            self._sync_ton_dataset_to_webapp("ton_tk", None)
            _drop_sp_table("ton_tk")
            self._set_cleared_flag('ton_tk')
            label = "Tồn Triển Khai"
        elif target_clean == "ton_bt":
            self.ton_bt_df = pd.DataFrame()
            self._set_custom_ton_imported("ton_bt")
            _safe_remove_cache("ton_bt.pkl.gz")
            self._sync_ton_dataset_to_webapp("ton_bt", None)
            _drop_sp_table("ton_bt")
            self._set_cleared_flag('ton_bt')
            label = "Tồn Bảo Trì"
        elif target_clean == "all":
            self.kh_cls_df = pd.DataFrame()
            self.cll30n_df = pd.DataFrame()
            self.tk_df = pd.DataFrame()
            self.bt_df = pd.DataFrame()
            self.ton_tk_df = pd.DataFrame()
            self.ton_bt_df = pd.DataFrame()
            self._set_custom_ton_imported("ton_tk")
            self._set_custom_ton_imported("ton_bt")
            self._sync_ton_dataset_to_webapp("ton_tk", None)
            self._sync_ton_dataset_to_webapp("ton_bt", None)
            for fname in ["kh_cls.pkl.gz", "cll30n.pkl.gz", "tk.pkl.gz", "bt.pkl.gz", "ton_tk.pkl.gz", "ton_bt.pkl.gz"]:
                _safe_remove_cache(fname)
            for tbl in ["kh_cls", "cll30n", "tk", "bt", "ton_tk", "ton_bt"]:
                _drop_sp_table(tbl)
            # Set cleared flags for all datasets so auto-sync won't refetch
            for ds in ['kh_cls', 'cll30n', 'tk', 'bt', 'ton_tk', 'ton_bt']:
                self._set_cleared_flag(ds)
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

    def _sync_ton_dataset_to_webapp(self, target: str, df: pd.DataFrame = None):
        url = getattr(self, 'PERMISSIONS_WEBAPP_URL', '') or os.environ.get("PERMISSIONS_WEBAPP_URL", "") or getattr(self, 'DEFAULT_PERMISSIONS_WEBAPP_URL', '')
        if not url:
            return
        try:
            if df is not None and not df.empty:
                cols = [str(c) for c in df.columns]
                rows = []
                for _, r in df.iterrows():
                    row_dict = {}
                    for col in cols:
                        val = r.get(col, '')
                        row_dict[col] = '' if (pd.isna(val) or val is None) else str(val).strip()
                    rows.append(row_dict)
                payload = {"action": f"sync_{target}", "headers": cols, "rows": rows}
            else:
                payload = {"action": f"clear_{target}"}

            resp = requests.post(
                url,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'},
                allow_redirects=True,
                timeout=15
            )
            print(f"Synced {target} dataset to Google Apps Script WebApp (status {resp.status_code})", flush=True)
        except Exception as e:
            print(f"Warning: _sync_ton_dataset_to_webapp for {target} failed: {e}", flush=True)

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

    # -------------------------------------------------------------------------
    # Loading Screen SOP Slides Management (Supabase + Local Cache)
    # -------------------------------------------------------------------------
    def get_loading_slides(self):
        cache_file = CACHE_DIR / "loading_slides.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        return {"ok": True, "slides": data}
            except Exception:
                pass

        engine_db = self.get_db_engine()
        if engine_db:
            try:
                from sqlalchemy import text
                with engine_db.connect() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS loading_slides (
                            id SERIAL PRIMARY KEY,
                            tag TEXT NOT NULL,
                            category TEXT,
                            badge_color TEXT,
                            title TEXT NOT NULL,
                            target TEXT,
                            steps TEXT,
                            note TEXT,
                            image_url TEXT,
                            icon TEXT,
                            is_active BOOLEAN DEFAULT TRUE,
                            sort_order INT DEFAULT 0,
                            updated_at TIMESTAMP DEFAULT NOW()
                        )
                    """))
                    conn.commit()
                    rows = conn.execute(text("SELECT id, tag, category, badge_color, title, target, steps, note, image_url, icon, is_active, sort_order FROM loading_slides WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC")).fetchall()
                    if rows and len(rows) > 0:
                        slides = []
                        for r in rows:
                            steps = []
                            try:
                                steps = json.loads(r[6]) if r[6] else []
                            except Exception:
                                steps = [s.strip() for s in str(r[6]).split('\n') if s.strip()]
                            slides.append({
                                "id": r[0],
                                "tag": r[1],
                                "category": r[2] or "",
                                "badge_color": r[3] or "#0284c7",
                                "title": r[4],
                                "target": r[5] or "",
                                "steps": steps,
                                "note": r[7] or "",
                                "image_url": r[8] or "",
                                "icon": r[9] or "TipsAndUpdatesOutlined",
                                "is_active": bool(r[10]),
                                "sort_order": r[11] or 0
                            })
                        try:
                            with open(cache_file, "w", encoding="utf-8") as f:
                                json.dump(slides, f, ensure_ascii=False, indent=2)
                        except Exception:
                            pass
                        return {"ok": True, "slides": slides}
            except Exception as e:
                print(f"Warning fetching loading_slides from Supabase: {e}", flush=True)

        return {"ok": True, "slides": DEFAULT_LOADING_SLIDES}

    def save_loading_slides(self, slides: list):
        if not isinstance(slides, list):
            return {"ok": False, "error": "Dữ liệu slide không hợp lệ!"}

        cache_file = CACHE_DIR / "loading_slides.json"
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(slides, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

        engine_db = self.get_db_engine()
        if engine_db:
            try:
                from sqlalchemy import text
                with engine_db.connect() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS loading_slides (
                            id SERIAL PRIMARY KEY,
                            tag TEXT NOT NULL,
                            category TEXT,
                            badge_color TEXT,
                            title TEXT NOT NULL,
                            target TEXT,
                            steps TEXT,
                            note TEXT,
                            image_url TEXT,
                            icon TEXT,
                            is_active BOOLEAN DEFAULT TRUE,
                            sort_order INT DEFAULT 0,
                            updated_at TIMESTAMP DEFAULT NOW()
                        )
                    """))
                    conn.execute(text("DELETE FROM loading_slides"))
                    for idx, s in enumerate(slides):
                        steps_raw = s.get("steps", [])
                        if isinstance(steps_raw, list):
                            steps_json = json.dumps(steps_raw, ensure_ascii=False)
                        else:
                            steps_json = json.dumps([str(steps_raw)], ensure_ascii=False)
                        conn.execute(text("""
                            INSERT INTO loading_slides (tag, category, badge_color, title, target, steps, note, image_url, icon, is_active, sort_order)
                            VALUES (:tag, :category, :badge_color, :title, :target, :steps, :note, :image_url, :icon, :is_active, :sort_order)
                        """), {
                            "tag": s.get("tag", "QUY TRÌNH"),
                            "category": s.get("category", ""),
                            "badge_color": s.get("badge_color", "#0284c7"),
                            "title": s.get("title", ""),
                            "target": s.get("target", ""),
                            "steps": steps_json,
                            "note": s.get("note", ""),
                            "image_url": s.get("image_url", ""),
                            "icon": s.get("icon", "TipsAndUpdatesOutlined"),
                            "is_active": bool(s.get("is_active", True)),
                            "sort_order": s.get("sort_order", idx + 1)
                        })
                    conn.commit()
            except Exception as e:
                print(f"Warning saving loading_slides to Supabase: {e}", flush=True)
                return {"ok": False, "error": f"Lỗi lưu Supabase: {e}"}

        return {"ok": True, "message": f"Đã lưu thành công {len(slides)} slide quy trình!"}

    def reset_loading_slides(self):
        return self.save_loading_slides(DEFAULT_LOADING_SLIDES)


DEFAULT_LOADING_SLIDES = [
    {
        "id": 1,
        "tag": "CHẤT LƯỢNG (CLL)",
        "category": "Kiểm Soát Ca Lặp",
        "badge_color": "#7c3aed",
        "title": "Quy Trình Triệt Tiêu CLL30N & Lặp Ca Bảo Trì",
        "target": "Chỉ tiêu: CLL30N <= 7.0% • CLPS 7N BT <= 3.0%",
        "steps": [
            "1. Đo kiểm công suất quang đầu vào bằng máy OPM (Chuẩn đạt: -18 dBm đến -23 dBm).",
            "2. Vệ sinh sạch sẽ Fast Connector, Adapter quang, tránh để bụi bẩn gây suy hao cao.",
            "3. Kiểm tra toàn bộ đoạn cáp thuê bao, thay thế mối nối suy giảm, bấm lại đầu quang chuẩn.",
            "4. Khảo sát lại vị trí đặt Modem/Access Point, tư vấn khách hàng đặt nơi thông thoáng.",
            "5. Đo kiểm Speedtest thực tế tại phòng khách và các phòng ngủ trước khi ký biên bản."
        ],
        "note": "💡 Bí quyết: Giải quyết tận gốc nguyên nhân gốc rễ, tuyệt đối không xử lý tạm thời để phát sinh lặp lại trong 30 ngày!",
        "icon": "EngineeringOutlined",
        "image_url": "",
        "is_active": True,
        "sort_order": 1
    },
    {
        "id": 2,
        "tag": "TRIỂN KHAI (TK)",
        "category": "Thi Công Chuẩn Mực",
        "badge_color": "#0284c7",
        "title": "Quy Trình Triển Khai Mới & Cam Kết Đúng Hẹn",
        "target": "Chỉ tiêu: Đúng Hẹn TK >= 97.2% • Thời gian RT-TK <= 18H",
        "steps": [
            "1. Tiếp nhận phiếu trên Mobisale, liên hệ khách hàng hẹn giờ chuẩn xác trước 15 - 30 phút.",
            "2. Khảo sát tuyến cáp từ Hộp cáp (Tủ cáp/ODF) đến nhà khách hàng đảm bảo mỹ quan đô thị.",
            "3. Kéo cáp theo đúng lộ trình kỹ thuật, đóng bọ gọn gàng, hạn chế tối đa góc uốn cong gắt.",
            "4. Kích hoạt thiết bị (Modem Wi-Fi 6 / FPT Play Box / Camera) và cấu hình tối ưu 2 băng tần (2.4G / 5G).",
            "5. Hướng dẫn khách hàng cài đặt và trải nghiệm ứng dụng Hi-FPT để tự quản trị Wi-Fi."
        ],
        "note": "⚡ Cam kết: 'Đúng giờ từng phút - Tận tâm từng việc' để mang lại ấn tượng đầu tiên tốt nhất cho khách hàng mới!",
        "icon": "SpeedOutlined",
        "image_url": "",
        "is_active": True,
        "sort_order": 2
    },
    {
        "id": 3,
        "tag": "AN TOÀN LAO ĐỘNG",
        "category": "Tiêu Chuẩn G-Safe",
        "badge_color": "#ea580c",
        "title": "Tuân Thủ Nghiêm Ngặt An Toàn Lao Động (G-Safe)",
        "target": "Tiêu chí: 100% Phiếu thi công & bảo trì an toàn tuyệt đối",
        "steps": [
            "1. Trang bị đầy đủ BHLĐ: Mũ bảo hiểm chuyên dụng có quai cài, găng tay, giày cách điện.",
            "2. Kiểm tra kỹ dây đai an toàn và móc khóa trước khi leo thang / trèo trụ viễn thông.",
            "3. Khi thi công dưới lòng đường, lề đường: Bắt buộc đặt cọc tiêu phản quang cảnh báo từ xa.",
            "4. Kiểm tra điện rò trên dây kéo, trụ điện lực bằng bút thử điện trước khi tác nghiệp.",
            "5. Tuyệt đối không leo trụ trong điều kiện trời mưa to, giông sét hoặc chập tối thiếu sáng."
        ],
        "note": "🛡️ Ghi nhớ: 'An toàn của bạn là hạnh phúc của gia đình!' An toàn lao động luôn là ưu tiên hàng đầu số 1.",
        "icon": "ShieldOutlined",
        "image_url": "",
        "is_active": True,
        "sort_order": 3
    },
    {
        "id": 4,
        "tag": "TRẢI NGHIỆM KHÁCH HÀNG",
        "category": "Văn Hóa Phục Vụ",
        "badge_color": "#059669",
        "title": "Tác Phong Chuyên Nghiệp & Trải Nghiệm Khách Hàng Tuyệt Hảo",
        "target": "Mục tiêu: Đánh giá dịch vụ 5 sao từ 100% khách hàng",
        "steps": [
            "1. Đồng phục FPT Telecom chỉnh tề, gọn gàng, đeo thẻ nhân viên đúng quy định khi tới nhà KH.",
            "2. Chủ động đeo bọc giày khi bước vào sàn nhà của khách hàng để giữ gìn vệ sinh chung.",
            "3. Lắng nghe cẩn thận phản ánh của khách hàng với thái độ cầu thị, lịch thiệp và tôn trọng.",
            "4. Dọn dẹp sạch sẽ toàn bộ mẩu cáp vụn, vỏ ốc, dây thít sau khi hoàn tất công việc.",
            "5. Bàn giao thiết bị, gửi lại danh thiếp hỗ trợ và hướng dẫn số tổng đài khi cần hỗ trợ gấp."
        ],
        "note": "🌟 Phương châm: Mỗi kỹ thuật viên là một đại sứ thương hiệu mang lại sự tin cậy tuyệt đối cho FPT Telecom.",
        "icon": "SentimentSatisfiedAltOutlined",
        "image_url": "",
        "is_active": True,
        "sort_order": 4
    },
    {
        "id": 5,
        "tag": "MẸO SỬ DỤNG HỆ THỐNG",
        "category": "Khai Thác Dashboard KPI",
        "badge_color": "#d97706",
        "title": "Mẹo Khai Thác Nhanh Dữ Liệu & Báo Cáo Trên Hệ Thống",
        "target": "Tiện ích: Tra cứu tức thì - Điều hành chủ động",
        "steps": [
            "1. Sử dụng thanh Lọc Nhanh (Đầu tháng, Hôm nay, Hôm qua, 7 ngày) để xem báo cáo theo chu kỳ mong muốn.",
            "2. Lọc theo Đội Trưởng hoặc Block để kiểm tra sát sao hiệu suất của từng nhóm địa bàn phụ trách.",
            "3. Nhấp đúp hoặc bấm nút 'Xem Chi Tiết' tại từng nhân viên để xem danh sách toàn bộ phiếu TK và BT.",
            "4. Tận dụng bảng 'Lịch Trực' để theo dõi nhân sự trực ca, đảm bảo tỷ lệ trực và kiểm soát tồn ca tồn khoán.",
            "5. Xuất báo cáo Excel với đầy đủ chỉ số RT, CLL30N và Tỷ lệ đúng hẹn chỉ bằng 1 cú nhấp chuột."
        ],
        "note": "📊 Dữ liệu là sức mạnh: Theo dõi chỉ số hàng ngày giúp bạn luôn chủ động bứt phá mọi mục tiêu KPI!",
        "icon": "TipsAndUpdatesOutlined",
        "image_url": "",
        "is_active": True,
        "sort_order": 5
    }
]




