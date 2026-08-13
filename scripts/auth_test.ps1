$api='http://localhost:8000/api/v1'
$email='ci_test_user@example.com'
$pwd='TestPass123!'
$payload = @{username=$email.Split('@')[0]; full_name='CI Test'; email=$email; password=$pwd}
Write-Host "Registering: $email"
try{
    $reg = Invoke-RestMethod -Method Post -Uri ($api + '/auth/register') -Body ($payload | ConvertTo-Json) -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Register success:" ($reg | ConvertTo-Json -Compress)
} catch {
    Write-Host "Register failed:" $_.Exception.Message
}

Write-Host "Logging in: $email"
$loginPayload = @{email=$email; password=$pwd}
try{
    $login = Invoke-RestMethod -Method Post -Uri ($api + '/auth/login') -Body ($loginPayload | ConvertTo-Json) -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Login success:" ($login | ConvertTo-Json -Compress)
} catch {
    Write-Host "Login failed:" $_.Exception.Message
}
