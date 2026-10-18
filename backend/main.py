import os
import sys
import time
import threading
import io as _io
import urllib.request as _urllib_req
import csv as _csv
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, Query, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
try:
    import orjson
    class FastJSON(Response):
        media_type = "application/json"
        def render(self, content):
            return orjson.dumps(content, default=str,
                                option=orjson.OPT_SERIALIZE_NUMPY | orjson.OPT_NON_STR_KEYS)
    default_response_cls = FastJSON
except Exception:
    default_response_cls = JSONResponse

try:
    from cachetools import TTLCache
except Exception:
    class TTLCache(dict):
        def __init__(self, maxsize=200, ttl=300):
            super().__init__()
            self.maxsize = maxsize
            self.ttl = ttl

from fastapi.middleware.gzip import GZipMiddleware

# Ensure sys.path includes backend directory for internal imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from engine import KPIEngine

app = FastAPI(title="Ultra-Fast HR KPI System", version="1.0.0", default_response_class=default_response_cls)
app.add_middleware(GZipMiddleware, minimum_size=1024)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize KPI engine
engine = KPIEngine()

DICH_VU_SHEET_ID = "1Uj4oO7cNIB-ha4FnDmL1_g0ziJXTWmqv_kyUCtTtn9Y"
DICH_VU_GID = "673112371"

def _fetch_dich_vu_sheet():
    """Đọc Google Sheet KPI Dịch Vụ, trả về list dict theo từng KTV."""
    url = f"https://docs.google.com/spreadsheets/d/{DICH_VU_SHEET_ID}/export?format=csv&gid={DICH_VU_GID}"
    try:
        req = _urllib_req.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = _urllib_req.urlopen(req, timeout=15)
        raw = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        raise RuntimeError(f"Không thể tải Google Sheet Dịch Vụ: {e}")

    reader = list(_csv.reader(_io.StringIO(raw)))
    data_rows = reader[3:]

    def _parse_num(val: str):
        if not val or val.strip() in ('-', ''):
            return None
        v = val.strip().replace('%', '').replace('.', '').replace(',', '.')
        try:
            return float(v)
        except Exception:
            return None

    results = []
    for row in data_rows:
        if len(row) < 21:
            continue
        ktv_raw = row[2].strip() if row[2].strip() else ''
        if not ktv_raw:
            continue
        if '.' in ktv_raw:
            account_suffix = ktv_raw.split('.')[-1].upper()
        else:
            account_suffix = ktv_raw.upper()

        tong_hoa_don   = _parse_num(row[5])
        ti_le_da_tt    = _parse_num(row[9])
        roi_mang_kh    = _parse_num(row[12])
        roi_mang_du_kien = _parse_num(row[19])
        pct_rm_hien_tai  = _parse_num(row[20])

        results.append({
            "ktv_raw": ktv_raw,
            "account_suffix": account_suffix,
            "tong_hoa_don": tong_hoa_don,
            "ti_le_da_tt": ti_le_da_tt,
            "roi_mang_kh": roi_mang_kh,
            "roi_mang_du_kien": roi_mang_du_kien,
            "pct_rm_hien_tai": pct_rm_hien_tai,
        })
    return results

_dv_cache = {"ts": 0.0, "map": {}}
_dv_lock = threading.Lock()

def _get_dv_map(ttl=300):
    if time.time() - _dv_cache["ts"] < ttl:
        return _dv_cache["map"]
    with _dv_lock:
        if time.time() - _dv_cache["ts"] < ttl:
            return _dv_cache["map"]
        try:
            _dv_cache["map"] = {r["account_suffix"]: r for r in _fetch_dich_vu_sheet() if r.get("account_suffix")}
            _dv_cache["ts"] = time.time()
        except Exception as e:
            print(f"DV sheet error: {e}", flush=True)
            _dv_cache["ts"] = time.time() - ttl + 30   # lỗi: dùng bản cũ, thử lại sau 30s
        return _dv_cache["map"]

if not os.environ.get("VERCEL") and not os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    threading.Thread(target=_get_dv_map, daemon=True).start()   # làm nóng lúc khởi động (chỉ trên server persistent)

_report_cache = TTLCache(maxsize=200, ttl=300)
_cache_lock = threading.Lock()

@app.get("/api/health")
def api_health():
    return {
        "status": "ok",
        "vercel": bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")),
        "time": time.time()
    }

