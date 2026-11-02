@echo off
title BrewLite - HTTPS Proxy
color 0E
cd /d "%~dp0\.."

echo ==================================================================
echo [Proxy] HE THONG DANG CHAY HTTPS REVERSE PROXY (Port 3443)
echo ==================================================================
echo.

node https-proxy.js
