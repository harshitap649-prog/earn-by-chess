@echo off
echo ========================================
echo   CHESS EARNING SITE - BACKEND SERVER
echo ========================================
echo.
echo Starting server...
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Make sure you see these messages:
echo   - Environment variables loaded
echo   - Database connected successfully
echo   - Server running on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.
npm run dev
pause

