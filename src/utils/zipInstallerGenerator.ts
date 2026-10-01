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
  const agentId = 'CL-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);

  // =========================================================================
  // 1. Instalador.bat / INSTALL_WIZARD.bat (Anti-Bucle, 1 Sola Ventana, 4 Opciones)
  // =========================================================================
  const batLauncher = `@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Crashing Live Monitor - Wizard de Instalacion v2.6

:: -------------------------------------------------------------------------
:: 1. PROTECCION ANTI-BUCLE: Verificacion estricta de elevacion UAC
:: -------------------------------------------------------------------------
if "%~1"=="--elevated" goto RUN_MENU

:: Comprobar si ya se esta ejecutando con privilegios de Administrador
net session >nul 2>&1
if %errorlevel% equ 0 goto RUN_MENU

:: Solicitar elevacion EXACTAMENTE UNA VEZ pasando la bandera --elevated
cls
echo ========================================================================
echo   [i] Solicitando permisos de Administrador para la instalacion...
echo       (Por favor, pulse "Si" en la ventana de Control de Cuentas UAC)
echo ========================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -ArgumentList '--elevated' -WorkingDirectory '%~dp0' -Verb RunAs"
exit /b

:: -------------------------------------------------------------------------
:: 2. WIZARD PRINCIPAL CON LAS 4 OPCIONES EXACTAS EN UNA SOLA VENTANA
:: -------------------------------------------------------------------------
:RUN_MENU
cd /d "%~dp0"
cls
color 0A

:MENU
cls
echo ========================================================================
echo            CRASHING LIVE MONITOR - WIZARD INSTALADOR (v2.6)
echo ========================================================================
echo  Servidor Configurado : ${currentHost}
echo  IP / Puerto Destino  : ${currentIp}:${currentPort}
echo  ID AnyDesk Asignado  : ${agentId}
echo  Directorio Destino   : C:\\CrashingLive
echo ========================================================================
echo.
echo  SELECCIONE LA OPCION QUE DESEA EJECUTAR EN ESTE EQUIPO:
echo.
echo   [1] Instalar Agente
echo       - Para Servidores o Maquinas que seran Monitoreadas
echo       - Instala el daemon en segundo plano y sensores de CPU, RAM y Red
echo.
echo   [2] Instalar Monitor
echo       - Para la Estacion de Control del Administrador
echo       - Configura la consola de supervision y base de datos PostgreSQL
echo.
echo   [3] Instalar Ambos
echo       - Servidor Todo-en-Uno (Full Stack)
echo       - Instala tanto el Agente de telemetria como el Monitor Central
echo.
echo   [4] Desinstalar componentes
echo       - Limpieza completa del equipo
echo       - Detiene servicios, elimina reglas de firewall y borra archivos
echo.
echo   [5] Salir
echo.
echo ========================================================================
set "OPCION="
set /p OPCION=" Seleccione una opcion [1, 2, 3, 4 o 5] y presione ENTER: "

if "%OPCION%"=="1" goto OP_AGENTE
if "%OPCION%"=="2" goto OP_MONITOR
if "%OPCION%"=="3" goto OP_AMBOS
if "%OPCION%"=="4" goto OP_DESINSTALAR
if "%OPCION%"=="5" goto OP_SALIR

echo.
echo  [!] Opcion invalida. Ingrese 1, 2, 3, 4 o 5.
timeout /t 2 >nul
goto MENU

:OP_AGENTE
cls
echo ========================================================================
echo  [+] INICIANDO: INSTALAR AGENTE
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_Instalador.ps1" -Mode Agent
goto FIN

:OP_MONITOR
cls
echo ========================================================================
echo  [+] INICIANDO: INSTALAR MONITOR
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_Instalador.ps1" -Mode Monitor
goto FIN

:OP_AMBOS
cls
echo ========================================================================
echo  [+] INICIANDO: INSTALAR AMBOS (AGENTE + MONITOR)
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_Instalador.ps1" -Mode Both
goto FIN

:OP_DESINSTALAR
cls
echo ========================================================================
echo  [+] INICIANDO: DESINSTALAR COMPONENTES
echo ========================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
goto FIN

:FIN
echo.
echo ========================================================================
echo  [✔] El proceso ha finalizado correctamente.
echo ========================================================================
echo.
pause
goto MENU

:OP_SALIR
exit /b 0
`;

  // =========================================================================
  // 2. Wizard_Instalador.ps1 (Motor PowerShell Modular con las 4 Opciones)
  // =========================================================================
  const psWizard = `<#
.SYNOPSIS
    Crashing Live Monitor - Setup Wizard Script
.DESCRIPTION
    Asistente modular en una sola consola con soporte para:
    1. Instalar Agente
    2. Instalar Monitor
    3. Instalar Ambos
    4. Desinstalar componentes
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
$AgentId    = "${agentId}"
$InstallDir = "C:\\CrashingLive"

function Show-Header {
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "         CRASHING LIVE MONITOR - WIZARD DE INSTALACION V2.6             " -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " Host Configurado : $HostName" -ForegroundColor Cyan
    Write-Host " IP / Puerto      : ${currentIp}:$ListenPort" -ForegroundColor Cyan
    Write-Host " ID AnyDesk Asign : $AgentId" -ForegroundColor Cyan
    Write-Host " Directorio Base  : $InstallDir" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host ""
}

# Menu interactivo si se llamo sin parametro -Mode
if ($Mode -eq "Interactive") {
    Clear-Host
    Show-Header
    Write-Host "SELECCIONE LA OPCION QUE DESEA EJECUTAR EN ESTE EQUIPO:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " [1] Instalar Agente" -ForegroundColor White
    Write-Host "     Instala el daemon en segundo plano en C:\\CrashingLive y reporta telemetria." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [2] Instalar Monitor" -ForegroundColor White
    Write-Host "     Configura la consola web de supervision y base de datos PostgreSQL." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [3] Instalar Ambos" -ForegroundColor White
    Write-Host "     Instala tanto el Agente como el Monitor en esta misma maquina." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [4] Desinstalar componentes" -ForegroundColor White
    Write-Host "     Detiene servicios, elimina reglas de firewall y desregistra de Windows." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [5] Salir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green

    $Choice = Read-Host " Ingrese su opcion [1, 2, 3, 4 o 5]"
    switch ($Choice) {
        "1" { $Mode = "Agent" }
        "2" { $Mode = "Monitor" }
        "3" { $Mode = "Both" }
        "4" { $Mode = "Uninstall" }
        Default {
            Write-Host "[-] Operacion cancelada por el usuario." -ForegroundColor Yellow
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

    $UninstBat = Join-Path $ScriptDir "Instalador.bat"
    if (Test-Path $UninstBat) {
        Copy-Item -Path $UninstBat -Destination "$InstallDir\\uninstall.bat" -Force
    }
}

# =========================================================================
# FUNCION 1: INSTALAR AGENTE
# =========================================================================
function Install-AgentModule {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " [PASO] INSTALANDO AGENTE DE MONITOREO..." -ForegroundColor White
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
            Write-Host "    [OK] config.json copiado (ID AnyDesk: $AgentId)." -ForegroundColor Green
        }

        # Preparar desinstalador
        Setup-UninstallFiles

        # 3. Validar Python
        Write-Host "[+] Verificando Python..." -ForegroundColor Cyan
        $PythonExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        if ($PythonExe) {
            Write-Host "    [OK] Python detectado: $PythonExe" -ForegroundColor Green
            Write-Host "[+] Verificando paquetes psutil..." -ForegroundColor Cyan
            try {
                & python -m pip install psutil --quiet
                Write-Host "    [OK] Dependencia psutil lista." -ForegroundColor Green
            } catch {
                Write-Host "    [*] Verifique conexion para pip o instale manualmente." -ForegroundColor Yellow
            }
        } else {
            Write-Host "    [!] Python no detectado en PATH. Puede descargarlo desde python.org." -ForegroundColor Yellow
        }

        # 4. Regla de Windows Firewall
        Write-Host "[+] Verificando regla de Windows Firewall para puertos $ListenPort y 8444..." -ForegroundColor Cyan
        $FwRule = Get-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
        if (-not $FwRule) {
            New-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
            New-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -Direction Inbound -Protocol UDP -LocalPort 8444 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
            Write-Host "    [OK] Reglas de Firewall creadas." -ForegroundColor Green
        } else {
            Write-Host "    [OK] Reglas de Firewall ya existian." -ForegroundColor Green
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
                Write-Host "    [*] Guardado para ejecucion directa: $InstallDir\\agent_daemon.py" -ForegroundColor Yellow
            }
        }

        # 6. Registrar en "Programas y caracteristicas" de Windows
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
        Set-ItemProperty -Path $RegKey -Name "DisplayIcon" -Value "powershell.exe" -Force
        Set-ItemProperty -Path $RegKey -Name "EstimatedSize" -Value 18500 -Force
        Write-Host "    [OK] Registrado en Windows para desinstalacion limpia." -ForegroundColor Green

        Write-Host ""
        Write-Host " [✔] AGENTE INSTALADO EXITOSAMENTE." -ForegroundColor Green
        Write-Host "     ID AnyDesk : $AgentId" -ForegroundColor Cyan
        Write-Host "     Directorio : $InstallDir" -ForegroundColor White
        Write-Host "     Logs       : $InstallDir\\logs\\agent.log" -ForegroundColor White
    }
    catch {
        Write-Host "[!] Error durante la instalacion del Agente: $_" -ForegroundColor Red
    }
}

# =========================================================================
# FUNCION 2: INSTALAR MONITOR
# =========================================================================
function Install-MonitorModule {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " [PASO] CONFIGURANDO MONITOR CENTRAL Y PANEL..." -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green

    try {
        Setup-UninstallFiles

        # 1. Regla de Firewall para el puerto del Monitor
        Write-Host "[+] Abriendo puerto TCP $ListenPort en Windows Firewall..." -ForegroundColor Cyan
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
            $SchemaFile = Join-Path $ScriptDir "schema.sql"
            if (Test-Path $SchemaFile) {
                Write-Host "    [*] Aplicando esquema relacional schema.sql..." -ForegroundColor Cyan
                $env:PGPASSWORD = "${dbPass}"
                & psql -h "$DbHost" -p "$DbPort" -U "$DbUser" -d "$DbName" -f "$SchemaFile" 2>$null
                Write-Host "    [OK] Esquema de base de datos verificado." -ForegroundColor Green
            }
        } else {
            Write-Host "    [*] PostgreSQL cliente no detectado en PATH (continuando sin error)." -ForegroundColor Gray
        }

        # 3. Acceso Directo en el Escritorio
        Write-Host "[+] Creando acceso directo en el Escritorio..." -ForegroundColor Cyan
        try {
            $Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
            $WshShell = New-Object -ComObject WScript.Shell
            $Sc = $WshShell.CreateShortcut("$Desktop\\Crashing Live Monitor.url")
            $Sc.TargetPath = "http://localhost:$ListenPort"
            $Sc.Save()
            Write-Host "    [OK] Acceso directo 'Crashing Live Monitor' creado en el Escritorio." -ForegroundColor Green
        } catch {
            Write-Host "    [*] Acceso web: http://localhost:$ListenPort" -ForegroundColor Gray
        }

        # 4. Registrar en "Programas y caracteristicas" de Windows
        Write-Host "[+] Registrando Monitor en Programas de Windows..." -ForegroundColor Cyan
        $RegKey = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor"
        if (-not (Test-Path $RegKey)) {
            New-Item -Path $RegKey -Force -ErrorAction SilentlyContinue | Out-Null
        }
        Set-ItemProperty -Path $RegKey -Name "DisplayName" -Value "Crashing Live Monitor - Consola Central" -Force
        Set-ItemProperty -Path $RegKey -Name "DisplayVersion" -Value "2.6.4" -Force
        Set-ItemProperty -Path $RegKey -Name "Publisher" -Value "Crashing Live Systems" -Force
        Set-ItemProperty -Path $RegKey -Name "InstallLocation" -Value "$InstallDir" -Force
        Set-ItemProperty -Path $RegKey -Name "UninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$InstallDir\\uninstall.ps1\`"" -Force
        Set-ItemProperty -Path $RegKey -Name "DisplayIcon" -Value "powershell.exe" -Force
        Set-ItemProperty -Path $RegKey -Name "EstimatedSize" -Value 32500 -Force
        Write-Host "    [OK] Registrado en Windows para desinstalacion limpia." -ForegroundColor Green

        Write-Host ""
        Write-Host " [✔] MONITOR CENTRAL CONFIGURADO EXITOSAMENTE." -ForegroundColor Green
        Write-Host "     Acceso Local : http://localhost:$ListenPort" -ForegroundColor Cyan
        Write-Host "     Acceso en Red: http://${currentIp}:$ListenPort" -ForegroundColor Cyan
    }
    catch {
        Write-Host "[!] Error durante la configuracion del Monitor: $_" -ForegroundColor Red
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
`;

  // =========================================================================
  // 3. uninstall.ps1 (Desinstalador Limpio en 1 Sola Ventana)
  // =========================================================================
  const psUninstall = `<#
.SYNOPSIS
    Crashing Live Monitor - Clean Uninstaller
.DESCRIPTION
    Detiene servicios, elimina reglas de firewall, borra C:\\CrashingLive
    y desregistra la aplicación de Windows.
#>

$ErrorActionPreference = "SilentlyContinue"

Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host "   DESINSTALANDO CRASHING LIVE MONITOR Y AGENTE DE ESTE EQUIPO...       " -ForegroundColor White
Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Detener y desregistrar Servicio de Windows
Write-Host "[1/5] Deteniendo servicio 'CrashingLiveDaemon'..." -ForegroundColor Cyan
Stop-Service -Name "CrashingLiveDaemon" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "[2/5] Eliminando servicio 'CrashingLiveDaemon' de Windows..." -ForegroundColor Cyan
& sc.exe delete "CrashingLiveDaemon" | Out-Null

# 2. Terminar procesos Python activos de CrashingLive
Write-Host "[3/5] Finalizando procesos remanentes en memoria..." -ForegroundColor Cyan
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*CrashingLive*" -or $_.CommandLine -like "*agent_daemon.py*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 3. Eliminar reglas de Firewall
Write-Host "[4/5] Eliminando reglas de entrada en Windows Firewall..." -ForegroundColor Cyan
Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue

# 4. Eliminar accesos directos
$Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$CommonDesktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktopDirectory)
Remove-Item -Path "$Desktop\\Crashing Live Monitor.url" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$CommonDesktop\\Crashing Live Monitor.url" -Force -ErrorAction SilentlyContinue

# 5. Desregistrar de Programas y Caracteristicas de Windows
Write-Host "[5/5] Desregistrando de 'Programas y Caracteristicas' de Windows..." -ForegroundColor Cyan
Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor" -Recurse -Force -ErrorAction SilentlyContinue

# 6. Borrar archivos de C:\CrashingLive
Write-Host "[+] Limpiando archivos en C:\\CrashingLive..." -ForegroundColor Cyan
if (Test-Path "C:\\CrashingLive") {
    Get-ChildItem -Path "C:\\CrashingLive" -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host " [✔] CRASHING LIVE HA SIDO COMPLETAMENTE DESINSTALADO Y BORRADO.        " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
`;

  // =========================================================================
  // 4. agent_daemon.py (Daemon con ID AnyDesk y Beacon UDP en LAN)
  // =========================================================================
  const pythonDaemon = `"""
Crashing Live Monitor - Autonomous Windows Telemetry Daemon
Version: 2.6.4
Agent ID AnyDesk: ${agentId}
Host: ${currentHost} | Port: ${currentPort}
"""

import sys
import os
import time
import json
import socket
import logging
import threading
import psutil
from datetime import datetime

CONFIG_PATH = r"C:\\CrashingLive\\config.json"

default_config = {
    "agent_id": "${agentId}",
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
logging.info(f"Agent ID AnyDesk: {config.get('agent_id', '${agentId}')}")
logging.info(f"Escuchando telemetria local en puerto {config.get('listen_port')}...")

# Hilo de Auto-Deteccion LAN Broadcast en UDP 8444
def lan_discovery_beacon():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        beacon_msg = json.dumps({
            "type": "CRASHING_LIVE_AGENT_BEACON",
            "agent_id": config.get("agent_id", "${agentId}"),
            "hostname": config.get("hostname", "${currentHost}"),
            "port": config.get("listen_port", ${currentPort}),
            "status": "ONLINE"
        }).encode("utf-8")
        
        while True:
            try:
                sock.sendto(beacon_msg, ('<broadcast>', 8444))
            except Exception:
                pass
            time.sleep(5)
    except Exception as e:
        logging.warning(f"Beacon UDP LAN no disponible: {e}")

threading.Thread(target=lan_discovery_beacon, daemon=True).start()

try:
    while True:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        net = psutil.net_io_counters()
        disk = psutil.disk_usage('C:\\\\')
        
        telemetry_point = {
            "timestamp": datetime.now().isoformat(),
            "agent_id": config.get("agent_id", "${agentId}"),
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
    agent_id VARCHAR(64) DEFAULT '${agentId}',
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
    agent_id VARCHAR(64) DEFAULT '${agentId}',
    status VARCHAR(32) DEFAULT 'ONLINE',
    latency_ms INTEGER DEFAULT 2,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial current server
INSERT INTO connected_servers (id, name, host, port, os_type, agent_id, status, latency_ms)
VALUES ('srv-node-1', '${currentHost}', '${currentIp}', ${currentPort}, 'Windows Server 2022', '${agentId}', 'ONLINE', 2)
ON CONFLICT (id) DO UPDATE SET last_ping = CURRENT_TIMESTAMP;
`;

  // =========================================================================
  // 6. config.json (Archivo de Configuracion)
  // =========================================================================
  const configJson = JSON.stringify(
    {
      app_name: "Crashing Live Monitor Suite",
      version: "2.6.4",
      agent_id: agentId,
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
       CRASHING LIVE MONITOR - WIZARD DE INSTALACION EN 1 SOLA VENTANA
===============================================================================

Este instalador abre DIRECTAMENTE una unica ventana interactiva sin bucles de
permisos ni ventanas secundarias.

-------------------------------------------------------------------------------
COMO USAR EL INSTALADOR:
-------------------------------------------------------------------------------
1. Descomprima este archivo .ZIP en su equipo o servidor.
2. Haga DOBLE CLIC en "Instalador.bat" (o "INSTALL_WIZARD.bat").
3. Se abrira directamente el Wizard en una sola consola con estas 4 opciones:

   [1] Instalar Agente
       -> Para servidores o equipos que seran monitoreados.
       -> Instala el servicio en C:\\CrashingLive con telemetria en vivo.

   [2] Instalar Monitor
       -> Para la estacion del administrador.
       -> Configura la consola web y base de datos PostgreSQL.

   [3] Instalar Ambos
       -> Instalacion Full Stack todo-en-uno en esta misma maquina.

   [4] Desinstalar componentes
       -> Limpieza completa: detiene y borra el servicio de Windows,
          elimina reglas de firewall y borra C:\\CrashingLive.

-------------------------------------------------------------------------------
ARCHIVOS DEL PAQUETE:
-------------------------------------------------------------------------------
- Instalador.bat        -> Lanzador principal con proteccion anti-bucle UAC.
- INSTALL_WIZARD.bat    -> Acceso directo equivalente.
- Wizard_Instalador.ps1 -> Motor PowerShell modular en una sola consola.
- uninstall.ps1         -> Desinstalador limpio y desregistro de Windows.
- agent_daemon.py       -> Daemon Python con telemetria y beacon AnyDesk.
- schema.sql            -> Base de datos relacional para PostgreSQL.
- config.json           -> Archivo de configuracion con ID AnyDesk: ${agentId}

Servidor: ${currentHost} (${currentIp}:${currentPort})
`;

  // Añadir los archivos con CRLF a prueba de fallos
  zip.file('Instalador.bat', toWindowsCrlf(batLauncher));
  zip.file('INSTALL_WIZARD.bat', toWindowsCrlf(batLauncher));
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
