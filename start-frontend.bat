@echo off
echo ========================================
echo   CHESS EARNING SITE - FRONTEND SERVER
echo ========================================
echo.
echo Starting frontend server...
echo.
cd /d "%~dp0\client"
echo Current directory: %CD%
echo.
echo Make sure you see:
echo   - VITE ready
echo   - Local: http://localhost:5173/
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.
npm run dev
pause
