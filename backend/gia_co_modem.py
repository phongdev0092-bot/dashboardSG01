import io
import re
import csv
import time
import datetime
import urllib.request
import urllib.parse
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from typing import Optional, List, Dict, Any
import pandas as pd

GIA_CO_SHEET_ID = "1CENxDanvq5tqhhbqRb_NWQViFT4iHK6tQNMqvNxS1Qc"
GIA_CO_GID = "0"

# In-memory data cache
_cache = {
    "data": None,
    "last_fetched": 0,
    "ttl": 60  # seconds
}

# In-memory image binary cache (url -> {bytes, content_type, time})
_img_cache: Dict[str, Dict[str, Any]] = {}

def _normalize_str(s: Any) -> str:
    if not s or pd.isna(s):
        return ""
    norm = unicodedata.normalize('NFC', str(s)).strip()
    return norm

def _clean_key(s: Any) -> str:
    norm = _normalize_str(s).lower()
    nfkd = unicodedata.normalize('NFKD', norm)
    no_accent = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return re.sub(r'[^a-z0-9]', '', no_accent)

def parse_drive_url(url: str) -> Optional[Dict[str, Any]]:
    url = (url or '').strip()
    if not url:
        return None
    
    # Extract file_id if it's Google Drive
    file_id = None
    m = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
    if m:
        file_id = m.group(1)
    else:
        m = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
        if m:
            file_id = m.group(1)

    if file_id:
        direct_thumb = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1000"
        proxy_path = f"/api/gia-co-modem/image-proxy?url={urllib.parse.quote(direct_thumb)}"
        return {
            "original": url,
            "file_id": file_id,
            "direct_url": direct_thumb,
            "thumbnail_url": proxy_path,
            "view_url": proxy_path,
            "open_url": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing",
            "is_drive": True
        }

    # Direct non-drive URL
    proxy_path = f"/api/gia-co-modem/image-proxy?url={urllib.parse.quote(url)}"
    return {
        "original": url,
        "direct_url": url,
        "thumbnail_url": proxy_path,
        "view_url": proxy_path,
        "open_url": url,
        "is_drive": False
    }

def parse_images_from_formula_or_text(formula: Optional[str], text_val: Optional[str]) -> List[Dict[str, Any]]:
    urls = []
    # Check formula first (e.g. IMAGE("https://..."))
    if formula:
        matches = re.findall(r'["\'](https?://[^"\']+)["\']', str(formula))
        urls.extend(matches)

    # Check text value
    if text_val and pd.notna(text_val) and str(text_val).strip().lower() not in ('nan', 'none', '', '-'):
        parts = [p.strip() for p in re.split(r'[,;\n\r]+', str(text_val)) if p.strip()]
        for p in parts:
            if p.startswith('http://') or p.startswith('https://'):
                urls.append(p)

    images = []
    seen = set()
    for u in urls:
        if u not in seen:
            seen.add(u)
            parsed = parse_drive_url(u)
            if parsed:
                images.append(parsed)
    return images

