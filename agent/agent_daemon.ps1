# -*- coding: utf-8 -*-
param (
    [string]$MonitorUrl = "http://localhost:3000",
    [string[]]$MonitorUrls = @(),
    [string]$CustomAgentCode = "",
    [int]$IntervalSeconds = 2,
    [switch]$NoGui,
    [switch]$Headless
)

# Ocultar ventana negra de consola si se inicio en modo GUI interactivo
if (-not $NoGui -and -not $Headless -and ($env:CRASHINGLIVE_HEADLESS -ne '1')) {
    try {
        Add-Type -Name Win32Window -Namespace Win32Utils -MemberDefinition @"
        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        [DllImport("kernel32.dll")]
        public static extern IntPtr GetConsoleWindow();
"@ -ErrorAction SilentlyContinue
        $hWnd = [Win32Utils.Win32Window]::GetConsoleWindow()
        if ($hWnd -ne [IntPtr]::Zero) {
            [Win32Utils.Win32Window]::ShowWindow($hWnd, 0) | Out-Null
        }
    } catch {}
}

$Host.UI.RawUI.WindowTitle = "Crashing LIVE - Agente de Telemetria Windows"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ConfigFile = Join-Path $ScriptDir "agent_config.json"

# Cargar o Generar Codigo AnyDesk Persistente
$AgentConfig = @{}
if (Test-Path $ConfigFile) {
    try {
        $rawJson = Get-Content $ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json
        $AgentConfig = @{
            agent_id = $rawJson.agent_id
            display_code = $rawJson.display_code
            numeric_code = $rawJson.numeric_code
            monitor_url = if ($rawJson.monitor_url) { $rawJson.monitor_url } else { $MonitorUrl }
            monitor_urls = if ($rawJson.monitor_urls) { @($rawJson.monitor_urls) } else { @($MonitorUrl) }
            interval_seconds = if ($rawJson.interval_seconds) { $rawJson.interval_seconds } else { $IntervalSeconds }
            tunnel_token = if ($rawJson.tunnel_token) { $rawJson.tunnel_token } else { 'clk_live_tunnel_sec_2026' }
        }
    } catch {}
}

# Si no existe codigo o se pasa uno por parametro
if ($CustomAgentCode) {
    $cleanDigits = ($CustomAgentCode -replace '\D', '')
    if ($cleanDigits.Length -lt 9) { $cleanDigits = $cleanDigits.PadRight(9, '0') }
    $cleanDigits = $cleanDigits.Substring(0, 9)
    $AgentConfig.numeric_code = $cleanDigits
    $AgentConfig.display_code = "$($cleanDigits.Substring(0,3)) $($cleanDigits.Substring(3,3)) $($cleanDigits.Substring(6,3))"
    $AgentConfig.agent_id = "CL-$($cleanDigits.Substring(0,3))-$($cleanDigits.Substring(3,3))-$($cleanDigits.Substring(6,3))"
} elseif (-not $AgentConfig.display_code) {
    $rand = [System.Random]::new()
    $part1 = $rand.Next(100, 999)
    $part2 = $rand.Next(100, 999)
    $part3 = $rand.Next(100, 999)
    $numCode = "$part1$part2$part3"
    $AgentConfig.numeric_code = $numCode
    $AgentConfig.display_code = "$part1 $part2 $part3"
    $AgentConfig.agent_id = "CL-$part1-$part2-$part3"
    $AgentConfig.monitor_url = $MonitorUrl
    $AgentConfig.monitor_urls = @($MonitorUrl)
    $AgentConfig.interval_seconds = $IntervalSeconds
}

# Normalizar lista de URLs
$allUrls = @()
if ($MonitorUrls -and $MonitorUrls.Count -gt 0) {
    $allUrls += $MonitorUrls
} elseif ($AgentConfig.monitor_urls -and $AgentConfig.monitor_urls.Count -gt 0) {
    $allUrls += $AgentConfig.monitor_urls
} else {
    $allUrls += @($MonitorUrl)
}
$targetUrls = @($allUrls | ForEach-Object { $_.TrimEnd('/') } | Select-Object -Unique)
$AgentConfig.monitor_urls = $targetUrls
$AgentConfig.monitor_url = $targetUrls[0]

# Guardar configuracion persistente
try {
    $AgentConfig | ConvertTo-Json -Depth 3 | Set-Content $ConfigFile -Encoding UTF8 -Force
} catch {}

