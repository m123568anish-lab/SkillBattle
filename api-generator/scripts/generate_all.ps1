Write-Host "Generating Python SDK..."
.\generate_python.ps1

Write-Host "Generating TypeScript SDK..."
.\generate_typescript.ps1

Write-Host "Generating Java SDK..."
.\generate_java.ps1

Write-Host ""
Write-Host "All SDKs generated successfully."