@echo off
chcp 65001 > nul
title Gypri Dilna - Instalace Tiskoveho Agenta do Po Spusteni

echo ====================================================================
echo   Gypri Dilna - Nastavení Tiskoveho Agenta do Po spusteni Windows
echo ====================================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_DIR=%LOCALAPPDATA%\GypriDilna\PrintAgent
set STARTUP_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Gypri_PrintAgent.vbs

echo 1. Vytvářím stálou složku: %TARGET_DIR%
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%TARGET_DIR%\templates" mkdir "%TARGET_DIR%\templates"

echo 2. Kopíruji soubory tiskového agenta...
copy /y "%SCRIPT_DIR%print_agent.py" "%TARGET_DIR%\print_agent.py" > nul
if exist "%SCRIPT_DIR%templates" copy /y "%SCRIPT_DIR%templates\*.*" "%TARGET_DIR%\templates\" > nul

echo 3. Hledám cestu k pythonw.exe...
set PYTHONW_PATH=pythonw.exe
for /f "delims=" %%i in ('python -c "import sys, os; pw = os.path.join(os.path.dirname(sys.executable), 'pythonw.exe'); print(pw if os.path.exists(pw) else 'pythonw.exe')" 2^>nul') do set PYTHONW_PATH=%%i

echo    Nalezeno: %PYTHONW_PATH%

echo 4. Vytvářím tichý spouštěč...
echo Set WshShell = CreateObject("WScript.Shell") > "%TARGET_DIR%\run_agent_silent.vbs"
echo Set FSO = CreateObject("Scripting.FileSystemObject") >> "%TARGET_DIR%\run_agent_silent.vbs"
echo strDir = "%TARGET_DIR%" >> "%TARGET_DIR%\run_agent_silent.vbs"
echo WshShell.CurrentDirectory = strDir >> "%TARGET_DIR%\run_agent_silent.vbs"
echo WshShell.Run """%PYTHONW_PATH%"" """ ^& strDir ^& "\print_agent.py""", 0, False >> "%TARGET_DIR%\run_agent_silent.vbs"

echo 5. Vytvářím zástupce v Po spuštění (Startup)...
echo Set WshShell = CreateObject("WScript.Shell") > "%STARTUP_VBS%"
echo WshShell.Run "wscript.exe ""%TARGET_DIR%\run_agent_silent.vbs""", 0, False >> "%STARTUP_VBS%"

echo.
echo ====================================================================
echo [OK] Tiskový Agent byl úspěšně nainstalován a přidán do Po spuštění!
echo      Složka: %TARGET_DIR%
echo      Bude se spouštět automaticky při každém zapnutí počítače na pozadí.
echo ====================================================================
echo.
pause
