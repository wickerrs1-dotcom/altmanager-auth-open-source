@echo off
REM ============================================================================
REM Redeploy Discord Commands - v2.1.0
REM ============================================================================
REM Run this script to force redeploy all Discord commands
REM This fixes issues where Discord caches old command definitions
REM ============================================================================

color 0B
chcp 65001 >nul 2>&1
echo.
echo ============================================================================
echo     DISCORD COMMAND REDEPLOYMENT
echo ============================================================================
echo.
echo This will redeploy all Discord commands from scratch.
echo This fixes issues where Discord shows old command definitions.
echo.
echo IMPORTANT: 
echo   - Your Discord token must be correct in config.json
echo   - The bot must be invited to your server
echo   - You have admin permissions in the server
echo.
pause

cd /d "%~dp0"

echo.
echo Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: Node.js not found
    pause
    exit /b 1
)

if not exist "config.json" (
    color 0C
    echo ERROR: config.json not found
    pause
    exit /b 1
)

echo.
echo Validating Discord configuration...
node -e "const cfg=require('./config.json'); if(!cfg.discord||!cfg.discord.token||!cfg.discord.appId||!cfg.discord.guildId) throw new Error('Missing discord config')" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: config.json is missing required Discord settings
    echo Please check:
    echo   - discord.token is set and not empty
    echo   - discord.appId is set (your bot's application ID)
    echo   - discord.guildId is set (your server ID)
    echo.
    pause
    exit /b 1
)

echo [OK] Configuration valid
echo.
echo Running command deployment...
echo.

npm run deploy

if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Command deployment failed
    echo Check your Discord token and bot permissions
    echo.
) else (
    color 0A
    echo.
    echo SUCCESS: Commands deployed
    echo.
    echo IMPORTANT: 
    echo   1. Wait 30 seconds for Discord to update
    echo   2. Restart your Discord client or reload the server
    echo   3. Try typing /alts again to see if dropdown is gone
    echo.
)

pause
