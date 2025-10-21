# VaultPilot Feature Test Script
# Run this to verify all features are working

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VaultPilot - Feature Test Suite" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$API_ENDPOINT = "https://t9abv3wghl.execute-api.us-east-1.amazonaws.com"
$tests = @()
$ProgressPreference = 'SilentlyContinue'

# Test 1: Rotation API
Write-Host "Testing Rotation API..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$API_ENDPOINT/rotation/test-smtp-001" -Method POST -ErrorAction Stop
    if ($result.result.success) {
        Write-Host "  ✅ Rotation API - Working!" -ForegroundColor Green
        $tests += @{Name="Rotation"; Status="✅ Pass"}
    } else {
        Write-Host "  ⚠ Rotation API - Unexpected response" -ForegroundColor Yellow
        $tests += @{Name="Rotation"; Status="⚠ Warning"}
    }
} catch {
    Write-Host "  ❌ Rotation API - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $tests += @{Name="Rotation"; Status="❌ Fail"}
}

# Test 2: Accounts API
Write-Host "`nTesting Accounts API..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$API_ENDPOINT/accounts" -ErrorAction Stop
    if ($result.count -ge 2) {
        Write-Host "  ✅ Accounts API - Found $($result.count) accounts" -ForegroundColor Green
        $tests += @{Name="Accounts"; Status="✅ Pass"}
    } else {
        Write-Host "  ⚠ Accounts API - Only $($result.count) account(s)" -ForegroundColor Yellow
        $tests += @{Name="Accounts"; Status="⚠ Warning"}
    }
} catch {
    Write-Host "  ❌ Accounts API - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $tests += @{Name="Accounts"; Status="❌ Fail"}
}

# Test 3: Audit Logs API
Write-Host "`nTesting Audit Logs API..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$API_ENDPOINT/audit" -ErrorAction Stop
    $latestLog = $result.logs | Select-Object -First 1
    $logTime = [DateTime]::Parse($latestLog.timestamp)
    $minutesAgo = ((Get-Date) - $logTime).TotalMinutes
    
    if ($minutesAgo -lt 60) {
        Write-Host "  ✅ Audit Logs API - Latest: $($latestLog.action) ($([int]$minutesAgo) min ago)" -ForegroundColor Green
        $tests += @{Name="Audit Logs"; Status="✅ Pass"}
    } else {
        Write-Host "  ⚠ Audit Logs API - Latest log is $([int]$minutesAgo) minutes old" -ForegroundColor Yellow
        $tests += @{Name="Audit Logs"; Status="⚠ Warning"}
    }
} catch {
    Write-Host "  ❌ Audit Logs API - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $tests += @{Name="Audit Logs"; Status="❌ Fail"}
}

# Test 4: Credentials API
Write-Host "`nTesting Credentials API..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$API_ENDPOINT/credentials" -ErrorAction Stop
    Write-Host "  ✅ Credentials API - Found $($result.credentials.Count) credentials" -ForegroundColor Green
    $tests += @{Name="Credentials"; Status="✅ Pass"}
} catch {
    Write-Host "  ❌ Credentials API - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $tests += @{Name="Credentials"; Status="❌ Fail"}
}

# Test 5: Account Scan API
Write-Host "`nTesting Account Scan API..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$API_ENDPOINT/accounts/411474509059/scan" -Method POST -ErrorAction Stop
    if ($result.message -like "*complete*") {
        Write-Host "  ✅ Account Scan API - Scan completed (found $($result.credentialsFound) credentials)" -ForegroundColor Green
        $tests += @{Name="Account Scan"; Status="✅ Pass"}
    } else {
        Write-Host "  ⚠ Account Scan API - Unexpected response" -ForegroundColor Yellow
        $tests += @{Name="Account Scan"; Status="⚠ Warning"}
    }
} catch {
    Write-Host "  ❌ Account Scan API - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $tests += @{Name="Account Scan"; Status="❌ Fail"}
}

# Summary
Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$passed = ($tests | Where-Object { $_.Status -like "*✅*" }).Count
$warnings = ($tests | Where-Object { $_.Status -like "*⚠*" }).Count
$failed = ($tests | Where-Object { $_.Status -like "*❌*" }).Count
$total = $tests.Count

$tests | ForEach-Object {
    $color = if ($_.Status -like "*✅*") { "Green" } elseif ($_.Status -like "*⚠*") { "Yellow" } else { "Red" }
    Write-Host "  $($_.Name): $($_.Status)" -ForegroundColor $color
}

Write-Host "`n────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  Passed: $passed | Warnings: $warnings | Failed: $failed | Total: $total" -ForegroundColor White
Write-Host "────────────────────────────────────────────────────────────────`n" -ForegroundColor Cyan

if ($failed -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 All tests passed! System is fully functional!" -ForegroundColor Green
} elseif ($failed -eq 0) {
    Write-Host "✅ All tests passed with some warnings. System is functional." -ForegroundColor Yellow
} else {
    Write-Host "⚠ Some tests failed. Please check the errors above." -ForegroundColor Red
}

Write-Host ""

