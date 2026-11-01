@echo off
chcp 65001 > nul
title Instalace potřebných knihoven pro Python
echo ====================================================================
echo   Instalace knihovny pywin32 pro Python
echo ====================================================================
echo.
pip install pywin32 requests
echo.
pause
