#!/usr/bin/env pwsh
# Deployment script for process-approval Edge Function

Write-Host "Deploying process-approval Edge Function..." -ForegroundColor Cyan

try {
    # Try using supabase CLI directly
    & supabase functions deploy process-approval
    Write-Host "✅ Deployment succeeded" -ForegroundColor Green
} catch {
    Write-Host "⚠️  supabase CLI not available, trying npx..." -ForegroundColor Yellow
    try {
        & npx supabase functions deploy process-approval
        Write-Host "✅ Deployment succeeded" -ForegroundColor Green
    } catch {
        Write-Host "❌ Deployment failed. Please run manually:" -ForegroundColor Red
        Write-Host "supabase functions deploy process-approval" -ForegroundColor White
    }
}