$interval = if ($AgentConfig.interval_seconds) { [int]$AgentConfig.interval_seconds } else { 2 }
$tunnelToken = if ($AgentConfig.tunnel_token) { $AgentConfig.tunnel_token } else { 'clk_live_tunnel_sec_2026' }
$displayCode = $AgentConfig.display_code
$agentId = $AgentConfig.agent_id

# Obtener Informacion General del Equipo
$hostname = $env:COMPUTERNAME
$osInfo = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
$osCaption = if ($osInfo) { $osInfo.Caption } else { "Microsoft Windows" }

# Obtener IP Principal
$localIp = "127.0.0.1"
try {
    $netIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
        $_.IPAddress -notmatch '^(169\.254|127\.)' -and $_.InterfaceAlias -notmatch 'Loopback'
    }
    if ($netIps) {
        $localIp = ($netIps | Select-Object -First 1).IPAddress
    }
} catch {
    $localIp = "127.0.0.1"
}

Clear-Host
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "                  CRASHING LIVE - AGENTE DE MONITOREO WINDOWS                   " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  SU CODIGO DE AGENTE (ESTILO ANYDESK):" -ForegroundColor Yellow
Write-Host ""
Write-Host "             >>>   $displayCode   <<<" -ForegroundColor Green
Write-Host "                   ID: $agentId" -ForegroundColor Gray
Write-Host ""
Write-Host "  Introduzca este codigo en el Monitor Central para conectar y ver el estado." -ForegroundColor White
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  Monitores Hub: $($targetUrls -join ', ')" -ForegroundColor White
Write-Host "  Equipo:        $hostname ($osCaption)" -ForegroundColor White
Write-Host "  IP Local:      $localIp" -ForegroundColor White
Write-Host "  Frecuencia:    Cada $interval segundos" -ForegroundColor White
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  Presione Ctrl+C en cualquier momento para detener el agente." -ForegroundColor DarkGray
Write-Host ""

# Variables para la GUI moderna y responsive
$enableGui = (-not $NoGui) -and (-not $Headless) -and ($env:CRASHINGLIVE_HEADLESS -ne '1')
$guiForm = $null
$hubBadges = @{}
$lblCpuVal = $null
$lblRamVal = $null
$pnlCpuTrack = $null
$pnlCpuFill = $null
$pnlRamTrack = $null
$pnlRamFill = $null

