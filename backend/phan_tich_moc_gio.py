import datetime
import io
import re
import unicodedata
import pandas as pd
import numpy as np

# Danh sách 8 Mốc giờ theo quy định công ty
MILESTONES = [
    {"id": "8-10H", "label": "8-10H", "subtitle": "Hạn <= 10:00"},
    {"id": "10-12H", "label": "10-12H", "subtitle": "Hạn <= 12:00"},
    {"id": "12h30-13h30", "label": "12h30-13h30", "subtitle": "Hạn <= 13:30"},
    {"id": "13h30-15h30", "label": "13h30-15h30", "subtitle": "Hạn <= 15:30"},
    {"id": "15h30-17h30", "label": "15h30-17h30", "subtitle": "Hạn <= 17:30"},
    {"id": "17h30-19h30", "label": "17h30-19h30", "subtitle": "Hạn <= 19:30"},
    {"id": "19h30-21h30", "label": "19h30-21h30", "subtitle": "Hạn <= 21:30"},
    {"id": "21h30-23h", "label": "21h30-23h", "subtitle": "Hạn <= 23:59"}
]

def remove_accents(text):
    """Chuẩn hóa chuỗi tiếng Việt: loại bỏ dấu và ký tự đ/Đ để tìm kiếm mượt mà."""
    if not text:
        return ''
    s = str(text)
    s = s.replace('đ', 'd').replace('Đ', 'D')
    nfkd = unicodedata.normalize('NFKD', s)
    return ''.join([c for c in nfkd if not unicodedata.combining(c)]).lower().strip()


def parse_time_slot(dt_val):
    """
    Phân loại timestamp mốc hẹn vào 8 mốc giờ của công ty.
    Định dạng đầu vào: '12/09/2026 10:00:00' -> 8-10H
    '12/09/2026 12:00:00' -> 10-12H
    """
    if dt_val is None or pd.isna(dt_val):
        return None
    s = str(dt_val).strip()
    if not s or s.lower() in ('nan', 'none', '-', 'null', ''):
        return None
    
    t_obj = None
    if isinstance(dt_val, (pd.Timestamp, datetime.datetime)):
        t_obj = dt_val.time()
    else:
        parts = s.split(' ')
        time_part = parts[1] if len(parts) > 1 else parts[0]
        try:
            h_m_s = time_part.split(':')
            if len(h_m_s) >= 2:
                hour = int(h_m_s[0])
                minute = int(h_m_s[1])
                second = int(h_m_s[2]) if len(h_m_s) > 2 else 0
                t_obj = datetime.time(hour, minute, second)
        except Exception:
            return None

    if t_obj is None:
        return None

    if t_obj <= datetime.time(10, 0):
        return "8-10H"
    elif t_obj <= datetime.time(12, 0):
        return "10-12H"
    elif t_obj <= datetime.time(13, 30):
        return "12h30-13h30"
    elif t_obj <= datetime.time(15, 30):
        return "13h30-15h30"
    elif t_obj <= datetime.time(17, 30):
        return "15h30-17h30"
    elif t_obj <= datetime.time(19, 30):
        return "17h30-19h30"
    elif t_obj <= datetime.time(21, 30):
        return "19h30-21h30"
    else:
        return "21h30-23h"


def parse_date_only(val):
    """Trích xuất ngày dạng datetime.date từ các kiểu dữ liệu khác nhau."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, datetime.date) and not isinstance(val, datetime.datetime):
        return val
    if isinstance(val, (datetime.datetime, pd.Timestamp)):
        return val.date()
    s = str(val).strip()
    if not s or s.lower() in ('nan', 'none', '-', 'null'):
        return None
    try:
        parts = s.split(' ')[0]
        if '/' in parts:
            p = parts.split('/')
            if len(p) == 3:
                return datetime.date(int(p[2]), int(p[1]), int(p[0]))
        elif '-' in parts:
            p = parts.split('-')
            if len(p) == 3:
                if len(p[0]) == 4:
                    return datetime.date(int(p[0]), int(p[1]), int(p[2]))
                else:
                    return datetime.date(int(p[2]), int(p[1]), int(p[0]))
    except Exception:
        pass
    try:
        dt = pd.to_datetime(s, dayfirst=True, errors='coerce')
        if pd.notnull(dt):
            return dt.date()
    except Exception:
        pass
    return None


def read_uploaded_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Đọc file Excel / CSV từ dạng bytes thành DataFrame pandas."""
    fn = filename.lower()
    bio = io.BytesIO(file_bytes)
    if fn.endswith('.csv'):
        for enc in ['utf-8-sig', 'utf-8', 'cp1258', 'latin1']:
            try:
                bio.seek(0)
                return pd.read_csv(bio, encoding=enc, dtype=str)
            except Exception:
                continue
        bio.seek(0)
        return pd.read_csv(bio, dtype=str)
    elif fn.endswith(('.xlsx', '.xlsm', '.xls')):
        return pd.read_excel(bio, dtype=str)
    else:
        try:
            bio.seek(0)
            return pd.read_excel(bio, dtype=str)
        except Exception:
            bio.seek(0)
            return pd.read_csv(bio, dtype=str)


