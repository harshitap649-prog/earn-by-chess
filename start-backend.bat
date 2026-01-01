@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Checking .env file...
if exist .env (
    echo ✅ .env file found
) else (
    echo ❌ .env file NOT found!
    echo Please create .env file with Razorpay keys
    pause
    exit /b 1
)
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev
pause