@app.get("/api/kpi/options")
def get_filter_options():
    if not engine.team_leads:
        engine._ensure_kpi_datasets_loaded()
    return {
        "team_leads": engine.team_leads,
        "regions": engine.regions,
        "partners": engine.partners,
        "blocks": engine.blocks,
        "phuongs": getattr(engine, 'phuongs', []),
        "blocks_by_teamlead": getattr(engine, 'blocks_by_teamlead', {}),
        "blocks_by_phuong": getattr(engine, 'blocks_by_phuong', {}),
        "last_sync_time": engine.last_sync_time,
        "is_syncing": engine.is_syncing,
        "sync_error": engine.sync_error
    }

import math
import pandas as pd
import numpy as np

def _sanitize_for_json(obj):
    if obj is None:
        return None
    elif isinstance(obj, bool):
        return obj
    elif isinstance(obj, (int, np.integer)):
        return int(obj)
    elif isinstance(obj, (float, np.floating)):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, dict):
        return {str(k): _sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [_sanitize_for_json(v) for v in obj]
    elif isinstance(obj, (str, bytes)):
        return obj if isinstance(obj, str) else obj.decode('utf-8', errors='ignore')
    elif pd.isna(obj):
        return None
    else:
        return str(obj)

@app.get("/api/kpi/report")
def get_kpi_report(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    team_lead: Optional[str] = Query(default=None),
    region: Optional[str] = Query(default=None),
    partner: Optional[str] = Query(default=None),
    block: Optional[str] = Query(default=None),
    phuong: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None)
):
    try:
        s_date = start_date if isinstance(start_date, str) else None
        e_date = end_date if isinstance(end_date, str) else None
        t_lead = team_lead if isinstance(team_lead, str) else None
        reg = region if isinstance(region, str) else None
        part = partner if isinstance(partner, str) else None
        blk = block if isinstance(block, str) else None
        srch = search if isinstance(search, str) else None

        key = (engine.data_version, s_date, e_date, t_lead, reg, part, blk, phuong, srch)
        with _cache_lock:
            report = _report_cache.get(key)
        if report is None:
            report = engine.get_kpi_report(start_date=s_date, end_date=e_date, team_lead=t_lead,
                                           region=reg, partner=part, block=blk, phuong=phuong, search=srch)
            with _cache_lock:
                _report_cache[key] = report

        dv_map, blank = _get_dv_map(), {}
        for emp in report.get("employees", []):
            dv = dv_map.get(str(emp.get("account", "")).strip().split(".")[-1].upper(), blank)
            emp["dv_tong_hoa_don"]      = dv.get("tong_hoa_don")
            emp["dv_ti_le_da_tt"]       = dv.get("ti_le_da_tt")
            emp["dv_roi_mang_kh"]       = dv.get("roi_mang_kh")
            emp["dv_roi_mang_du_kien"]  = dv.get("roi_mang_du_kien")
            emp["dv_pct_rm_hien_tai"]   = dv.get("pct_rm_hien_tai")
        return FastJSON(report)
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Error in /api/kpi/report: {e}\n{trace}", flush=True)
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": trace})

@app.get("/api/kpi/employee/{account}")
def get_employee_details(
    account: str,
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None)
):
    return engine.get_employee_details(account, start_date=start_date, end_date=end_date)

@app.get("/api/kpi/clpn7n-tk")
def get_clpn7n_tk_list(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    team_lead: Optional[str] = Query(default=None)
):
    return engine.get_clpn7n_tk_list(start_date=start_date, end_date=end_date, team_lead=team_lead)

@app.get("/api/kpi/ton-tk-bt/dashboard")
def get_ton_tk_bt_dashboard(force: bool = Query(default=False)):
    return engine.get_ton_tk_bt_dashboard(force=force)

@app.post("/api/kpi/ton-tk-bt/sync")
def sync_ton_tk_bt(force: bool = Query(default=True)):
    res = engine.sync_ton_tk_bt(force=force)
    dashboard = engine.get_ton_tk_bt_dashboard(force=False)
    return {
        "ok": True,
        "sync_info": res,
        "dashboard": dashboard
    }

@app.post("/api/kpi/ton-tk-bt/import")
async def import_ton_tk_bt(file: UploadFile = File(...), mode: Optional[str] = Form("AUTO")):
    contents = await file.read()
    res = engine.import_ton_tk_bt(contents, file.filename, mode=mode)
    return res

@app.get("/api/admin/dataset-counts")
def get_dataset_counts():
    try:
        return engine.get_dataset_counts()
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Error in /api/admin/dataset-counts: {e}\n{trace}", flush=True)
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e), "traceback": trace})