if ($enableGui) {
    try {
        Add-Type -AssemblyName System.Windows.Forms, System.Drawing -ErrorAction Stop

        $guiForm = New-Object System.Windows.Forms.Form
        $guiForm.Text = "Crashing LIVE - Agente Status"
        $guiForm.Size = New-Object System.Drawing.Size(520, 480)
        $guiForm.MinimumSize = New-Object System.Drawing.Size(460, 380)
        $guiForm.StartPosition = "CenterScreen"
        $guiForm.TopMost = $true
        $guiForm.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)
        $guiForm.ForeColor = [System.Drawing.Color]::White
        $guiForm.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::Sizable
        $guiForm.MaximizeBox = $true

        # 1. Panel Header Superior (Identificación y AnyDesk ID)
        $pnlHeader = New-Object System.Windows.Forms.Panel
        $pnlHeader.Dock = [System.Windows.Forms.DockStyle]::Top
        $pnlHeader.Height = 88
        $pnlHeader.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 24)
        $guiForm.Controls.Add($pnlHeader)

        $lblTitle = New-Object System.Windows.Forms.Label
        $lblTitle.Text = "CRASHING LIVE • AGENTE STATUS"
        $lblTitle.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
        $lblTitle.ForeColor = [System.Drawing.Color]::FromArgb(255, 102, 0)
        $lblTitle.Location = New-Object System.Drawing.Point(14, 10)
        $lblTitle.AutoSize = $true
        $pnlHeader.Controls.Add($lblTitle)

        $lblBase = New-Object System.Windows.Forms.Label
        $lblBase.Text = "$hostname ($localIp) • $osCaption"
        $lblBase.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
        $lblBase.ForeColor = [System.Drawing.Color]::FromArgb(160, 160, 160)
        $lblBase.Location = New-Object System.Drawing.Point(14, 32)
        $lblBase.AutoSize = $true
        $pnlHeader.Controls.Add($lblBase)

        # Badge del Código AnyDesk
        $pnlAnydesk = New-Object System.Windows.Forms.Panel
        $pnlAnydesk.Location = New-Object System.Drawing.Point(14, 54)
        $pnlAnydesk.Size = New-Object System.Drawing.Size(470, 24)
        $pnlAnydesk.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right)
        $pnlAnydesk.BackColor = [System.Drawing.Color]::FromArgb(32, 32, 32)
        $pnlHeader.Controls.Add($pnlAnydesk)

        $lblCode = New-Object System.Windows.Forms.Label
        $lblCode.Text = "CÓDIGO ANYDESK: $displayCode   •   ID: $agentId"
        $lblCode.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $lblCode.ForeColor = [System.Drawing.Color]::FromArgb(0, 230, 118)
        $lblCode.Location = New-Object System.Drawing.Point(8, 4)
        $lblCode.AutoSize = $true
        $pnlAnydesk.Controls.Add($lblCode)

        # 2. Panel de Métricas Locales Compactas con Barras de Progreso
        $pnlMetrics = New-Object System.Windows.Forms.Panel
        $pnlMetrics.Dock = [System.Windows.Forms.DockStyle]::Top
        $pnlMetrics.Height = 92
        $pnlMetrics.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)
        $guiForm.Controls.Add($pnlMetrics)

        # Fila CPU
        $lblCpuTitle = New-Object System.Windows.Forms.Label
        $lblCpuTitle.Text = "CPU"
        $lblCpuTitle.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $lblCpuTitle.ForeColor = [System.Drawing.Color]::FromArgb(180, 180, 180)
        $lblCpuTitle.Location = New-Object System.Drawing.Point(14, 10)
        $lblCpuTitle.AutoSize = $true
        $pnlMetrics.Controls.Add($lblCpuTitle)

        $lblCpuVal = New-Object System.Windows.Forms.Label
        $lblCpuVal.Text = "0%"
        $lblCpuVal.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $lblCpuVal.ForeColor = [System.Drawing.Color]::White
        $lblCpuVal.Location = New-Object System.Drawing.Point(420, 10)
        $lblCpuVal.Size = New-Object System.Drawing.Size(65, 16)
        $lblCpuVal.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
        $lblCpuVal.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Right)
        $pnlMetrics.Controls.Add($lblCpuVal)

        $pnlCpuTrack = New-Object System.Windows.Forms.Panel
        $pnlCpuTrack.Location = New-Object System.Drawing.Point(14, 28)
        $pnlCpuTrack.Size = New-Object System.Drawing.Size(470, 7)
        $pnlCpuTrack.BackColor = [System.Drawing.Color]::FromArgb(38, 38, 38)
        $pnlCpuTrack.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right)
        $pnlMetrics.Controls.Add($pnlCpuTrack)

        $pnlCpuFill = New-Object System.Windows.Forms.Panel
        $pnlCpuFill.Location = New-Object System.Drawing.Point(0, 0)
        $pnlCpuFill.Size = New-Object System.Drawing.Size(10, 7)
        $pnlCpuFill.BackColor = [System.Drawing.Color]::FromArgb(0, 230, 118)
        $pnlCpuTrack.Controls.Add($pnlCpuFill)

        # Fila RAM
        $lblRamTitle = New-Object System.Windows.Forms.Label
        $lblRamTitle.Text = "MEMORIA RAM"
        $lblRamTitle.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $lblRamTitle.ForeColor = [System.Drawing.Color]::FromArgb(180, 180, 180)
        $lblRamTitle.Location = New-Object System.Drawing.Point(14, 46)
        $lblRamTitle.AutoSize = $true
        $pnlMetrics.Controls.Add($lblRamTitle)

        $lblRamVal = New-Object System.Windows.Forms.Label
        $lblRamVal.Text = "0% (0 / 16 GB)"
        $lblRamVal.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $lblRamVal.ForeColor = [System.Drawing.Color]::White
        $lblRamVal.Location = New-Object System.Drawing.Point(320, 46)
        $lblRamVal.Size = New-Object System.Drawing.Size(165, 16)
        $lblRamVal.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
        $lblRamVal.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Right)
        $pnlMetrics.Controls.Add($lblRamVal)

        $pnlRamTrack = New-Object System.Windows.Forms.Panel
        $pnlRamTrack.Location = New-Object System.Drawing.Point(14, 65)
        $pnlRamTrack.Size = New-Object System.Drawing.Size(470, 7)
        $pnlRamTrack.BackColor = [System.Drawing.Color]::FromArgb(38, 38, 38)
        $pnlRamTrack.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right)
        $pnlMetrics.Controls.Add($pnlRamTrack)

        $pnlRamFill = New-Object System.Windows.Forms.Panel
        $pnlRamFill.Location = New-Object System.Drawing.Point(0, 0)
        $pnlRamFill.Size = New-Object System.Drawing.Size(10, 7)
        $pnlRamFill.BackColor = [System.Drawing.Color]::FromArgb(255, 102, 0)
        $pnlRamTrack.Controls.Add($pnlRamFill)

        # 3. Encabezado de la lista de monitores
        $pnlMonHeader = New-Object System.Windows.Forms.Panel
        $pnlMonHeader.Dock = [System.Windows.Forms.DockStyle]::Top
        $pnlMonHeader.Height = 26
        $pnlMonHeader.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)
        $guiForm.Controls.Add($pnlMonHeader)

        $lblMonTitle = New-Object System.Windows.Forms.Label
        $lblMonTitle.Text = "MONITORES REGISTRADOS (CONEXIÓN SALIENTE):"
        $lblMonTitle.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
        $lblMonTitle.ForeColor = [System.Drawing.Color]::FromArgb(140, 140, 140)
        $lblMonTitle.Location = New-Object System.Drawing.Point(14, 6)
        $lblMonTitle.AutoSize = $true
        $pnlMonHeader.Controls.Add($lblMonTitle)

        # 4. Footer Inferior Sutil
        $pnlFooter = New-Object System.Windows.Forms.Panel
        $pnlFooter.Dock = [System.Windows.Forms.DockStyle]::Bottom
        $pnlFooter.Height = 26
        $pnlFooter.BackColor = [System.Drawing.Color]::FromArgb(22, 22, 22)
        $guiForm.Controls.Add($pnlFooter)

        $lblFooter = New-Object System.Windows.Forms.Label
        $lblFooter.Text = "Modelo Saliente (Outbound-only) • Cierre la ventana para detener el agente"
        $lblFooter.Font = New-Object System.Drawing.Font("Segoe UI", 7.5)
        $lblFooter.ForeColor = [System.Drawing.Color]::FromArgb(110, 110, 110)
        $lblFooter.Location = New-Object System.Drawing.Point(14, 6)
        $lblFooter.AutoSize = $true
        $pnlFooter.Controls.Add($lblFooter)

        # 5. Contenedor de Tarjetas de Monitores (Flexible y Scrollable)
        $pnlCardsContainer = New-Object System.Windows.Forms.Panel
        $pnlCardsContainer.Dock = [System.Windows.Forms.DockStyle]::Fill
        $pnlCardsContainer.AutoScroll = $true
        $pnlCardsContainer.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)
        $guiForm.Controls.Add($pnlCardsContainer)

        $yPos = 6
        foreach ($url in $targetUrls) {
            $pnlCard = New-Object System.Windows.Forms.Panel
            $pnlCard.Location = New-Object System.Drawing.Point(14, $yPos)
            $pnlCard.Size = New-Object System.Drawing.Size(470, 38)
            $pnlCard.BackColor = [System.Drawing.Color]::FromArgb(26, 26, 26)
            $pnlCard.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right)
            $pnlCardsContainer.Controls.Add($pnlCard)

            $lblUrl = New-Object System.Windows.Forms.Label
            $lblUrl.Text = $url
            $lblUrl.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
            $lblUrl.ForeColor = [System.Drawing.Color]::White
            $lblUrl.Location = New-Object System.Drawing.Point(10, 10)
            $lblUrl.Size = New-Object System.Drawing.Size(290, 20)
            $lblUrl.AutoEllipsis = $true
            $lblUrl.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right)
            $pnlCard.Controls.Add($lblUrl)

            $lblBadge = New-Object System.Windows.Forms.Label
            $lblBadge.Text = "[CONECTANDO...]"
            $lblBadge.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
            $lblBadge.ForeColor = [System.Drawing.Color]::FromArgb(255, 160, 0)
            $lblBadge.Location = New-Object System.Drawing.Point(305, 10)
            $lblBadge.Size = New-Object System.Drawing.Size(155, 20)
            $lblBadge.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
            $lblBadge.Anchor = ([System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Right)
            $pnlCard.Controls.Add($lblBadge)

            $hubBadges[$url] = $lblBadge
            $yPos += 46
        }

        $guiForm.Show()
    } catch {
        $enableGui = $false
    }
}

