@echo off
REM Deploy process-approval Edge Function to Supabase

cd /d "%~dp0"

echo Deploying process-approval Edge Function...
echo.
echo This will:
echo 1. Deploy the CORS-fixed index.ts
echo 2. Apply the verify_jwt=false configuration
echo.

REM Try supabase CLI first
where supabase >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using supabase CLI...
    supabase functions deploy process-approval
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Deployment succeeded!
        echo.
        echo Next steps:
        echo 1. Go to http://localhost:5174/manager/approvals
        echo 2. Test: Reject, Request Clarification, Approve
        echo 3. Check Chrome DevTools Network tab for 200 status
        pause
        exit /b 0
    )
)

REM Fallback to npx
echo Using npx supabase CLI...
npx.cmd supabase functions deploy process-approval
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Deployment succeeded!
    echo.
    echo Next steps:
    echo 1. Go to http://localhost:5174/manager/approvals
    echo 2. Test: Reject, Request Clarification, Approve
    echo 3. Check Chrome DevTools Network tab for 200 status
    pause
    exit /b 0
)

REM If both fail
echo.
echo ❌ Deployment failed. Please run manually:
echo    supabase functions deploy process-approval
echo.
echo Or try npx directly:
echo    npx supabase functions deploy process-approval
pause
exit /b 1
