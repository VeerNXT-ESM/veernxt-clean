@echo off
TITLE VeerNXT Scraper Setup & Launcher

echo ===================================================
echo    Starting VeerNXT Job Scraper Desktop App
echo ===================================================
echo.

:: 1. Check if Node.js is installed
npm --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    echo ===================================================
    echo  ERROR: NODE.JS IS NOT INSTALLED OR NOT IN PATH
    echo ===================================================
    echo.
    echo To run this application, you must install Node.js.
    echo.
    echo Opening the Node.js download page in your browser...
    timeout /t 5 >nul
    start https://nodejs.org/en/download/
    echo.
    echo Press any key to exit. Please run this file again after installing.
    pause >nul
    exit
)

cd /d "%~dp0"

:: 2. Check if node_modules exists, if not, install dependencies quietly
IF NOT EXIST "node_modules" (
    echo [1/2] Installing required components for the first time. Please wait...
    call npm install >nul 2>&1
)

echo [2/2] Launching Application...
:: 3. Launch electron
start npm start

:: Close the terminal window after 2 seconds
timeout /t 2 /nobreak >nul
exit
