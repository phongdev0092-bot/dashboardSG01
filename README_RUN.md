# HƯỚNG DẪN CHẠY LOCAL UNG DỤNG TOOL KPI

Đã tạo sẵn các file Batch (`.bat`) giúp bạn khởi động ứng dụng chạy local chỉ với **1 cú click chuột**.

---

## 🚀 Cách 1: Chạy Chế Độ Development (Khuyên dùng khi Dev)
**File batch:** [`run_local.bat`](file:///d:/Tool%20KPI/run_local.bat)

- **Tác dụng:** Tự động mở 2 cửa sổ terminal riêng cho **Backend (FastAPI)** và **Frontend (Vite Dev Server)**.
- **Tự động mở trình duyệt tại:** `http://localhost:3000`
- **Đặc điểm:** Hỗ trợ Hot-Reload (sửa code frontend/backend tự cập nhật ngay).

👉 **Cách chạy:** Nhấp chuột đôi vào file `run_local.bat` trong thư mục dự án.

---

## ⚡ Cách 2: Chạy Chế Độ Standalone Single-Port (Khuyên dùng khi chạy cho User/Demo)
**File batch:** [`run_standalone.bat`](file:///d:/Tool%20KPI/run_standalone.bat)

- **Tác dụng:** Tự động Build Frontend sang bản tĩnh (`dist`) và chỉ chạy 1 Server FastAPI duy nhất phục vụ cả API và Web App.
- **Tự động mở trình duyệt tại:** `http://localhost:8000`
- **Đặc điểm:** Gọn nhẹ, chỉ sử dụng 1 cổng duy nhất `8000`.

👉 **Cách chạy:** Nhấp chuột đôi vào file `run_standalone.bat` trong thư mục dự án.

---

## 🛠️ Cấu trúc thư mục Batch:
- [`run_local.bat`](file:///d:/Tool%20KPI/run_local.bat) -> Khởi động Backend (8000) & Frontend Dev (3000).
- [`run_standalone.bat`](file:///d:/Tool%20KPI/run_standalone.bat) -> Build & Khởi động Single Server (8000).
- [`backend/requirements.txt`](file:///d:/Tool%20KPI/backend/requirements.txt) -> Khai báo thư viện Python Backend.
