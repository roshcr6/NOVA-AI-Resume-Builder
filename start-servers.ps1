# NOVA Development Servers Launcher
# This script starts both backend and frontend servers in separate PowerShell windows

Write-Host "🚀 Starting NOVA Development Servers..." -ForegroundColor Cyan

# Start Backend Server
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

# Wait a moment before starting frontend
Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "Starting Frontend Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`n✅ Both servers are starting in separate windows!" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nPress any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
