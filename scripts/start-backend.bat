@echo off
title BrewLite - Backend API
color 0B
cd /d "%~dp0\..\backend"

echo ==================================================================
echo [Backend] HE THONG DANG CHAY BACKEND API (NestJS + Prisma)
echo ==================================================================
echo.

if not exist "node_modules\.bin\nest.cmd" (
    echo [Backend] Phat hien chua cai du thu vien, dang chay npm install...
    call npm install
    if errorlevel 1 (
        echo [Backend] Loi khi chay npm install!
        pause
        exit /b %errorlevel%
    )
) else (
    echo [Backend] Thu vien backend da san sang.
)

echo [Prisma] Dang kiem tra ket noi Database localhost:5432 ...
set "DB_OK=0"
for /L %%i in (1,1,5) do (
    powershell -NoProfile -Command "$c = New-Object System.Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', 5432); exit 0 } catch { exit 1 }" >nul 2>&1
    if errorlevel 1 (
        timeout /t 1 >nul
    ) else (
        set "DB_OK=1"
        goto :db_ready
    )
)

:db_ready
if "%DB_OK%"=="1" (
    echo [Prisma] Ket noi Database thanh cong! Cap nhat schema va nap seed...
    call npx prisma generate
    call npx prisma migrate deploy
    call npm run seed
) else (
    echo [Prisma] LUU Y: Chua thay PostgreSQL chay tai port 5432.
    echo          (Neu can dung Database, hay dam bao Docker Desktop dang chay!)
    call npx prisma generate
)

echo.
echo [Backend] Dang khoi dong NestJS API tai http://localhost:3001 ...
call npm run start:dev
