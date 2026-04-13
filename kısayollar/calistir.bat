@echo off
setlocal
cd /d "%~dp0.."

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$repo = (Get-Location).Path; $pidFile = Join-Path $repo '.next-dev.pid';" ^
  "if (Test-Path $pidFile) { $existingPid = (Get-Content $pidFile -Raw).Trim(); if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) { Write-Host ('Dev server zaten acik: http://localhost:3000 (PID ' + $existingPid + ')'); exit 0 } else { Remove-Item $pidFile -ErrorAction SilentlyContinue } }" ^
  "$busy = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($busy) { Write-Host ('Port 3000 baska bir surec tarafindan kullaniliyor. Once onu kapat, sonra tekrar dene. PID ' + $busy.OwningProcess); exit 1 }" ^
  "$launcher = Join-Path $repo '_dev-server.bat'; $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', $launcher -WorkingDirectory $repo -PassThru;" ^
  "Set-Content -Path $pidFile -Value $proc.Id;" ^
  "$deadline = (Get-Date).AddSeconds(45); $ready = $false; do { Start-Sleep -Milliseconds 500; $ready = [bool](Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1) } while (-not $ready -and (Get-Date) -lt $deadline);" ^
  "if ($ready) { Write-Host ('Dev server hazir: http://localhost:3000 (PID ' + $proc.Id + ')') } else { Write-Host ('Dev server penceresi acildi. Hazir olmasi biraz zaman alabilir. PID ' + $proc.Id) }"

endlocal
