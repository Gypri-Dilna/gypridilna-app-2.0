@echo off
chcp 65001 > nul
title Gypri Dilna - Brother Print Agent
echo ====================================================================
echo   Spouštění tiskového agenta Gypri Dílna (Port 5001)
echo ====================================================================
echo.
python "%~dp0print_agent.py"
pause
