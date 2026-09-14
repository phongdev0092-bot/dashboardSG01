import os
from typing import Optional
from fastapi import FastAPI, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from engine import KPIEngine

app = FastAPI(title="Ultra-Fast HR KPI System", version="1.0.0")

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

@app.get("/api/kpi/options")
def get_filter_options():
    return {
        "team_leads": engine.team_leads,
        "regions": engine.regions,
        "partners": engine.partners,
        "blocks": engine.blocks,
        "last_sync_time": engine.last_sync_time,
        "is_syncing": engine.is_syncing,
        "sync_error": engine.sync_error
    }

@app.get("/api/kpi/report")
def get_kpi_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    team_lead: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    partner: Optional[str] = Query(None),
    block: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    return engine.get_kpi_report(
        start_date=start_date,
        end_date=end_date,
        team_lead=team_lead,
        region=region,
        partner=partner,
        block=block,
        search=search
    )

@app.get("/api/kpi/employee/{account}")
def get_employee_details(
    account: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    return engine.get_employee_details(account, start_date=start_date, end_date=end_date)

@app.post("/api/kpi/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    if engine.is_syncing:
        return {"status": "in_progress", "message": "Đang đồng bộ dữ liệu..."}
    
    background_tasks.add_task(engine.sync_live_data)
    return {"status": "started", "message": "Đã bắt đầu đồng bộ dữ liệu mới nhất!"}

# =========================================================================
# LỊCH TRỰC API ENDPOINTS
# =========================================================================
@app.get("/api/lich-truc/dashboard")
def get_lich_truc_dashboard(date: Optional[str] = Query(None)):
    return engine.get_lich_truc_dashboard(date_str=date)

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

@app.on_event("startup")
def on_startup():
    start_lt_milestone_scheduler()

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
    uvicorn.run("main:app", host="0.0.0.0", port=port)


