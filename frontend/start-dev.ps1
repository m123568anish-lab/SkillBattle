$ErrorActionPreference = 'Stop'

$frontendDir = (Resolve-Path $PSScriptRoot).Path
$backendDir = (Resolve-Path (Join-Path $frontendDir '..\backend')).Path
$frontendUrl = 'http://127.0.0.1:3000/'

if (-not (Test-Path (Join-Path $frontendDir 'package.json'))) {
    throw 'Frontend directory not found.'
}

if (-not (Test-Path (Join-Path $backendDir 'app'))) {
    throw 'Backend directory not found.'
}

Get-WmiObject Win32_Process |
    Where-Object {
        $_.CommandLine -match 'D:\\BattleAI\\frontend' -and
        ($_.CommandLine -match 'next.*(dev|start)' -or $_.CommandLine -match 'npm.*(run.*dev|run.*start)')
    } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

Write-Host 'Starting frontend...'
Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile','-Command',"Set-Location -LiteralPath '$frontendDir'; npm run dev" -WindowStyle Minimized

Write-Host 'Starting backend...'
Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile','-Command',"Set-Location -LiteralPath '$backendDir'; .\\.venv\\Scripts\\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized

Write-Host 'Both services are starting.'
Write-Host "Frontend: $frontendUrl"
Write-Host 'Backend: http://127.0.0.1:8000/docs'
