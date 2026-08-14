$api = "http://localhost:8000/api/v1"
Write-Host "Checking $api/health..."
try {
    $r = Invoke-WebRequest -UseBasicParsing "$api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "HEALTH:" $r.StatusCode
} catch {
    Write-Host "HEALTH check failed:" $_.Exception.Message
}

Write-Host "Checking http://localhost:8000/docs..."
try {
    $r = Invoke-WebRequest -UseBasicParsing "http://localhost:8000/docs" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "DOCS:" $r.StatusCode
} catch {
    Write-Host "DOCS check failed:" $_.Exception.Message
}

Write-Host "Done."