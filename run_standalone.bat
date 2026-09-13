@echo off
chcp 65001 >nul
title Tool KPI - Single Port Standalone (Port 8000)

echo ========================================================
echo          TOOL KPI - RUN STANDALONE (PORT 8000)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/3] BUILD FRONTEND STATIC ASSETS...
cd /d "%ROOT_DIR%frontend"
if not exist "node_modules\" (
    echo Cai dat node_modules...
    call npm install
)
call npm run build

echo.
echo [2/3] KHOI DONG ULTRA-FAST FASTAPI BACKEND & FRONTEND SERVING...
cd /d "%ROOT_DIR%backend"
start "Tool KPI - Standalone Server (Port 8000)" cmd /k "cd /d "%ROOT_DIR%backend" && python main.py"

echo.
echo [3/3] DANG MO TRUY CAP APPS TRANH TRONG BROWSER...
timeout /t 3 /nobreak >nul
start http://localhost:8000

echo.
echo ========================================================
echo [HOAN THANH] Da mo ung dung tai http://localhost:8000
echo ========================================================
echo.
pause
