@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Crashing LIVE - Desinstalar Servicio de Windows
cd /d "%~dp0"

echo ===============================================================================
echo            CRASHING LIVE - DESINSTALADOR DE SERVICIO DE WINDOWS
echo ===============================================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b 0
)

echo Deteniendo y eliminando tarea de sistema 'CrashingLiveAgent'...
schtasks /end /tn "CrashingLiveAgent" >nul 2>&1
schtasks /delete /tn "CrashingLiveAgent" /f >nul 2>&1

powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*agent_daemon*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

echo [OK] Servicio de Windows desinstalado correctamente.
echo.
pause
exit /b 0
