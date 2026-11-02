@echo off
title BrewLite - Frontend Web
color 0D
cd /d "%~dp0\..\frontend"

echo ==================================================================
echo [Frontend] HE THONG DANG CHAY FRONTEND WEB (Next.js)
echo ==================================================================
echo.

if not exist "node_modules\.bin\next.cmd" (
    echo [Frontend] Phat hien chua cai du thu vien, dang chay npm install...
    call npm install
    if errorlevel 1 (
        echo [Frontend] Loi khi chay npm install!
        pause
        exit /b %errorlevel%
    )
) else (
    echo [Frontend] Thu vien frontend da san sang.
)

echo [Frontend] Dang khoi dong Next.js Server tai http://localhost:3000 ...
call npm run dev
