@echo off
chcp 65001 >nul
title Tool KPI - Run Local

echo ========================================================
echo               TOOL KPI - RUN LOCAL (DEV MODE)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/3] KIEM TRA DEPS & MODULES...
if not exist "%ROOT_DIR%frontend\node_modules\" (
    echo [THONG BAO] Chua co node_modules, dang cai dat frontend packages...
    cd /d "%ROOT_DIR%frontend"
    call npm install
    if errorlevel 1 (
        echo [LOI] PM Install loi! Vui long kiem tra.
        pause
        exit /b 1
    )
)

echo.
echo [2/3] DANG KHOI DONG BACKEND VA FRONTEND...
echo  - Backend API:  http://localhost:8000
echo  - Frontend App: http://localhost:3000
echo.

REM Start Backend FastAPI
start "Tool KPI - Backend Server (Port 8000)" cmd /k "cd /d "%ROOT_DIR%backend" && python main.py"

REM Start Frontend Vite
start "Tool KPI - Frontend Server (Port 3000)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo [3/3] MO TRUY CAP TRANH DANG CHUONG TRINH TRONGBROWSER...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo [HOAN THANH] Da khoi dong xong ca Backend va Frontend!
echo Cua so terminal Backend & Frontend dang chay song song.
echo ========================================================
echo.
pause
