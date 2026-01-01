@echo off
echo Starting Chess Earning Site...
echo.
echo Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server (Port 5173)...
start "Frontend Server" cmd /k "cd client && npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Opening frontend in browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173
pause

