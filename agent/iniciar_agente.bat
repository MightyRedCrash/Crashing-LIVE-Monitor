@echo off
title Crashing LIVE - Agente de Monitoreo Windows
cd /d "%~dp0"

echo ===============================================================================
echo                CRASHING LIVE - INICIANDO AGENTE WINDOWS
echo ===============================================================================
echo [i] Verificando entorno de ejecucion...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; try { Get-Command Get-CimInstance | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [!] Advertencia: PowerShell CIM no detectado, ejecutando con modo de compatibilidad...
)

echo [OK] Iniciando agente y conectando con el Monitor...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent_daemon.ps1" %*

if %errorlevel% neq 0 (
    echo.
    echo [x] El agente se ha detenido con codigo de salida %errorlevel%.
    pause
)