@app.get("/api/debug/data-status")
def get_debug_data_status():
    """Public endpoint to diagnose why KPIs might be empty (no auth required)."""
    try:
        counts = engine.get_dataset_counts()
        tk_cols = list(engine.tk_df.columns)[:10] if engine.tk_df is not None and not engine.tk_df.empty else []
        bt_cols = list(engine.bt_df.columns)[:10] if engine.bt_df is not None and not engine.bt_df.empty else []
        return {
            "ok": True,
            "dataset_counts": counts.get("counts", {}),
            "in_memory": {
                "tk": len(engine.tk_df) if engine.tk_df is not None and not engine.tk_df.empty else 0,
                "bt": len(engine.bt_df) if engine.bt_df is not None and not engine.bt_df.empty else 0,
                "kh_cls": len(engine.kh_cls_df) if engine.kh_cls_df is not None and not engine.kh_cls_df.empty else 0,
                "cll30n": len(engine.cll30n_df) if engine.cll30n_df is not None and not engine.cll30n_df.empty else 0,
                "hr": len(engine.hr_df) if engine.hr_df is not None and not engine.hr_df.empty else 0,
            },
            "tk_sample_columns": tk_cols,
            "bt_sample_columns": bt_cols,
            "emp_map_size": len(engine.emp_map),
            "last_sync_time": engine.last_sync_time,
            "has_db_connection": engine.get_db_engine() is not None,
            "db_error": getattr(engine, '_last_db_error', None),
            "db_url_masked": (engine.DATABASE_URL[:25] + '...') if getattr(engine, 'DATABASE_URL', None) else 'EMPTY',
        }
    except Exception as e:
        import traceback
        return {"ok": False, "error": str(e), "traceback": traceback.format_exc()}

@app.post("/api/admin/import-dataset")
async def import_database_dataset(
    file: UploadFile = File(...),
    target: Optional[str] = Form("cll30n"),
    rule: Optional[str] = Form("MERGE_NO_OVERWRITE")
):
    contents = await file.read()
    res = engine.import_database_dataset(contents, file.filename, target=target, rule=rule)
    return res

class ClearDatasetRequest(BaseModel):
    target: str = "kh_cls"
    password: str

@app.post("/api/admin/clear-dataset")
def clear_database_dataset(req: ClearDatasetRequest):
    res = engine.clear_database_dataset(req.target, req.password)
    return res

