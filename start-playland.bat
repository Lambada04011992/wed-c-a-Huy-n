@echo off
chcp 65001 >nul
title Kawaii English 5 Playland - Launcher
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Dang khoi dong AI Proxy Server tai http://localhost:3001 ...
  start "" "http://localhost:3001"
  node ai-proxy-server.mjs
) else (
  echo [Thong bao] May chua cai Node.js. Dang mo truc tiep index.html ...
  echo De bat Chat AI Mun va AI Tao Game bao mat, hay cai Node.js (>=18) tu https://nodejs.org
  start "" "%~dp0index.html"
  pause
)
