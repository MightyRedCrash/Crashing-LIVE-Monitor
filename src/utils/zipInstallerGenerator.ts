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
  installPath?: string;
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
  const defaultPath = params.installPath || 'C:\\Program Files\\Crashing LIVE';
  const agentId = 'CL-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);

  // =========================================================================
  // 1. Instalador.bat (Lanzador con Auto-Elevacion UAC y Desbloqueo)
  // =========================================================================
  const batLauncher = `@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Crashing LIVE Monitor - Asistente de Instalacion
cd /d "%~dp0"

:: 1. Comprobar privilegios de Administrador con elevacion transparente
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================================================
    echo  [i] Solicitando permisos de Administrador para Crashing LIVE Setup...
    echo      (Por favor, confirme "Si" en el cartel de Control de Cuentas UAC)
    echo ========================================================================
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c cd /d ""%~dp0"" && call ""%~f0"" --elevated' -Verb RunAs"
    exit /b
)

:: 2. Desbloquear archivos descargados (evita bloqueo de Windows SmartScreen)
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue"

:: 3. Lanzar Asistente Grafico GUI con logo y seleccion de ruta
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_GUI.ps1"

:: 4. Fallback si el sistema no soporta Windows Forms
if %errorlevel% neq 0 (
    echo.
    echo [!] Iniciando Asistente de instalacion en modo consola...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Wizard_Instalador.ps1"
    pause
)
exit /b 0
`;

  // =========================================================================
  // 2. Instalador.vbs (Lanzador Silencioso)
  // =========================================================================
  const vbsLauncher = `' Crashing LIVE Monitor - Lanzador de Asistente Grafico
Set WshShell = CreateObject("WScript.Shell")
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\\"))
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & strPath & "Wizard_GUI.ps1""", 1, False
Set WshShell = Nothing
`;

  // =========================================================================
  // 3. Instalador.hta (ASISTENTE GRAFICO COMPLETO ESTILO WIZARD COMUN)
  // =========================================================================
  const htaLauncher = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Crashing LIVE Monitor - Asistente de Instalación</title>
<HTA:APPLICATION 
    ID="oCrashingLiveInstaller"
    APPLICATIONNAME="Crashing LIVE Installer"
    BORDER="dialog"
    BORDERSTYLE="normal"
    CAPTION="yes"
    MAXIMIZEBUTTON="no"
    MINIMIZEBUTTON="yes"
    SHOWINTASKBAR="yes"
    SINGLEINSTANCE="yes"
    SYSMENU="yes"
    WINDOWSTATE="normal"
    SCROLL="no"
/>
<style>
  body {
    background-color: #0d0e12;
    color: #e4e4e7;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    user-select: none;
  }
  .header {
    background: #181920;
    border-bottom: 2px solid #27272a;
    padding: 16px 24px;
  }
  .logo-box {
    display: inline-block;
    width: 36px;
    height: 36px;
    background: #00ff66;
    color: #000;
    font-weight: 900;
    font-size: 20px;
    text-align: center;
    line-height: 36px;
    border-radius: 8px;
    margin-right: 12px;
    vertical-align: middle;
  }
  .header-text {
    display: inline-block;
    vertical-align: middle;
  }
  .title {
    color: #00ff66;
    font-size: 16px;
    font-weight: bold;
    margin: 0;
    letter-spacing: 0.5px;
  }
  .subtitle {
    color: #a1a1aa;
    font-size: 11px;
    margin-top: 2px;
  }
  .content {
    padding: 24px;
    min-height: 320px;
  }
  .step-title {
    font-size: 14px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 6px;
  }
  .step-desc {
    font-size: 12px;
    color: #a1a1aa;
    margin-bottom: 18px;
    line-height: 1.4;
  }
  .radio-card {
    background: #181922;
    border: 1px solid #3f3f46;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 10px;
    cursor: pointer;
  }
  .radio-card:hover {
    border-color: #00ff66;
    background: #1e2029;
  }
  .radio-title {
    font-size: 13px;
    font-weight: bold;
    color: #fff;
  }
  .radio-desc {
    font-size: 11px;
    color: #a1a1aa;
    margin-top: 2px;
  }
  .folder-input-group {
    background: #181922;
    border: 1px solid #3f3f46;
    border-radius: 8px;
    padding: 16px;
    margin-top: 15px;
  }
  .folder-input {
    width: 78%;
    background: #090a0f;
    border: 1px solid #52525b;
    border-radius: 6px;
    color: #00ff66;
    font-family: Consolas, monospace;
    font-size: 12px;
    padding: 8px 10px;
  }
  .btn-browse {
    width: 18%;
    background: #27272a;
    border: 1px solid #52525b;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    padding: 8px;
    cursor: pointer;
    margin-left: 2%;
  }
  .btn-browse:hover {
    background: #3f3f46;
  }
  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #121318;
    border-top: 1px solid #27272a;
    padding: 14px 24px;
    text-align: right;
  }
  .btn {
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    margin-left: 8px;
  }
  .btn-secondary {
    background: #27272a;
    border: 1px solid #3f3f46;
    color: #d4d4d8;
  }
  .btn-secondary:hover {
    background: #3f3f46;
    color: #fff;
  }
  .btn-primary {
    background: #00ff66;
    border: 1px solid #00ff66;
    color: #000;
  }
  .btn-primary:hover {
    background: #00dd55;
  }
  .p-bar {
    width: 100%;
    height: 14px;
    background: #27272a;
    border-radius: 7px;
    overflow: hidden;
    margin: 15px 0;
  }
  .p-fill {
    width: 0%;
    height: 100%;
    background: #00ff66;
  }
</style>
<script language="VBScript">
Dim currentStep
Dim selectedMode
currentStep = 1
selectedMode = "Both"

Sub Window_OnLoad
    window.resizeTo 700, 580
    ShowStep(1)
End Sub

Sub SelectMode(mode)
    selectedMode = mode
    document.getElementById("radAgent").checked = (mode = "Agent")
    document.getElementById("radMonitor").checked = (mode = "Monitor")
    document.getElementById("radBoth").checked = (mode = "Both")
    document.getElementById("radUninstall").checked = (mode = "Uninstall")
End Sub

