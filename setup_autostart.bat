@echo off
chcp 65001 > nul
title Gypri Dilna - Instalace Tiskoveho Agenta do Po Spusteni

echo ====================================================================
echo   Gypri Dilna - Instalace Tiskoveho Agenta do Po spusteni Windows
echo ====================================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Gypri_PrintAgent_Silent.vbs

echo Set WshShell = CreateObject("WScript.Shell") > "%TARGET_VBS%"
echo WshShell.Run "pythonw.exe ""%SCRIPT_DIR%print_agent.py""", 0, False >> "%TARGET_VBS%"

echo [OK] Tiskovy Agent byl uspesne pridán do Po spusteni (Startup)!
echo      Bude se spoustet automaticky na pozadi bez konzoloveho okna.
echo.
pause
