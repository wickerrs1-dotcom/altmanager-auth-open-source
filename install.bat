@echo off
REM ============================================================================
REM Ultimate Alt Manager v2.1.0 - VPS Installation Script
REM ============================================================================
REM This script installs the bot on a clean Windows VPS
REM Requirements: Node.js 18+, administrator access, internet connection
REM ============================================================================

color 0B
chcp 65001 >nul 2>&1
echo.
echo ============================================================================
echo     ULTIMATE ALT MANAGER v2.1.0 - VPS INSTALLATION
echo ============================================================================
echo.
echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    echo Then add it to your system PATH
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js installed: 
node --version

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] npm is not available
    echo Please ensure Node.js is properly installed
    echo.
    pause
    exit /b 1
)

echo [OK] npm installed: 
npm --version
echo.

REM Step 1: Install dependencies
echo ============================================================================
echo [STEP 1/5] Installing dependencies with npm...
echo ============================================================================
echo.
cd /d "%~dp0"
npm install --legacy-peer-deps
if errorlevel 1 (
    color 0C
    echo [ERROR] Failed to install dependencies
    echo Check your internet connection and run again
    echo.
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Step 2: Check configuration files
echo ============================================================================
echo [STEP 2/5] Verifying configuration files...
echo ============================================================================
echo.

if not exist "config.json" (
    color 0C
    echo [ERROR] config.json not found!
    echo Copy example-config.json to config.json and fill in your values:
    echo   - discord.token: Your Discord bot token
    echo   - discord.appId: Your bot's application ID  
    echo   - discord.guildId: Your server ID
    echo   - accounts.alts: Your alt accounts with passwords
    echo   - servers: Server configurations
    echo.
    pause
    exit /b 1
)
echo [OK] config.json exists

if not exist "accounts.json" (
    color 0C
    echo [ERROR] accounts.json not found!
    echo Copy or restore your accounts.json before proceeding
    echo.
    pause
    exit /b 1
)
echo [OK] accounts.json exists
echo.

REM Step 3: Check environment setup
echo ============================================================================
echo [STEP 3/5] Setting up environment...
echo ============================================================================
echo.

if not exist "state" mkdir state
if not exist "state\auth-cache" mkdir state\auth-cache
if not exist "logs" mkdir logs
if not exist "logs\alts" mkdir logs\alts
if not exist "logs\exports" mkdir logs\exports
echo [OK] Created state/logs directories
echo.

REM Step 4: Validate installation
echo ============================================================================
echo [STEP 4/5] Validating Node.js files...
echo ============================================================================
echo.
node -c index.js
if errorlevel 1 (
    color 0C
    echo [ERROR] index.js has syntax errors
    echo Fix the errors and try again
    echo.
    pause
    exit /b 1
)
echo [OK] index.js syntax valid
echo.

REM Step 5: Deploy Discord commands
echo ============================================================================
echo [STEP 5/5] Deploying Discord commands...
echo ============================================================================
echo.
echo Running: npm run deploy
echo.
call npm run deploy
if errorlevel 1 (
    color 0E
    echo [WARN] Command deployment may have failed
    echo If this is the first run, you may need to:
    echo   1. Check your Discord token in config.json
    echo   2. Ensure the bot is invited to your server
    echo   3. Run "npm run deploy" manually after fixing
    echo.
) else (
    echo [OK] Commands deployed successfully
    echo.
)

REM Final instructions
color 0A
echo ============================================================================
echo     INSTALLATION COMPLETE
echo ============================================================================
echo.
echo The bot is now ready to run! To start it:
echo.
echo   node index.js
echo.
echo Or use: npm start
echo.
echo To redeploy commands: npm run deploy
echo To run diagnostics: npm run doctor
echo To view logs: check logs/ directory
echo.
echo NEXT STEPS:
echo   1. Ensure config.json has your Discord token and server IDs
echo   2. Ensure accounts.json has your alt account credentials  
echo   3. Run the bot: node index.js
echo   4. Check Discord for the /alts command to appear
echo   5. Use /alts help for command reference
echo.
echo For troubleshooting:
echo   - Run: npm run doctor
echo   - Check logs/ directory for errors
echo   - Verify config.json is valid JSON
echo   - Ensure Discord token is correct
echo.
echo ============================================================================
pause
