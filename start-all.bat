@echo off
title Ozack Development Launcher
echo ===================================================
echo   Starting Ozack App (Chat & Dispatch Services)
echo ===================================================
echo.
echo Launching Chat Backend...
start "Chat Backend (Port 5000)" cmd /k "cd /d "%~dp0Chat\backend" && npm run dev"

echo Launching Chat Frontend...
start "Chat Frontend" cmd /k "cd /d "%~dp0Chat\frontend" && npm run dev"

echo Launching Dispatch Backend...
start "Dispatch Backend" cmd /k "cd /d "%~dp0Dispatch\backend" && npm run dev"

echo Launching Dispatch Frontend...
start "Dispatch Frontend" cmd /k "cd /d "%~dp0Dispatch\frontend" && npm run dev"

echo.
echo All 4 services have been launched in separate terminal windows!