@app.post("/api/kpi/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    if engine.is_syncing:
        return {"status": "in_progress", "message": "Đang đồng bộ dữ liệu..."}
    
    background_tasks.add_task(engine.sync_live_data)
    return {"status": "started", "message": "Đã bắt đầu đồng bộ dữ liệu mới nhất!"}

@app.get("/api/kpi/sync/status")
def get_sync_status():
    """Poll this endpoint to check if a background sync is still running."""
    return {
        "is_syncing": engine.is_syncing,
        "last_sync_time": engine.last_sync_time,
        "sync_error": engine.sync_error
    }

# =========================================================================
# LỊCH TRỰC API ENDPOINTS
# =========================================================================
@app.get("/api/lich-truc/dashboard")
def get_lich_truc_dashboard(
    date: Optional[str] = Query(None),
    force: bool = Query(False)
):
    return engine.get_lich_truc_dashboard(date_str=date, force=force)

@app.get("/api/lich-truc/thresholds")
def get_lich_truc_thresholds():
    return engine.get_thresholds()

@app.post("/api/lich-truc/thresholds")
def save_lich_truc_thresholds(payload: dict):
    ti_le_truc_min = payload.get('tiLeTrucMin', 50.0)
    ton_per_ns_max = payload.get('tonPerNsMax', 5.0)
    return engine.save_thresholds(ti_le_truc_min, ton_per_ns_max)

@app.get("/api/lich-truc/doi-truong-list")
def get_lich_truc_doi_truong_list():
    return engine.team_leads

@app.get("/api/lich-truc/chitiet")
def get_lich_truc_chitiet(
    month: Optional[int] = Query(0),
    year: Optional[int] = Query(0),
    doi_truong: Optional[str] = Query("__ALL__")
):
    return engine.get_lich_truc_chitiet(month=month, year=year, doi_truong=doi_truong)

@app.post("/api/lich-truc/add-row")
def add_lich_truc_row(payload: dict):
    mail = payload.get('mail', '').strip()
    values_b_to_al = payload.get('valuesBtoAL', [])
    return engine.add_lich_truc_row(mail, values_b_to_al)

@app.post("/api/lich-truc/update-row")
def update_lich_truc_row(payload: dict):
    row_number = payload.get('rowNumber', 0)
    values_b_to_al = payload.get('valuesBtoAL', [])
    return engine.update_lich_truc_row(row_number, values_b_to_al)

@app.post("/api/lich-truc/delete-row")
def delete_lich_truc_row(payload: dict):
    row_number = payload.get('rowNumber', 0)
    return engine.delete_lich_truc_row(row_number)

@app.post("/api/lich-truc/import-csv")
def import_lich_truc_csv(payload: dict):
    rows_data = payload.get('rows', [])
    return engine.import_lich_truc_rows(rows_data)

@app.get("/api/lich-truc/history")
def get_lich_truc_history(
    month: Optional[int] = Query(0),
    year: Optional[int] = Query(0),
    doi_truong: Optional[str] = Query("__ALL__"),
    search: Optional[str] = Query(""),
    limit_latest: Optional[bool] = Query(False)
):
    return engine.get_lich_truc_history(
        month=month,
        year=year,
        doi_truong=doi_truong,
        search=search,
        limit_latest=limit_latest
    )

@app.post("/api/lich-truc/history/clear")
def clear_lich_truc_history():
    return engine.clear_lich_truc_history()

# Background Milestone Scheduler (08:00, 14:00, 19:00, 23:00)
import threading
import time
import datetime

def start_lt_milestone_scheduler():
    def scheduler_loop():
        executed_milestones = set()
        print("Lịch Trực 4-milestone auto-scheduler started (08:00, 14:00, 19:00, 23:00)...", flush=True)
        while True:
            try:
                now = datetime.datetime.now()
                today_str = now.strftime('%Y-%m-%d')
                hour = now.hour
                minute = now.minute

                if hour in (8, 14, 19, 23) and minute < 5:
                    key = (today_str, hour)
                    if key not in executed_milestones:
                        executed_milestones.add(key)
                        label = f"{hour:02d}:00"
                        print(f"Triggering scheduled milestone snapshot for {label} on {today_str}...", flush=True)
                        engine._snapshot_and_detect_lt_changes(source_label=label)
            except Exception as e:
                print(f"Scheduler loop error: {e}", flush=True)
            time.sleep(30)

    t = threading.Thread(target=scheduler_loop, daemon=True)
    t.start()

# Start background scheduler for Lịch Trực snapshots (only on persistent servers, not on Vercel Serverless)
if not os.environ.get("VERCEL") and not os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    try:
        start_lt_milestone_scheduler()
    except Exception as e_sched:
        print(f"Warning starting LT milestone scheduler: {e_sched}", flush=True)
    try:
        engine.start_background_refresher()
    except Exception as e_bg:
        print(f"Warning starting background refresher: {e_bg}", flush=True)



# =========================================================================
# ADMIN & AUTHENTICATION API ENDPOINTS
# =========================================================================
@app.post("/api/admin/login")
def admin_login(payload: dict):
    login_id = payload.get('login_id', '')
    password = payload.get('password', '')
    return engine.authenticate_user(login_id, password)

@app.post("/api/admin/setup-initial-password")
def setup_initial_password(payload: dict):
    login_id = payload.get('login_id', '')
    password = payload.get('password', '')
    return engine.setup_initial_admin_password(login_id, password)

@app.post("/api/admin/check-hr-email")
def check_hr_email(payload: dict):
    email = payload.get('email', '')
    return engine.check_hr_email(email)

@app.post("/api/admin/register")
def register_user(payload: dict):
    mail = payload.get('mail', '')
    user_alias = payload.get('user', '')
    password = payload.get('password', '')
    return engine.register_user(mail, user_alias, password)

@app.get("/api/admin/users")
def get_admin_users():
    return engine.get_admin_users()

@app.post("/api/admin/users/add")
def add_admin_user(payload: dict):
    return engine.add_admin_user(payload)

@app.post("/api/admin/users/update")
def update_admin_user(payload: dict):
    user_id = payload.get('user_id', 0)
    return engine.update_admin_user(user_id, payload)

@app.post("/api/admin/users/delete")
def delete_admin_user(payload: dict):
    user_id = payload.get('user_id', 0)
    return engine.delete_admin_user(user_id)

@app.get("/api/admin/users/config-webapp")
def get_webapp_config():
    return engine.get_permissions_webapp_url()

@app.post("/api/admin/users/config-webapp")
def set_webapp_config(payload: dict):
    url = payload.get('url', '')
    return engine.set_permissions_webapp_url(url)

@app.get("/api/admin/config-database")
def get_database_config():
    return engine.get_database_url()

@app.post("/api/admin/config-database")
def set_database_config(payload: dict):
    url = payload.get('url', '')
    return engine.set_database_url(url)

@app.post("/api/admin/users/sync-sheet")
def sync_users_sheet():
    return engine.sync_admin_users_to_sheet()

@app.get("/api/admin/hr-list")
def get_admin_hr_list(
    search: Optional[str] = Query(""),
    block: Optional[str] = Query("__ALL__"),
    team_lead: Optional[str] = Query("__ALL__")
):
    return engine.get_hr_list(search=search, block=block, team_lead=team_lead)

@app.get("/api/admin/hr-detail/{code}")
def get_admin_hr_detail(code: str):
    return engine.get_hr_detail(code)

@app.post("/api/admin/hr/add")
def add_admin_hr(payload: dict):
    return engine.add_hr_employee(payload)

@app.post("/api/admin/hr/update")
def update_admin_hr(payload: dict):
    code = payload.get('code', '')
    return engine.update_hr_employee(code, payload)

@app.post("/api/admin/hr/delete")
def delete_admin_hr(payload: dict):
    code = payload.get('code', '')
    return engine.delete_hr_employee(code)

@app.get("/api/admin/luong-list")
def get_admin_luong_list(
    search: Optional[str] = Query(""),
    block: Optional[str] = Query("__ALL__"),
    team_lead: Optional[str] = Query("__ALL__")
):
    return engine.get_luong_list(search=search, block=block, team_lead=team_lead)


@app.get("/api/admin/loading-slides")
def get_admin_loading_slides():
    return engine.get_loading_slides()

@app.post("/api/admin/loading-slides")
def save_admin_loading_slides(payload: dict):
    slides = payload.get('slides', [])
    return engine.save_loading_slides(slides)

@app.post("/api/admin/loading-slides/reset")
def reset_admin_loading_slides():
    return engine.reset_loading_slides()



# =========================================================================
# KPI DỊCH VỤ API ENDPOINTS
# =========================================================================

@app.get("/api/dich-vu/report")
def get_dich_vu_report(account: Optional[str] = Query(default=None)):
    """
    Trả về KPI Dịch Vụ từ Google Sheet.
    - Nếu có param `account` (inside account, vd: PNC01.DUYPT) → lọc theo phần sau dấu chấm.
    - Không có → trả tất cả rows.
    """
    try:
        rows = _fetch_dich_vu_sheet()
        if account:
            suffix = account.strip().split('.')[-1].upper()
            rows = [r for r in rows if r['account_suffix'] == suffix]
        return JSONResponse(content={"ok": True, "rows": rows, "total": len(rows)})
    except Exception as e:
        import traceback
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e), "traceback": traceback.format_exc()})

