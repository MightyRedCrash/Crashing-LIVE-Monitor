@echo off
cd /d "%~dp0"

:: Verificar si pythonw.exe esta disponible (ejecutable de Windows sin consola)
where pythonw >nul 2>&1
if %errorlevel% equ 0 (
    start "" pythonw "%~dp0agent_daemon.pyw" %*
    exit /b 0
)

where python >nul 2>&1
if %errorlevel% equ 0 (
    start "" python "%~dp0agent_daemon.pyw" %*
    exit /b 0
)

:: Fallback a PowerShell si Python no esta instalado
call "%~dp0iniciar_agente.bat" %*
exit /b %errorlevel%