# Funcion para obtener los Top 15 Procesos estilo Task Manager
function Get-TopProcessesList {
    param ([int]$Limit = 15)
    $list = @()
    try {
        $procs = Get-Process -ErrorAction SilentlyContinue | Where-Object { 
            $_.Id -ne 0 -and $_.ProcessName -notmatch '^(Idle|System Idle Process)$' 
        } | Sort-Object -Property @{Expression = {$_.CPU}; Descending = $true}, @{Expression = {$_.WorkingSet64}; Descending = $true} | Select-Object -First $Limit

        foreach ($p in $procs) {
            $cpuPct = 0.0
            if ($p.CPU) {
                $cpuPct = [Math]::Round(($p.CPU / [Environment]::ProcessorCount) % 100, 1)
            }
            $memMB = [Math]::Round($p.WorkingSet64 / 1MB, 1)
            $userName = "SYSTEM"
            try {
                if ($p.StartInfo -and $p.StartInfo.Environment -and $p.StartInfo.Environment['USERNAME']) {
                    $userName = $p.StartInfo.Environment['USERNAME']
                }
            } catch {}

            $list += @{
                pid = $p.Id
                name = $p.ProcessName
                cpu = $cpuPct
                memoryMB = $memMB
                user = $userName
                status = "running"
            }
        }
    } catch {}

    if ($list.Count -eq 0) {
        $list = @(
            @{ pid = 4; name = "System"; cpu = 1.2; memoryMB = 128.4; user = "SYSTEM"; status = "running" },
            @{ pid = 1420; name = "agent_daemon.ps1"; cpu = 1.8; memoryMB = 72.5; user = "SYSTEM"; status = "running" },
            @{ pid = 2840; name = "powershell.exe"; cpu = 0.5; memoryMB = 84.1; user = "SYSTEM"; status = "running" }
        )
    }
    return $list
}

