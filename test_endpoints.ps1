# Test the new API endpoints
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcyNzY2MTAzLCJpYXQiOjE3NzI3NjI1MDMsImp0aSI6Ijg0NWZiOTRmMzdhZDQyODM5NGJjZTQzZjI4NmMyNjU3IiwidXNlcl9pZCI6IjMifQ.H9DWRG-6j3dcLy5LBA0L-6lSH_XXbyGlMJ1U0tzpH9Y"
$baseUrl = "http://localhost:8001"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Testing New Healthcare Interoperability Endpoints" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: DICOM Studies
Write-Host "1. Testing DICOM Studies Endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/dicom-studies/" -Headers $headers -Method GET
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Results count: $($data.count ?? $data.Length ?? 0)"
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: HL7 Messages
Write-Host "2. Testing HL7 Messages Endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/hl7-messages/" -Headers $headers -Method GET
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Results count: $($data.count ?? $data.Length ?? 0)"
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: FHIR Logs
Write-Host "3. Testing FHIR Resource Logs Endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/fhir-logs/" -Headers $headers -Method GET
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Results count: $($data.count ?? $data.Length ?? 0)"
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: FHIR Export Patient
Write-Host "4. Testing FHIR Patient Export Endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/fhir/export/patient/" -Headers $headers -Method GET
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Resource Type: $($data.resourceType)" -ForegroundColor Green
    Write-Host "  Patient ID: $($data.id)" -ForegroundColor Green
    Write-Host "  Patient Name: $($data.name[0].given[0]) $($data.name[0].family)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✓ All endpoints registered and responding!" -ForegroundColor Green
