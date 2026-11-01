@echo off
chcp 65001 > nul
title Instalace Brother b-PAC 3.4 Client Component
echo ====================================================================
echo   Instalace Brother b-PAC 3.4 Client Component (64-bit)
echo ====================================================================
echo.
echo Spouštím oficiální instalátor b-PAC...
msiexec /i "%~dp0bPAC3CCISetup_64.msi"
echo.
echo Hotovo! Nyní pokračujte spuštěním tiskového agenta.
echo.
pause
