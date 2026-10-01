@echo off
title Crashing LIVE - Iniciando Instalador
cd /d "%~dp0"
echo ===============================================================================
echo                CRASHING LIVE - INICIANDO ASISTENTE OFICIAL
echo ===============================================================================
echo Desbloqueando ejecutable y verificando permisos...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File '%~dp0Instalador_Crashing_LIVE.exe' -ErrorAction SilentlyContinue" >nul 2>&1
echo Abriendo instalador...
start "" "%~dp0Instalador_Crashing_LIVE.exe"
exit /b 0
