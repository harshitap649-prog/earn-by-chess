@echo off
echo ========================================
echo   Deploying AI-Fixed Chess Site
echo ========================================
echo.

echo Step 1: Adding all changes...
git add .

echo.
echo Step 2: Committing changes...
git commit -m "Fix AI - faster calculation, timeout protection, better error handling"

echo.
echo Step 3: Pushing to GitHub...
git push

echo.
echo ========================================
echo   Deployment Steps:
echo ========================================
echo.
echo 1. Go to https://vercel.com
echo 2. Click "Add New Project"
echo 3. Import your GitHub repository
echo 4. Configure:
echo    - Framework: Vite
echo    - Root Directory: client
echo    - Build Command: npm run build:skip-check
echo    - Output Directory: dist
echo 5. Click "Deploy"
echo.
echo OR use Vercel CLI:
echo    vercel --prod
echo.
pause