def _find_column_name(df, candidate_names, default_idx=None):
    """Tìm tên cột linh hoạt theo danh sách ứng viên hoặc chỉ số cột mặc định."""
    if df is None or df.empty:
        return None
    cols = list(df.columns)
    cols_clean = [str(c).strip().lower() for c in cols]
    for cand in candidate_names:
        cand_clean = cand.strip().lower()
        for idx, c in enumerate(cols_clean):
            if cand_clean == c or cand_clean in c:
                return cols[idx]
    if default_idx is not None and default_idx < len(cols):
        return cols[default_idx]
    return None


def get_available_completion_dates(engine, analysis_type="COMPLETE_TIME"):
    """Lấy danh sách các ngày khả dụng (hoàn tất hoặc lịch hẹn) trong cơ sở dữ liệu."""
    tk = getattr(engine, 'tk_df', pd.DataFrame())
    bt = getattr(engine, 'bt_df', pd.DataFrame())

    dates = set()
    if analysis_type == "APPOINTMENT":
        # Thu thập ngày từ các cột mốc hẹn
        if tk is not None and not tk.empty:
            for c in ['Mốc hẹn L2 xanh', 'Mốc hẹn L1 xanh', 'Mốc hẹn L1 đỏ']:
                if c in tk.columns:
                    for d in tk[c].dropna().unique():
                        p = parse_date_only(d)
                        if p: dates.add(p)
        if bt is not None and not bt.empty:
            for c in ['Mốc hẹn L2', 'Mốc hẹn L1', 'Mốc hẹn Xanh L1', 'Mốc hẹn Xanh L2']:
                if c in bt.columns:
                    for d in bt[c].dropna().unique():
                        p = parse_date_only(d)
                        if p: dates.add(p)
    else:
        # Thu thập ngày từ cột hoàn tất
        if tk is not None and not tk.empty:
            if 'date_complete' in tk.columns:
                for d in tk['date_complete'].dropna().unique():
                    p = d if isinstance(d, datetime.date) and not isinstance(d, datetime.datetime) else parse_date_only(d)
                    if p: dates.add(p)
        if bt is not None and not bt.empty:
            if 'date_complete' in bt.columns:
                for d in bt['date_complete'].dropna().unique():
                    p = d if isinstance(d, datetime.date) and not isinstance(d, datetime.datetime) else parse_date_only(d)
                    if p: dates.add(p)

    sorted_dates = sorted(list(dates))
    date_strs = [d.strftime('%Y-%m-%d') for d in sorted_dates]
    return {
        "dates": date_strs,
        "count": len(date_strs),
        "min_date": date_strs[0] if date_strs else None,
        "max_date": date_strs[-1] if date_strs else None
    }


