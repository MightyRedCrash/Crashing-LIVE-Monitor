@echo off
title Crashing LIVE - Sistema de Monitoreo y Telemetria
cd /d "%~dp0"
cls

echo ===============================================================================
echo                CRASHING LIVE - MONITOR DE INFRAESTRUCTURA WINDOWS
echo ===============================================================================
echo.
echo [1/3] Verificando entorno de ejecucion...

where node >nul 2>&1
if errorlevel 1 goto error_node

if not exist "node_modules\" (
    echo [INFO] Instalando dependencias de Node.js...
    call npm.cmd install
    if errorlevel 1 goto error_npm
)

echo [2/3] Verificando estado del servidor central...
powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/system/real-telemetry' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto arrancar_servidor

echo [OK] El servidor ya esta activo en http://localhost:3000.
goto abrir_navegador

:arrancar_servidor
echo [INFO] Iniciando servidor de monitoreo y telemetria en segundo plano...
start "Crashing LIVE Server" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$host.UI.RawUI.WindowTitle='Crashing LIVE Server (Puerto 3000)'; npx.cmd tsx server.ts"

echo Esperando a que el servidor este listo...
ping -n 4 127.0.0.1 >nul 2>&1

:abrir_navegador
echo.
echo [3/3] Abriendo interfaz del Monitor...

if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" --app="http://localhost:3000" --disable-gpu
    goto mostrar_menu
)

if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" --app="http://localhost:3000" --disable-gpu
    goto mostrar_menu
)

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3000" --disable-gpu
    goto mostrar_menu
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000" --disable-gpu
    goto mostrar_menu
)

start "" "http://localhost:3000"

:mostrar_menu
echo.
echo ===============================================================================
echo      CRASHING LIVE MONITOR ESTA FUNCIONANDO CORRECTAMENTE
echo ===============================================================================
echo   - URL Local:     http://localhost:3000
echo ===============================================================================
echo.
echo Opciones disponibles:
echo   [1] Iniciar Agente de Telemetria local
echo   [2] Abrir Asistente Instalador Oficial
echo   [3] Reabrir Monitor en el navegador
echo   [4] Salir
echo.
set /p opt="Seleccione una opcion (1-4) [Enter para salir]: "

if "%opt%"=="1" (
    start "" "%~dp0agent\iniciar_agente.bat"
    exit /b 0
)
if "%opt%"=="2" (
    start "" "%~dp0Instalador\Iniciar_Instalador.bat"
    exit /b 0
)
if "%opt%"=="3" (
    start "" "http://localhost:3000"
    exit /b 0
)

exit /b 0

:error_node
echo.
echo [ERROR] Node.js no esta instalado en este equipo.
echo Por favor instale Node.js desde https://nodejs.org/ para ejecutar el servidor.
echo.
pause
exit /b 1

:error_npm
echo.
echo [ERROR] Ocurrio un fallo instalando las dependencias.
echo.
pause
exit /b 1
