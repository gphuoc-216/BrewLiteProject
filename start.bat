@echo off
title BrewLite - 1-Click Launcher
color 0A
cd /d "%~dp0"

echo ==================================================================
echo         HE THONG DAT CA PHE BREWLITE - AUTO LAUNCHER
echo ==================================================================
echo.

:: 1. Kiem tra file cau hinh .env
if not exist "backend\.env" (
    echo [Cau hinh] Tao backend\.env tu backend\.env.example...
    copy "backend\.env.example" "backend\.env" >nul
)
if not exist "frontend\.env.local" (
    echo [Cau hinh] Tao frontend\.env.local tu frontend\.env.example...
    copy "frontend\.env.example" "frontend\.env.local" >nul
)

:: 2. Tu dong lay IP mang LAN (Wi-Fi / Ethernet)
set "IP="
for /f "tokens=4" %%a in ('route print 0.0.0.0 ^| findstr " 0.0.0.0 "') do (
    if not defined IP set "IP=%%a"
)
if not defined IP (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Address"') do (
        if not defined IP set "IP=%%a"
    )
    if defined IP set IP=%IP: =%
)

:: 3. Kiem tra Docker Desktop & PostgreSQL
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [Docker] Dam bao PostgreSQL container dang chay...
    docker compose up -d postgres >nul 2>&1
) else (
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (
        echo [Docker] Dang khoi dong Docker Desktop de chay CSDL PostgreSQL...
        start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
    )
)

echo [1/3] Khoi dong Backend (Prisma + Seed + NestJS)...
start "BrewLite - Backend API" cmd /k "call scripts\start-backend.bat"

echo [2/3] Khoi dong Frontend (Next.js)...
start "BrewLite - Frontend Web" cmd /k "call scripts\start-frontend.bat"

echo [3/3] Khoi dong HTTPS Reverse Proxy (Camera Mobile)...
start "BrewLite - HTTPS Proxy" cmd /k "call scripts\start-proxy.bat"

echo.
echo ==================================================================
echo TAT CA DICH VU DANG DUOC KHOI DONG TRONG CAC CUA SO MOI!
echo ==================================================================
echo.
echo [DANH SACH LINK TRUY CAP]:
echo ------------------------------------------------------------------
echo 1. Khach hang / Trang chu  : http://localhost:3000
echo 2. Tai lieu Backend API    : http://localhost:3001/api/docs
echo 3. Bang Kanban Barista     : http://localhost:3000/staff
echo 4. Dashboard Quan Tri      : http://localhost:3000/admin
echo.
echo [LINK QUET MA QR BANG CAMERA DIEN THOAI (CUNG MANG WI-FI)]:
if defined IP (
    echo    =^> https://%IP%:3443/mbbank
) else (
    echo    =^> https://localhost:3443/mbbank
)
echo.
echo [TAI KHOAN TEST HE THONG - MAT KHAU CHUNG: 123456]:
echo  - Quan tri vien (Admin)   : admin
echo  - Nhan vien (Staff)       : barista1
echo  - Khach hang (Customer)   : customer1
echo ------------------------------------------------------------------
echo Chuc nhom demo do an thanh cong ruc ro!
echo.
pause
