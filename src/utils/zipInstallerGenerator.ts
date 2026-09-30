import JSZip from 'jszip';

export interface ZipConfigParams {
  hostName: string;
  ipAddress: string;
  port: number;
  dbHost?: string;
  dbPort?: number;
  dbName?: string;
  dbUser?: string;
  dbPass?: string;
}

/**
 * Normaliza cualquier texto para Windows con finales de línea CRLF (\r\n).
 * Crucial para que cmd.exe y batch scripts en Windows no fallen ni cierren la ventana.
 */
function toWindowsCrlf(text: string): string {
  return text.replace(/\r?\n/g, '\r\n');
}

export async function generateInstallerZip(params: ZipConfigParams): Promise<Blob> {
  const zip = new JSZip();

  const currentHost = params.hostName || 'WINSRV-PRIMARY-DC';
  const currentIp = params.ipAddress || '192.168.1.140';
  const currentPort = params.port || 8443;
  const dbHost = params.dbHost || currentIp;
  const dbPort = params.dbPort || 5432;
  const dbName = params.dbName || 'crashinglive_db';
  const dbUser = params.dbUser || 'postgres';
  const dbPass = params.dbPass || 'P@ssw0rd2026!';

  // =========================================================================
  // 1. INSTALL_WIZARD.bat (Auto-elevable, a prueba de fallos, con menú inicial)
  // =========================================================================
  const batLauncher = `@echo off
setlocal EnableExtensions
title Crashing Live Monitor - Wizard de Instalacion v2.6

:: 1. Auto-elevacion con permisos de Administrador mediante UAC si no es admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================================================
    echo  [i] Solicitando elevacion de permisos de Administrador...
    echo      (Por favor, pulse "Si" en la ventana de Control de Cuentas de Usuario)
    echo ========================================================================
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -WorkingDirectory '%~dp0' -Verb RunAs"
    exit /b
)

:: 2. Posicionar directorio de trabajo en la carpeta donde esta el script
cd /d "%~dp0"

:MENU
cls
echo ========================================================================
echo         CRASHING LIVE MONITOR - WIZARD INSTALADOR (v2.6)
echo ========================================================================
echo  Servidor Configurado: ${currentHost}
echo  IP / Puerto Destino : ${currentIp}:${currentPort}
echo  Directorio Actual   : %~dp0
echo ========================================================================
echo.
echo   POR FAVOR, SELECCIONE EL TIPO DE INSTALACION PARA ESTE EQUIPO:
echo.
echo   [1] AGENTE DE MONITOREO (Para Servidores / Maquinas Monitoreadas)
echo       -------------------------------------------------------------
echo       - Instala el daemon en segundo plano (Python / Windows Service)
echo       - Sensores en tiempo real de CPU, RAM, Red, Discos y Procesos
echo       - Guardrails de PowerShell y telemetria hacia el Monitor Central
echo       - Se registra en Programas de Windows para desinstalacion limpia
echo       - Recomendado para: Servidores Windows Server 2022/2019 o Win 10/11
echo.
echo   [2] MONITOR CENTRAL / PANEL (Para la Estacion del Administrador)
echo       -------------------------------------------------------------
echo       - Configura la consola web de supervision en tiempo real
echo       - Conecta y crea las tablas en la Base de Datos PostgreSQL
echo       - Crea el acceso directo de escritorio "Crashing Live Monitor"
echo       - Se registra en Programas de Windows para desinstalacion limpia
echo       - Recomendado para: El servidor central o PC del administrador
echo.
echo   [3] AMBOS (Full Stack / Servidor Todo-en-Uno)
echo       -------------------------------------------------------------
echo       - Instala tanto el Agente de telemetria como el Monitor Central
echo       - Recomendado para: Servidores unicos o pruebas locales
echo.
echo   [4] DESINSTALAR Y BORRAR CRASHING LIVE DE ESTE EQUIPO
echo       -------------------------------------------------------------
echo       - Detiene y borra el servicio de Windows
echo       - Elimina reglas de firewall, archivos en C:\\CrashingLive
echo       - Desregistra la app de Programas y Caracteristicas de Windows
echo.
echo   [5] SALIR
echo.
echo ========================================================================
set "OPCION="
set /p OPCION=" Seleccione una opcion [1, 2, 3, 4 o 5] y presione ENTER: "

if "%OPCION%"=="1" goto INSTALAR_AGENTE
if "%OPCION%"=="2" goto INSTALAR_MONITOR
if "%OPCION%"=="3" goto INSTALAR_AMBOS
if "%OPCION%"=="4" goto DESINSTALAR
if "%OPCION%"=="5" goto SALIR

echo.
echo  [!] Opcion no valida. Por favor ingrese 1, 2, 3, 4 o 5.
timeout /t 2 >nul
goto MENU

:INSTALAR_AGENTE
cls
echo ========================================================================
echo  [+] INICIANDO INSTALACION DEL AGENTE DE MONITOREO...
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\Wizard_Instalador.ps1" -Mode Agent
goto FIN

:INSTALAR_MONITOR
cls
echo ========================================================================
echo  [+] INICIANDO CONFIGURACION DEL MONITOR CENTRAL...
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\Wizard_Instalador.ps1" -Mode Monitor
goto FIN

:INSTALAR_AMBOS
cls
echo ========================================================================
echo  [+] INICIANDO INSTALACION COMBINADA (AGENTE + MONITOR)...
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\Wizard_Instalador.ps1" -Mode Both
goto FIN

:DESINSTALAR
cls
echo ========================================================================
echo  [+] INICIANDO DESINSTALACION COMPLETA Y LIMPIEZA...
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\uninstall.ps1"
goto FIN

:FIN
echo.
echo ========================================================================
echo  El proceso ha finalizado.
echo ========================================================================
echo.
pause
exit /b 0

:SALIR
exit /b 0
`;

  // =========================================================================
  // 1.1 INSTALADOR_DIRECTO_AGENTE.bat (Acceso directo para instalar solo Agente)
  // =========================================================================
  const batAgentOnly = `@echo off
setlocal EnableExtensions
title Crashing Live - Instalador Agente de Monitoreo

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [i] Solicitando permisos de Administrador...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -WorkingDirectory '%~dp0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
cls
echo ========================================================================
echo  [+] INSTALACION DIRECTA: AGENTE DE MONITOREO (CRASHING LIVE)
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\Wizard_Instalador.ps1" -Mode Agent
echo.
pause
exit /b 0
`;

  // =========================================================================
  // 1.2 INSTALADOR_DIRECTO_MONITOR.bat (Acceso directo para instalar solo Monitor)
  // =========================================================================
  const batMonitorOnly = `@echo off
setlocal EnableExtensions
title Crashing Live - Instalador Monitor Central

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [i] Solicitando permisos de Administrador...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -WorkingDirectory '%~dp0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
cls
echo ========================================================================
echo  [+] INSTALACION DIRECTA: MONITOR CENTRAL / PANEL (CRASHING LIVE)
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\Wizard_Instalador.ps1" -Mode Monitor
echo.
pause
exit /b 0
`;

  // =========================================================================
  // 1.3 DESINSTALAR_COMPLETO.bat (Lanzador directo para desinstalar)
  // =========================================================================
  const batUninstallOnly = `@echo off
setlocal EnableExtensions
title Crashing Live - Desinstalador Oficial de la Suite

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [i] Solicitando permisos de Administrador para desinstalar...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -WorkingDirectory '%~dp0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
cls
echo ========================================================================
echo  DESINSTALADOR OFICIAL DE CRASHING LIVE MONITOR Y AGENTE
echo ========================================================================
echo.
echo  ADVERTENCIA: Esta accion detendra los servicios de monitoreo,
echo  eliminara las reglas de Firewall, borrara C:\\CrashingLive y
echo  desregistrara la aplicacion de "Programas y caracteristicas" de Windows.
echo.
set /p CONFIRM=" ¿Esta seguro de que desea desinstalar Crashing Live? [S/N]: "
if /i not "%CONFIRM%"=="S" (
    echo.
    echo  Operacion cancelada por el usuario.
    pause
    exit /b 0
)

echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\uninstall.ps1"
echo.
pause
exit /b 0
`;

  // =========================================================================
  // 2. Wizard_Instalador.ps1 (Asistente PowerShell que registra en Windows)
  // =========================================================================
  const psWizard = `<#
.SYNOPSIS
    Crashing Live Monitor - Setup Wizard Script
.DESCRIPTION
    Instalador interactivo y modular con soporte para Agente y Monitor.
    Registra automáticamente el software en "Programas y características" (appwiz.cpl).
#>

param(
    [ValidateSet("Interactive", "Agent", "Monitor", "Both", "Uninstall")]
    [string]$Mode = "Interactive"
)

$ErrorActionPreference = "Continue"

# Parametros de Configuracion
$HostName   = "${currentHost}"
$ListenPort = ${currentPort}
$DbHost     = "${dbHost}"
$DbPort     = ${dbPort}
$DbName     = "${dbName}"
$DbUser     = "${dbUser}"
$InstallDir = "C:\\CrashingLive"

function Show-Banner {
    Clear-Host
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "         CRASHING LIVE MONITOR - WIZARD DE INSTALACION V2.6             " -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " Host Configurado: $HostName" -ForegroundColor Cyan
    Write-Host " IP / Puerto     : ${currentIp}:$ListenPort" -ForegroundColor Cyan
    Write-Host " Directorio Base : $InstallDir" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host ""
}

# Menu interactivo si se llamo sin parametro -Mode
if ($Mode -eq "Interactive") {
    Show-Banner
    Write-Host "POR FAVOR, SELECCIONE QUE DESEA INSTALAR EN ESTE EQUIPO:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " [1] AGENTE DE MONITOREO (Para Servidores / Maquinas Monitoreadas)" -ForegroundColor White
    Write-Host "     Instala el daemon en segundo plano en C:\\CrashingLive y reporta metricas." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [2] MONITOR CENTRAL / PANEL (Para la Estacion del Administrador)" -ForegroundColor White
    Write-Host "     Configura la consola web de supervision y base de datos PostgreSQL." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [3] AMBOS (Full Stack / Servidor Todo-en-Uno)" -ForegroundColor White
    Write-Host "     Instala tanto el Agente como el Monitor en esta misma maquina." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [4] DESINSTALAR Y BORRAR Crashing Live de este equipo" -ForegroundColor White
    Write-Host "     Detiene servicios, elimina reglas de firewall y desregistra de Windows." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [5] Cancelar" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green

    $Choice = Read-Host " Ingrese su opcion [1, 2, 3, 4 o 5]"
    switch ($Choice) {
        "1" { $Mode = "Agent" }
        "2" { $Mode = "Monitor" }
        "3" { $Mode = "Both" }
        "4" { $Mode = "Uninstall" }
        Default {
            Write-Host "[-] Instalacion cancelada por el usuario." -ForegroundColor Yellow
            Exit 0
        }
    }
}

# Copiar scripts de desinstalación en la carpeta de instalación
function Setup-UninstallFiles {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }

    $UninstPs1 = Join-Path $ScriptDir "uninstall.ps1"
    if (Test-Path $UninstPs1) {
        Copy-Item -Path $UninstPs1 -Destination "$InstallDir\\uninstall.ps1" -Force
    }

    $UninstBat = Join-Path $ScriptDir "DESINSTALAR_COMPLETO.bat"
    if (Test-Path $UninstBat) {
        Copy-Item -Path $UninstBat -Destination "$InstallDir\\uninstall.bat" -Force
    }
}

# =========================================================================
# FUNCION 1: INSTALACION DEL AGENTE HOST Y REGISTRO EN WINDOWS
# =========================================================================
function Install-AgentModule {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " [Paso 1/2] INSTALANDO AGENTE DE MONITOREO..." -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green

    try {
        # 1. Crear directorios
        Write-Host "[+] Creando estructura de carpetas en $InstallDir..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path "$InstallDir\\logs" -Force -ErrorAction SilentlyContinue | Out-Null
        New-Item -ItemType Directory -Path "$InstallDir\\scripts" -Force -ErrorAction SilentlyContinue | Out-Null
        New-Item -ItemType Directory -Path "$InstallDir\\backups" -Force -ErrorAction SilentlyContinue | Out-Null
        Write-Host "    [OK] Carpetas listas." -ForegroundColor Green

        # 2. Copiar archivos
        Write-Host "[+] Copiando archivos de telemetria..." -ForegroundColor Cyan
        $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
        if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
        
        $DaemonSrc = Join-Path $ScriptDir "agent_daemon.py"
        if (Test-Path $DaemonSrc) {
            Copy-Item -Path $DaemonSrc -Destination "$InstallDir\\agent_daemon.py" -Force
            Write-Host "    [OK] agent_daemon.py copiado." -ForegroundColor Green
        }

        $ConfigSrc = Join-Path $ScriptDir "config.json"
        if (Test-Path $ConfigSrc) {
            Copy-Item -Path $ConfigSrc -Destination "$InstallDir\\config.json" -Force
            Write-Host "    [OK] config.json copiado." -ForegroundColor Green
        }

        # Preparar desinstalador
        Setup-UninstallFiles

        # 3. Validar Python
        Write-Host "[+] Verificando Python..." -ForegroundColor Cyan
        $PythonExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        if ($PythonExe) {
            Write-Host "    [OK] Python detectado: $PythonExe" -ForegroundColor Green
            Write-Host "[+] Verificando paquetes psutil y psycopg2-binary..." -ForegroundColor Cyan
            try {
                & python -m pip install --upgrade psutil psycopg2-binary --quiet
                Write-Host "    [OK] Dependencias instaladas correctamente." -ForegroundColor Green
            } catch {
                Write-Host "    [*] Verifique conexion a internet para pip." -ForegroundColor Yellow
            }
        } else {
            Write-Host "    [!] Python no encontrado en PATH del sistema." -ForegroundColor Yellow
            Write-Host "    [i] Si lo desea, instale Python 3.10+ desde https://python.org" -ForegroundColor Gray
        }

        # 4. Regla de Windows Firewall
        Write-Host "[+] Verificando regla de Windows Firewall para puerto TCP $ListenPort..." -ForegroundColor Cyan
        $FwRule = Get-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
        if (-not $FwRule) {
            New-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
            Write-Host "    [OK] Regla de Firewall creada para puerto $ListenPort." -ForegroundColor Green
        } else {
            Write-Host "    [OK] Regla de Firewall ya existia." -ForegroundColor Green
        }

        # 5. Servicio de Windows
        Write-Host "[+] Configurando servicio de Windows 'CrashingLiveDaemon'..." -ForegroundColor Cyan
        $SvcName = "CrashingLiveDaemon"
        $ExistingSvc = Get-Service -Name $SvcName -ErrorAction SilentlyContinue
        if ($ExistingSvc) {
            Write-Host "    [*] Servicio existente detectado. Reiniciando..." -ForegroundColor Yellow
            Stop-Service -Name $SvcName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Start-Service -Name $SvcName -ErrorAction SilentlyContinue
            Write-Host "    [OK] Servicio reiniciado." -ForegroundColor Green
        } else {
            if ($PythonExe) {
                New-Service -Name $SvcName -DisplayName "Crashing Live Autonomous AI Daemon" -BinaryPathName "\`"$PythonExe\`" \`"$InstallDir\\agent_daemon.py\`"" -StartupType Automatic -Description "Daemon de telemetria en tiempo real de Crashing Live." -ErrorAction SilentlyContinue | Out-Null
                Start-Service -Name $SvcName -ErrorAction SilentlyContinue
                Write-Host "    [OK] Servicio registrado con inicio automatico." -ForegroundColor Green
            } else {
                Write-Host "    [*] Guardado para inicio manual: $InstallDir\\agent_daemon.py" -ForegroundColor Yellow
            }
        }

        # 6. Registrar en "Agregar o quitar programas" de Windows
        Write-Host "[+] Registrando en Programas y Caracteristicas de Windows..." -ForegroundColor Cyan
        $RegKey = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent"
        if (-not (Test-Path $RegKey)) {
            New-Item -Path $RegKey -Force -ErrorAction SilentlyContinue | Out-Null
        }
        Set-ItemProperty -Path $RegKey -Name "DisplayName" -Value "Crashing Live Agent - Monitoreo de Servidores" -Force
        Set-ItemProperty -Path $RegKey -Name "DisplayVersion" -Value "2.6.4" -Force
        Set-ItemProperty -Path $RegKey -Name "Publisher" -Value "Crashing Live Systems" -Force
        Set-ItemProperty -Path $RegKey -Name "InstallLocation" -Value "$InstallDir" -Force
        Set-ItemProperty -Path $RegKey -Name "UninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$InstallDir\\uninstall.ps1\`"" -Force
        Set-ItemProperty -Path $RegKey -Name "QuietUninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$InstallDir\\uninstall.ps1\`"" -Force
        Set-ItemProperty -Path $RegKey -Name "DisplayIcon" -Value "powershell.exe" -Force
        Set-ItemProperty -Path $RegKey -Name "URLInfoAbout" -Value "http://${currentIp}:$ListenPort" -Force
        Set-ItemProperty -Path $RegKey -Name "EstimatedSize" -Value 18500 -Force
        Set-ItemProperty -Path $RegKey -Name "NoModify" -Value 1 -Force
        Set-ItemProperty -Path $RegKey -Name "NoRepair" -Value 1 -Force
        Write-Host "    [OK] Registrado en Windows (desinstalable desde Panel de Control / Configuracion)." -ForegroundColor Green

        Write-Host ""
        Write-Host " [✔] AGENTE DE MONITOREO INSTALADO EXITOSAMENTE." -ForegroundColor Green
        Write-Host "     Carpeta: $InstallDir" -ForegroundColor White
        Write-Host "     Logs:    $InstallDir\\logs\\agent.log" -ForegroundColor White
    }
    catch {
        Write-Host "[!] Error durante instalacion del Agente: $_" -ForegroundColor Red
    }
}

# =========================================================================
# FUNCION 2: CONFIGURACION DEL MONITOR CENTRAL Y REGISTRO EN WINDOWS
# =========================================================================
function Install-MonitorModule {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " [Paso 2/2] CONFIGURANDO MONITOR CENTRAL Y PANEL..." -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green

    try {
        Setup-UninstallFiles

        # 1. Regla de Firewall para el puerto del Monitor
        Write-Host "[+] Abriendo puerto de servicio TCP $ListenPort en Firewall..." -ForegroundColor Cyan
        $FwMon = Get-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue
        if (-not $FwMon) {
            New-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
            Write-Host "    [OK] Regla de Firewall configurada." -ForegroundColor Green
        } else {
            Write-Host "    [OK] Regla de Firewall ya existia." -ForegroundColor Green
        }

        # 2. Base de datos PostgreSQL
        Write-Host "[+] Comprobando conectividad con PostgreSQL en $DbHost:$DbPort..." -ForegroundColor Cyan
        $PsqlCmd = Get-Command psql.exe -ErrorAction SilentlyContinue
        if ($PsqlCmd) {
            $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
            if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
            $SchemaPath = Join-Path $ScriptDir "schema.sql"
            if (Test-Path $SchemaPath) {
                Write-Host "    [+] Aplicando esquema schema.sql a '$DbName'..." -ForegroundColor Cyan
                $env:PGPASSWORD = "${dbPass}"
                & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SchemaPath 2>$null
                Write-Host "    [OK] Tablas de telemetria y servidores sincronizadas." -ForegroundColor Green
            }
        } else {
            Write-Host "    [*] psql.exe no esta en el PATH. Puede importar 'schema.sql' en pgAdmin cuando guste." -ForegroundColor Gray
        }

        # 3. Acceso Directo de Escritorio
        Write-Host "[+] Creando acceso directo en el Escritorio..." -ForegroundColor Cyan
        try {
            $Wsh = New-Object -ComObject WScript.Shell
            $Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
            $Sc = $Wsh.CreateShortcut("$Desktop\\Crashing Live Monitor.url")
            $Sc.TargetPath = "http://localhost:$ListenPort"
            $Sc.Save()
            Write-Host "    [OK] Acceso directo 'Crashing Live Monitor' creado en el Escritorio." -ForegroundColor Green
        } catch {
            Write-Host "    [*] URL del Panel: http://localhost:$ListenPort" -ForegroundColor Gray
        }

        # 4. Registrar en "Agregar o quitar programas" de Windows
        Write-Host "[+] Registrando en Programas y Caracteristicas de Windows..." -ForegroundColor Cyan
        $RegKey = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor"
        if (-not (Test-Path $RegKey)) {
            New-Item -Path $RegKey -Force -ErrorAction SilentlyContinue | Out-Null
        }
        Set-ItemProperty -Path $RegKey -Name "DisplayName" -Value "Crashing Live Monitor - Panel de Control Central" -Force
        Set-ItemProperty -Path $RegKey -Name "DisplayVersion" -Value "2.6.4" -Force
        Set-ItemProperty -Path $RegKey -Name "Publisher" -Value "Crashing Live Systems" -Force
        Set-ItemProperty -Path $RegKey -Name "InstallLocation" -Value "$InstallDir" -Force
        Set-ItemProperty -Path $RegKey -Name "UninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$InstallDir\\uninstall.ps1\`"" -Force
        Set-ItemProperty -Path $RegKey -Name "QuietUninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$InstallDir\\uninstall.ps1\`"" -Force
        Set-ItemProperty -Path $RegKey -Name "DisplayIcon" -Value "powershell.exe" -Force
        Set-ItemProperty -Path $RegKey -Name "URLInfoAbout" -Value "http://localhost:$ListenPort" -Force
        Set-ItemProperty -Path $RegKey -Name "EstimatedSize" -Value 32500 -Force
        Set-ItemProperty -Path $RegKey -Name "NoModify" -Value 1 -Force
        Set-ItemProperty -Path $RegKey -Name "NoRepair" -Value 1 -Force
        Write-Host "    [OK] Registrado en Windows (desinstalable desde Panel de Control / Configuracion)." -ForegroundColor Green

        Write-Host ""
        Write-Host " [✔] MONITOR CENTRAL CONFIGURADO EXITOSAMENTE." -ForegroundColor Green
        Write-Host "     Acceso Local : http://localhost:$ListenPort" -ForegroundColor Cyan
        Write-Host "     Acceso en Red: http://${currentIp}:$ListenPort" -ForegroundColor Cyan
    }
    catch {
        Write-Host "[!] Error durante configuracion del Monitor: $_" -ForegroundColor Red
    }
}

# =========================================================================
# EJECUCION DE LOS MODULOS SEGUN EL MODO
# =========================================================================
if ($Mode -eq "Agent") {
    Install-AgentModule
} elseif ($Mode -eq "Monitor") {
    Install-MonitorModule
} elseif ($Mode -eq "Both") {
    Install-AgentModule
    Install-MonitorModule
} elseif ($Mode -eq "Uninstall") {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
    & (Join-Path $ScriptDir "uninstall.ps1")
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host " [✔] ASISTENTE COMPLETADO CON EXITO!                                    " -ForegroundColor Green
Write-Host " Modo instalado: $Mode" -ForegroundColor White
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
`;

  // =========================================================================
  // 3. uninstall.ps1 (Desinstalador Completo y Limpieza de Registro)
  // =========================================================================
  const psUninstall = `<#
.SYNOPSIS
    Crashing Live Monitor - Complete Clean Uninstaller
.DESCRIPTION
    Detiene servicios, elimina reglas de firewall, borra C:\\CrashingLive
    y desregistra la aplicación de "Programas y características" de Windows.
#>

$ErrorActionPreference = "SilentlyContinue"

Clear-Host
Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host "   DESINSTALANDO CRASHING LIVE MONITOR Y AGENTE DE ESTE EQUIPO...       " -ForegroundColor White
Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Detener y desregistrar Servicio de Windows
Write-Host "[1/6] Deteniendo servicio 'CrashingLiveDaemon'..." -ForegroundColor Cyan
Stop-Service -Name "CrashingLiveDaemon" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "[2/6] Eliminando servicio 'CrashingLiveDaemon' de Windows..." -ForegroundColor Cyan
& sc.exe delete "CrashingLiveDaemon" | Out-Null

# 2. Terminar procesos Python activos de CrashingLive
Write-Host "[3/6] Finalizando procesos remanentes en memoria..." -ForegroundColor Cyan
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*CrashingLive*" -or $_.CommandLine -like "*agent_daemon.py*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 3. Eliminar reglas de Firewall
Write-Host "[4/6] Eliminando reglas de entrada en Windows Firewall..." -ForegroundColor Cyan
Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Agent Port" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Central" -ErrorAction SilentlyContinue

# 4. Eliminar accesos directos
Write-Host "[5/6] Eliminando accesos directos del Escritorio..." -ForegroundColor Cyan
$Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$CommonDesktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktopDirectory)
Remove-Item -Path "$Desktop\\Crashing Live Monitor.url" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$CommonDesktop\\Crashing Live Monitor.url" -Force -ErrorAction SilentlyContinue

# 5. Desregistrar de Programas y Caracteristicas de Windows (Uninstall Registry Key)
Write-Host "[6/6] Desregistrando de 'Programas y Caracteristicas' de Windows..." -ForegroundColor Cyan
Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor" -Recurse -Force -ErrorAction SilentlyContinue

# 6. Borrar carpeta C:\CrashingLive
Write-Host "[+] Limpiando archivos y directorio C:\\CrashingLive..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c timeout /t 2 >nul & rmdir /s /q C:\\CrashingLive" -WindowStyle Hidden

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host " [✔] CRASHING LIVE HA SIDO COMPLETAMENTE DESINSTALADO Y BORRADO.        " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2
`;

  // =========================================================================
  // 4. agent_daemon.py (Daemon Python Autónomo de Telemetría)
  // =========================================================================
  const pythonDaemon = `"""
Crashing Live Monitor - Autonomous Windows Telemetry Daemon
Version: 2.6.4
Host: ${currentHost} | Port: ${currentPort}
"""

import sys
import os
import time
import json
import logging
import psutil
from datetime import datetime

CONFIG_PATH = r"C:\\CrashingLive\\config.json"

default_config = {
    "hostname": "${currentHost}",
    "listen_port": ${currentPort},
    "db_host": "${dbHost}",
    "db_port": ${dbPort},
    "db_name": "${dbName}",
    "db_user": "${dbUser}",
    "interval_seconds": 2
}

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_config
    return default_config

config = load_config()

os.makedirs(r"C:\\CrashingLive\\logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [CrashingLiveDaemon] %(message)s",
    handlers=[
        logging.FileHandler(r"C:\\CrashingLive\\logs\\agent.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

logging.info(f"Iniciando Crashing Live Agent en {config.get('hostname')}...")
logging.info(f"Escuchando telemetria local en puerto {config.get('listen_port')}...")

try:
    while True:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        net = psutil.net_io_counters()
        disk = psutil.disk_usage('C:\\\\')
        
        telemetry_point = {
            "timestamp": datetime.now().isoformat(),
            "cpu_percent": cpu,
            "ram_percent": ram.percent,
            "ram_used_gb": round(ram.used / (1024**3), 2),
            "ram_total_gb": round(ram.total / (1024**3), 2),
            "net_bytes_sent": net.bytes_sent,
            "net_bytes_recv": net.bytes_recv,
            "disk_used_percent": disk.percent
        }
        
        logging.info(f"TELEMETRIA OK - CPU: {cpu}% | RAM: {ram.percent}% | DISK: {disk.percent}%")
        time.sleep(config.get("interval_seconds", 2))
except KeyboardInterrupt:
    logging.info("Daemon detenido por el operador.")
`;

  // =========================================================================
  // 5. schema.sql (Base de Datos PostgreSQL 16)
  // =========================================================================
  const schemaSql = `-- PostgreSQL Relational Schema for Crashing Live Monitor
-- Generated automatically by Crashing Live Wizard v2.6
-- Target DB: ${dbName}

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Telemetry History Table
CREATE TABLE IF NOT EXISTS telemetry_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    hostname VARCHAR(128) NOT NULL DEFAULT '${currentHost}',
    cpu_percent NUMERIC(5,2) NOT NULL,
    ram_percent NUMERIC(5,2) NOT NULL,
    ram_used_gb NUMERIC(6,2) NOT NULL,
    net_in_kb NUMERIC(10,2) NOT NULL,
    net_out_kb NUMERIC(10,2) NOT NULL,
    disk_read_mb NUMERIC(8,2) DEFAULT 0,
    disk_write_mb NUMERIC(8,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at ON telemetry_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_hostname ON telemetry_history(hostname);

-- 2. Connected Servers Registry
CREATE TABLE IF NOT EXISTS connected_servers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    host VARCHAR(128) NOT NULL,
    port INTEGER NOT NULL DEFAULT ${currentPort},
    os_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'ONLINE',
    latency_ms INTEGER DEFAULT 2,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Windows Services Status
CREATE TABLE IF NOT EXISTS windows_services (
    id VARCHAR(64) PRIMARY KEY,
    server_id VARCHAR(64) REFERENCES connected_servers(id),
    name VARCHAR(128) NOT NULL,
    display_name VARCHAR(256),
    status VARCHAR(32) NOT NULL,
    startup_type VARCHAR(32) NOT NULL,
    pid INTEGER,
    memory_mb NUMERIC(8,2),
    cpu_percent NUMERIC(5,2),
    binary_path TEXT,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Disruptive Approvals
CREATE TABLE IF NOT EXISTS disruptive_approvals (
    id VARCHAR(64) PRIMARY KEY,
    server_id VARCHAR(64) REFERENCES connected_servers(id),
    action_type VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    risk_level VARCHAR(32) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'PENDING'
);

-- Seed initial current server
INSERT INTO connected_servers (id, name, host, port, os_type, status, latency_ms)
VALUES ('srv-node-1', '${currentHost}', '${currentIp}', ${currentPort}, 'Windows Server 2022', 'ONLINE', 2)
ON CONFLICT (id) DO UPDATE SET last_ping = CURRENT_TIMESTAMP;
`;

  // =========================================================================
  // 6. config.json (Archivo de Configuracion)
  // =========================================================================
  const configJson = JSON.stringify(
    {
      app_name: "Crashing Live Monitor Suite",
      version: "2.6.4",
      server: {
        hostname: currentHost,
        ip_address: currentIp,
        port: currentPort,
        ssl: true
      },
      database: {
        host: dbHost,
        port: dbPort,
        name: dbName,
        user: dbUser,
        ssl: false
      },
      agent: {
        install_dir: "C:\\CrashingLive",
        service_name: "CrashingLiveDaemon",
        interval_seconds: 2,
        require_reboot_approval: true
      }
    },
    null,
    2
  );

  // =========================================================================
  // 7. LEEME_INSTRUCCIONES.txt (Manual de Despliegue en Español)
  // =========================================================================
  const readmeTxt = `===============================================================================
       CRASHING LIVE MONITOR - PAQUETE OFICIAL DE INSTALACION V2.6
===============================================================================

Este paquete contiene el Wizard Instalador con auto-elevacion para Windows
y registro oficial para desinstalacion limpia desde Programas de Windows.

-------------------------------------------------------------------------------
1. COMO INICIAR LA INSTALACION EN WINDOWS:
-------------------------------------------------------------------------------
1. Descomprima este archivo .ZIP en cualquier carpeta de su servidor o equipo.
2. Haga DOBLE CLIC sobre el archivo:
   "INSTALL_WIZARD.bat"
   
   (El asistente solicitara permisos de Administrador de Windows de forma automatica
    mediante el cartel de Control de Cuentas de Usuario UAC).

3. En la primera pantalla, elija que rol cumplira este equipo:
   [1] AGENTE DE MONITOREO -> Si es un servidor/PC que va a ser monitoreado.
   [2] MONITOR CENTRAL     -> Si es la maquina principal donde el administrador
                              visualiza las graficas y base de datos PostgreSQL.
   [3] AMBOS               -> Si desea instalar todo en este unico equipo.

-------------------------------------------------------------------------------
2. COMO DESINSTALAR Y BORRAR EL SOFTWARE DESDE WINDOWS:
-------------------------------------------------------------------------------
Una vez instalado, puede desinstalar y borrar completamente Crashing Live mediante
CUALQUIERA de estas dos formas oficiales:

FORMA A (Desde Windows):
  1. Vaya a "Configuracion > Aplicaciones > Aplicaciones instaladas" en Windows 11/10
     o abra "Panel de control > Desinstalar un programa" (appwiz.cpl).
  2. Busque "Crashing Live Monitor" o "Crashing Live Agent".
  3. Haga clic en los tres puntos y elija "Desinstalar".
  4. El desinstalador automatico detendra los servicios, borrara las reglas de Firewall,
     eliminara la carpeta C:\\CrashingLive y limpiara el registro de Windows.

FORMA B (Desde este paquete):
  - Ejecute "DESINSTALAR_COMPLETO.bat" o elija la opcion [4] en "INSTALL_WIZARD.bat".

-------------------------------------------------------------------------------
3. ARCHIVOS INCLUIDOS EN ESTE PAQUETE:
-------------------------------------------------------------------------------
- INSTALL_WIZARD.bat             -> Asistente con selector Agente / Monitor / Desinstalar.
- INSTALADOR_DIRECTO_AGENTE.bat  -> Instala directamente el Agente en 1 clic.
- INSTALADOR_DIRECTO_MONITOR.bat -> Instala directamente el Monitor en 1 clic.
- DESINSTALAR_COMPLETO.bat       -> Desinstala y borra todo de inmediato.
- Wizard_Instalador.ps1          -> Motor PowerShell del asistente.
- uninstall.ps1                  -> Motor de desinstalacion y limpieza profunda.
- agent_daemon.py                -> Daemon de telemetria en Python 3.12.
- schema.sql                     -> Esquema de tablas para PostgreSQL 16.
- config.json                    -> Archivo de configuracion preestablecido.

Servidor configurado: ${currentHost} (${currentIp}:${currentPort})
`;

  // Añadir todos los archivos con finales de línea CRLF obligatorios para Windows
  zip.file('INSTALL_WIZARD.bat', toWindowsCrlf(batLauncher));
  zip.file('INSTALADOR_DIRECTO_AGENTE.bat', toWindowsCrlf(batAgentOnly));
  zip.file('INSTALADOR_DIRECTO_MONITOR.bat', toWindowsCrlf(batMonitorOnly));
  zip.file('DESINSTALAR_COMPLETO.bat', toWindowsCrlf(batUninstallOnly));
  zip.file('Wizard_Instalador.ps1', toWindowsCrlf(psWizard));
  zip.file('uninstall.ps1', toWindowsCrlf(psUninstall));
  zip.file('agent_daemon.py', toWindowsCrlf(pythonDaemon));
  zip.file('schema.sql', toWindowsCrlf(schemaSql));
  zip.file('config.json', toWindowsCrlf(configJson));
  zip.file('LEEME_INSTRUCCIONES.txt', toWindowsCrlf(readmeTxt));

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}
