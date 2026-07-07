$ErrorActionPreference = 'Stop'

$frontendDir = Join-Path $PSScriptRoot 'frontend'
$backendDir = Join-Path $PSScriptRoot 'backend'

if (-not (Test-Path (Join-Path $frontendDir 'package.json'))) {
    throw 'Frontend directory not found.'
}

if (-not (Test-Path (Join-Path $backendDir 'app'))) {
    throw 'Backend directory not found.'
}

Write-Host 'Starting frontend...'
Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile','-Command',"Set-Location -LiteralPath '$frontendDir'; npm run dev" -WindowStyle Minimized

Write-Host 'Starting backend...'
Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile','-Command',"Set-Location -LiteralPath '$backendDir'; .\\.venv\\Scripts\\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized

Write-Host 'Both services are starting.'
Write-Host 'Frontend: http://127.0.0.1:3000'
Write-Host 'Backend: http://127.0.0.1:8000/docs'
