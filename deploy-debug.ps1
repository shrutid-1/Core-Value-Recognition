$env:SUPABASE_CLI_LOG_LEVEL = "DEBUG"
Set-Location "C:\Users\Shruti D\Core Value Recognition"
& supabase functions deploy provision-employees --debug 2>&1 | Tee-Object -FilePath "deploy-output.txt"
