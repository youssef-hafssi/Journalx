@echo off
echo ========================================
echo    JournalX - Vercel Deployment Script
echo ========================================
echo.

echo 1. Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please check for errors.
    pause
    exit /b 1
)

echo.
echo 2. Build successful! dist folder created.
echo.

echo 3. Checking for Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    call npm install -g vercel
)

echo.
echo 4. Ready to deploy!
echo.
echo Choose deployment method:
echo   a) Deploy via Vercel CLI (vercel)
echo   b) Deploy to production (vercel --prod)
echo   c) Open Vercel dashboard in browser
echo   d) Exit
echo.

set /p choice="Enter your choice (a/b/c/d): "

if /i "%choice%"=="a" (
    echo.
    echo Deploying via Vercel CLI...
    call vercel
) else if /i "%choice%"=="b" (
    echo.
    echo Deploying to production...
    call vercel --prod
) else if /i "%choice%"=="c" (
    echo.
    echo Opening Vercel dashboard...
    start https://vercel.com/dashboard
) else if /i "%choice%"=="d" (
    echo.
    echo Exiting...
) else (
    echo Invalid choice. Exiting...
)

echo.
echo ========================================
echo    Deployment process completed!
echo ========================================
echo.
echo Don't forget to:
echo 1. Set environment variables in Vercel
echo 2. Update Supabase Site URL
echo 3. Test your deployed application
echo.
pause
