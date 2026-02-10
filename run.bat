@echo off
REM ============================================================================
REM Ultimate Alt Manager v2.1.0 - Run Bot
REM ============================================================================
REM This script loads the Discord token from EDIT_ME/01_DISCORD_TOKEN.env
REM and starts the bot
REM ============================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"
set NODE_ENV=production
title Ultimate Alt Manager v2.1.0

REM Check if config.json exists
if not exist "config.json" (
    echo ERROR: config.json not found!
    echo Please copy example-config.json to config.json and fill in your values
    echo.
    pause
    exit /b 1
)

REM Load Discord token from EDIT_ME/01_DISCORD_TOKEN.env
if exist "EDIT_ME\01_DISCORD_TOKEN.env" (
    for /f "tokens=1,2 delims==" %%a in ('type "EDIT_ME\01_DISCORD_TOKEN.env"') do (
        if "%%a"=="DISCORD_TOKEN" set DISCORD_TOKEN=%%b
    )
)

REM If token not found, try reading from config.json (for backward compatibility)
if not defined DISCORD_TOKEN (
    REM Try to read from config.json using Node.js
    for /f %%a in ('node -e "try{const cfg=require('./config.json');console.log(cfg.discord?.token||'')}catch{}"') do set DISCORD_TOKEN=%%a
)

REM If still no token, show error
if not defined DISCORD_TOKEN (
    echo ERROR: Discord token not found!
    echo Please add your Discord token to: EDIT_ME\01_DISCORD_TOKEN.env
    echo Format: DISCORD_TOKEN=your_token_here
    echo.
    pause
    exit /b 1
)

REM Start the bot
echo Starting Ultimate Alt Manager v2.1.0...
echo.
node index.js

REM Restart loop (optional - comment out for single-run)
REM :loop
REM echo Restarting in 5 seconds...
REM timeout /t 5 /nobreak >nul
REM goto loop