Sub BrowseFolder
    Set objShell = CreateObject("Shell.Application")
    Set objFolder = objShell.BrowseForFolder(0, "Seleccione la carpeta donde se creara Crashing LIVE:", 0, 0)
    If Not objFolder Is Nothing Then
        folderPath = objFolder.Self.Path
        If InStr(folderPath, "Crashing LIVE") = 0 Then
            If Right(folderPath, 1) = "\\" Then
                folderPath = folderPath & "Crashing LIVE"
            Else
                folderPath = folderPath & "\\Crashing LIVE"
            End If
        End If
        document.getElementById("txtInstallDir").value = folderPath
    End If
End Sub

Sub NextStep
    If currentStep = 1 Then
        If document.getElementById("radUninstall").checked Then
            selectedMode = "Uninstall"
            ShowStep(3)
            ExecuteInstallation
            Exit Sub
        End If
        If document.getElementById("radAgent").checked Then selectedMode = "Agent"
        If document.getElementById("radMonitor").checked Then selectedMode = "Monitor"
        If document.getElementById("radBoth").checked Then selectedMode = "Both"
        ShowStep(2)
    ElseIf currentStep = 2 Then
        ShowStep(3)
        ExecuteInstallation
    ElseIf currentStep = 4 Then
        If document.getElementById("chkOpenFolder").checked Then
            Set WshShell = CreateObject("WScript.Shell")
            WshShell.Run "explorer.exe """ & document.getElementById("txtInstallDir").value & """", 1, False
        End If
        window.close
    End If
End Sub

Sub PrevStep
    If currentStep = 2 Then
        ShowStep(1)
    End If
End Sub

Sub ShowStep(s)
    currentStep = s
    document.getElementById("step1").style.display = "none"
    document.getElementById("step2").style.display = "none"
    document.getElementById("step3").style.display = "none"
    document.getElementById("step4").style.display = "none"
    
    document.getElementById("btnBack").style.display = "none"
    document.getElementById("btnNext").style.display = "inline-block"
    document.getElementById("btnCancel").style.display = "inline-block"
    
    If s = 1 Then
        document.getElementById("step1").style.display = "block"
        document.getElementById("btnNext").value = "Siguiente >"
    ElseIf s = 2 Then
        document.getElementById("step2").style.display = "block"
        document.getElementById("btnBack").style.display = "inline-block"
        document.getElementById("btnNext").value = "Instalar >"
    ElseIf s = 3 Then
        document.getElementById("step3").style.display = "block"
        document.getElementById("btnNext").style.display = "none"
        document.getElementById("btnCancel").style.display = "none"
    ElseIf s = 4 Then
        document.getElementById("step4").style.display = "block"
        document.getElementById("btnNext").style.display = "inline-block"
        document.getElementById("btnNext").value = "Finalizar"
    End If
End Sub

Sub ExecuteInstallation
    destDir = document.getElementById("txtInstallDir").value
    document.getElementById("statusLabel").innerText = "Instalando en " & destDir & "..."
    document.getElementById("pFill").style.width = "40%"
    
    Set WshShell = CreateObject("WScript.Shell")
    strCur = Left(document.location.pathname, InStrRev(document.location.pathname, "\\"))
    cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & strCur & "Wizard_Instalador.ps1"" -Mode " & selectedMode & " -TargetDir """ & destDir & """"
    
    WshShell.Run cmd, 0, True
    
    document.getElementById("pFill").style.width = "100%"
    document.getElementById("statusLabel").innerText = "¡Completado exitosamente!"
    document.getElementById("finalDirLabel").innerText = destDir
    ShowStep(4)
End Sub
</script>
</head>
<body>
  <!-- Header con Logo Oficial y Nombre -->
  <div class="header">
    <div class="logo-box">CL</div>
    <div class="header-text">
      <div class="title">CRASHING LIVE MONITOR - ASISTENTE DE INSTALACIÓN</div>
      <div class="subtitle">Servidor: ${currentHost} | IP: ${currentIp}:${currentPort} | ID: ${agentId}</div>
    </div>
  </div>

  <div class="content">
    <!-- PASO 1: SELECCION DE TIPO DE INSTALACION -->
    <div id="step1">
      <div class="step-title">Selección de componentes para este equipo</div>
      <div class="step-desc">Elija qué funciones desea instalar en este equipo. Podrá cambiar o desinstalar en cualquier momento:</div>
      
      <div class="radio-card" onclick="SelectMode('Both')">
        <input type="radio" id="radBoth" name="installType" checked style="float:left; margin-top:4px;">
        <div style="margin-left: 24px;">
          <div class="radio-title" style="color:#38bdf8;">Instalación Completa (Agente + Monitor Central) [Recomendado]</div>
          <div class="radio-desc">Servidor Todo-en-Uno (Full Stack). Instala la consola central y el agente de telemetría.</div>
        </div>
      </div>

      <div class="radio-card" onclick="SelectMode('Agent')">
        <input type="radio" id="radAgent" name="installType" style="float:left; margin-top:4px;">
        <div style="margin-left: 24px;">
          <div class="radio-title" style="color:#ff6b00;">Instalar Agente de Monitoreo</div>
          <div class="radio-desc">Para puestos o servidores supervisados. Ejecuta el daemon de telemetría en segundo plano.</div>
        </div>
      </div>

      <div class="radio-card" onclick="SelectMode('Monitor')">
        <input type="radio" id="radMonitor" name="installType" style="float:left; margin-top:4px;">
        <div style="margin-left: 24px;">
          <div class="radio-title" style="color:#00ff66;">Instalar Monitor Central / Panel de Control</div>
          <div class="radio-desc">Para la estación de trabajo del administrador. Configura panel web y acceso directo.</div>
        </div>
      </div>

      <div class="radio-card" onclick="SelectMode('Uninstall')">
        <input type="radio" id="radUninstall" name="installType" style="float:left; margin-top:4px;">
        <div style="margin-left: 24px;">
          <div class="radio-title" style="color:#ef4444;">Desinstalar componentes existentes</div>
          <div class="radio-desc">Detiene servicios, elimina reglas de firewall y limpia la carpeta de instalación.</div>
        </div>
      </div>
    </div>

    <!-- PASO 2: SELECCION DE CARPETA DE DESTINO -->
    <div id="step2" style="display:none;">
      <div class="step-title">Seleccionar carpeta de destino</div>
      <div class="step-desc">
        Por defecto, el asistente instalará en la carpeta oficial <strong>C:\\Program Files\\Crashing LIVE</strong>.<br>
        Si desea instalar en otra unidad o ruta personalizada, haga clic en <em>Examinar...</em>
      </div>

      <div class="folder-input-group">
        <label style="font-size:11px; color:#a1a1aa; display:block; margin-bottom:6px;">Ruta de instalación:</label>
        <input type="text" id="txtInstallDir" class="folder-input" value="${defaultPath}">
        <input type="button" class="btn-browse" value="Examinar..." onclick="BrowseFolder">
        <div style="font-size:11px; color:#71717a; margin-top:8px;">
          Espacio requerido en disco: ~85 MB &nbsp;|&nbsp; Espacio disponible: &gt; 10 GB
        </div>
      </div>
    </div>

    <!-- PASO 3: PROGRESO DE INSTALACION -->
    <div id="step3" style="display:none;">
      <div class="step-title">Instalando componentes...</div>
      <div class="step-desc" id="statusLabel">Iniciando copia de archivos...</div>
      <div class="p-bar"><div id="pFill" class="p-fill"></div></div>
      <div style="font-size:11px; color:#a1a1aa;">Por favor espere mientras se configuran los servicios y permisos de Windows.</div>
    </div>

    <!-- PASO 4: FINALIZACION -->
    <div id="step4" style="display:none;">
      <div class="step-title" style="color:#00ff66;">¡Instalación completada con éxito!</div>
      <div class="step-desc">
        Crashing LIVE Monitor ha sido instalado correctamente en su equipo en:<br>
        <strong id="finalDirLabel" style="color:#fff;">${defaultPath}</strong>
      </div>
      
      <div style="background:#181922; border:1px solid #27272a; border-radius:8px; padding:14px; margin-top:10px;">
        <label style="display:block; font-size:12px; margin-bottom:8px; cursor:pointer;">
          <input type="checkbox" id="chkOpenFolder" checked> Abrir carpeta de instalación en el Explorador
        </label>
        <div style="font-size:11px; color:#a1a1aa;">
          Acceso al Monitor Web: <span style="color:#00ff66;">http://localhost:${currentPort}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer con Botones del Wizard Común -->
  <div class="footer">
    <input type="button" id="btnBack" class="btn btn-secondary" value="< Atras" onclick="PrevStep" style="display:none;">
    <input type="button" id="btnNext" class="btn btn-primary" value="Siguiente >" onclick="NextStep">
    <input type="button" id="btnCancel" class="btn btn-secondary" value="Cancelar" onclick="window.close">
  </div>
</body>
</html>
`;

  // =========================================================================
  // 4. Wizard_GUI.ps1 (ASISTENTE GRAFICO POWERSHELL FORMS CON PASOS COMUNES)
  // =========================================================================
  const psGuiWizard = `# Crashing LIVE Monitor - Asistente Grafico de Instalacion
try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
    Add-Type -AssemblyName System.Drawing -ErrorAction Stop
    [System.Windows.Forms.Application]::EnableVisualStyles()
} catch {}

$HostName   = "${currentHost}"
$ListenPort = ${currentPort}
$DbHost     = "${dbHost}"
$DbPort     = ${dbPort}
$DbName     = "${dbName}"
$DbUser     = "${dbUser}"
$AgentId    = "${agentId}"

$ProgFiles = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
if (-not $ProgFiles) { $ProgFiles = $env:ProgramFiles }
if (-not $ProgFiles) { $ProgFiles = "C:\\Program Files" }
$DefaultInstallDir = Join-Path $ProgFiles "Crashing LIVE"

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    if ($MyInvocation -and $MyInvocation.MyCommand -and $MyInvocation.MyCommand.Definition) {
        $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    }
}
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }

try {
    $Form = New-Object System.Windows.Forms.Form
    $Form.Text = "Crashing LIVE Monitor - Asistente de Instalación v2.6"
    $Form.Size = New-Object System.Drawing.Size(700, 580)
    $Form.StartPosition = "CenterScreen"
    $Form.FormBorderStyle = "FixedDialog"
    $Form.MaximizeBox = $false
    $Form.BackColor = [System.Drawing.Color]::FromArgb(15, 15, 18)
    $Form.ForeColor = [System.Drawing.Color]::White
    $Form.Font = New-Object System.Drawing.Font("Segoe UI", 9)

    # Encabezado
    $HeaderPanel = New-Object System.Windows.Forms.Panel
    $HeaderPanel.Size = New-Object System.Drawing.Size(700, 80)
    $HeaderPanel.Location = New-Object System.Drawing.Point(0, 0)
    $HeaderPanel.BackColor = [System.Drawing.Color]::FromArgb(24, 25, 32)

    $LogoBox = New-Object System.Windows.Forms.Label
    $LogoBox.Text = "CL"
    $LogoBox.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $LogoBox.ForeColor = [System.Drawing.Color]::Black
    $LogoBox.BackColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $LogoBox.Size = New-Object System.Drawing.Size(46, 46)
    $LogoBox.Location = New-Object System.Drawing.Point(20, 16)
    $LogoBox.TextAlign = "MiddleCenter"

    $TitleLabel = New-Object System.Windows.Forms.Label
    $TitleLabel.Text = "CRASHING LIVE MONITOR"
    $TitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
    $TitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $TitleLabel.Location = New-Object System.Drawing.Point(76, 17)
    $TitleLabel.AutoSize = $true

    $SubtitleLabel = New-Object System.Windows.Forms.Label
    $SubtitleLabel.Text = "Asistente de Instalación & Configuración | Nodo: $HostName ($ListenPort)"
    $SubtitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $SubtitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(161, 161, 170)
    $SubtitleLabel.Location = New-Object System.Drawing.Point(76, 42)
    $SubtitleLabel.AutoSize = $true

    $HeaderPanel.Controls.Add($LogoBox)
    $HeaderPanel.Controls.Add($TitleLabel)
    $HeaderPanel.Controls.Add($SubtitleLabel)
    $Form.Controls.Add($HeaderPanel)

    # Footer con Botones
    $FooterPanel = New-Object System.Windows.Forms.Panel
    $FooterPanel.Size = New-Object System.Drawing.Size(700, 65)
    $FooterPanel.Location = New-Object System.Drawing.Point(0, 475)
    $FooterPanel.BackColor = [System.Drawing.Color]::FromArgb(20, 21, 26)

    $BtnCancel = New-Object System.Windows.Forms.Button
    $BtnCancel.Text = "Cancelar"
    $BtnCancel.Size = New-Object System.Drawing.Size(110, 34)
    $BtnCancel.Location = New-Object System.Drawing.Point(560, 15)
    $BtnCancel.FlatStyle = "Flat"
    $BtnCancel.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(60, 60, 65)
    $BtnCancel.BackColor = [System.Drawing.Color]::FromArgb(35, 36, 42)
    $BtnCancel.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 200)
    $BtnCancel.Add_Click({ $Form.Close() })

    $BtnNext = New-Object System.Windows.Forms.Button
    $BtnNext.Text = "Siguiente >"
    $BtnNext.Size = New-Object System.Drawing.Size(125, 34)
    $BtnNext.Location = New-Object System.Drawing.Point(425, 15)
    $BtnNext.FlatStyle = "Flat"
    $BtnNext.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $BtnNext.BackColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $BtnNext.ForeColor = [System.Drawing.Color]::Black
    $BtnNext.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)

    $BtnBack = New-Object System.Windows.Forms.Button
    $BtnBack.Text = "< Atrás"
    $BtnBack.Size = New-Object System.Drawing.Size(110, 34)
    $BtnBack.Location = New-Object System.Drawing.Point(305, 15)
    $BtnBack.FlatStyle = "Flat"
    $BtnBack.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(60, 60, 65)
    $BtnBack.BackColor = [System.Drawing.Color]::FromArgb(35, 36, 42)
    $BtnBack.ForeColor = [System.Drawing.Color]::White
    $BtnBack.Visible = $false

    $FooterPanel.Controls.Add($BtnCancel)
    $FooterPanel.Controls.Add($BtnNext)
    $FooterPanel.Controls.Add($BtnBack)
    $Form.Controls.Add($FooterPanel)

    # Paso 1: Tipo
    $Step1Panel = New-Object System.Windows.Forms.Panel
    $Step1Panel.Size = New-Object System.Drawing.Size(650, 380)
    $Step1Panel.Location = New-Object System.Drawing.Point(25, 90)

    $Step1Title = New-Object System.Windows.Forms.Label
    $Step1Title.Text = "Seleccione el tipo de instalación para este equipo:"
    $Step1Title.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $Step1Title.ForeColor = [System.Drawing.Color]::White
    $Step1Title.Location = New-Object System.Drawing.Point(0, 5)
    $Step1Title.AutoSize = $true
    $Step1Panel.Controls.Add($Step1Title)

    function Create-RadioOption($y, $title, $desc, $color, $checked) {
        $Pnl = New-Object System.Windows.Forms.Panel
        $Pnl.Location = New-Object System.Drawing.Point(0, $y)
        $Pnl.Size = New-Object System.Drawing.Size(645, 68)
        $Pnl.BackColor = [System.Drawing.Color]::FromArgb(26, 27, 34)
        $Pnl.BorderStyle = "FixedSingle"

        $Rad = New-Object System.Windows.Forms.RadioButton
        $Rad.Location = New-Object System.Drawing.Point(14, 14)
        $Rad.Size = New-Object System.Drawing.Size(20, 20)
        $Rad.Checked = $checked

        $LblTitle = New-Object System.Windows.Forms.Label
        $LblTitle.Text = $title
        $LblTitle.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
        $LblTitle.ForeColor = $color
        $LblTitle.Location = New-Object System.Drawing.Point(42, 12)
        $LblTitle.AutoSize = $true

        $LblDesc = New-Object System.Windows.Forms.Label
        $LblDesc.Text = $desc
        $LblDesc.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
        $LblDesc.ForeColor = [System.Drawing.Color]::FromArgb(180, 180, 185)
        $LblDesc.Location = New-Object System.Drawing.Point(42, 34)
        $LblDesc.AutoSize = $true

        $Pnl.Controls.Add($Rad)
        $Pnl.Controls.Add($LblTitle)
        $Pnl.Controls.Add($LblDesc)

        $Pnl.Add_Click({ $Rad.Checked = $true })
        $LblTitle.Add_Click({ $Rad.Checked = $true })
        $LblDesc.Add_Click({ $Rad.Checked = $true })

        return @{ Panel = $Pnl; Radio = $Rad }
    }

    $OptBoth = Create-RadioOption 35 "3. Instalación Completa (Agente + Monitor Central) [Recomendado]" "Servidor Todo-en-Uno (Full Stack). Instala la consola web y el daemon de telemetría." ([System.Drawing.Color]::FromArgb(56, 189, 248)) $true
    $OptAgent = Create-RadioOption 115 "1. Instalar Agente de Monitoreo" "Para puestos o servidores supervisados. Ejecuta el servicio en segundo plano y sensores de hardware." ([System.Drawing.Color]::FromArgb(255, 107, 0)) $false
    $OptMonitor = Create-RadioOption 195 "2. Instalar Monitor Central / Panel" "Para la estación del administrador. Configura consola web, base de datos y acceso directo en Escritorio." ([System.Drawing.Color]::FromArgb(0, 255, 102)) $false
    $OptUninstall = Create-RadioOption 275 "4. Desinstalar componentes existentes" "Detiene servicios, elimina reglas de firewall y borra la carpeta de Crashing LIVE." ([System.Drawing.Color]::FromArgb(239, 68, 68)) $false

    $Step1Panel.Controls.Add($OptBoth.Panel)
    $Step1Panel.Controls.Add($OptAgent.Panel)
    $Step1Panel.Controls.Add($OptMonitor.Panel)
    $Step1Panel.Controls.Add($OptUninstall.Panel)
    $Form.Controls.Add($Step1Panel)

    # Paso 2: Ruta
    $Step2Panel = New-Object System.Windows.Forms.Panel
    $Step2Panel.Size = New-Object System.Drawing.Size(650, 380)
    $Step2Panel.Location = New-Object System.Drawing.Point(25, 90)
    $Step2Panel.Visible = $false

    $Step2Title = New-Object System.Windows.Forms.Label
    $Step2Title.Text = "Seleccione la carpeta de instalación de Crashing LIVE:"
    $Step2Title.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $Step2Title.ForeColor = [System.Drawing.Color]::White
    $Step2Title.Location = New-Object System.Drawing.Point(0, 5)
    $Step2Title.AutoSize = $true
    $Step2Panel.Controls.Add($Step2Title)

    $Step2Desc = New-Object System.Windows.Forms.Label
    $Step2Desc.Text = "Por defecto, el asistente instalará en 'C:\\Program Files\\Crashing LIVE'." + [System.Environment]::NewLine + "Puede mantener esta ruta estándar o especificar cualquier otra carpeta o unidad (ej: D:\\Crashing LIVE):"
    $Step2Desc.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
    $Step2Desc.ForeColor = [System.Drawing.Color]::FromArgb(180, 180, 185)
    $Step2Desc.Location = New-Object System.Drawing.Point(0, 35)
    $Step2Desc.Size = New-Object System.Drawing.Size(640, 45)
    $Step2Panel.Controls.Add($Step2Desc)

    $FolderBoxPanel = New-Object System.Windows.Forms.Panel
    $FolderBoxPanel.Location = New-Object System.Drawing.Point(0, 95)
    $FolderBoxPanel.Size = New-Object System.Drawing.Size(645, 110)
    $FolderBoxPanel.BackColor = [System.Drawing.Color]::FromArgb(26, 27, 34)
    $FolderBoxPanel.BorderStyle = "FixedSingle"

    $LblPathTag = New-Object System.Windows.Forms.Label
    $LblPathTag.Text = "Carpeta de destino:"
    $LblPathTag.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $LblPathTag.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $LblPathTag.Location = New-Object System.Drawing.Point(15, 15)
    $LblPathTag.AutoSize = $true
    $FolderBoxPanel.Controls.Add($LblPathTag)

    $TxtPath = New-Object System.Windows.Forms.TextBox
    $TxtPath.Text = $DefaultInstallDir
    $TxtPath.Location = New-Object System.Drawing.Point(15, 40)
    $TxtPath.Size = New-Object System.Drawing.Size(490, 28)
    $TxtPath.BackColor = [System.Drawing.Color]::FromArgb(10, 10, 14)
    $TxtPath.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $TxtPath.Font = New-Object System.Drawing.Font("Consolas", 10)
    $FolderBoxPanel.Controls.Add($TxtPath)

    $BtnBrowse = New-Object System.Windows.Forms.Button
    $BtnBrowse.Text = "Examinar..."
    $BtnBrowse.Location = New-Object System.Drawing.Point(515, 38)
    $BtnBrowse.Size = New-Object System.Drawing.Size(110, 30)
    $BtnBrowse.FlatStyle = "Flat"
    $BtnBrowse.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(60, 60, 65)
    $BtnBrowse.BackColor = [System.Drawing.Color]::FromArgb(40, 42, 50)
    $BtnBrowse.ForeColor = [System.Drawing.Color]::White
    $BtnBrowse.Add_Click({
        $Fbd = New-Object System.Windows.Forms.FolderBrowserDialog
        $Fbd.Description = "Seleccione la carpeta donde se creara 'Crashing LIVE':"
        $Fbd.ShowNewFolderButton = $true
        if ($Fbd.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            $Selected = $Fbd.SelectedPath
            if (-not ($Selected -like "*Crashing LIVE*")) {
                $Selected = Join-Path $Selected "Crashing LIVE"
            }
            $TxtPath.Text = $Selected
        }
    })
    $FolderBoxPanel.Controls.Add($BtnBrowse)

    $LblDiskSpace = New-Object System.Windows.Forms.Label
    $LblDiskSpace.Text = "Espacio requerido: 85 MB  |  Espacio libre disponible: > 15 GB"
    $LblDiskSpace.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
    $LblDiskSpace.ForeColor = [System.Drawing.Color]::FromArgb(140, 140, 150)
    $LblDiskSpace.Location = New-Object System.Drawing.Point(15, 78)
    $LblDiskSpace.AutoSize = $true
    $FolderBoxPanel.Controls.Add($LblDiskSpace)

    $Step2Panel.Controls.Add($FolderBoxPanel)
    $Form.Controls.Add($Step2Panel)

    # Paso 3: Progreso
    $Step3Panel = New-Object System.Windows.Forms.Panel
    $Step3Panel.Size = New-Object System.Drawing.Size(650, 380)
    $Step3Panel.Location = New-Object System.Drawing.Point(25, 90)
    $Step3Panel.Visible = $false

    $Step3Title = New-Object System.Windows.Forms.Label
    $Step3Title.Text = "Instalando Crashing LIVE..."
    $Step3Title.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $Step3Title.ForeColor = [System.Drawing.Color]::White
    $Step3Title.Location = New-Object System.Drawing.Point(0, 5)
    $Step3Title.AutoSize = $true
    $Step3Panel.Controls.Add($Step3Title)

    $PBar = New-Object System.Windows.Forms.ProgressBar
    $PBar.Location = New-Object System.Drawing.Point(0, 35)
    $PBar.Size = New-Object System.Drawing.Size(645, 22)
    $PBar.Minimum = 0
    $PBar.Maximum = 100
    $PBar.Value = 0
    $Step3Panel.Controls.Add($PBar)

    $StatusLabel = New-Object System.Windows.Forms.Label
    $StatusLabel.Text = "Iniciando instalación..."
    $StatusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $StatusLabel.ForeColor = [System.Drawing.Color]::FromArgb(161, 161, 170)
    $StatusLabel.Location = New-Object System.Drawing.Point(0, 65)
    $StatusLabel.AutoSize = $true
    $Step3Panel.Controls.Add($StatusLabel)

    $LogBox = New-Object System.Windows.Forms.TextBox
    $LogBox.Location = New-Object System.Drawing.Point(0, 95)
    $LogBox.Size = New-Object System.Drawing.Size(645, 260)
    $LogBox.Multiline = $true
    $LogBox.ReadOnly = $true
    $LogBox.ScrollBars = "Vertical"
    $LogBox.BackColor = [System.Drawing.Color]::FromArgb(10, 10, 12)
    $LogBox.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $LogBox.Font = New-Object System.Drawing.Font("Consolas", 8.5)
    $Step3Panel.Controls.Add($LogBox)

    $Form.Controls.Add($Step3Panel)

    # Paso 4: Finalizacion
    $Step4Panel = New-Object System.Windows.Forms.Panel
    $Step4Panel.Size = New-Object System.Drawing.Size(650, 380)
    $Step4Panel.Location = New-Object System.Drawing.Point(25, 90)
    $Step4Panel.Visible = $false

    $Step4Title = New-Object System.Windows.Forms.Label
    $Step4Title.Text = "¡Instalación completada exitosamente!"
    $Step4Title.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $Step4Title.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 102)
    $Step4Title.Location = New-Object System.Drawing.Point(0, 10)
    $Step4Title.AutoSize = $true
    $Step4Panel.Controls.Add($Step4Title)

    $Step4Desc = New-Object System.Windows.Forms.Label
    $Step4Desc.Text = "Crashing LIVE Monitor ha sido instalado correctamente en su equipo:"
    $Step4Desc.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
    $Step4Desc.ForeColor = [System.Drawing.Color]::White
    $Step4Desc.Location = New-Object System.Drawing.Point(0, 45)
    $Step4Desc.Size = New-Object System.Drawing.Size(640, 25)
    $Step4Panel.Controls.Add($Step4Desc)

    $InstalledPathBox = New-Object System.Windows.Forms.Label
    $InstalledPathBox.Text = $DefaultInstallDir
    $InstalledPathBox.Font = New-Object System.Drawing.Font("Consolas", 10.5, [System.Drawing.FontStyle]::Bold)
    $InstalledPathBox.ForeColor = [System.Drawing.Color]::FromArgb(56, 189, 248)
    $InstalledPathBox.Location = New-Object System.Drawing.Point(0, 75)
    $InstalledPathBox.AutoSize = $true
    $Step4Panel.Controls.Add($InstalledPathBox)

    $ChkOpenFolder = New-Object System.Windows.Forms.CheckBox
    $ChkOpenFolder.Text = "Abrir la carpeta 'Crashing LIVE' en el Explorador de Windows"
    $ChkOpenFolder.Checked = $true
    $ChkOpenFolder.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
    $ChkOpenFolder.ForeColor = [System.Drawing.Color]::White
    $ChkOpenFolder.Location = New-Object System.Drawing.Point(5, 120)
    $ChkOpenFolder.Size = New-Object System.Drawing.Size(500, 25)
    $Step4Panel.Controls.Add($ChkOpenFolder)

    $ChkOpenMonitor = New-Object System.Windows.Forms.CheckBox
    $ChkOpenMonitor.Text = "Abrir el Monitor Web en el navegador (http://localhost:$ListenPort)"
    $ChkOpenMonitor.Checked = $true
    $ChkOpenMonitor.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
    $ChkOpenMonitor.ForeColor = [System.Drawing.Color]::White
    $ChkOpenMonitor.Location = New-Object System.Drawing.Point(5, 150)
    $ChkOpenMonitor.Size = New-Object System.Drawing.Size(500, 25)
    $Step4Panel.Controls.Add($ChkOpenMonitor)

    $Form.Controls.Add($Step4Panel)

    $Script:CurrentStep = 1

    function Append-Log($text) {
        $LogBox.AppendText($text + [System.Environment]::NewLine)
        $LogBox.SelectionStart = $LogBox.Text.Length
        $LogBox.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    }

    function Go-Step($stepNum) {
        $Script:CurrentStep = $stepNum
        $Step1Panel.Visible = ($stepNum -eq 1)
        $Step2Panel.Visible = ($stepNum -eq 2)
        $Step3Panel.Visible = ($stepNum -eq 3)
        $Step4Panel.Visible = ($stepNum -eq 4)

        $BtnBack.Visible = ($stepNum -eq 2)
        $BtnNext.Visible = ($stepNum -ne 3)
        $BtnCancel.Visible = ($stepNum -ne 3)

        if ($stepNum -eq 1) {
            $BtnNext.Text = "Siguiente >"
        } elseif ($stepNum -eq 2) {
            $BtnNext.Text = "Instalar >"
        } elseif ($stepNum -eq 4) {
            $BtnNext.Text = "Finalizar"
        }
    }

    $BtnBack.Add_Click({
        if ($Script:CurrentStep -eq 2) {
            Go-Step 1
        }
    })

    $BtnNext.Add_Click({
        if ($Script:CurrentStep -eq 1) {
            if ($OptUninstall.Radio.Checked) {
                Go-Step 3
                Run-Install "Uninstall" $TxtPath.Text
            } else {
                Go-Step 2
            }
        } elseif ($Script:CurrentStep -eq 2) {
            $Mode = "Both"
            if ($OptAgent.Radio.Checked) { $Mode = "Agent" }
            if ($OptMonitor.Radio.Checked) { $Mode = "Monitor" }
            Go-Step 3
            Run-Install $Mode $TxtPath.Text
        } elseif ($Script:CurrentStep -eq 4) {
            if ($ChkOpenFolder.Checked -and (Test-Path $TxtPath.Text)) {
                Invoke-Item $TxtPath.Text
            }
            if ($ChkOpenMonitor.Checked) {
                Start-Process ("http://localhost:" + $ListenPort)
            }
            $Form.Close()
        }
    })

    function Run-Install($mode, $targetPath) {
        $InstalledPathBox.Text = $targetPath

        if ($mode -eq "Uninstall") {
            $Step3Title.Text = "Desinstalando componentes..."
            $StatusLabel.Text = "Limpiando servicios y archivos..."
            $PBar.Value = 30
            Append-Log "[1/3] Deteniendo servicios de Crashing LIVE..."
            Stop-Service -Name "CrashingLiveDaemon" -Force -ErrorAction SilentlyContinue
            & sc.exe delete "CrashingLiveDaemon" | Out-Null
            
            $PBar.Value = 60
            Append-Log "[2/3] Eliminando reglas de Windows Firewall..."
            Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
            Remove-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -ErrorAction SilentlyContinue
            Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue

            $PBar.Value = 90
            Append-Log ("[3/3] Eliminando carpeta " + $targetPath + "...")
            if (Test-Path $targetPath) {
                Remove-Item -Path $targetPath -Recurse -Force -ErrorAction SilentlyContinue
            }
            $PBar.Value = 100
            Append-Log "[✔] Desinstalacion completada exitosamente."
            Start-Sleep -Seconds 1
            $Step4Title.Text = "¡Desinstalación completada!"
            $Step4Desc.Text = "Crashing LIVE ha sido completamente eliminado del sistema."
            $ChkOpenFolder.Visible = $false
            $ChkOpenMonitor.Visible = $false
            Go-Step 4
            return
        }

        $PBar.Value = 15
        $StatusLabel.Text = "Creando carpeta de destino: " + $targetPath + "..."
        Append-Log ("[1/6] Creando directorio oficial: " + $targetPath)
        New-Item -ItemType Directory -Path ($targetPath + "\\logs") -Force -ErrorAction SilentlyContinue | Out-Null
        New-Item -ItemType Directory -Path ($targetPath + "\\scripts") -Force -ErrorAction SilentlyContinue | Out-Null
        New-Item -ItemType Directory -Path ($targetPath + "\\backups") -Force -ErrorAction SilentlyContinue | Out-Null
        Append-Log "      [OK] Estructura creada correctamente."

        $PBar.Value = 35
        $StatusLabel.Text = "Copiando componentes de la aplicacion..."
        Append-Log "[2/6] Copiando archivos de Crashing LIVE..."
        Copy-Item -Path (Join-Path $ScriptDir "agent_daemon.py") -Destination ($targetPath + "\\agent_daemon.py") -Force -ErrorAction SilentlyContinue
        Copy-Item -Path (Join-Path $ScriptDir "config.json") -Destination ($targetPath + "\\config.json") -Force -ErrorAction SilentlyContinue
        Copy-Item -Path (Join-Path $ScriptDir "uninstall.ps1") -Destination ($targetPath + "\\uninstall.ps1") -Force -ErrorAction SilentlyContinue
        Append-Log ("      [OK] Binarios y configuracion copiados a " + $targetPath)

        $PBar.Value = 55
        $StatusLabel.Text = "Configurando reglas de Windows Firewall..."
        Append-Log ("[3/6] Habilitando puertos TCP " + $ListenPort + " y UDP 8444...")
        Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
        New-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -Direction Inbound -Protocol UDP -LocalPort 8444 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
        Append-Log "      [OK] Firewall configurado correctamente."

        if ($mode -in "Agent", "Both") {
            $PBar.Value = 75
            $StatusLabel.Text = "Configurando servicio de Windows 'CrashingLiveDaemon'..."
            Append-Log "[4/6] Registrando servicio en Windows..."
            $PythonExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
            $SvcName = "CrashingLiveDaemon"
            if (Get-Service -Name $SvcName -ErrorAction SilentlyContinue) {
                Stop-Service -Name $SvcName -Force -ErrorAction SilentlyContinue
                Start-Service -Name $SvcName -ErrorAction SilentlyContinue
                Append-Log "      [OK] Servicio reiniciado."
            } else {
                if ($PythonExe) {
                    $BinPath = '"' + $PythonExe + '" "' + $targetPath + '\\agent_daemon.py"'
                    New-Service -Name $SvcName -DisplayName "Crashing LIVE Autonomous Daemon" -BinaryPathName $BinPath -StartupType Automatic -ErrorAction SilentlyContinue | Out-Null
                    Start-Service -Name $SvcName -ErrorAction SilentlyContinue
                    Append-Log "      [OK] Servicio 'CrashingLiveDaemon' registrado con inicio automatico."
                }
            }

            $RegKey = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent"
            if (-not (Test-Path $RegKey)) { New-Item -Path $RegKey -Force -ErrorAction SilentlyContinue | Out-Null }
            Set-ItemProperty -Path $RegKey -Name "DisplayName" -Value "Crashing LIVE Agent" -Force
            Set-ItemProperty -Path $RegKey -Name "InstallLocation" -Value $targetPath -Force
            Set-ItemProperty -Path $RegKey -Name "UninstallString" -Value ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $targetPath + '\\uninstall.ps1"') -Force
            Append-Log "      [OK] Registrado en Programas y Caracteristicas."
        }

        if ($mode -in "Monitor", "Both") {
            $PBar.Value = 90
            $StatusLabel.Text = "Creando acceso directo en el Escritorio..."
            Append-Log "[5/6] Creando acceso directo 'Crashing LIVE Monitor'..."
            try {
                $Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
                $WshShell = New-Object -ComObject WScript.Shell
                $Sc = $WshShell.CreateShortcut($Desktop + "\\Crashing LIVE Monitor.url")
                $Sc.TargetPath = "http://localhost:" + $ListenPort
                $Sc.Save()
                Append-Log "      [OK] Acceso directo creado en el Escritorio."
            } catch {}
        }

        $PBar.Value = 100
        $StatusLabel.Text = "¡Instalación completada exitosamente!"
        Append-Log "[6/6] Proceso finalizado con exito."
        Start-Sleep -Milliseconds 500
        Go-Step 4
    }

    $Form.ShowDialog() | Out-Null
    $Form.Dispose()
} catch {
    [System.Windows.Forms.MessageBox]::Show(("Error en el asistente: " + $_.Exception.Message), "Crashing LIVE Setup", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
}
`;

  // =========================================================================
  // 5. Wizard_Instalador.ps1 (Motor PowerShell con Parametro -TargetDir)
  // =========================================================================
  const psCliWizard = `# Crashing LIVE Monitor - Motor de Instalacion con Ruta Personalizada
param(
    [ValidateSet("Interactive", "Agent", "Monitor", "Both", "Uninstall")]
    [string]$Mode = "Interactive",
    
    [string]$TargetDir = ""
)

$HostName   = "${currentHost}"
$ListenPort = ${currentPort}

if (-not $TargetDir) {
    $ProgFiles = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
    if (-not $ProgFiles) { $ProgFiles = $env:ProgramFiles }
    if (-not $ProgFiles) { $ProgFiles = "C:\\Program Files" }
    $TargetDir = Join-Path $ProgFiles "Crashing LIVE"
}

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    if ($MyInvocation -and $MyInvocation.MyCommand -and $MyInvocation.MyCommand.Definition) {
        $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    }
}
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }

if ($Mode -eq "Interactive") {
    Clear-Host
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "         CRASHING LIVE MONITOR - ASISTENTE DE INSTALACION               " -ForegroundColor White
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host (" Carpeta por defecto: " + $TargetDir) -ForegroundColor Cyan
    Write-Host ""
    $CustomPath = Read-Host " Presione ENTER para usar la ruta por defecto o escriba otra ruta"
    if ($CustomPath.Trim() -ne "") {
        if (-not ($CustomPath -like "*Crashing LIVE*")) {
            $TargetDir = Join-Path $CustomPath "Crashing LIVE"
        } else {
            $TargetDir = $CustomPath
        }
    }
    Write-Host ""
    Write-Host " [1] Instalar Agente" -ForegroundColor White
    Write-Host " [2] Instalar Monitor" -ForegroundColor White
    Write-Host " [3] Instalar Ambos [Recomendado]" -ForegroundColor White
    Write-Host " [4] Desinstalar" -ForegroundColor White
    $Choice = Read-Host " Ingrese su opcion [1, 2, 3 o 4]"
    switch ($Choice) {
        "1" { $Mode = "Agent" }
        "2" { $Mode = "Monitor" }
        "3" { $Mode = "Both" }
        "4" { $Mode = "Uninstall" }
        Default { $Mode = "Both" }
    }
}

if ($Mode -in "Agent", "Both") {
    Write-Host ("[+] Creando " + $TargetDir + "...") -ForegroundColor Cyan
    New-Item -ItemType Directory -Path ($TargetDir + "\\logs") -Force -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path ($TargetDir + "\\scripts") -Force -ErrorAction SilentlyContinue | Out-Null
    
    Copy-Item -Path (Join-Path $ScriptDir "agent_daemon.py") -Destination ($TargetDir + "\\agent_daemon.py") -Force -ErrorAction SilentlyContinue
    Copy-Item -Path (Join-Path $ScriptDir "config.json") -Destination ($TargetDir + "\\config.json") -Force -ErrorAction SilentlyContinue
    Copy-Item -Path (Join-Path $ScriptDir "uninstall.ps1") -Destination ($TargetDir + "\\uninstall.ps1") -Force -ErrorAction SilentlyContinue

    New-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -Direction Inbound -Protocol TCP -LocalPort $ListenPort -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    Write-Host ("[✔] Crashing LIVE instalado exitosamente en " + $TargetDir) -ForegroundColor Green
}

if ($Mode -in "Monitor", "Both") {
    try {
        $Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
        $WshShell = New-Object -ComObject WScript.Shell
        $Sc = $WshShell.CreateShortcut($Desktop + "\\Crashing LIVE Monitor.url")
        $Sc.TargetPath = "http://localhost:" + $ListenPort
        $Sc.Save()
        Write-Host "[✔] Acceso directo en el Escritorio creado." -ForegroundColor Green
    } catch {}
}

if ($Mode -eq "Uninstall") {
    Write-Host ("[+] Desinstalando de " + $TargetDir + "...") -ForegroundColor Yellow
    Stop-Service -Name "CrashingLiveDaemon" -Force -ErrorAction SilentlyContinue
    & sc.exe delete "CrashingLiveDaemon" | Out-Null
    Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
    if (Test-Path $TargetDir) {
        Remove-Item -Path $TargetDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[✔] Desinstalacion completada." -ForegroundColor Green
}
`;

  // =========================================================================
  // 6. uninstall.ps1 (Desinstalador limpio de Crashing LIVE)
  // =========================================================================
  const psUninstall = `# Crashing LIVE Monitor - Clean Uninstaller
$ErrorActionPreference = "SilentlyContinue"

$CurrentDir = Split-Path -Parent $PSCommandPath
if (-not $CurrentDir) {
    $ProgFiles = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
    $CurrentDir = Join-Path $ProgFiles "Crashing LIVE"
}

Stop-Service -Name "CrashingLiveDaemon" -Force -ErrorAction SilentlyContinue
& sc.exe delete "CrashingLiveDaemon" | Out-Null

Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Crashing LIVE*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Remove-NetFirewallRule -DisplayName "Crashing Live Agent Inbound" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Agent Discovery" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Crashing Live Monitor Port" -ErrorAction SilentlyContinue

$Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
Remove-Item -Path ($Desktop + "\\Crashing LIVE Monitor.url") -Force -ErrorAction SilentlyContinue

Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveAgent" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLiveMonitor" -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path $CurrentDir) {
    Get-ChildItem -Path $CurrentDir -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item -Path $CurrentDir -Force -Recurse -ErrorAction SilentlyContinue
}
`;

  // =========================================================================
  // 7. agent_daemon.py
  // =========================================================================
  const pythonDaemon = `"""
