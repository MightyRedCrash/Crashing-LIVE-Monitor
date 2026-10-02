@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Crashing LIVE - Instalador de Servicio de Windows Desatendido
cd /d "%~dp0"

echo ===============================================================================
echo        CRASHING LIVE - INSTALADOR DE SERVICIO DESATENDIDO (WINDOWS)
echo ===============================================================================
echo.
echo Este script registra el Agente de Monitoreo como un Servicio del Sistema
echo que se iniciara automaticamente con Windows (ONSTART) con maximos privilegios
echo (NT AUTHORITY\SYSTEM), transmitiendo telemetria de forma ininterrumpida.
echo.

:: Verificar permisos de Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Se requieren permisos de Administrador para registrar el servicio.
    echo Solicitando elevacion UAC...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b 0
)

echo [1/3] Deteniendo instancias previas del servicio...
schtasks /end /tn "CrashingLiveAgent" >nul 2>&1
schtasks /delete /tn "CrashingLiveAgent" /f >nul 2>&1

echo [2/3] Registrando Tarea de Sistema / Servicio Desatendido (ONSTART)...

where python >nul 2>&1
if %errorlevel% equ 0 (
    if exist "%~dp0agent_daemon.py" (
        echo [INFO] Python detectado. Configurando motor psutil/python...
        schtasks /create /tn "CrashingLiveAgent" /tr "\"pythonw.exe\" \"%~dp0agent_daemon.py\"" /sc onstart /ru "NT AUTHORITY\SYSTEM" /rl highest /f >nul 2>&1
    )
)

if %errorlevel% neq 0 (
    echo [INFO] Configurando motor de Servicio PowerShell Nativo...
    schtasks /create /tn "CrashingLiveAgent" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%~dp0agent_daemon.ps1\"" /sc onstart /ru "NT AUTHORITY\SYSTEM" /rl highest /f
)

if %errorlevel% equ 0 (
    echo [OK] Servicio registrado exitosamente con nombre 'CrashingLiveAgent'.
) else (
    echo [ERROR] No se pudo crear la tarea del sistema.
    pause
    exit /b 1
)

echo [3/3] Iniciando el servicio inmediatamente...
schtasks /run /tn "CrashingLiveAgent"

echo.
echo ===============================================================================
echo    ??SERVICIO DE AGENTE CRASHING LIVE INSTALADO Y EN EJECUCION!
echo ===============================================================================
echo   - Modo:              Desatendido (Inicia con el arranque de Windows)
echo   - Cuenta:            NT AUTHORITY\SYSTEM
echo   - Tarea del Sistema: CrashingLiveAgent
echo   - Conexion:          Saliente (Outbound) a traves de Firewall/NAT
echo ===============================================================================
echo.
pause
exit /b 0
