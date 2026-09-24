#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Shruti D\Core Value Recognition"

Write-Host "Deploying provision-employees Edge Function..." -ForegroundColor Cyan

# Deploy the provision-employees function
$deployOutput = supabase functions deploy provision-employees 2>&1
Write-Host $deployOutput

# Check if deployment succeeded
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment succeeded!" -ForegroundColor Green
    Write-Host $deployOutput
} else {
    Write-Host "❌ Deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host $deployOutput
    exit 1
}