# =========================================================================
# GIA CỐ MODEM API ENDPOINT
# =========================================================================
from gia_co_modem import get_gia_co_modem_report, get_image_proxy
from fastapi.responses import Response

@app.get("/api/gia-co-modem/data")
def api_get_gia_co_modem_data(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    team_lead: Optional[str] = Query(default=None),
    employee: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    force: bool = Query(default=False)
):
    """
    Trả về dữ liệu Gia Cố Modem từ Google Sheet, kết nối thông tin nhân sự HR.
    """
    try:
        if not engine.team_leads:
            engine._ensure_kpi_datasets_loaded()

        s_date = start_date if isinstance(start_date, str) and start_date.strip() else None
        e_date = end_date if isinstance(end_date, str) and end_date.strip() else None
        t_lead = team_lead if isinstance(team_lead, str) and team_lead.strip() else None
        emp = employee if isinstance(employee, str) and employee.strip() else None
        srch = search if isinstance(search, str) and search.strip() else None
        frc = force if isinstance(force, bool) else False

        data = get_gia_co_modem_report(
            emp_map=engine.emp_map,
            all_team_leads=engine.team_leads,
            start_date=s_date,
            end_date=e_date,
            team_lead=t_lead,
            employee=emp,
            search=srch,
            force=frc
        )
        return JSONResponse(content=_sanitize_for_json(data))
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Error in /api/gia-co-modem/data: {e}\n{trace}", flush=True)
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e), "traceback": trace})