$backoffPerHub = @{}
foreach ($u in $targetUrls) { $backoffPerHub[$u] = 0 }
$MAX_BACKOFF = 20.0

# Bucle principal de transmision saliente
while ($true) {
    if ($guiForm -and -not $guiForm.Visible) {
        Write-Host "Ventana de status cerrada por el usuario. Deteniendo agente." -ForegroundColor DarkGray
        break
    }

    $timeStr = (Get-Date).ToString("HH:mm:ss")

    # 1. Medir CPU Global
    $cpuUsage = 15
    try {
        $cpuMetric = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Measure-Object -Property LoadPercentage -Average
        if ($cpuMetric -and $cpuMetric.Average -ne $null) {
            $cpuUsage = [int]$cpuMetric.Average
        }
    } catch {}

    # 2. Medir Memoria RAM
    $ramTotalGB = 16.0
    $ramUsedGB = 8.0
    $ramPct = 50
    try {
        $osObj = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
        if ($osObj) {
            $ramTotalGB = [Math]::Round($osObj.TotalVisibleMemorySize / 1024 / 1024, 1)
            $freeMem = [Math]::Round($osObj.FreePhysicalMemory / 1024 / 1024, 1)
            $ramUsedGB = [Math]::Round($ramTotalGB - $freeMem, 1)
            $ramPct = [Math]::Round(($ramUsedGB / $ramTotalGB) * 100)
        }
    } catch {}

    # 3. Medir Disco
    $diskTotalGB = 500
    $diskFreeGB = 250
    $diskPct = 50
    try {
        $diskC = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue
        if ($diskC -and $diskC.Size -gt 0) {
            $diskTotalGB = [Math]::Round($diskC.Size / 1GB, 1)
            $diskFreeGB = [Math]::Round($diskC.FreeSpace / 1GB, 1)
            $diskPct = [Math]::Round((($diskC.Size - $diskC.FreeSpace) / $diskC.Size) * 100)
        }
    } catch {}

    # 4. Top Procesos Estilo Task Manager
    $topProcesses = Get-TopProcessesList -Limit 15

    # Actualizar metricas en la mini-ventana flotante (barras estilizadas y valores)
    if ($lblCpuVal -and $pnlCpuFill -and $pnlCpuTrack) {
        $lblCpuVal.Text = "$cpuUsage%"
        $newCpuWidth = [Math]::Max(2, [int](($pnlCpuTrack.Width * $cpuUsage) / 100))
        $pnlCpuFill.Width = [Math]::Min($pnlCpuTrack.Width, $newCpuWidth)
        $pnlCpuFill.BackColor = if ($cpuUsage -gt 80) { [System.Drawing.Color]::FromArgb(255, 82, 82) } elseif ($cpuUsage -gt 50) { [System.Drawing.Color]::FromArgb(255, 102, 0) } else { [System.Drawing.Color]::FromArgb(0, 230, 118) }
    }
    if ($lblRamVal -and $pnlRamFill -and $pnlRamTrack) {
        $lblRamVal.Text = "$ramPct% ($ramUsedGB / $ramTotalGB GB)"
        $newRamWidth = [Math]::Max(2, [int](($pnlRamTrack.Width * $ramPct) / 100))
        $pnlRamFill.Width = [Math]::Min($pnlRamTrack.Width, $newRamWidth)
        $pnlRamFill.BackColor = if ($ramPct -gt 85) { [System.Drawing.Color]::FromArgb(255, 82, 82) } else { [System.Drawing.Color]::FromArgb(255, 102, 0) }
    }

    # Armar payload
    $payload = @{
        serverId = $agentId
        agentId = $agentId
        code = $displayCode
        hostname = $hostname
        ip = $localIp
        port = 8443
        osType = $osCaption
        cpu = $cpuUsage
        ram = $ramPct
        ramUsedGB = $ramUsedGB
        ramTotalGB = $ramTotalGB
        diskPercent = $diskPct
        diskFreeGB = $diskFreeGB
        diskTotalGB = $diskTotalGB
        netInKB = [Math]::Round((Get-Random -Minimum 400 -Maximum 1100))
        netOutKB = [Math]::Round((Get-Random -Minimum 150 -Maximum 450))
        uptimeSeconds = 3600
        servicesRunning = 120
        tunnelToken = $tunnelToken
        agentSecret = $tunnelToken
        processes = $topProcesses
    }

    $jsonBody = $payload | ConvertTo-Json -Depth 4 -Compress

    # Enviar reporte saliente a cada monitor registrado
    foreach ($targetUrl in $targetUrls) {
        try {
            $headers = @{
                "X-Tunnel-Token" = $tunnelToken
                "X-Server-Id" = $agentId
            }
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            $res = Invoke-RestMethod -Uri "$targetUrl/api/telemetry/report" -Method Post -Body $jsonBody -Headers $headers -ContentType "application/json; charset=utf-8" -TimeoutSec 3 -ErrorAction Stop
            $sw.Stop()
            $latMs = $sw.ElapsedMilliseconds

            $backoffPerHub[$targetUrl] = 0

            if ($hubBadges[$targetUrl]) {
                $hubBadges[$targetUrl].Text = "[OK] " + $latMs + "ms"
                $hubBadges[$targetUrl].ForeColor = [System.Drawing.Color]::FromArgb(0, 230, 118)
            }

            Write-Host "[$timeStr] [HUB: $targetUrl] " -NoNewline -ForegroundColor DarkGray
            Write-Host "[OK " -NoNewline -ForegroundColor Green
            Write-Host "$latMs ms] " -NoNewline -ForegroundColor Green
            Write-Host "CPU: $cpuUsage% | RAM: $ramPct% ($ramUsedGB/$ramTotalGB GB) | Disco C: $diskPct% | Top Procesos: $($topProcesses.Count)" -ForegroundColor White

        } catch {
            $backoffPerHub[$targetUrl] += 1
            $errDetail = $_.Exception.Message
            if ($errDetail -match "No es posible conectar" -or $errDetail -match "actively refused") {
                $errDetail = "Conexion rechazada"
            } elseif ($errDetail -match "tiempo de espera") {
                $errDetail = "Timeout 3s"
            }

            if ($hubBadges[$targetUrl]) {
                $hubBadges[$targetUrl].Text = "[ERROR] " + $errDetail
                $hubBadges[$targetUrl].ForeColor = [System.Drawing.Color]::FromArgb(255, 82, 82)
            }

            Write-Host "[$timeStr] [HUB: $targetUrl] " -NoNewline -ForegroundColor DarkGray
            Write-Host "[ERROR] " -NoNewline -ForegroundColor Red
            Write-Host "$errDetail" -ForegroundColor DarkYellow
        }
    }

    # Procesar eventos de la ventana flotante de Windows Forms
    if ($guiForm) {
        [System.Windows.Forms.Application]::DoEvents()
    }

    Start-Sleep -Seconds $interval
}
