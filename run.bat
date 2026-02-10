@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
set NODE_ENV=production
set DISCORD_TOKEN=
title Wicked Alts (1.8.9)

:loop
node .
echo Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