@app.get("/api/gia-co-modem/image-proxy")
def api_gia_co_modem_image_proxy(url: str = Query(...)):
    """
    Proxy an toàn cho ảnh Google Drive / ảnh minh chứng để tránh lỗi CORS hoặc chặn referrer.
    """
    try:
        data, content_type = get_image_proxy(url)
        return Response(
            content=data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*"
            }
        )
    except Exception as e:
        print(f"Image proxy error for {url}: {e}", flush=True)
# =========================================================================
# PHÂN TÍCH MỐC GIỜ API ENDPOINTS
# =========================================================================
from phan_tich_moc_gio import (
    get_phan_tich_moc_gio_report,
    get_available_completion_dates,
    analyze_uploaded_moc_gio_files
)

@app.get("/api/kpi/moc-gio/dates")
def api_get_moc_gio_dates(analysis_type: Optional[str] = Query(default="COMPLETE_TIME")):
    """Lấy danh sách các ngày khả dụng (hoàn tất hoặc lịch hẹn) hiện có trong hệ thống."""
    try:
        if not engine.team_leads:
            engine._ensure_kpi_datasets_loaded()
        a_type = analysis_type if isinstance(analysis_type, str) and analysis_type.strip() else "COMPLETE_TIME"
        res = get_available_completion_dates(engine, analysis_type=a_type)
        return JSONResponse(content=_sanitize_for_json(res))
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Error in /api/kpi/moc-gio/dates: {e}\n{trace}", flush=True)
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e), "traceback": trace})

@app.get("/api/kpi/moc-gio/report")
def api_get_moc_gio_report(
    date: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    team_lead: Optional[str] = Query(default=None),
    block: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    analysis_type: Optional[str] = Query(default="COMPLETE_TIME")
):
    """
    Báo cáo phân tích tồn mốc giờ theo:
    - analysis_type == 'COMPLETE_TIME' (Theo thời gian hoàn tất)
    - analysis_type == 'APPOINTMENT' (Theo lịch hẹn)
    """
    try:
        if not engine.team_leads:
            engine._ensure_kpi_datasets_loaded()

        d_date = date if isinstance(date, str) and date.strip() else None
        s_date = start_date if isinstance(start_date, str) and start_date.strip() else None
        e_date = end_date if isinstance(end_date, str) and end_date.strip() else None
        t_lead = team_lead if isinstance(team_lead, str) and team_lead.strip() else None
        blk = block if isinstance(block, str) and block.strip() else None
        srch = search if isinstance(search, str) and search.strip() else None
        a_type = analysis_type if isinstance(analysis_type, str) and analysis_type.strip() else "COMPLETE_TIME"

        res = get_phan_tich_moc_gio_report(
            engine=engine,
            target_date=d_date,
            start_date=s_date,
            end_date=e_date,
            team_lead=t_lead,
            block=blk,
            search=srch,
            analysis_type=a_type
        )
        return JSONResponse(content=_sanitize_for_json(res))
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Error in /api/kpi/moc-gio/report: {e}\n{trace}", flush=True)
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e), "traceback": trace})

@app.post("/api/kpi/moc-gio/analyze-files")
async def api_analyze_moc_gio_files(
    tk_file: Optional[UploadFile] = File(None),
    bt_file: Optional[UploadFile] = File(None),
    date: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    team_lead: Optional[str] = Form(None),
    block: Optional[str] = Form(None),
    search: Optional[str] = Form(None),
    analysis_type: Optional[str] = Form("COMPLETE_TIME")
):
    """Phân tích mốc giờ từ các file Excel/CSV do người dùng tải lên."""
    try:
        if not engine.team_leads:
            engine._ensure_kpi_datasets_loaded()

        tk_bytes = await tk_file.read() if tk_file else None
        tk_fn = tk_file.filename if tk_file else None

        bt_bytes = await bt_file.read() if bt_file else None
        bt_fn = bt_file.filename if bt_file else None
        a_type = analysis_type if isinstance(analysis_type, str) and analysis_type.strip() else "COMPLETE_TIME"

        res = analyze_uploaded_moc_gio_files(
            engine=engine,
            tk_file_bytes=tk_bytes,
            tk_filename=tk_fn,
            bt_file_bytes=bt_bytes,
            bt_filename=bt_fn,
            target_date=date,
            start_date=start_date,
            end_date=end_date,
            team_lead=team_lead,
            block=block,
            search=search,
            analysis_type=a_type
        )
        return JSONResponse(content=_sanitize_for_json(res))
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Error in /api/kpi/moc-gio/analyze-files: {e}\n{trace}", flush=True)
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e), "traceback": trace})

# Serve frontend build if dist directory exists
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


