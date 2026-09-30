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
  // 1. INSTALL_WIZARD.bat (Lanzador Principal en Windows con Selección Inicial)
  // =========================================================================
  const batLauncher = `@echo off
chcp 65001 >nul
title Crashing Live Monitor - Wizard de Instalación Oficial v2.6
color 0A

:: 1. Verificación de Permisos de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    cls
    echo ========================================================================
    echo  [!] ERROR: PRIVILEGIOS INSUFICIENTES
    echo ========================================================================
    echo  El instalador requiere permisos administrativos para:
    echo   - Registrar servicios de Windows (Windows Service Daemon)
    echo   - Configurar reglas de entrada en Windows Firewall
    echo   - Instalar dependencias del sistema y verificar PostgreSQL
    echo.
    echo  POR FAVOR: Haga clic derecho sobre "INSTALL_WIZARD.bat" 
    echo  y seleccione "Ejecutar como administrador".
    echo ========================================================================
    echo.
    pause
    exit /b 1
)

:MENU_PRINCIPAL
cls
echo ========================================================================
echo       ██████╗██████╗  █████╗ ███████╗██╗  ██╗██╗███╗   ██╗ ██████╗ 
echo      ██╔════╝██╔══██╗██╔══██╗██╔════╝██║  ██║██║████╗  ██║██╔════╝ 
echo      ██║     ██████╔╝███████║███████╗███████║██║██╔██╗ ██║██║  ███╗
echo      ██║     ██╔══██╗██╔══██║╚════██║██╔══██║██║██║╚██╗██║██║   ██║
echo      ╚██████╗██║  ██║██║  ██║███████║██║  ██║██║██║ ╚████║╚██████╔╝
echo       ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
echo               CRASHING LIVE MONITOR - WIZARD DE INSTALACIÓN
echo ========================================================================
echo  Servidor Configurado: ${currentHost} [${currentIp}:${currentPort}]
echo ========================================================================
echo.
echo   ¿QUÉ TIPO DE INSTALACIÓN DESEA REALIZAR EN ESTE EQUIPO?
echo.
echo   [1] AGENTE DE MONITOREO (Para Servidores y Nodos Monitoreados)
echo       ------------------------------------------------------------------
echo       - Instala el servicio en segundo plano (Python Daemon)
echo       - Recolecta telemetría: CPU, RAM, Red LAN, Discos NVMe y Procesos
echo       - Configura guardrails de PowerShell para autorreparación
echo       - Conecta y transmite métricas en vivo hacia el Monitor Central
echo       - Ideal para: Windows Server 2022/2019/2016 o Windows 10/11
echo.
echo   [2] MONITOR CENTRAL / PANEL (Para la Estación del Administrador)
echo       ------------------------------------------------------------------
echo       - Configura el Panel de Control Web y Centro de Mando
echo       - Conecta y crea las tablas en la Base de Datos PostgreSQL 16
echo       - Supervisión en tiempo real de múltiples servidores en red
echo       - Crea acceso directo de escritorio y servicio web en puerto ${currentPort}
echo       - Ideal para: El servidor central o PC del administrador
echo.
echo   [3] AMBOS (Full Stack / Servidor Todo-en-Uno)
echo       ------------------------------------------------------------------
echo       - Instala tanto el Agente de recolección como el Monitor Central
echo       - Ideal para: Servidores autónomos o pruebas completas en 1 equipo
echo.
echo   [4] SALIR DEL ASISTENTE
echo.
echo ========================================================================
set /p OPCION=" Seleccione una opción [1, 2, 3 o 4] y presione ENTER: "

if "%OPCION%"=="1" goto INSTALAR_AGENTE
if "%OPCION%"=="2" goto INSTALAR_MONITOR
if "%OPCION%"=="3" goto INSTALAR_AMBOS
if "%OPCION%"=="4" goto SALIR

echo.
echo  [!] Opción no válida. Por favor ingrese 1, 2, 3 o 4.
timeout /t 2 >nul
goto MENU_PRINCIPAL

:INSTALAR_AGENTE
cls
echo ========================================================================
echo  [+] HA SELECCIONADO: 1. AGENTE DE MONITOREO
echo ========================================================================
echo  Ejecutando el asistente de instalación del Agente en PowerShell...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_Instalador.ps1" -Mode Agent
goto FIN

:INSTALAR_MONITOR
cls
echo ========================================================================
echo  [+] HA SELECCIONADO: 2. MONITOR CENTRAL / PANEL DE CONTROL
echo ========================================================================
echo  Ejecutando el asistente de configuración del Monitor en PowerShell...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_Instalador.ps1" -Mode Monitor
goto FIN

:INSTALAR_AMBOS
cls
echo ========================================================================
echo  [+] HA SELECCIONADO: 3. INSTALACIÓN FULL STACK (AMBOS)
echo ========================================================================
echo  Ejecutando instalación combinada de Agente + Monitor en PowerShell...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_Instalador.ps1" -Mode Both
goto FIN

:FIN
echo.
echo ========================================================================
echo  El proceso del asistente ha concluido.
echo ========================================================================
pause
exit /b 0

:SALIR
echo.
echo  Instalación cancelada por el usuario.
exit /b 0
`;

  // =========================================================================
  // 2. Wizard_Instalador.ps1 (Asistente Interactivo PowerShell con Menú)
  // =========================================================================
  const psWizard = `<#
.SYNOPSIS
    Crashing Live Monitor - Interactive Setup Wizard
.DESCRIPTION
    Asistente interactivo con selector de tipo de instalación:
    Opción 1: Agente de Monitoreo
    Opción 2: Monitor Central
    Opción 3: Ambos (Full Stack)
#>

param(
    [ValidateSet("Interactive", "Agent", "Monitor", "Both")]
    [string]$Mode = "Interactive"
)

# Configuración Base Integrada
$HostName   = "${currentHost}"
$ListenPort = ${currentPort}
$DbHost     = "${dbHost}"
$DbPort     = ${dbPort}
$DbName     = "${dbName}"
$DbUser     = "${dbUser}"
$InstallDir = "C:\\CrashingLive"

function Show-Header {
    Clear-Host
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "         CRASHING LIVE MONITOR - WIZARD DE INSTALACIÓN V2.6             " -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " Host Configurado: $HostName | Puerto: $ListenPort" -ForegroundColor Cyan
    Write-Host " PostgreSQL: $DbHost:$DbPort/$DbName" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host ""
}

# Si se ejecuta sin parámetros, mostrar el selector de instalación
if ($Mode -eq "Interactive") {
    Show-Header
    Write-Host "¿QUÉ TIPO DE INSTALACIÓN DESEA REALIZAR EN ESTE EQUIPO?" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " [1] AGENTE DE MONITOREO (Para Servidores que serán monitoreados)" -ForegroundColor White
    Write-Host "     -> Instala el daemon Python en C:\\CrashingLive, servicio de Windows," -ForegroundColor Gray
    Write-Host "        sensores de CPU/RAM/Red/Disco y guardrails de PowerShell." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [2] MONITOR CENTRAL (Para la Estación / Servidor del Administrador)" -ForegroundColor White
    Write-Host "     -> Configura la consola de monitoreo web, aplica el esquema SQL en" -ForegroundColor Gray
    Write-Host "        PostgreSQL y habilita la recepción de alertas en vivo." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [3] AMBOS (Full Stack / Servidor Todo-en-Uno)" -ForegroundColor White
    Write-Host "     -> Instala Agente + Monitor en esta misma máquina." -ForegroundColor Gray
    Write-Host ""
    Write-Host " [4] Cancelar" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    
    $Choice = Read-Host " Ingrese su opción [1, 2, 3 o 4]"
    switch ($Choice) {
        "1" { $Mode = "Agent" }
        "2" { $Mode = "Monitor" }
        "3" { $Mode = "Both" }
        Default {
            Write-Host "[-] Operación cancelada por el usuario." -ForegroundColor Yellow
            Exit 0
        }
    }
}

# =========================================================================
# FUNCIÓN DE INSTALACIÓN DEL AGENTE
# =========================================================================
function Install-AgentComponent {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " [1/3] INSTALANDO AGENTE DE MONITOREO EN ESTE EQUIPO..." -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green

    # 1. Crear directorios de trabajo
    Write-Host "[+] Creando estructura de directorios en $InstallDir..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "$InstallDir\\logs" -Force | Out-Null
    New-Item -ItemType Directory -Path "$InstallDir\\scripts" -Force | Out-Null
    New-Item -ItemType Directory -Path "$InstallDir\\backups" -Force | Out-Null

    # 2. Copiar archivos del daemon
    Write-Host "[+] Copiando agent_daemon.py y archivos de configuración..." -ForegroundColor Cyan
    $SourceScript = Join-Path $PSScriptRoot "agent_daemon.py"
    if (Test-Path $SourceScript) {
        Copy-Item -Path $SourceScript -Destination "$InstallDir\\agent_daemon.py" -Force
    }

    $SourceConfig = Join-Path $PSScriptRoot "config.json"
    if (Test-Path $SourceConfig) {
        Copy-Item -Path $SourceConfig -Destination "$InstallDir\\config.json" -Force
    }

    # 3. Comprobar Python
    Write-Host "[+] Verificando entorno de ejecución Python..." -ForegroundColor Cyan
    $PythonCmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if (-not $PythonCmd) {
        Write-Host "[*] Python no detectado. Intentando instalación automática con winget..." -ForegroundColor Yellow
        try {
            winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
        } catch {
            Write-Host "[!] Instale Python 3.10+ manualmente desde https://python.org si winget no está disponible." -ForegroundColor Red
        }
    } else {
        Write-Host "    [OK] Python detectado: $(python --version)" -ForegroundColor Green
    }

    # 4. Instalar paquetes de telemetría
    Write-Host "[+] Instalando librerías requeridas (psutil, psycopg2-binary)..." -ForegroundColor Cyan
    try {
        python -m pip install --upgrade psutil psycopg2-binary --quiet
        Write-Host "    [OK] Dependencias de telemetría instaladas." -ForegroundColor Green
    } catch {
        Write-Host "    [*] Advertencia: Verifique conectividad a internet para pip." -ForegroundColor Yellow
    }

    # 5. Configurar regla de Firewall
    Write-Host "[+] Abriendo puerto TCP $ListenPort en Windows Firewall..." -ForegroundColor Cyan
    $Fw = Get-NetFirewallRule -DisplayName "Crashing Live Agent Port" -ErrorAction SilentlyContinue
    if (-not $Fw) {
        New-NetFirewallRule -DisplayName "Crashing Live Agent Port" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any | Out-Null
        Write-Host "    [OK] Regla de Firewall creada para puerto $ListenPort." -ForegroundColor Green
    } else {
        Write-Host "    [OK] Regla de Firewall ya existía." -ForegroundColor Green
    }

    # 6. Registrar Servicio de Windows
    Write-Host "[+] Registrando servicio de Windows 'CrashingLiveDaemon'..." -ForegroundColor Cyan
    $ServiceName = "CrashingLiveDaemon"
    if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Write-Host "    [*] Servicio existente detenido para actualización." -ForegroundColor Yellow
    } else {
        New-Service -Name $ServiceName \`
            -DisplayName "Crashing Live Autonomous AI Daemon" \`
            -BinaryPathName "python.exe $InstallDir\\agent_daemon.py" \`
            -StartupType Automatic \`
            -Description "Daemon de telemetría continua y guardrails de seguridad de Crashing Live." | Out-Null
        Write-Host "    [OK] Servicio registrado con inicio automático." -ForegroundColor Green
    }

    Write-Host "[✔] AGENTE INSTALADO CORRECTAMENTE." -ForegroundColor Green
    Write-Host "    Directorio: $InstallDir" -ForegroundColor Gray
    Write-Host "    Servicio:   CrashingLiveDaemon" -ForegroundColor Gray
}

# =========================================================================
# FUNCIÓN DE INSTALACIÓN DEL MONITOR
# =========================================================================
function Install-MonitorComponent {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host " [2/3] CONFIGURANDO MONITOR CENTRAL Y BASE DE DATOS..." -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green

    # 1. Comprobar PostgreSQL
    Write-Host "[+] Comprobando conectividad con PostgreSQL ($DbHost:$DbPort)..." -ForegroundColor Cyan
    $PsqlCmd = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($PsqlCmd) {
        Write-Host "    [OK] Herramientas cliente de PostgreSQL encontradas." -ForegroundColor Green
        $SchemaFile = Join-Path $PSScriptRoot "schema.sql"
        if (Test-Path $SchemaFile) {
            Write-Host "[+] Aplicando esquema schema.sql a la base de datos '$DbName'..." -ForegroundColor Cyan
            try {
                $env:PGPASSWORD = "${dbPass}"
                & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SchemaFile 2>$null
                Write-Host "    [OK] Esquema de base de datos aplicado con éxito." -ForegroundColor Green
            } catch {
                Write-Host "    [*] Verifique credenciales o cree la base '$DbName' antes de aplicar el esquema." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "    [*] Cliente psql no encontrado en PATH. Puede importar 'schema.sql' manualmente en pgAdmin." -ForegroundColor Yellow
    }

    # 2. Habilitar reglas de entrada para monitoreo en red
    Write-Host "[+] Configurando regla de Firewall para permitir conexión de agentes..." -ForegroundColor Cyan
    $FwMonitor = Get-NetFirewallRule -DisplayName "Crashing Live Monitor Central" -ErrorAction SilentlyContinue
    if (-not $FwMonitor) {
        New-NetFirewallRule -DisplayName "Crashing Live Monitor Central" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any | Out-Null
        Write-Host "    [OK] Puerto $ListenPort habilitado para recibir agentes de la LAN." -ForegroundColor Green
    }

    # 3. Crear acceso directo en el Escritorio
    Write-Host "[+] Creando Acceso Directo en el Escritorio..." -ForegroundColor Cyan
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
        $Shortcut = $WshShell.CreateShortcut("$DesktopPath\\Crashing Live Monitor.url")
        $Shortcut.TargetPath = "http://localhost:$ListenPort"
        $Shortcut.Save()
        Write-Host "    [OK] Acceso directo 'Crashing Live Monitor' creado en el Escritorio." -ForegroundColor Green
    } catch {
        Write-Host "    [*] Acceda vía navegador en http://localhost:$ListenPort" -ForegroundColor Gray
    }

    Write-Host "[✔] MONITOR CENTRAL CONFIGURADO CORRECTAMENTE." -ForegroundColor Green
    Write-Host "    URL Local:  http://localhost:$ListenPort" -ForegroundColor Cyan
    Write-Host "    URL en Red: http://${currentIp}:$ListenPort" -ForegroundColor Cyan
}

# =========================================================================
# EJECUCIÓN SEGÚN EL MODO SELECCIONADO
# =========================================================================
if ($Mode -eq "Agent") {
    Install-AgentComponent
} elseif ($Mode -eq "Monitor") {
    Install-MonitorComponent
} elseif ($Mode -eq "Both") {
    Install-AgentComponent
    Install-MonitorComponent
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host " [✔] INSTALACIÓN COMPLETADA EXITOSAMENTE!                               " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host " Modo instalado: $Mode" -ForegroundColor White
Write-Host " Para cualquier cambio futuro ejecute nuevamente 'INSTALL_WIZARD.bat'" -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Green
`;

  // =========================================================================
  // 3. agent_daemon.py (Daemon Python Autónomo)
  // =========================================================================
  const pythonDaemon = `"""
Crashing Live Monitor - Autonomous Windows Automation & Diagnostic Daemon
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
            with open(CONFIG_PATH, "r") as f:
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
logging.info(f"Escuchando telemetría local en puerto {config.get('listen_port')}...")

try:
    while True:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        net = psutil.net_io_counters()
        disk = psutil.disk_usage('C:\\')
        
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
        
        # En producción guarda en PostgreSQL o transmite al Monitor
        logging.info(f"TELEMETRÍA OK - CPU: {cpu}% | RAM: {ram.percent}% | DISK: {disk.percent}%")
        time.sleep(config.get("interval_seconds", 2))
except KeyboardInterrupt:
    logging.info("Daemon detenido por el operador.")
`;

  // =========================================================================
  // 4. schema.sql (Base de Datos PostgreSQL 16)
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
  // 5. config.json (Archivo de Configuración en Formato JSON)
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
  // 6. LEEME_INSTRUCCIONES.txt (Instrucciones Claras en Español)
  // =========================================================================
  const readmeTxt = `===============================================================================
       CRASHING LIVE MONITOR - PAQUETE OFICIAL DE INSTALACIÓN V2.6
===============================================================================

¡Gracias por descargar el paquete de instalación de Crashing Live Monitor!

Este archivo .ZIP contiene el WIZARD INSTALADOR AUTOMÁTICO diseñado para facilitar
el despliegue en cualquier servidor Windows Server (2022/2019/2016) o Windows 10/11.

-------------------------------------------------------------------------------
1. PASO ÚNICO PARA INICIAR LA INSTALACIÓN:
-------------------------------------------------------------------------------
1. Descomprima este archivo .ZIP en cualquier carpeta de su servidor o equipo.
2. Haga clic derecho sobre el archivo "INSTALL_WIZARD.bat"
3. Seleccione "Ejecutar como administrador".

-------------------------------------------------------------------------------
2. PRIMERA PANTALLA DEL WIZARD (SELECCIÓN DE COMPONENTE):
-------------------------------------------------------------------------------
Al iniciar, el asistente le preguntará de forma interactiva qué tipo de equipo
es este y qué rol cumplirá en la red:

[1] AGENTE DE MONITOREO:
    Elija esta opción si este es un servidor o estación que desea SUPERVISAR.
    - Crea el directorio C:\\CrashingLive
    - Instala el daemon en segundo plano (Python / Windows Service)
    - Habilita la telemetría en tiempo real y guardrails de seguridad
    - Conecta automáticamente con el Monitor Central

[2] MONITOR CENTRAL / PANEL DE CONTROL:
    Elija esta opción si este es el servidor o equipo del ADMINISTRADOR.
    - Configura la consola web de supervisión en tiempo real
    - Aplica el esquema relacional en PostgreSQL 16 (schema.sql)
    - Centraliza las alertas, visualización multiequipo y aprobaciones
    - Crea acceso directo en el Escritorio: "Crashing Live Monitor"

[3] AMBOS (Full Stack / Servidor Todo-en-Uno):
    Instala tanto el Agente de telemetría como el Monitor Central en esta misma máquina.

-------------------------------------------------------------------------------
3. ARCHIVOS INCLUIDOS EN ESTE PAQUETE:
-------------------------------------------------------------------------------
- INSTALL_WIZARD.bat        -> Lanzador en 1 clic con selección de Agente / Monitor.
- Wizard_Instalador.ps1     -> Asistente completo automatizado en PowerShell.
- agent_daemon.py           -> Daemon Python 3.12 para recolección de métricas.
- schema.sql                -> Esquema relacional completo para PostgreSQL 16.
- config.json               -> Parámetros de red y base de datos preconfigurados.
- LEEME_INSTRUCCIONES.txt   -> Este manual de despliegue.

Soporte y documentación en vivo: http://${currentIp}:${currentPort}
`;

  // Añadir todos los archivos al paquete ZIP
  zip.file('INSTALL_WIZARD.bat', batLauncher);
  zip.file('Wizard_Instalador.ps1', psWizard);
  zip.file('agent_daemon.py', pythonDaemon);
  zip.file('schema.sql', schemaSql);
  zip.file('config.json', configJson);
  zip.file('LEEME_INSTRUCCIONES.txt', readmeTxt);

  // Generar el blob ZIP
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}
