# Platform Services Manager
# Manages services for the IT Management Platform

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "menu")]
    [string]$Action = "menu",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Development", "Production")]
    [string]$Mode = "Development"
)

$baseDir = $PSScriptRoot
$venvActivate = Join-Path $baseDir ".venv\Scripts\Activate.ps1"
$statusFile = Join-Path $baseDir ".services-status.json"
$logsDir = Join-Path $baseDir "logs"

# Ensure logs directory exists
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# Dashboard Functions
function Show-Dashboard {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                                                ║" -ForegroundColor Cyan
    Write-Host "  ║        " -NoNewline -ForegroundColor Cyan
    Write-Host "IT MANAGEMENT PLATFORM - SERVICE MANAGER" -NoNewline -ForegroundColor White
    Write-Host "           ║" -ForegroundColor Cyan
    Write-Host "  ║                                                                ║" -ForegroundColor Cyan
    Write-Host "  ╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    # Show current status
    $status = Get-ServiceStatus
    if ($status) {
        $modeColor = if ($status.mode -eq "Production") { "Green" } else { "Yellow" }
        Write-Host "  Current Status: " -NoNewline -ForegroundColor Gray
        Write-Host "$($status.mode) Mode" -NoNewline -ForegroundColor $modeColor
        Write-Host " | " -NoNewline -ForegroundColor Gray
        
        $runningCount = ($status.services | Where-Object { 
            $_.pid -and (Get-Process -Id $_.pid -ErrorAction SilentlyContinue) 
        }).Count
        
        $statusColor = if ($runningCount -eq $status.services.Count) { "Green" } 
                      elseif ($runningCount -gt 0) { "Yellow" }
                      else { "Red" }
        
        Write-Host "$runningCount/$($status.services.Count) Services Running" -ForegroundColor $statusColor
        Write-Host ""
    } else {
        Write-Host "  Current Status: " -NoNewline -ForegroundColor Gray
        Write-Host "No services running" -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "  ┌────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                      SERVICE ACTIONS                           │" -ForegroundColor DarkGray
    Write-Host "  └────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [1] " -NoNewline -ForegroundColor Cyan
    Write-Host "Start Services" -ForegroundColor White
    Write-Host "        → Start all services in background mode" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [2] " -NoNewline -ForegroundColor Yellow
    Write-Host "Stop All Services" -ForegroundColor White
    Write-Host "        → Gracefully stop all running services" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [3] " -NoNewline -ForegroundColor Magenta
    Write-Host "Restart Services" -ForegroundColor White
    Write-Host "        → Stop and restart all services" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ┌────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                      MONITORING                                │" -ForegroundColor DarkGray
    Write-Host "  └────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [4] " -NoNewline -ForegroundColor Green
    Write-Host "View Service Status" -ForegroundColor White
    Write-Host "        → Display detailed status of all services" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [5] " -NoNewline -ForegroundColor Green
    Write-Host "View Service Logs" -ForegroundColor White
    Write-Host "        → Review recent log entries" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ┌────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                      QUICK ACCESS                              │" -ForegroundColor DarkGray
    Write-Host "  └────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [6] " -NoNewline -ForegroundColor Blue
    Write-Host "Open Access Center" -ForegroundColor White
    Write-Host "        → Launch in browser (http://localhost:3000)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ┌────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                      SETTINGS                                  │" -ForegroundColor DarkGray
    Write-Host "  └────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [M] " -NoNewline -ForegroundColor White
    Write-Host "Toggle Mode " -NoNewline -ForegroundColor White
    $currentMode = if ($script:GlobalMode -eq "Production") { "Production" } else { "Development" }
    $modeColor = if ($script:GlobalMode -eq "Production") { "Green" } else { "Yellow" }
    Write-Host "(Current: " -NoNewline -ForegroundColor DarkGray
    Write-Host $currentMode -NoNewline -ForegroundColor $modeColor
    Write-Host ")" -ForegroundColor DarkGray
    
    # Show test credentials in Development mode
    if ($script:GlobalMode -eq "Development") {
        Write-Host "        → Test Credentials: " -NoNewline -ForegroundColor DarkGray
        Write-Host "admin" -NoNewline -ForegroundColor Cyan
        Write-Host " / " -NoNewline -ForegroundColor DarkGray
        Write-Host "admin123" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "    [0] " -NoNewline -ForegroundColor Red
    Write-Host "Exit" -ForegroundColor White
    Write-Host ""
    Write-Host "  ══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Show-ActionResult {
    param([string]$Message, [string]$Color = "Green")
    Write-Host ""
    Write-Host "  ────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  $Message" -ForegroundColor $Color
    Write-Host "  ────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Invoke-InteractiveDashboard {
    $script:GlobalMode = "Development"
    
    while ($true) {
        Show-Dashboard
        Write-Host "  Select an option: " -NoNewline -ForegroundColor Cyan
        $choice = Read-Host
        
        switch ($choice.ToUpper()) {
            "1" {
                $script:Mode = $script:GlobalMode
                $existing = Get-ServiceStatus
                if ($existing) {
                    Write-Host ""
                    Write-Host "  Stopping existing services..." -ForegroundColor Yellow
                    Stop-PlatformServices
                    Start-Sleep -Seconds 2
                }
                Start-PlatformServices
                Show-ActionResult "✓ Services started in background mode" "Green"
            }
            "2" {
                Stop-PlatformServices
                Show-ActionResult "✓ All services stopped" "Yellow"
            }
            "3" {
                Stop-PlatformServices
                Start-Sleep -Seconds 2
                $script:Mode = $script:GlobalMode
                Start-PlatformServices
                Show-ActionResult "✓ Services restarted" "Green"
            }
            "4" {
                Show-ServiceStatus
                Write-Host ""
                Write-Host "  Press any key to continue..." -ForegroundColor Gray
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
            "5" {
                Show-ServiceLogs
            }
            "6" {
                Start-Process "http://localhost:3000"
                Show-ActionResult "✓ Opening Access Center in browser..." "Blue"
            }
            "M" {
                if ($script:GlobalMode -eq "Development") {
                    $script:GlobalMode = "Production"
                    Show-ActionResult "✓ Switched to Production Mode" "Green"
                } else {
                    $script:GlobalMode = "Development"
                    Show-ActionResult "✓ Switched to Development Mode" "Yellow"
                }
            }
            "0" {
                Clear-Host
                Write-Host ""
                Write-Host "  ══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
                Write-Host "   Thank you for using IT Management Platform Service Manager!" -ForegroundColor Cyan
                Write-Host "  ══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
                Write-Host ""
                return
            }
            default {
                Show-ActionResult "✗ Invalid option. Please try again." "Red"
            }
        }
    }
}

# Service definitions
$services = @(
    @{
        Name = "Backend API"
        Path = "backend"
        DevCommand = "python -m uvicorn main:app --reload --port 8000"
        ProdCommand = "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"
        Port = 8000
        Url = "http://localhost:8000"
        RequiresVenv = $true
        RequiresBuild = $false
    },
    @{
        Name = "Access Center"
        Path = "Access Center"
        DevCommand = "npm run dev"
        ProdCommand = "npm run preview"
        BuildCommand = "npm run build"
        Port = 3000
        Url = "http://localhost:3000"
        RequiresVenv = $false
        RequiresBuild = $true
    },
    @{
        Name = "Knowledge Base"
        Path = "Knowledge"
        DevCommand = "npm run dev"
        ProdCommand = "npm run preview"
        BuildCommand = "npm run build"
        Port = 3001
        Url = "http://localhost:3001"
        RequiresVenv = $false
        RequiresBuild = $true
    },
    @{
        Name = "Monitoring Dashboard"
        Path = "monitoring-dashboard"
        DevCommand = "npm run dev"
        ProdCommand = "npm run preview"
        BuildCommand = "npm run build"
        Port = 3002
        Url = "http://localhost:3002"
        RequiresVenv = $false
        RequiresBuild = $true
    },
    @{
        Name = "Ticketing System"
        Path = "ticketing-system"
        DevCommand = "npm run dev"
        ProdCommand = "npm run preview"
        BuildCommand = "npm run build"
        Port = 3003
        Url = "http://localhost:3003"
        RequiresVenv = $false
        RequiresBuild = $true
    }
)

function Get-ServiceStatus {
    if (Test-Path $statusFile) {
        return Get-Content $statusFile | ConvertFrom-Json
    }
    return $null
}

function Save-ServiceStatus {
    param($StatusData)
    
    $StatusData | ConvertTo-Json -Depth 10 | Set-Content $statusFile
}

function Stop-PlatformServices {
    Write-Host "Stopping all platform services..." -ForegroundColor Yellow
    
    $status = Get-ServiceStatus
    if ($null -eq $status) {
        Write-Host "No running services found" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Note: If services are running in Terminal tabs, close the Windows Terminal window manually." -ForegroundColor Cyan
        return
    }
    
    foreach ($service in $status.services) {
        if ($service.pid) {
            $process = Get-Process -Id $service.pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping $($service.name) (PID: $($service.pid))..." -ForegroundColor Yellow
                Stop-Process -Id $service.pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ✓ Stopped" -ForegroundColor Green
            }
        }
    }
    
    # Remove status file
    if (Test-Path $statusFile) {
        Remove-Item $statusFile -Force
    }
    
    Write-Host "`nAll services stopped" -ForegroundColor Green
}

function Start-PlatformServices {
    Start-ServicesInBackground
}

function Start-ServicesInBackground {
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "Starting IT Management Platform" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Mode: $Mode" -ForegroundColor $(if ($Mode -eq "Production") { "Green" } else { "Yellow" })
    Write-Host ""
    
    # Build production assets if in Production mode
    if ($Mode -eq "Production") {
        Write-Host "Building production assets..." -ForegroundColor Yellow
        Write-Host ""
        
        foreach ($service in $services) {
            if ($service.RequiresBuild) {
                $servicePath = Join-Path $baseDir $service.Path
                Write-Host "Building $($service.Name)..." -ForegroundColor Cyan
                
                Push-Location $servicePath
                try {
                    & npm run build
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  ✓ Build completed" -ForegroundColor Green
                    } else {
                        Write-Host "  ✗ Build failed" -ForegroundColor Red
                        Pop-Location
                        return
                    }
                } catch {
                    Write-Host "  ✗ Build error: $($_.Exception.Message)" -ForegroundColor Red
                    Pop-Location
                    return
                }
                Pop-Location
                Write-Host ""
            }
        }
        
        Write-Host "All builds completed successfully!" -ForegroundColor Green
        Write-Host ""
    }
    
    Write-Host "Launching services in Windows Terminal tabs..." -ForegroundColor Yellow
    Write-Host ""
    
    # Build Windows Terminal command
    $wtCommand = "wt.exe -w 0"
    
    foreach ($service in $services) {
        $servicePath = Join-Path $baseDir $service.Path
        $command = if ($Mode -eq "Production") { $service.ProdCommand } else { $service.DevCommand }
        
        if ($service.RequiresVenv) {
            $tabCommand = " new-tab --title `"$($service.Name)`" pwsh -NoExit -Command `"Set-Location '$servicePath'; & '$venvActivate'; $command`""
        } else {
            $tabCommand = " new-tab --title `"$($service.Name)`" pwsh -NoExit -Command `"Set-Location '$servicePath'; $command`""
        }
        
        $wtCommand += $tabCommand
        
        if ($service -ne $services[-1]) {
            $wtCommand += " ``; ``"
        }
    }
    
    # Execute Windows Terminal command
    Invoke-Expression $wtCommand
    
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "All Services Starting!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access your applications:" -ForegroundColor Yellow
    Write-Host "  • Access Center:         http://localhost:3000" -ForegroundColor White
    Write-Host "  • Knowledge Base:        http://localhost:3001" -ForegroundColor White
    Write-Host "  • Monitoring Dashboard:  http://localhost:3002" -ForegroundColor White
    Write-Host "  • Ticketing System:      http://localhost:3003" -ForegroundColor White
    Write-Host "  • Backend API:           http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "Default Login:" -ForegroundColor Yellow
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    if ($Mode -eq "Development") {
        Write-Host "Running in DEVELOPMENT mode (hot reload enabled)" -ForegroundColor Yellow
    } else {
        Write-Host "Running in PRODUCTION mode (optimized builds)" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Note: Check the Windows Terminal tabs for each service status" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press any key to open Access Center in browser..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Start-Process "http://localhost:3000"
}

function Start-ServicesInBackground {
    Write-Host "Starting platform services in $Mode mode..." -ForegroundColor Cyan
    Write-Host ""
    
    # Build production assets if in Production mode
    if ($Mode -eq "Production") {
        Write-Host "Building production assets..." -ForegroundColor Yellow
        Write-Host ""
        
        foreach ($service in $services) {
            if ($service.RequiresBuild) {
                $servicePath = Join-Path $baseDir $service.Path
                Write-Host "Building $($service.Name)..." -ForegroundColor Cyan
                
                Push-Location $servicePath
                try {
                    & npm run build
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  ✓ Build completed" -ForegroundColor Green
                    } else {
                        Write-Host "  ✗ Build failed" -ForegroundColor Red
                        Pop-Location
                        return
                    }
                } catch {
                    Write-Host "  ✗ Build error: $($_.Exception.Message)" -ForegroundColor Red
                    Pop-Location
                    return
                }
                Pop-Location
                Write-Host ""
            }
        }
        
        Write-Host "All builds completed successfully!" -ForegroundColor Green
        Write-Host ""
    }
    
    $statusData = @{
        lastUpdated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        mode = $Mode
        services = @()
    }
    
    foreach ($service in $services) {
        $servicePath = Join-Path $baseDir $service.Path
        $logFile = Join-Path $logsDir "$($service.Name -replace ' ', '-').log"
        
        Write-Host "Starting $($service.Name)..." -ForegroundColor Cyan
        
        # Select command based on mode
        $command = if ($Mode -eq "Production") { $service.ProdCommand } else { $service.DevCommand }
        
        # Build script block
        $scriptBlock = if ($service.RequiresVenv) {
            "Set-Location '$servicePath'; & '$venvActivate'; $command *>&1 | Tee-Object -FilePath '$logFile'"
        } else {
            "Set-Location '$servicePath'; $command *>&1 | Tee-Object -FilePath '$logFile'"
        }
        
        # Start as background job
        $job = Start-Job -ScriptBlock ([scriptblock]::Create($scriptBlock))
        
        # Wait a moment for process to start
        Start-Sleep -Milliseconds 500
        
        # Get the actual process PID (this is approximate)
        $processPid = $null
        if ($service.RequiresVenv) {
            $processPid = (Get-Process python -ErrorAction SilentlyContinue | 
                   Where-Object { $_.CommandLine -like "*uvicorn*" } | 
                   Select-Object -First 1).Id
        } else {
            $processPid = (Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue | 
                   Select-Object -First 1 -ExpandProperty OwningProcess)
        }
        
        $statusData.services += @{
            name = $service.Name
            port = $service.Port
            url = $service.Url
            pid = $processPid
            jobId = $job.Id
            logFile = $logFile
        }
        
        $modeLabel = if ($Mode -eq "Production") { "Production" } else { "Dev" }
        Write-Host "  ✓ Started [$modeLabel] (Job ID: $($job.Id), Port: $($service.Port))" -ForegroundColor Green
        Write-Host "    URL: $($service.Url)" -ForegroundColor Gray
        Write-Host "    Log: $logFile" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Save status
    Save-ServiceStatus -StatusData $statusData
    
    Write-Host "All services started successfully in $Mode mode!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your applications:" -ForegroundColor Cyan
    Write-Host "  • Access Center:         http://localhost:3000" -ForegroundColor White
    Write-Host "  • Knowledge Base:        http://localhost:3001" -ForegroundColor White
    Write-Host "  • Monitoring Dashboard:  http://localhost:3002" -ForegroundColor White
    Write-Host "  • Ticketing System:      http://localhost:3003" -ForegroundColor White
    Write-Host "  • Backend API:           http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    if ($Mode -eq "Development") {
        Write-Host "Running in DEVELOPMENT mode (hot reload enabled)" -ForegroundColor Yellow
    } else {
        Write-Host "Running in PRODUCTION mode (optimized builds)" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Use 'start-all.ps1 -Action stop' to stop all services" -ForegroundColor Gray
    Write-Host "Use 'start-all.ps1 -Action status' to view status" -ForegroundColor Gray
    Write-Host "Use 'start-all.ps1 -Action logs' to view logs" -ForegroundColor Gray
}

function Show-ServiceStatus {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "     PLATFORM SERVICES STATUS" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    
    $status = Get-ServiceStatus
    
    if ($null -eq $status) {
        Write-Host "`nNo services running" -ForegroundColor Yellow
        Write-Host "Run 'start-all.ps1 -Action start' to start services" -ForegroundColor Gray
        return
    }
    
    Write-Host "`nMode: $($status.mode)" -ForegroundColor $(if ($status.mode -eq "Production") { "Green" } else { "Yellow" })
    Write-Host "`nService Name          Port    PID       Status      URL" -ForegroundColor Gray
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    foreach ($service in $status.services) {
        $isRunning = $false
        $pidDisplay = "N/A"
        $statusColor = "Red"
        $statusText = "Stopped"
        
        # Check if process is still running
        if ($service.pid) {
            $process = Get-Process -Id $service.pid -ErrorAction SilentlyContinue
            if ($process) {
                $isRunning = $true
                $pidDisplay = $service.pid
                $statusColor = "Green"
                $statusText = "Running"
            }
        }
        
        # Check if job is still running
        if ($service.jobId) {
            $job = Get-Job -Id $service.jobId -ErrorAction SilentlyContinue
            if ($job -and $job.State -eq "Running") {
                if (-not $isRunning) {
                    $statusColor = "Yellow"
                    $statusText = "Starting"
                }
            }
        }
        
        $name = $service.name.PadRight(20)
        $port = $service.port.ToString().PadRight(7)
        $pidFormatted = $pidDisplay.ToString().PadRight(9)
        
        Write-Host $name -NoNewline
        Write-Host $port -NoNewline
        Write-Host $pidFormatted -NoNewline
        Write-Host $statusText.PadRight(11) -ForegroundColor $statusColor -NoNewline
        Write-Host $service.url -ForegroundColor Gray
    }
    
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "`nLast Updated: $($status.lastUpdated)" -ForegroundColor Gray
}

function Show-ServiceLogs {
    $status = Get-ServiceStatus
    
    if ($null -eq $status) {
        Write-Host "No services running" -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "Available service logs:" -ForegroundColor Cyan
    Write-Host ""
    
    $i = 1
    foreach ($service in $status.services) {
        Write-Host "  [$i] $($service.name)" -ForegroundColor White
        Write-Host "      $($service.logFile)" -ForegroundColor Gray
        $i++
    }
    
    Write-Host ""
    $choice = Read-Host "Select a service (1-$($status.services.Count)) or 0 to cancel"
    
    if ($choice -eq "0" -or [int]$choice -lt 1 -or [int]$choice -gt $status.services.Count) {
        return
    }
    
    $selectedService = $status.services[[int]$choice - 1]
    
    if (Test-Path $selectedService.logFile) {
        Write-Host ""
        Write-Host "=== $($selectedService.name) Log ===" -ForegroundColor Cyan
        Write-Host ""
        Get-Content $selectedService.logFile -Tail 50
    } else {
        Write-Host "Log file not found: $($selectedService.logFile)" -ForegroundColor Red
    }
}

# Main execution
switch ($Action) {
    "menu" {
        Invoke-InteractiveDashboard
    }
    "start" {
        # Stop any existing services first
        $existing = Get-ServiceStatus
        if ($existing) {
            Write-Host "Stopping existing services..." -ForegroundColor Yellow
            Stop-PlatformServices
            Start-Sleep -Seconds 2
        }
        Start-PlatformServices
    }
    "stop" {
        Stop-PlatformServices
    }
    "restart" {
        Stop-PlatformServices
        Start-Sleep -Seconds 2
        Start-PlatformServices
    }
    "status" {
        Show-ServiceStatus
    }
    "logs" {
        Show-ServiceLogs
    }
}