def analyze_moc_gio_data(
    tk_df,
    bt_df,
    emp_map=None,
    hr_map=None,
    ns_by_block=None,
    all_team_leads=None,
    all_blocks=None,
    target_date=None,
    start_date=None,
    end_date=None,
    team_lead=None,
    block=None,
    search=None,
    analysis_type="COMPLETE_TIME"
):
    """
    Phân tích dữ liệu TK & BT theo 2 chế độ:
    1. analysis_type == 'COMPLETE_TIME' (Theo thời gian hoàn tất):
       - Lọc theo ngày hoàn tất HĐ.
       - Triển khai: Cột I (Mốc hẹn L1 đỏ), Cột J (Mốc hẹn L1 xanh).
       - Bảo trì: Cột M (Mốc hẹn Xanh L1), Cột K (Mốc hẹn L1 - đỏ).
    2. analysis_type == 'APPOINTMENT' (Theo lịch hẹn):
       - Không quan tâm thời gian hoàn tất.
       - Triển khai:
         * Cột O: Mốc hẹn L2 xanh
         * Cột J: Mốc hẹn L1 xanh
         * Cột I: Mốc hẹn L1 đỏ
         * Nếu O có giá trị: lấy Cột O làm mốc thời gian (thuộc TK Xanh).
         * Nếu O trống: lấy Cột J (TK Xanh) và Cột I (TK Đỏ).
       - Bảo trì:
         * Cột Q: Mốc hẹn L2
         * Cột K: Mốc hẹn L1
         * Nếu Q có giá trị lấy Q, nếu Q trống lấy K làm mốc thời gian (thuộc BT Đỏ).
         * Mốc Xanh BT: Cột S (Mốc hẹn Xanh L2) nếu có, nếu không lấy Cột M (Mốc hẹn Xanh L1).
    """
    emp_map = emp_map or {}
    hr_map = hr_map or {}
    ns_by_block = ns_by_block or {}

    # Xác định khoảng ngày lọc
    date_filter_mode = "NONE"
    t_date_obj = parse_date_only(target_date) if target_date else None
    s_date_obj = parse_date_only(start_date) if start_date else None
    e_date_obj = parse_date_only(end_date) if end_date else None

    if t_date_obj:
        date_filter_mode = "EXACT"
    elif s_date_obj and e_date_obj:
        date_filter_mode = "RANGE"
    elif s_date_obj:
        date_filter_mode = "EXACT"
        t_date_obj = s_date_obj

    def is_date_matched(d_val):
        if date_filter_mode == "NONE":
            return True
        d_obj = parse_date_only(d_val)
        if not d_obj:
            return False
        if date_filter_mode == "EXACT":
            return d_obj == t_date_obj
        elif date_filter_mode == "RANGE":
            return s_date_obj <= d_obj <= e_date_obj
        return True

    # 1. Cột trong Data Triển Khai
    col_tk_l2_green = _find_column_name(tk_df, ['Mốc hẹn L2 xanh', 'Mốc hẹn L2 Xanh', 'TG hẹn L2 xanh', 'TG Hẹn L2 xanh'], default_idx=14)
    col_tk_red = _find_column_name(tk_df, ['Mốc hẹn L1 đỏ', 'Mốc hẹn L1 Đỏ', 'TG Hẹn đỏ', 'Mốc đỏ L1', 'TG hẹn L1 đỏ'], default_idx=8)
    col_tk_green = _find_column_name(tk_df, ['Mốc hẹn L1 xanh', 'Mốc hẹn L1 Xanh', 'TG Hẹn xanh', 'Mốc xanh L1', 'TG hẹn L1 xanh'], default_idx=9)
    col_tk_complete = _find_column_name(tk_df, ['date_complete', 'Ngày hoàn tất PTC', 'dt_complete', 'TG Hoàn Tất', 'Thời gian hoàn tất'], default_idx=16)
    col_tk_emp = _find_column_name(tk_df, ['Nhân viên', 'Nhân sự', 'Inside Account', 'KTV', 'Account hoàn tất'], default_idx=28)
    col_tk_hd = _find_column_name(tk_df, ['Số hợp đồng', 'Số HĐ', 'Số HD'], default_idx=0)
    col_tk_kh = _find_column_name(tk_df, ['Tên khách hàng', 'Tên KH', 'Khách hàng'], default_idx=1)
    col_tk_block = _find_column_name(tk_df, ['Block', 'Block nhân sự', 'Block quản lý'], default_idx=48)
    col_tk_loai = _find_column_name(tk_df, ['Loại giao dịch', 'Loại triển khai', 'Gói dịch vụ'], default_idx=25)

    # 2. Cột trong Data Bảo Trì
    col_bt_l2_red = _find_column_name(bt_df, ['Mốc hẹn L2', 'Mốc hẹn Đỏ L2', 'Mốc hẹn đỏ L2'], default_idx=16)
    col_bt_l1_red = _find_column_name(bt_df, ['Mốc hẹn L1', 'Mốc hẹn Đỏ L1', 'Mốc hẹn đỏ L1', 'Mốc đỏ L1'], default_idx=10)
    col_bt_l2_green = _find_column_name(bt_df, ['Mốc hẹn Xanh L2', 'Mốc hẹn xanh L2'], default_idx=18)
    col_bt_l1_green = _find_column_name(bt_df, ['Mốc hẹn Xanh L1', 'Mốc hẹn xanh L1', 'Mốc xanh L1'], default_idx=12)
    col_bt_complete = _find_column_name(bt_df, ['date_complete', 'TG Hoàn Tất', 'dt_complete', 'Thời gian hoàn tất', 'Ngày hoàn tất'], default_idx=5)
    col_bt_emp = _find_column_name(bt_df, ['Nhân viên', 'Nhân sự', 'Inside Account', 'KTV'], default_idx=3)
    col_bt_hd = _find_column_name(bt_df, ['Số HĐ', 'Số hợp đồng', 'Số HD'], default_idx=0)
    col_bt_kh = _find_column_name(bt_df, ['Tên Khách Hàng', 'Tên KH', 'Tên đầy đủ'], default_idx=1)
    col_bt_block = _find_column_name(bt_df, ['Block', 'Block quản lý'], default_idx=30)
    col_bt_loai = _find_column_name(bt_df, ['Loại checklist', 'Tình trạng', 'Nguyên nhân'], default_idx=26)

    emp_stats = {}
    detailed_records = []

    def get_or_create_emp(emp_code, block_fallback=''):
        key = str(emp_code).strip().upper()
        if not key or key in ('NAN', 'NONE', '-', 'NULL', 'KHÔNG XÁC ĐỊNH'):
            key = 'CHƯA PHÂN CÔNG'

        if key not in emp_stats:
            hr_info = emp_map.get(key, {}) or hr_map.get(key, {})
            name = hr_info.get('name') or hr_info.get('Họ Tên NV') or key
            block_name = hr_info.get('block') or block_fallback or '(Không xác định)'
            lead_name = (
                hr_info.get('team_lead') or 
                hr_info.get('truong') or 
                hr_info.get('lead') or 
                hr_info.get('Họ tên Đội trưởng') or 
                ns_by_block.get(block_name, {}).get('truong') or 
                '(Chưa rõ)'
            )
            ma_nv = hr_info.get('code') or hr_info.get('ma_nv') or hr_info.get('Mã NV') or ''

            emp_stats[key] = {
                "inside_account": key,
                "name": name,
                "ma_nv": ma_nv,
                "block": block_name,
                "doi_truong": lead_name,
                "total_all": 0,
                "total_tk": 0,
                "total_bt": 0,
                "total_tk_xanh": 0,
                "total_tk_do": 0,
                "total_bt_xanh": 0,
                "total_bt_do": 0,
                "milestones": {
                    m["id"]: {
                        "tk_xanh": 0,
                        "tk_do": 0,
                        "tk_tong": 0,
                        "bt_xanh": 0,
                        "bt_do": 0,
                        "bt_tong": 0,
                        "tong_moc": 0
                    }
                    for m in MILESTONES
                }
            }
        return emp_stats[key]

    is_appt_mode = (analysis_type == "APPOINTMENT")

    # =========================================================================
    # 1. DUYỆT DATA TRIỂN KHAI
    # =========================================================================
    if tk_df is not None and not tk_df.empty:
        for idx, r in tk_df.iterrows():
            emp_raw = str(r.get(col_tk_emp, '')).strip()
            block_raw = str(r.get(col_tk_block, '')).strip() if col_tk_block else ''
            so_hd = str(r.get(col_tk_hd, '')).strip() if col_tk_hd else f"TK_{idx}"
            ten_kh = str(r.get(col_tk_kh, '')).strip() if col_tk_kh else ''
            loai_gd = str(r.get(col_tk_loai, '')).strip() if col_tk_loai else 'Triển khai'
            dt_complete_str = str(r.get('dt_complete', r.get(col_tk_complete) or '')).strip()

            raw_red = r.get(col_tk_red) if col_tk_red else None
            raw_green = r.get(col_tk_green) if col_tk_green else None
            raw_l2_green = r.get(col_tk_l2_green) if col_tk_l2_green else None

            if is_appt_mode:
                # LOGIC THEO LỊCH HẸN:
                # Nếu O có giá trị -> lấy O làm mốc thời gian (TK Xanh)
                # Nếu O trống -> lấy Cột J (TK Xanh) và Cột I (TK Đỏ)
                has_o = bool(raw_l2_green and str(raw_l2_green).strip() not in ('nan', 'None', '', 'null'))
                if has_o:
                    if is_date_matched(raw_l2_green):
                        slot_o = parse_time_slot(raw_l2_green)
                        if slot_o:
                            emp_entry = get_or_create_emp(emp_raw, block_raw)
                            emp_entry["milestones"][slot_o]["tk_xanh"] += 1
                            emp_entry["milestones"][slot_o]["tk_tong"] += 1
                            emp_entry["milestones"][slot_o]["tong_moc"] += 1
                            emp_entry["total_tk_xanh"] += 1
                            emp_entry["total_tk"] += 1
                            emp_entry["total_all"] += 1

                            detailed_records.append({
                                "id": f"TK_{len(detailed_records) + 1}",
                                "type": "TK",
                                "type_label": "Triển Khai",
                                "so_hd": so_hd,
                                "ten_kh": ten_kh,
                                "loai_gd": loai_gd,
                                "nhan_vien": emp_entry["name"],
                                "inside_account": emp_entry["inside_account"],
                                "block": emp_entry["block"],
                                "doi_truong": emp_entry["doi_truong"],
                                "thoi_gian_hoan_tat": dt_complete_str,
                                "moc_hen_xanh": f"{str(raw_l2_green).strip()} (Cột O - L2 xanh)",
                                "moc_hen_do": "-",
                                "slot_xanh": slot_o,
                                "slot_do": "Không có"
                            })
                else:
                    # O trống: xét J (L1 xanh) và I (L1 đỏ)
                    matched_j = bool(raw_green and is_date_matched(raw_green))
                    matched_i = bool(raw_red and is_date_matched(raw_red))

                    if matched_j or matched_i:
                        emp_entry = get_or_create_emp(emp_raw, block_raw)
                        slot_j = parse_time_slot(raw_green) if matched_j else None
                        slot_i = parse_time_slot(raw_red) if matched_i else None

                        counted_tk = False
                        if slot_j:
                            emp_entry["milestones"][slot_j]["tk_xanh"] += 1
                            emp_entry["milestones"][slot_j]["tk_tong"] += 1
                            emp_entry["milestones"][slot_j]["tong_moc"] += 1
                            emp_entry["total_tk_xanh"] += 1
                            if not counted_tk:
                                emp_entry["total_tk"] += 1
                                emp_entry["total_all"] += 1
                                counted_tk = True

                        if slot_i:
                            emp_entry["milestones"][slot_i]["tk_do"] += 1
                            emp_entry["milestones"][slot_i]["tk_tong"] += 1
                            emp_entry["milestones"][slot_i]["tong_moc"] += 1
                            emp_entry["total_tk_do"] += 1
                            if not counted_tk:
                                emp_entry["total_tk"] += 1
                                emp_entry["total_all"] += 1
                                counted_tk = True

                        if slot_j or slot_i:
                            detailed_records.append({
                                "id": f"TK_{len(detailed_records) + 1}",
                                "type": "TK",
                                "type_label": "Triển Khai",
                                "so_hd": so_hd,
                                "ten_kh": ten_kh,
                                "loai_gd": loai_gd,
                                "nhan_vien": emp_entry["name"],
                                "inside_account": emp_entry["inside_account"],
                                "block": emp_entry["block"],
                                "doi_truong": emp_entry["doi_truong"],
                                "thoi_gian_hoan_tat": dt_complete_str,
                                "moc_hen_xanh": str(raw_green or '-').strip(),
                                "moc_hen_do": str(raw_red or '-').strip(),
                                "slot_xanh": slot_j or "Không có",
                                "slot_do": slot_i or "Không có"
                            })

            else:
                # LOGIC THEO THỜI GIAN HOÀN TẤT:
                complete_val = r.get(col_tk_complete) if col_tk_complete else None
                if 'date_complete' in tk_df.columns:
                    complete_val = r.get('date_complete')

                if not is_date_matched(complete_val):
                    continue

                emp_entry = get_or_create_emp(emp_raw, block_raw)
                slot_red = parse_time_slot(raw_red)
                slot_green = parse_time_slot(raw_green)

                emp_entry["total_all"] += 1
                emp_entry["total_tk"] += 1

                if slot_green:
                    emp_entry["milestones"][slot_green]["tk_xanh"] += 1
                    emp_entry["milestones"][slot_green]["tk_tong"] += 1
                    emp_entry["milestones"][slot_green]["tong_moc"] += 1
                    emp_entry["total_tk_xanh"] += 1

                if slot_red:
                    emp_entry["milestones"][slot_red]["tk_do"] += 1
                    emp_entry["milestones"][slot_red]["tk_tong"] += 1
                    emp_entry["milestones"][slot_red]["tong_moc"] += 1
                    emp_entry["total_tk_do"] += 1

                detailed_records.append({
                    "id": f"TK_{len(detailed_records) + 1}",
                    "type": "TK",
                    "type_label": "Triển Khai",
                    "so_hd": so_hd,
                    "ten_kh": ten_kh,
                    "loai_gd": loai_gd,
                    "nhan_vien": emp_entry["name"],
                    "inside_account": emp_entry["inside_account"],
                    "block": emp_entry["block"],
                    "doi_truong": emp_entry["doi_truong"],
                    "thoi_gian_hoan_tat": dt_complete_str,
                    "moc_hen_xanh": str(raw_green or '').strip(),
                    "moc_hen_do": str(raw_red or '').strip(),
                    "slot_xanh": slot_green or 'Không xác định',
                    "slot_do": slot_red or 'Không xác định'
                })

    # =========================================================================
    # 2. DUYỆT DATA BẢO TRÌ
    # =========================================================================
    if bt_df is not None and not bt_df.empty:
        for idx, r in bt_df.iterrows():
            emp_raw = str(r.get(col_bt_emp, '')).strip()
            block_raw = str(r.get(col_bt_block, '')).strip() if col_bt_block else ''
            so_hd = str(r.get(col_bt_hd, '')).strip() if col_bt_hd else f"BT_{idx}"
            ten_kh = str(r.get(col_bt_kh, '')).strip() if col_bt_kh else ''
            loai_gd = str(r.get(col_bt_loai, '')).strip() if col_bt_loai else 'Sự cố bảo trì'
            dt_complete_str = str(r.get('dt_complete', r.get(col_bt_complete) or '')).strip()

            raw_l1_red = r.get(col_bt_l1_red) if col_bt_l1_red else None
            raw_l2_red = r.get(col_bt_l2_red) if col_bt_l2_red else None
            raw_l1_green = r.get(col_bt_l1_green) if col_bt_l1_green else None
            raw_l2_green = r.get(col_bt_l2_green) if col_bt_l2_green else None

            if is_appt_mode:
                # LOGIC THEO LỊCH HẸN BẢO TRÌ:
                # Cột K là mốc hẹn lần 1, Cột Q là mốc hẹn lần 2
                # Nếu Q trống lấy K, nếu Q có giá trị lấy Q làm giá trị mốc thời gian
                has_q = bool(raw_l2_red and str(raw_l2_red).strip() not in ('nan', 'None', '', 'null'))
                effective_val = raw_l2_red if has_q else raw_l1_red

                if effective_val and is_date_matched(effective_val):
                    slot = parse_time_slot(effective_val)
                    if slot:
                        emp_entry = get_or_create_emp(emp_raw, block_raw)
                        emp_entry["milestones"][slot]["bt_do"] += 1
                        emp_entry["milestones"][slot]["bt_tong"] += 1
                        emp_entry["milestones"][slot]["tong_moc"] += 1
                        emp_entry["total_bt_do"] += 1
                        emp_entry["total_bt"] += 1
                        emp_entry["total_all"] += 1

                        detailed_records.append({
                            "id": f"BT_{len(detailed_records) + 1}",
                            "type": "BT",
                            "type_label": "Bảo Trì",
                            "so_hd": so_hd,
                            "ten_kh": ten_kh,
                            "loai_gd": loai_gd,
                            "nhan_vien": emp_entry["name"],
                            "inside_account": emp_entry["inside_account"],
                            "block": emp_entry["block"],
                            "doi_truong": emp_entry["doi_truong"],
                            "thoi_gian_hoan_tat": dt_complete_str,
                            "moc_hen_xanh": "-",
                            "moc_hen_do": f"{str(effective_val).strip()} ({'Cột Q - L2' if has_q else 'Cột K - L1'})",
                            "slot_xanh": "-",
                            "slot_do": slot
                        })

            else:
                # LOGIC THEO THỜI GIAN HOÀN TẤT:
                complete_val = r.get(col_bt_complete) if col_bt_complete else None
                if 'date_complete' in bt_df.columns:
                    complete_val = r.get('date_complete')

                if not is_date_matched(complete_val):
                    continue

                emp_entry = get_or_create_emp(emp_raw, block_raw)
                slot_green = parse_time_slot(raw_l1_green)
                slot_red = parse_time_slot(raw_l1_red)

                emp_entry["total_all"] += 1
                emp_entry["total_bt"] += 1

                if slot_green:
                    emp_entry["milestones"][slot_green]["bt_xanh"] += 1
                    emp_entry["milestones"][slot_green]["bt_tong"] += 1
                    emp_entry["milestones"][slot_green]["tong_moc"] += 1
                    emp_entry["total_bt_xanh"] += 1

                if slot_red:
                    emp_entry["milestones"][slot_red]["bt_do"] += 1
                    emp_entry["milestones"][slot_red]["bt_tong"] += 1
                    emp_entry["milestones"][slot_red]["tong_moc"] += 1
                    emp_entry["total_bt_do"] += 1

                detailed_records.append({
                    "id": f"BT_{len(detailed_records) + 1}",
                    "type": "BT",
                    "type_label": "Bảo Trì",
                    "so_hd": so_hd,
                    "ten_kh": ten_kh,
                    "loai_gd": loai_gd,
                    "nhan_vien": emp_entry["name"],
                    "inside_account": emp_entry["inside_account"],
                    "block": emp_entry["block"],
                    "doi_truong": emp_entry["doi_truong"],
                    "thoi_gian_hoan_tat": dt_complete_str,
                    "moc_hen_xanh": str(raw_l1_green or '').strip(),
                    "moc_hen_do": str(raw_l1_red or '').strip(),
                    "slot_xanh": slot_green or 'Không xác định',
                    "slot_do": slot_red or 'Không xác định'
                })

    # Lọc theo Đội trưởng, Block, Tìm kiếm (với chuẩn hóa tiếng Việt không dấu)
    filtered_list = list(emp_stats.values())
    if team_lead and isinstance(team_lead, str) and team_lead != '__ALL__':
        tl_norm = remove_accents(team_lead)
        filtered_list = [e for e in filtered_list if tl_norm in remove_accents(e.get('doi_truong', ''))]

    if block and isinstance(block, str) and block != '__ALL__':
        blk_norm = remove_accents(block)
        filtered_list = [e for e in filtered_list if blk_norm in remove_accents(e.get('block', ''))]

    if search and isinstance(search, str) and search.strip():
        q_norm = remove_accents(search)
        filtered_list = [
            e for e in filtered_list
            if q_norm in remove_accents(e.get('inside_account', ''))
            or q_norm in remove_accents(e.get('name', ''))
            or q_norm in remove_accents(e.get('ma_nv', ''))
            or q_norm in remove_accents(e.get('block', ''))
            or q_norm in remove_accents(e.get('doi_truong', ''))
        ]

    # Sắp xếp danh sách nhân viên theo tổng ca giảm dần
    filtered_list.sort(key=lambda x: x['total_all'], reverse=True)

    # Tính tổng hợp toàn công ty / toàn bộ lọc (Summary Totals)
    overall_total_all = sum(e['total_all'] for e in filtered_list)
    overall_total_tk = sum(e['total_tk'] for e in filtered_list)
    overall_total_bt = sum(e['total_bt'] for e in filtered_list)
    overall_tk_xanh = sum(e['total_tk_xanh'] for e in filtered_list)
    overall_tk_do = sum(e['total_tk_do'] for e in filtered_list)
    overall_bt_xanh = sum(e['total_bt_xanh'] for e in filtered_list)
    overall_bt_do = sum(e['total_bt_do'] for e in filtered_list)

    # Tổng từng mốc giờ
    milestone_summary = {}
    peak_count = -1
    peak_milestone = None

    for m in MILESTONES:
        mid = m["id"]
        m_tk_xanh = sum(e['milestones'][mid]['tk_xanh'] for e in filtered_list)
        m_tk_do = sum(e['milestones'][mid]['tk_do'] for e in filtered_list)
        m_tk_tong = m_tk_xanh + m_tk_do
        m_bt_xanh = sum(e['milestones'][mid]['bt_xanh'] for e in filtered_list)
        m_bt_do = sum(e['milestones'][mid]['bt_do'] for e in filtered_list)
        m_bt_tong = m_bt_xanh + m_bt_do
        m_total = m_tk_tong + m_bt_tong

        if m_total > peak_count:
            peak_count = m_total
            peak_milestone = mid

        milestone_summary[mid] = {
            "id": mid,
            "label": m["label"],
            "tk_xanh": m_tk_xanh,
            "tk_do": m_tk_do,
            "tk_tong": m_tk_tong,
            "bt_xanh": m_bt_xanh,
            "bt_do": m_bt_do,
            "bt_tong": m_bt_tong,
            "tong_moc": m_total
        }

    selected_date_display = t_date_obj.strftime('%d/%m/%Y') if t_date_obj else (
        f"{s_date_obj.strftime('%d/%m/%Y')} -> {e_date_obj.strftime('%d/%m/%Y')}" if s_date_obj and e_date_obj else "Tất cả các ngày"
    )

    # Danh sách tất cả Đội Trưởng và Block khả dụng
    unique_team_leads = sorted(list(set(
        [e['doi_truong'] for e in emp_stats.values() if e.get('doi_truong') and e['doi_truong'] not in ('(Chưa rõ)', 'Chưa xác nhận')] +
        (all_team_leads or [])
    )))
    unique_blocks = sorted(list(set(
        [e['block'] for e in emp_stats.values() if e.get('block') and e['block'] != '(Không xác định)'] +
        (all_blocks or [])
    )))

    return {
        "ok": True,
        "analysis_type": analysis_type,
        "selected_date": t_date_obj.strftime('%Y-%m-%d') if t_date_obj else None,
        "selected_date_display": selected_date_display,
        "filter_mode": date_filter_mode,
        "milestones": MILESTONES,
        "all_team_leads": unique_team_leads,
        "all_blocks": unique_blocks,
        "metrics": {
            "total_all": overall_total_all,
            "total_tk": overall_total_tk,
            "total_bt": overall_total_bt,
            "total_tk_xanh": overall_tk_xanh,
            "total_tk_do": overall_tk_do,
            "total_bt_xanh": overall_bt_xanh,
            "total_bt_do": overall_bt_do,
            "active_employees": len(filtered_list),
            "peak_milestone": peak_milestone,
            "peak_count": peak_count if peak_count > 0 else 0
        },
        "milestone_summary": milestone_summary,
        "employees": filtered_list,
        "records_count": len(detailed_records),
        "detailed_records": detailed_records[:2500]
    }