def parse_date_value(val: Any):
    if not val or pd.isna(val):
        return None, None, ""

    # Check if Excel serial float (e.g. 46291.6999)
    try:
        fval = float(val)
        if 30000 < fval < 70000:
            dt = datetime.datetime(1899, 12, 30) + datetime.timedelta(days=fval)
            return dt, dt.strftime('%Y-%m-%d'), dt.strftime('%d/%m/%Y %H:%M:%S')
    except Exception:
        pass

    # Try standard string date formats
    s = str(val).strip()
    for fmt in ('%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
        try:
            dt = datetime.datetime.strptime(s, fmt)
            return dt, dt.strftime('%Y-%m-%d'), dt.strftime('%d/%m/%Y %H:%M:%S')
        except Exception:
            pass
    return None, None, s

def fetch_xlsx_sheet_data() -> List[Dict[str, Any]]:
    url = f"https://docs.google.com/spreadsheets/d/{GIA_CO_SHEET_ID}/export?format=xlsx"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        content = resp.read()

    z = zipfile.ZipFile(io.BytesIO(content))

    # Parse shared strings
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
            if t is not None and t.text:
                shared_strings.append(t.text)
            else:
                runs = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                shared_strings.append("".join([r.text or "" for r in runs]))

    # Parse sheet1.xml
    tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    sheetData = tree.find('main:sheetData', ns)

    raw_matrix = []
    for row in sheetData.findall('main:row', ns):
        cells = {}
        for c in row.findall('main:c', ns):
            cell_ref = c.get('r')
            m = re.match(r'([A-Z]+)', cell_ref)
            if not m:
                continue
            col_letter = m.group(1)
            val = None
            v = c.find('main:v', ns)
            f = c.find('main:f', ns)
            formula = f.text if f is not None else None
            cell_type = c.get('t')

            if cell_type == 's' and v is not None and v.text:
                idx = int(v.text)
                val = shared_strings[idx] if idx < len(shared_strings) else None
            elif v is not None:
                val = v.text

            cells[col_letter] = {
                'val': val,
                'formula': formula
            }
        raw_matrix.append(cells)

    if not raw_matrix:
        return []

    # Map column positions from header row
    header_row = raw_matrix[0]
    col_mapping = {}
    for col_letter, cell_info in header_row.items():
        ck = _clean_key(cell_info.get('val'))
        if 'id' in ck and 'so' not in ck:
            col_mapping['id'] = col_letter
        elif 'msnv' in ck or 'manv' in ck:
            col_mapping['msnv'] = col_letter
        elif 'inside' in ck or 'account' in ck:
            col_mapping['inside_account'] = col_letter
        elif 'mail' in ck or 'email' in ck:
            col_mapping['mail'] = col_letter
        elif 'hopdong' in ck or 'sohd' in ck:
            col_mapping['so_hd'] = col_letter
        elif 'hinhanh' in ck or 'anh' in ck or 'image' in ck:
            col_mapping['hinh_anh'] = col_letter
        elif 'ngaycapnhat' in ck or 'ngay' in ck or 'time' in ck:
            col_mapping['ngay_cap_nhat'] = col_letter

    # Fallbacks if some headers didn't match
    if 'id' not in col_mapping: col_mapping['id'] = 'A'
    if 'msnv' not in col_mapping: col_mapping['msnv'] = 'B'
    if 'inside_account' not in col_mapping: col_mapping['inside_account'] = 'C'
    if 'mail' not in col_mapping: col_mapping['mail'] = 'D'
    if 'so_hd' not in col_mapping: col_mapping['so_hd'] = 'E'
    if 'hinh_anh' not in col_mapping: col_mapping['hinh_anh'] = 'F'
    if 'ngay_cap_nhat' not in col_mapping: col_mapping['ngay_cap_nhat'] = 'G'

    rows = []
    for idx, r in enumerate(raw_matrix[1:]):
        c_id = r.get(col_mapping['id'], {})
        c_msnv = r.get(col_mapping['msnv'], {})
        c_inside = r.get(col_mapping['inside_account'], {})
        c_mail = r.get(col_mapping['mail'], {})
        c_so_hd = r.get(col_mapping['so_hd'], {})
        c_img = r.get(col_mapping['hinh_anh'], {})
        c_date = r.get(col_mapping['ngay_cap_nhat'], {})

        # Clean ID
        try:
            id_val = int(float(c_id.get('val'))) if c_id.get('val') else (idx + 1)
        except Exception:
            id_val = idx + 1

        # Clean MSNV
        msnv_str = ""
        raw_msnv = c_msnv.get('val')
        if raw_msnv is not None and str(raw_msnv).strip().lower() not in ('nan', 'none', ''):
            try:
                msnv_str = str(int(float(raw_msnv)))
            except Exception:
                msnv_str = str(raw_msnv).strip()

        inside_str = _normalize_str(c_inside.get('val'))
        so_hd_str = _normalize_str(c_so_hd.get('val'))
        mail_str = _normalize_str(c_mail.get('val'))

        # Parse image from formula or text
        img_formula = c_img.get('formula')
        img_val = c_img.get('val')
        parsed_imgs = parse_images_from_formula_or_text(img_formula, img_val)

        # Parse date
        dt_obj, date_str, formatted_date = parse_date_value(c_date.get('val'))

        rows.append({
            "id": id_val,
            "msnv": msnv_str,
            "inside_account": inside_str,
            "mail": mail_str,
            "so_hd": so_hd_str,
            "images": parsed_imgs,
            "image_count": len(parsed_imgs),
            "raw_image": str(img_formula or img_val or ""),
            "raw_date": str(c_date.get('val') or ""),
            "formatted_date": formatted_date,
            "date_str": date_str,
            "_datetime": dt_obj or datetime.datetime(1970, 1, 1)
        })

    return rows

def fetch_raw_sheet_data(force: bool = False) -> List[Dict[str, Any]]:
    now = time.time()
    if not force and _cache["data"] is not None and (now - _cache["last_fetched"]) < _cache["ttl"]:
        return _cache["data"]

    try:
        rows = fetch_xlsx_sheet_data()
        _cache["data"] = rows
        _cache["last_fetched"] = now
        return rows
    except Exception as e:
        print(f"Warning: XLSX sheet fetch failed: {e}. Checking cache...", flush=True)
        if _cache["data"] is not None:
            return _cache["data"]
        raise RuntimeError(f"Không thể kết nối đến Google Sheet Gia Cố Modem: {e}")

def get_image_proxy(url: str):
    """
    Fetch remote image and cache in memory for ultra-fast local streaming.
    """
    now = time.time()
    if url in _img_cache and (now - _img_cache[url]["time"]) < 3600:
        return _img_cache[url]["bytes"], _img_cache[url]["content_type"]

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        content_type = resp.headers.get("Content-Type", "image/jpeg")
        data = resp.read()

    _img_cache[url] = {
        "bytes": data,
        "content_type": content_type,
        "time": now
    }
    return data, content_type

def get_gia_co_modem_report(
    emp_map: Dict[str, Any],
    all_team_leads: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    team_lead: Optional[str] = None,
    employee: Optional[str] = None,
    search: Optional[str] = None,
    force: bool = False
) -> Dict[str, Any]:
    raw_rows = fetch_raw_sheet_data(force=force)

    # Build MSNV lookup dict from emp_map
    msnv_to_emp = {}
    for acc, info in (emp_map or {}).items():
        code = str(info.get('code', '')).strip().lstrip('0')
        if code:
            msnv_to_emp[code] = info

    enriched_rows = []
    for r in raw_rows:
        inside = r["inside_account"].upper()
        msnv_clean = r["msnv"].lstrip('0')

        # Match from emp_map by inside account or code
        emp_info = (emp_map or {}).get(inside)
        if not emp_info and msnv_clean in msnv_to_emp:
            emp_info = msnv_to_emp[msnv_clean]

        name = emp_info.get('name') if emp_info else (r["inside_account"] or r["msnv"])
        tl = emp_info.get('team_lead') if emp_info else 'Chưa xác nhận'
        block = emp_info.get('block', '') if emp_info else ''
        partner = emp_info.get('partner', '') if emp_info else ''

        row_copy = dict(r)
        row_copy["name"] = name
        row_copy["team_lead"] = tl or 'Chưa xác nhận'
        row_copy["block"] = block
        row_copy["partner"] = partner
        enriched_rows.append(row_copy)

    # Sort descending by date
    enriched_rows.sort(key=lambda x: x["_datetime"], reverse=True)

    # Collect available team leads & employees from all rows + HR
    active_team_leads = set()
    emp_dict = {}

    for r in enriched_rows:
        tl_val = r["team_lead"]
        if tl_val:
            active_team_leads.add(tl_val)
        acc_key = r["inside_account"] or r["msnv"]
        if acc_key and acc_key not in emp_dict:
            emp_dict[acc_key] = {
                "account": r["inside_account"],
                "msnv": r["msnv"],
                "name": r["name"],
                "team_lead": r["team_lead"]
            }

    # Merge with HR team leads
    all_tls_set = set(all_team_leads or [])
    all_tls_set.update(active_team_leads)
    sorted_team_leads = sorted([tl for tl in all_tls_set if tl and tl != 'Chưa xác nhận'])
    if 'Chưa xác nhận' in all_tls_set:
        sorted_team_leads.append('Chưa xác nhận')

    # Apply filters
    filtered_rows = enriched_rows

    if team_lead and team_lead != '__ALL__':
        norm_tl = _clean_key(team_lead)
        filtered_rows = [r for r in filtered_rows if _clean_key(r["team_lead"]) == norm_tl]

    if employee and employee != '__ALL__':
        norm_emp = _clean_key(employee)
        filtered_rows = [
            r for r in filtered_rows
            if _clean_key(r["inside_account"]) == norm_emp or
               _clean_key(r["msnv"]) == norm_emp or
               _clean_key(r["name"]) == norm_emp
        ]

    if start_date:
        filtered_rows = [r for r in filtered_rows if r["date_str"] and r["date_str"] >= start_date]

    if end_date:
        filtered_rows = [r for r in filtered_rows if r["date_str"] and r["date_str"] <= end_date]

    if search:
        kw = _clean_key(search)
        filtered_rows = [
            r for r in filtered_rows
            if kw in _clean_key(r["so_hd"]) or
               kw in _clean_key(r["inside_account"]) or
               kw in _clean_key(r["msnv"]) or
               kw in _clean_key(r["name"]) or
               kw in _clean_key(r["mail"]) or
               kw in _clean_key(r["team_lead"])
        ]

    # Metrics calculation
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    this_month_prefix = datetime.date.today().strftime('%Y-%m')

    # Summary
    total_contracts = len(filtered_rows)
    all_time_contracts = len(enriched_rows)
    distinct_emps = len(set(r["inside_account"] or r["msnv"] for r in filtered_rows if (r["inside_account"] or r["msnv"])))
    distinct_tls = len(set(r["team_lead"] for r in filtered_rows if r["team_lead"]))
    today_cnt = sum(1 for r in filtered_rows if r["date_str"] == today_str)
    this_month_cnt = sum(1 for r in filtered_rows if r["date_str"] and r["date_str"].startswith(this_month_prefix))
    has_image_cnt = sum(1 for r in filtered_rows if r["image_count"] > 0)

    # Breakdown by Team Lead
    by_tl: Dict[str, int] = {}
    for r in filtered_rows:
        tl_name = r["team_lead"] or 'Chưa xác nhận'
        by_tl[tl_name] = by_tl.get(tl_name, 0) + 1
    tl_breakdown = [{"team_lead": k, "count": v} for k, v in sorted(by_tl.items(), key=lambda x: x[1], reverse=True)]

    # Breakdown by Date (for trend chart)
    by_date: Dict[str, int] = {}
    for r in filtered_rows:
        d = r["date_str"]
        if d:
            by_date[d] = by_date.get(d, 0) + 1
    date_breakdown = [{"date": k, "count": v} for k, v in sorted(by_date.items())]

    # Clean rows for JSON output (strip `_datetime`)
    clean_rows = []
    for r in filtered_rows:
        item = dict(r)
        item.pop("_datetime", None)
        clean_rows.append(item)

    last_sync_time = datetime.datetime.fromtimestamp(_cache["last_fetched"]).strftime('%H:%M:%S %d/%m/%Y') if _cache["last_fetched"] else None

    return {
        "ok": True,
        "summary": {
            "total_contracts": total_contracts,
            "all_time_contracts": all_time_contracts,
            "unique_employees": distinct_emps,
            "unique_team_leads": distinct_tls,
            "today_contracts": today_cnt,
            "this_month_contracts": this_month_cnt,
            "has_image_contracts": has_image_cnt
        },
        "breakdowns": {
            "by_team_lead": tl_breakdown,
            "by_date": date_breakdown
        },
        "filter_options": {
            "team_leads": sorted_team_leads,
            "employees": sorted(list(emp_dict.values()), key=lambda x: x["name"])
        },
        "last_sync_time": last_sync_time,
        "rows": clean_rows
    }
