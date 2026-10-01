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
 * Crucial para que batch scripts y powershell en Windows no fallen.
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
  // 1. Instalador.vbs (Lanzador 100% Silencioso sin ventana CMD)
  // =========================================================================
  const vbsLauncher = `' Crashing Live Monitor - Lanzador de Asistente Grafico GUI
Set WshShell = CreateObject("WScript.Shell")
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\\"))
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strPath & "Wizard_GUI.ps1""", 0, False
Set WshShell = Nothing
`;

  // =========================================================================
  // 2. Instalador.bat (Lanzador rapido que cierra la consola y abre el GUI)
  // =========================================================================
  const batLauncher = `@echo off
setlocal
cd /d "%~dp0"
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Wizard_GUI.ps1"
exit /b 0
`;

  // =========================================================================
  // 3. Wizard_GUI.ps1 (ASISTENTE VISUAL GRAFICO WINDOWS FORMS EN PROGRAM FILES)
  // =========================================================================
  const psGuiWizard = `<#
.SYNOPSIS
    Crashing Live Monitor - Asistente Grafico de Instalacion (Windows GUI)
.DESCRIPTION
    Abre una ventana grafica nativa moderna (sin consola CMD).
    Instala obligatoriamente en C:\\Program Files\\CrashingLive.
    Ofrece las 4 opciones oficiales:
      [1] Instalar Agente
      [2] Instalar Monitor
      [3] Instalar Ambos
      [4] Desinstalar componentes
#>

# 1. Comprobacion y elevacion de permisos de Administrador transparente (sin CMD)
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$PSCommandPath\`"" -Verb RunAs
    Exit
}

# 2. Cargar ensamblados de Windows Forms y Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# Parametros del Servidor
$HostName   = "${currentHost}"
$ListenPort = ${currentPort}
$DbHost     = "${dbHost}"
$DbPort     = ${dbPort}
$DbName     = "${dbName}"
$DbUser     = "${dbUser}"
$AgentId    = "${agentId}"

# RUTA OFICIAL EN PROGRAM FILES
$ProgFiles = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
if (-not $ProgFiles) { $ProgFiles = $env:ProgramFiles }
if (-not $ProgFiles) { $ProgFiles = "C:\\Program Files" }
$InstallDir = Join-Path $ProgFiles "CrashingLive"

$ScriptDir = Split-Path -Parent $PSCommandPath
if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }

# Crear Ventana Principal
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Crashing Live Monitor - Asistente de Instalación v2.6"
$Form.Size = New-Object System.Drawing.Size(700, 620)
$Form.StartPosition = "CenterScreen"
$Form.FormBorderStyle = "FixedDialog"
$Form.MaximizeBox = $false
$Form.BackColor = [System.Drawing.Color]::FromArgb(15, 15, 18)
$Form.ForeColor = [System.Drawing.Color]::White
$Form.Font = New-Object System.Drawing.Font("Segoe UI", 9)

# -------------------------------------------------------------------------
# ENCABEZADO MODERNO
# -------------------------------------------------------------------------
$HeaderPanel = New-Object System.Windows.Forms.Panel
$HeaderPanel.Size = New-Object System.Drawing.Size(700, 95)
$HeaderPanel.Location = New-Object System.Drawing.Point(0, 0)
$HeaderPanel.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 27)

$TitleLabel = New-Object System.Windows.Forms.Label
$TitleLabel.Text = "CRASHING LIVE MONITOR - WIZARD DE INSTALACIÓN"
$TitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$TitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
$TitleLabel.Location = New-Object System.Drawing.Point(25, 15)
$TitleLabel.AutoSize = $true

$SubtitleLabel = New-Object System.Windows.Forms.Label
$SubtitleLabel.Text = "Servidor: $HostName  |  Puerto: $ListenPort  |  AnyDesk ID: $AgentId"
$SubtitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$SubtitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(212, 212, 216)
$SubtitleLabel.Location = New-Object System.Drawing.Point(25, 42)
$SubtitleLabel.AutoSize = $true

$DestLabel = New-Object System.Windows.Forms.Label
$DestLabel.Text = "Carpeta de destino oficial: $InstallDir"
$DestLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Italic)
$DestLabel.ForeColor = [System.Drawing.Color]::FromArgb(161, 161, 170)
$DestLabel.Location = New-Object System.Drawing.Point(25, 66)
$DestLabel.AutoSize = $true

$HeaderPanel.Controls.Add($TitleLabel)
$HeaderPanel.Controls.Add($SubtitleLabel)
$HeaderPanel.Controls.Add($DestLabel)
$Form.Controls.Add($HeaderPanel)

# -------------------------------------------------------------------------
# CONTENEDOR DE OPCIONES
# -------------------------------------------------------------------------
$OptionsPanel = New-Object System.Windows.Forms.Panel
$OptionsPanel.Size = New-Object System.Drawing.Size(650, 480)
$OptionsPanel.Location = New-Object System.Drawing.Point(25, 105)
$OptionsPanel.BackColor = [System.Drawing.Color]::Transparent

$PromptLabel = New-Object System.Windows.Forms.Label
$PromptLabel.Text = "Por favor, seleccione qué desea instalar o ejecutar en este equipo:"
$PromptLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$PromptLabel.ForeColor = [System.Drawing.Color]::White
$PromptLabel.Location = New-Object System.Drawing.Point(0, 5)
$PromptLabel.AutoSize = $true
$OptionsPanel.Controls.Add($PromptLabel)

# Helper para crear botones de tarjeta modernos
function Create-OptionCard($yPos, $title, $desc, $accentColor, $borderColor) {
    $Btn = New-Object System.Windows.Forms.Button
    $Btn.Location = New-Object System.Drawing.Point(0, $yPos)
    $Btn.Size = New-Object System.Drawing.Size(650, 75)
    $Btn.FlatStyle = "Flat"
    $Btn.FlatAppearance.BorderSize = 1
    $Btn.FlatAppearance.BorderColor = $borderColor
    $Btn.BackColor = [System.Drawing.Color]::FromArgb(26, 26, 30)
    $Btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    $Btn.TextAlign = "TopLeft"
    $Btn.Padding = New-Object System.Windows.Forms.Padding(18, 12, 10, 10)
    $Btn.Text = "$title\`n$desc"
    $Btn.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
    $Btn.ForeColor = $accentColor
    return $Btn
}

# Boton 1: Instalar Agente
$BtnAgent = Create-OptionCard 35 "1. Instalar Agente de Monitoreo" "   -> Instala el daemon en segundo plano en 'C:\\Program Files\\CrashingLive' y reporta telemetría." ([System.Drawing.Color]::FromArgb(255, 107, 0)) ([System.Drawing.Color]::FromArgb(255, 107, 0))
$OptionsPanel.Controls.Add($BtnAgent)

# Boton 2: Instalar Monitor
$BtnMonitor = Create-OptionCard 120 "2. Instalar Monitor Central / Panel" "   -> Configura la consola web de supervisión, base de datos PostgreSQL y crea el acceso en Escritorio." ([System.Drawing.Color]::FromArgb(0, 255, 102)) ([System.Drawing.Color]::FromArgb(0, 255, 102))
$OptionsPanel.Controls.Add($BtnMonitor)

# Boton 3: Instalar Ambos
$BtnBoth = Create-OptionCard 205 "3. Instalar Ambos (Agente + Monitor Central)" "   -> Servidor Todo-en-Uno (Full Stack). Instala tanto el Agente de telemetría como el Monitor Central." ([System.Drawing.Color]::FromArgb(56, 189, 248)) ([System.Drawing.Color]::FromArgb(56, 189, 248))
$OptionsPanel.Controls.Add($BtnBoth)

# Boton 4: Desinstalar componentes
$BtnUninstall = Create-OptionCard 290 "4. Desinstalar componentes de Crashing Live" "   -> Limpieza completa: detiene servicios, elimina reglas de firewall y borra 'C:\\Program Files\\CrashingLive'." ([System.Drawing.Color]::FromArgb(239, 68, 68)) ([System.Drawing.Color]::FromArgb(239, 68, 68))
$OptionsPanel.Controls.Add($BtnUninstall)

# Boton Salir
$BtnExit = New-Object System.Windows.Forms.Button
$BtnExit.Text = "Cerrar Asistente"
$BtnExit.Location = New-Object System.Drawing.Point(510, 385)
$BtnExit.Size = New-Object System.Drawing.Size(140, 35)
$BtnExit.FlatStyle = "Flat"
$BtnExit.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(60, 60, 65)
$BtnExit.BackColor = [System.Drawing.Color]::FromArgb(35, 35, 40)
$BtnExit.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 200)
$BtnExit.Add_Click({ $Form.Close() })
$OptionsPanel.Controls.Add($BtnExit)

$Form.Controls.Add($OptionsPanel)

# -------------------------------------------------------------------------
# PANEL DE PROGRESO Y RESULTADOS (Inicialmente Oculto)
# -------------------------------------------------------------------------
$ProgressPanel = New-Object System.Windows.Forms.Panel
$ProgressPanel.Size = New-Object System.Drawing.Size(650, 480)
$ProgressPanel.Location = New-Object System.Drawing.Point(25, 105)
$ProgressPanel.BackColor = [System.Drawing.Color]::Transparent
$ProgressPanel.Visible = $false

$ActionTitleLabel = New-Object System.Windows.Forms.Label
$ActionTitleLabel.Text = "Ejecutando operación..."
$ActionTitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$ActionTitleLabel.ForeColor = [System.Drawing.Color]::White
$ActionTitleLabel.Location = New-Object System.Drawing.Point(0, 5)
$ActionTitleLabel.AutoSize = $true
$ProgressPanel.Controls.Add($ActionTitleLabel)

$ProgressBar = New-Object System.Windows.Forms.ProgressBar
$ProgressBar.Location = New-Object System.Drawing.Point(0, 35)
$ProgressBar.Size = New-Object System.Drawing.Size(650, 22)
$ProgressBar.Minimum = 0
$ProgressBar.Maximum = 100
$ProgressBar.Value = 0
$ProgressPanel.Controls.Add($ProgressBar)

$StatusLabel = New-Object System.Windows.Forms.Label
$StatusLabel.Text = "Iniciando proceso..."
$StatusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$StatusLabel.ForeColor = [System.Drawing.Color]::FromArgb(161, 161, 170)
$StatusLabel.Location = New-Object System.Drawing.Point(0, 65)
$StatusLabel.AutoSize = $true
$ProgressPanel.Controls.Add($StatusLabel)

$LogTextBox = New-Object System.Windows.Forms.TextBox
$LogTextBox.Location = New-Object System.Drawing.Point(0, 95)
$LogTextBox.Size = New-Object System.Drawing.Size(650, 260)
$LogTextBox.Multiline = $true
$LogTextBox.ReadOnly = $true
$LogTextBox.ScrollBars = "Vertical"
$LogTextBox.BackColor = [System.Drawing.Color]::FromArgb(10, 10, 12)
$LogTextBox.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
$LogTextBox.Font = New-Object System.Drawing.Font("Consolas", 8.5)
$ProgressPanel.Controls.Add($LogTextBox)

# Botones finales
$BtnOpenFolder = New-Object System.Windows.Forms.Button
$BtnOpenFolder.Text = "Abrir Carpeta en Program Files"
$BtnOpenFolder.Location = New-Object System.Drawing.Point(230, 375)
$BtnOpenFolder.Size = New-Object System.Drawing.Size(240, 38)
$BtnOpenFolder.FlatStyle = "Flat"
$BtnOpenFolder.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
$BtnOpenFolder.BackColor = [System.Drawing.Color]::FromArgb(20, 35, 25)
$BtnOpenFolder.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
$BtnOpenFolder.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$BtnOpenFolder.Visible = $false
$BtnOpenFolder.Add_Click({
    if (Test-Path $InstallDir) {
        Invoke-Item $InstallDir
    }
})
$ProgressPanel.Controls.Add($BtnOpenFolder)

$BtnFinish = New-Object System.Windows.Forms.Button
$BtnFinish.Text = "Finalizar"
$BtnFinish.Location = New-Object System.Drawing.Point(490, 375)
$BtnFinish.Size = New-Object System.Drawing.Size(160, 38)
$BtnFinish.FlatStyle = "Flat"
$BtnFinish.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
$BtnFinish.BackColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
$BtnFinish.ForeColor = [System.Drawing.Color]::Black
$BtnFinish.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$BtnFinish.Visible = $false
$BtnFinish.Add_Click({ $Form.Close() })
$ProgressPanel.Controls.Add($BtnFinish)

$Form.Controls.Add($ProgressPanel)

# -------------------------------------------------------------------------
# LOGICA DE INSTALACION EN C:\\Program Files\\CrashingLive
# -------------------------------------------------------------------------
function Append-Log($text) {
    $LogTextBox.AppendText("$text\`r\`n")
    $LogTextBox.SelectionStart = $LogTextBox.Text.Length
    $LogTextBox.ScrollToCaret()
    [System.Windows.Forms.Application]::DoEvents()
}

function Run-Installation($mode) {
    $OptionsPanel.Visible = $false
    $ProgressPanel.Visible = $true
    
    switch ($mode) {
        "Agent" { $ActionTitleLabel.Text = "Instalando Agente de Monitoreo..." }
        "Monitor" { $ActionTitleLabel.Text = "Instalando Monitor Central / Panel..." }
        "Both" { $ActionTitleLabel.Text = "Instalando Ambos (Agente + Monitor Central)..." }
        "Uninstall" { $ActionTitleLabel.Text = "Desinstalando componentes de Crashing Live..." }
    }

    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 300

    if ($mode -eq "Uninstall") {
        Execute-Uninstall
    } else {
        Execute-Install -installAgent ($mode -in "Agent", "Both") -installMonitor ($mode -in "Monitor", "Both")
    }
}

function Execute-Install($installAgent, $installMonitor) {
    $ProgressBar.Value = 10
    $StatusLabel.Text = "Creando carpeta oficial en Program Files..."
    Append-Log "[1/6] Creando directorio oficial: $InstallDir"
    
    New-Item -ItemType Directory -Path "$InstallDir\\logs" -Force -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$InstallDir\\scripts" -Force -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$InstallDir\\backups" -Force -ErrorAction SilentlyContinue | Out-Null
    Append-Log "      [OK] Directorio C:\\Program Files\\CrashingLive listo."

    $ProgressBar.Value = 30
    $StatusLabel.Text = "Copiando archivos de la aplicacion..."
    Append-Log "[2/6] Copiando componentes y configuraciones..."
    
    $DaemonSrc = Join-Path $ScriptDir "agent_daemon.py"
    if (Test-Path $DaemonSrc) {
        Copy-Item -Path $DaemonSrc -Destination "$InstallDir\\agent_daemon.py" -Force
        Append-Log "      [OK] agent_daemon.py copiado."
    }

    $ConfigSrc = Join-Path $ScriptDir "config.json"
    if (Test-Path $ConfigSrc) {
        Copy-Item -Path $ConfigSrc -Destination "$InstallDir\\config.json" -Force
        Append-Log "      [OK] config.json copiado (AnyDesk ID: $AgentId)."
    }

    $UninstSrc = Join-Path $ScriptDir "uninstall.ps1"
    if (Test-Path $UninstSrc) {
        Copy-Item -Path $UninstSrc -Destination "$InstallDir\\uninstall.ps1" -Force
    }

    $ProgressBar.Value = 50
    $StatusLabel.Text = "Configurando reglas de Windows Firewall..."
    Append-Log "[3/6] Configurando reglas en Windows Firewall..."
    
    Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue

    New-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -Direction Inbound -Protocol UDP -LocalPort 8444 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    Append-Log "      [OK] Puertos TCP $ListenPort y UDP 8444 habilitados en Firewall."

    if ($installAgent) {
        $ProgressBar.Value = 70
        $StatusLabel.Text = "Configurando servicio de Windows 'CrashingLiveDaemon'..."
        Append-Log "[4/6] Configurando servicio de Windows 'CrashingLiveDaemon'..."
        
        $PythonExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        $SvcName = "CrashingLiveDaemon"
        $ExistingSvc = Get-Service -Name $SvcName -ErrorAction SilentlyContinue
        
        if ($ExistingSvc) {
            Stop-Service -Name $SvcName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Start-Service -Name $SvcName -ErrorAction SilentlyContinue
            Append-Log "      [OK] Servicio reiniciado correctamente."
        } else {
            if ($PythonExe) {
                New-Service -Name $SvcName -DisplayName "Crashing Live Autonomous AI Daemon" -BinaryPathName "\`"$PythonExe\`" \`"$InstallDir\\agent_daemon.py\`"" -StartupType Automatic -Description "Daemon de telemetria en tiempo real de Crashing Live." -ErrorAction SilentlyContinue | Out-Null
                Start-Service -Name $SvcName -ErrorAction SilentlyContinue
                Append-Log "      [OK] Servicio 'CrashingLiveDaemon' registrado con inicio automatico."
            } else {
                Append-Log "      [*] Python no detectado en PATH. El daemon queda listo en $InstallDir\\agent_daemon.py."
            }
        }

        # Registrar Agente en Windows
        $RegKey = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent"
        if (-not (Test-Path $RegKey)) { New-Item -Path $RegKey -Force -ErrorAction SilentlyContinue | Out-Null }
        Set-ItemProperty -Path $RegKey -Name "DisplayName" -Value "Crashing Live Agent - Monitoreo de Servidores" -Force
        Set-ItemProperty -Path $RegKey -Name "DisplayVersion" -Value "2.6.4" -Force
        Set-ItemProperty -Path $RegKey -Name "Publisher" -Value "Crashing Live Systems" -Force
        Set-ItemProperty -Path $RegKey -Name "InstallLocation" -Value "$InstallDir" -Force
        Set-ItemProperty -Path $RegKey -Name "UninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$InstallDir\\uninstall.ps1\`"" -Force
        Append-Log "      [OK] Agente registrado en Programas y Caracteristicas de Windows."
    }

    if ($installMonitor) {
        $ProgressBar.Value = 85
        $StatusLabel.Text = "Configurando acceso directo en el Escritorio..."
        Append-Log "[5/6] Creando acceso directo 'Crashing Live Monitor'..."
        
        try {
            $Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
            $WshShell = New-Object -ComObject WScript.Shell
            $Sc = $WshShell.CreateShortcut("$Desktop\\Crashing Live Monitor.url")
            $Sc.TargetPath = "http://localhost:$ListenPort"
            $Sc.Save()
            Append-Log "      [OK] Acceso directo creado en el Escritorio."
        } catch {
            Append-Log "      [*] Acceso web: http://localhost:$ListenPort"
        }

        # Registrar Monitor en Windows
        $RegKeyMon = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor"
        if (-not (Test-Path $RegKeyMon)) { New-Item -Path $RegKeyMon -Force -ErrorAction SilentlyContinue | Out-Null }
        Set-ItemProperty -Path $RegKeyMon -Name "DisplayName" -Value "Crashing Live Monitor - Consola Central" -Force
        Set-ItemProperty -Path $RegKeyMon -Name "DisplayVersion" -Value "2.6.4" -Force
        Set-ItemProperty -Path $RegKeyMon -Name "Publisher" -Value "Crashing Live Systems" -Force
        Set-ItemProperty -Path $RegKeyMon -Name "InstallLocation" -Value "$InstallDir" -Force
        Set-ItemProperty -Path $RegKeyMon -Name "UninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$InstallDir\\uninstall.ps1\`"" -Force
        Append-Log "      [OK] Monitor registrado en Programas y Caracteristicas de Windows."
    }

    $ProgressBar.Value = 100
    $StatusLabel.Text = "¡Instalación completada exitosamente!"
    Append-Log ""
    Append-Log "========================================================================"
    Append-Log "[✔] OPERACION COMPLETADA CON EXITO."
    Append-Log "    Carpeta instalada : $InstallDir"
    Append-Log "    AnyDesk ID        : $AgentId"
    Append-Log "    Acceso Monitor    : http://localhost:$ListenPort"
    Append-Log "========================================================================"

    $BtnOpenFolder.Visible = $true
    $BtnFinish.Visible = $true
}

function Execute-Uninstall {
    $ProgressBar.Value = 20
    $StatusLabel.Text = "Deteniendo servicios y procesos..."
    Append-Log "[1/4] Deteniendo servicio 'CrashingLiveDaemon'..."
    Stop-Service -Name "CrashingLiveDaemon" -Force -ErrorAction SilentlyContinue
    & sc.exe delete "CrashingLiveDaemon" | Out-Null
    Append-Log "      [OK] Servicio eliminado."

    $ProgressBar.Value = 45
    $StatusLabel.Text = "Eliminando reglas de Windows Firewall..."
    Append-Log "[2/4] Limpiando reglas de Firewall..."
    Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue
    Append-Log "      [OK] Reglas de Firewall eliminadas."

    $ProgressBar.Value = 70
    $StatusLabel.Text = "Desregistrando de Windows..."
    Append-Log "[3/4] Eliminando registros de instalacion en Windows..."
    Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor" -Recurse -Force -ErrorAction SilentlyContinue
    
    $Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
    Remove-Item -Path "$Desktop\\Crashing Live Monitor.url" -Force -ErrorAction SilentlyContinue
    Append-Log "      [OK] Desregistrado de Windows."

    $ProgressBar.Value = 90
    $StatusLabel.Text = "Borrando carpeta en Program Files..."
    Append-Log "[4/4] Eliminando carpeta $InstallDir..."
    if (Test-Path $InstallDir) {
        Get-ChildItem -Path $InstallDir -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item -Path $InstallDir -Force -Recurse -ErrorAction SilentlyContinue
    }
    Append-Log "      [OK] Carpeta eliminada de Program Files."

    $ProgressBar.Value = 100
    $StatusLabel.Text = "¡Desinstalación completada con éxito!"
    Append-Log ""
    Append-Log "========================================================================"
    Append-Log "[✔] CRASHING LIVE HA SIDO COMPLETAMENTE DESINSTALADO DE ESTE EQUIPO."
    Append-Log "========================================================================"
    
    $BtnFinish.Visible = $true
}

# Conectar eventos de clic
$BtnAgent.Add_Click({ Run-Installation "Agent" })
$BtnMonitor.Add_Click({ Run-Installation "Monitor" })
$BtnBoth.Add_Click({ Run-Installation "Both" })
$BtnUninstall.Add_Click({ Run-Installation "Uninstall" })

# Mostrar Ventana Modal
$Form.ShowDialog() | Out-Null
$Form.Dispose()
`;

  // =========================================================================
  // 4. Wizard_Instalador.ps1 (CLI Fallback para consolas administrativas)
  // =========================================================================
  const psCliWizard = `<#
.SYNOPSIS
    Crashing Live Monitor - CLI Fallback
#>
param(
    [ValidateSet("Interactive", "Agent", "Monitor", "Both", "Uninstall")]
    [string]$Mode = "Interactive"
)

$ProgFiles = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
if (-not $ProgFiles) { $ProgFiles = $env:ProgramFiles }
if (-not $ProgFiles) { $ProgFiles = "C:\\Program Files" }
$InstallDir = Join-Path $ProgFiles "CrashingLive"

# Si no hay parametro, abrir la interfaz grafica directamente
$GuiScript = Join-Path (Split-Path -Parent $PSCommandPath) "Wizard_GUI.ps1"
if (Test-Path $GuiScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$GuiScript"
    Exit
}
`;

  // =========================================================================
  // 5. uninstall.ps1 (Desinstalador limpio en Program Files)
  // =========================================================================
  const psUninstall = `<#
.SYNOPSIS
    Crashing Live Monitor - Clean Uninstaller (C:\\Program Files\\CrashingLive)
#>
$ErrorActionPreference = "SilentlyContinue"

$ProgFiles = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
if (-not $ProgFiles) { $ProgFiles = $env:ProgramFiles }
if (-not $ProgFiles) { $ProgFiles = "C:\\Program Files" }
$InstallDir = Join-Path $ProgFiles "CrashingLive"

# Detener servicio
Stop-Service -Name "CrashingLiveDaemon" -Force -ErrorAction SilentlyContinue
& sc.exe delete "CrashingLiveDaemon" | Out-Null

# Limpiar procesos
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*CrashingLive*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Reglas firewall
Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue

# Accesos directos
$Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
Remove-Item -Path "$Desktop\\Crashing Live Monitor.url" -Force -ErrorAction SilentlyContinue

# Registro
Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor" -Recurse -Force -ErrorAction SilentlyContinue

# Borrar archivos
if (Test-Path $InstallDir) {
    Get-ChildItem -Path $InstallDir -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item -Path $InstallDir -Force -Recurse -ErrorAction SilentlyContinue
}
`;

  // =========================================================================
  // 6. agent_daemon.py (Daemon instalado en Program Files con AnyDesk Beacon)
  // =========================================================================
  const pythonDaemon = `"""
Crashing Live Monitor - Autonomous Windows Telemetry Daemon
Version: 2.6.4
Install Location: C:\\Program Files\\CrashingLive
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

CONFIG_PATH = os.path.join(os.environ.get("ProgramFiles", r"C:\\Program Files"), "CrashingLive", "config.json")

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

log_dir = os.path.join(os.environ.get("ProgramFiles", r"C:\\Program Files"), "CrashingLive", "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [CrashingLiveDaemon] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "agent.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

logging.info(f"Iniciando Crashing Live Agent en {config.get('hostname')}...")
logging.info(f"Ruta de ejecucion: C:\\\\Program Files\\\\CrashingLive")
logging.info(f"Agent ID AnyDesk: {config.get('agent_id', '${agentId}')}")

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
        
        logging.info(f"TELEMETRIA OK - CPU: {cpu}% | RAM: {ram.percent}%")
        time.sleep(config.get("interval_seconds", 2))
except KeyboardInterrupt:
    logging.info("Daemon detenido por el operador.")
`;

  // =========================================================================
  // 7. schema.sql (Base de Datos PostgreSQL 16)
  // =========================================================================
  const schemaSql = `-- PostgreSQL Relational Schema for Crashing Live Monitor
-- Target DB: ${dbName}
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

INSERT INTO connected_servers (id, name, host, port, os_type, agent_id, status, latency_ms)
VALUES ('srv-node-1', '${currentHost}', '${currentIp}', ${currentPort}, 'Windows Server 2022', '${agentId}', 'ONLINE', 2)
ON CONFLICT (id) DO UPDATE SET last_ping = CURRENT_TIMESTAMP;
`;

  // =========================================================================
  // 8. config.json (Archivo de Configuracion en Program Files)
  // =========================================================================
  const configJson = JSON.stringify(
    {
      app_name: "Crashing Live Monitor Suite",
      version: "2.6.4",
      agent_id: agentId,
      install_location: "C:\\Program Files\\CrashingLive",
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
        install_dir: "C:\\Program Files\\CrashingLive",
        service_name: "CrashingLiveDaemon",
        interval_seconds: 2,
        require_reboot_approval: true
      }
    },
    null,
    2
  );

  // =========================================================================
  // 9. LEEME_INSTRUCCIONES.txt (Manual en Español)
  // =========================================================================
  const readmeTxt = `===============================================================================
       CRASHING LIVE MONITOR - ASISTENTE GRAFICO DE INSTALACION (GUI)
===============================================================================

Este instalador abre directamente el ASISTENTE GRAFICO MODERNO (GUI),
sin consola de comandos (CMD), e instala en:
C:\\Program Files\\CrashingLive

-------------------------------------------------------------------------------
COMO INICIAR LA INSTALACION EN WINDOWS:
-------------------------------------------------------------------------------
1. Descomprima este archivo .ZIP en su equipo o servidor.
2. Haga DOBLE CLIC en cualquiera de estos archivos:
   - "Instalador.vbs" (Apertura 100% grafica directa sin ventana CMD)
   - "Instalador.bat" (Lanzador rapido)

3. Se abrira directamente la ventana del Asistente Grafico con las 4 opciones:
   [1] Instalar Agente
   [2] Instalar Monitor
   [3] Instalar Ambos
   [4] Desinstalar componentes

Todos los archivos se copian en:
C:\\Program Files\\CrashingLive
`;

  // Añadir archivos al ZIP con finales de línea CRLF obligatorios
  zip.file('Instalador.vbs', toWindowsCrlf(vbsLauncher));
  zip.file('Instalador.bat', toWindowsCrlf(batLauncher));
  zip.file('INSTALL_WIZARD.bat', toWindowsCrlf(batLauncher));
  zip.file('Wizard_GUI.ps1', toWindowsCrlf(psGuiWizard));
  zip.file('Wizard_Instalador.ps1', toWindowsCrlf(psCliWizard));
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
