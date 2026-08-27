# PowerShell Automation script to start all Ozack services
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting Ozack App (Chat & Dispatch Services)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Launching Chat Backend..." -ForegroundColor Magenta
Start-Process cmd -ArgumentList "/k ""cd /d `"$ScriptDir\Chat\backend`" && npm run dev"""

Write-Host "Launching Chat Frontend..." -ForegroundColor Blue
Start-Process cmd -ArgumentList "/k ""cd /d `"$ScriptDir\Chat\frontend`" && npm run dev"""

Write-Host "Launching Dispatch Backend..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k ""cd /d `"$ScriptDir\Dispatch\backend`" && npm run dev"""

Write-Host "Launching Dispatch Frontend..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k ""cd /d `"$ScriptDir\Dispatch\frontend`" && npm run dev"""

Write-Host ""
Write-Host "All 4 services launched successfully in separate windows!" -ForegroundColor Green
