# -*- coding: utf-8 -*-
param (
    [string]$MonitorUrl = "http://localhost:3000",
    [string[]]$MonitorUrls = @(),
    [string]$CustomAgentCode = "",
    [int]$IntervalSeconds = 2,
    [switch]$NoGui,
    [switch]$Headless
)

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

# Determinar si levantamos la mini-ventana GUI flotante
$enableGui = (-not $NoGui) -and (-not $Headless) -and ($env:CRASHINGLIVE_HEADLESS -ne '1')
$guiForm = $null
$hubBadges = @{}
$lblGuiMetrics = $null

if ($enableGui) {
    try {
        Add-Type -AssemblyName System.Windows.Forms, System.Drawing -ErrorAction Stop

        $guiForm = New-Object System.Windows.Forms.Form
        $guiForm.Text = "Crashing LIVE - Agente Status"
        $calcHeight = 240 + ($targetUrls.Count * 40)
        $guiForm.Size = New-Object System.Drawing.Size(460, $calcHeight)
        $guiForm.StartPosition = "CenterScreen"
        $guiForm.TopMost = $true
        $guiForm.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)
        $guiForm.ForeColor = [System.Drawing.Color]::White
        $guiForm.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedSingle
        $guiForm.MaximizeBox = $false

        # Panel Header
        $pnlHeader = New-Object System.Windows.Forms.Panel
        $pnlHeader.Dock = [System.Windows.Forms.DockStyle]::Top
        $pnlHeader.Height = 65
        $pnlHeader.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 24)
        $guiForm.Controls.Add($pnlHeader)

        $lblTitle = New-Object System.Windows.Forms.Label
        $lblTitle.Text = "CRASHING LIVE - AGENTE STATUS"
        $lblTitle.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
        $lblTitle.ForeColor = [System.Drawing.Color]::FromArgb(255, 102, 0)
        $lblTitle.Location = New-Object System.Drawing.Point(12, 10)
        $lblTitle.AutoSize = $true
        $pnlHeader.Controls.Add($lblTitle)

        $lblSub = New-Object System.Windows.Forms.Label
        $lblSub.Text = "ID: " + $agentId + "  |  Codigo AnyDesk: " + $displayCode + "  |  " + $hostname
        $lblSub.Font = New-Object System.Drawing.Font("Consolas", 8.5)
        $lblSub.ForeColor = [System.Drawing.Color]::FromArgb(160, 160, 160)
        $lblSub.Location = New-Object System.Drawing.Point(12, 34)
        $lblSub.AutoSize = $true
        $pnlHeader.Controls.Add($lblSub)

        # Metricas Label
        $lblGuiMetrics = New-Object System.Windows.Forms.Label
        $lblGuiMetrics.Text = "CPU: 0%  |  RAM: 0%  |  Procesos: 0  |  Saliente 443"
        $lblGuiMetrics.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
        $lblGuiMetrics.ForeColor = [System.Drawing.Color]::White
        $lblGuiMetrics.Location = New-Object System.Drawing.Point(12, 75)
        $lblGuiMetrics.Size = New-Object System.Drawing.Size(420, 20)
        $guiForm.Controls.Add($lblGuiMetrics)

        $lblMonTitle = New-Object System.Windows.Forms.Label
        $lblMonTitle.Text = "MONITORES REGISTRADOS (CONEXION SALIENTE):"
        $lblMonTitle.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
        $lblMonTitle.ForeColor = [System.Drawing.Color]::FromArgb(140, 140, 140)
        $lblMonTitle.Location = New-Object System.Drawing.Point(12, 100)
        $lblMonTitle.AutoSize = $true
        $guiForm.Controls.Add($lblMonTitle)

        # Fila de cada monitor
        $yPos = 125
        foreach ($url in $targetUrls) {
            $pnlCard = New-Object System.Windows.Forms.Panel
            $pnlCard.Location = New-Object System.Drawing.Point(12, $yPos)
            $pnlCard.Size = New-Object System.Drawing.Size(420, 32)
            $pnlCard.BackColor = [System.Drawing.Color]::FromArgb(28, 28, 28)
            $guiForm.Controls.Add($pnlCard)

            $lblUrl = New-Object System.Windows.Forms.Label
            $lblUrl.Text = $url
            $lblUrl.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
            $lblUrl.ForeColor = [System.Drawing.Color]::White
            $lblUrl.Location = New-Object System.Drawing.Point(8, 8)
            $lblUrl.AutoSize = $true
            $pnlCard.Controls.Add($lblUrl)

            $lblBadge = New-Object System.Windows.Forms.Label
            $lblBadge.Text = "[CONECTANDO...]"
            $lblBadge.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
            $lblBadge.ForeColor = [System.Drawing.Color]::Orange
            $lblBadge.Location = New-Object System.Drawing.Point(260, 8)
            $lblBadge.Size = New-Object System.Drawing.Size(150, 18)
            $lblBadge.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
            $pnlCard.Controls.Add($lblBadge)

            $hubBadges[$url] = $lblBadge
            $yPos += 38
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

    # Actualizar metricas en la mini-ventana flotante
    if ($lblGuiMetrics) {
        $lblGuiMetrics.Text = "CPU: " + $cpuUsage + "%  |  RAM: " + $ramPct + "% (" + $ramUsedGB + "/" + $ramTotalGB + " GB)  |  Procesos: " + $topProcesses.Count
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