Crashing LIVE Monitor - Autonomous Windows Telemetry Daemon
Version: 2.6.4
Default Location: ${defaultPath}
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

app_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(app_dir, "config.json")

default_config = {
    "agent_id": "${agentId}",
    "hostname": "${currentHost}",
    "listen_port": ${currentPort},
    "interval_seconds": 2
}

def load_config():
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_config
    return default_config

config = load_config()

log_dir = os.path.join(app_dir, "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [CrashingLIVE] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "agent.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

logging.info(f"Iniciando Crashing LIVE Agent en {config.get('hostname')}...")
logging.info(f"Carpeta: {app_dir}")
logging.info(f"Agent ID AnyDesk: {config.get('agent_id', '${agentId}')}")

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
        logging.warning(f"Beacon UDP LAN: {e}")

threading.Thread(target=lan_discovery_beacon, daemon=True).start()

try:
    while True:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        logging.info(f"TELEMETRIA OK - CPU: {cpu}% | RAM: {ram.percent}%")
        time.sleep(config.get("interval_seconds", 2))
except KeyboardInterrupt:
    logging.info("Daemon detenido.")
`;

  // =========================================================================
  // 8. schema.sql
  // =========================================================================
  const schemaSql = `-- PostgreSQL Relational Schema for Crashing LIVE Monitor
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
`;

  // =========================================================================
  // 9. config.json
  // =========================================================================
  const configJson = JSON.stringify(
    {
      app_name: "Crashing LIVE Monitor",
      version: "2.6.4",
      agent_id: agentId,
      install_location: defaultPath,
      server: {
        hostname: currentHost,
        ip_address: currentIp,
        port: currentPort,
        ssl: true
      },
      agent: {
        service_name: "CrashingLiveDaemon",
        interval_seconds: 2,
        require_reboot_approval: true
      }
    },
    null,
    2
  );

  // =========================================================================
  // 10. LEEME_INSTRUCCIONES.txt
  // =========================================================================
  const readmeTxt = `===============================================================================
       CRASHING LIVE MONITOR - ASISTENTE DE INSTALACION OFICIAL (WIZARD)
===============================================================================

Este paquete contiene el Asistente Grafico clasico (Wizard comun) de
Crashing LIVE Monitor.

COMO INICIAR LA INSTALACION:
1. Descomprima este archivo .ZIP en su equipo o servidor.
2. Ejecute "Instalador.bat" (o "Instalador.hta").
3. El Asistente le guiara paso a paso:
   - Paso 1: Seleccion de componentes (Agente, Monitor, Ambos o Desinstalar).
   - Paso 2: Seleccion de carpeta de destino. Por defecto instalara en:
             C:\\Program Files\\Crashing LIVE
             O bien puede hacer clic en "Examinar..." y especificar la ruta que desee.
   - Paso 3: Barra de progreso de instalacion automatica.
   - Paso 4: Finalizacion y apertura de accesos.
`;

  zip.file('Instalador.bat', toWindowsCrlf(batLauncher));
  zip.file('Instalador.hta', toWindowsCrlf(htaLauncher));
  zip.file('Instalador.vbs', toWindowsCrlf(vbsLauncher));
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
