@echo off
REM Alt Manager - Security Cleanup Script
REM Removes sensitive files before sharing/distributing
REM Run this before committing to git or sharing the project

echo Cleaning sensitive files...

if exist "accounts.json" del /f /q "accounts.json" && echo Deleted: accounts.json
if exist ".env" del /f /q ".env" && echo Deleted: .env
if exist "EDIT_ME\01_DISCORD_TOKEN.env" del /f /q "EDIT_ME\01_DISCORD_TOKEN.env" && echo Deleted: EDIT_ME\01_DISCORD_TOKEN.env

if exist "logs" (
    echo Cleaning logs directory...
    del /s /q "logs\*.*" 2>nul
    for /d %%x in ("logs\*") do @rd /s /q "%%x" 2>nul
    echo Cleaned: logs (contents removed)
)

if exist "state" (
    echo Cleaning state/auth-cache...
    if exist "state\auth-cache" (
        del /s /q "state\auth-cache\*.*" 2>nul
        echo Cleaned: state\auth-cache (tokens removed)
    )
    if exist "state\backups" (
        del /s /q "state\backups\*.*" 2>nul
        echo Cleaned: state\backups
    )
)

if exist "node_modules" (
    echo Removing node_modules...
    for /d %%x in ("node_modules\*") do @rd /s /q "%%x" 2>nul
    del /s /q "node_modules\*.*" 2>nul
    rd /s /q "node_modules" 2>nul
    echo Deleted: node_modules
)

echo.
echo Security cleanup complete!
echo.
echo Safe to share:
echo - example-accounts.json (sample config)
echo - example-config.json (sample config)
echo - src/ (code only)
echo - package.json (dependencies)
echo.
pause
