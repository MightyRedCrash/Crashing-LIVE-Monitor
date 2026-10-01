@echo off
title Crashing LIVE - Agente de Monitoreo Windows (Python)
cd /d "%~dp0"

echo ===============================================================================
echo            CRASHING LIVE - INICIANDO AGENTE WINDOWS (PYTHON)
echo ===============================================================================
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python no encontrado en el PATH de Windows.
    echo [i] Iniciando automaticamente la version nativa PowerShell (sin dependencias)...
    call "%~dp0iniciar_agente.bat" %*
    exit /b %errorlevel%
)

python "%~dp0agent_daemon.py" %*
if %errorlevel% neq 0 (
    echo.
    echo [x] El agente se ha detenido.
    pause
)