def get_phan_tich_moc_gio_report(
    engine,
    target_date=None,
    start_date=None,
    end_date=None,
    team_lead=None,
    block=None,
    search=None,
    analysis_type="COMPLETE_TIME"
):
    """Báo cáo phân tích mốc giờ sử dụng dữ liệu có sẵn từ KPIEngine."""
    if not engine.team_leads:
        engine._ensure_kpi_datasets_loaded()

    tk_df = getattr(engine, 'tk_df', pd.DataFrame())
    bt_df = getattr(engine, 'bt_df', pd.DataFrame())
    emp_map = getattr(engine, 'emp_map', {})
    
    ns_by_block, hr_map = {}, {}
    try:
        ns_by_block, hr_map = engine._get_nhan_su_by_block()
    except Exception:
        pass

    return analyze_moc_gio_data(
        tk_df=tk_df,
        bt_df=bt_df,
        emp_map=emp_map,
        hr_map=hr_map,
        ns_by_block=ns_by_block,
        all_team_leads=engine.team_leads,
        all_blocks=engine.blocks,
        target_date=target_date,
        start_date=start_date,
        end_date=end_date,
        team_lead=team_lead,
        block=block,
        search=search,
        analysis_type=analysis_type
    )


def analyze_uploaded_moc_gio_files(
    engine,
    tk_file_bytes=None,
    tk_filename=None,
    bt_file_bytes=None,
    bt_filename=None,
    target_date=None,
    start_date=None,
    end_date=None,
    team_lead=None,
    block=None,
    search=None,
    analysis_type="COMPLETE_TIME"
):
    """Phân tích mốc giờ từ các file Excel/CSV do người dùng tải lên."""
    emp_map = getattr(engine, 'emp_map', {})
    ns_by_block, hr_map = {}, {}
    try:
        ns_by_block, hr_map = engine._get_nhan_su_by_block()
    except Exception:
        pass

    tk_df = pd.DataFrame()
    bt_df = pd.DataFrame()

    if tk_file_bytes and tk_filename:
        tk_df = read_uploaded_file(tk_file_bytes, tk_filename)

    if bt_file_bytes and bt_filename:
        bt_df = read_uploaded_file(bt_file_bytes, bt_filename)

    return analyze_moc_gio_data(
        tk_df=tk_df,
        bt_df=bt_df,
        emp_map=emp_map,
        hr_map=hr_map,
        ns_by_block=ns_by_block,
        all_team_leads=engine.team_leads,
        all_blocks=engine.blocks,
        target_date=target_date,
        start_date=start_date,
        end_date=end_date,
        team_lead=team_lead,
        block=block,
        search=search,
        analysis_type=analysis_type
    )
