@echo off
setlocal
cd /d "%~dp0.."

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$repo = (Get-Location).Path; $pidFile = Join-Path $repo '.next-dev.pid';" ^
  "if (-not (Test-Path $pidFile)) { Write-Host 'Kayitli calisan dev server bulunamadi.'; exit 0 }" ^
  "$existingPid = (Get-Content $pidFile -Raw).Trim(); $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue;" ^
  "if ($proc) { cmd /c ('taskkill /PID ' + $existingPid + ' /T /F >nul 2>&1'); Write-Host ('Dev server durduruldu. PID ' + $existingPid) } else { Write-Host 'Kayitli surec zaten kapaliydi.' }" ^
  "Remove-Item $pidFile -ErrorAction SilentlyContinue"

endlocal
