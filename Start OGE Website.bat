@echo off
title Office of Global Engagement - local website
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies (first run only)...
  call npm install --no-audit --no-fund
)
echo.
echo Starting the OGE website at http://localhost:8080  (press Ctrl+C to stop)
echo.
start "" http://localhost:8080/
call npm start
