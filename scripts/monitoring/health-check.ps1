# System Health Check Tool
# Comprehensive system health monitoring

function Get-SystemHealth {
    $results = @{
        Timestamp = Get-Date
        ComputerName = $env:COMPUTERNAME
        OverallStatus = "Healthy"
        CPU = @{}
        Memory = @{}
        Disk = @{}
        Services = @{}
        EventLog = @{}
        Issues = @()
    }
    
    Write-Host "`nPerforming system health check..." -ForegroundColor Yellow
    
    # CPU Check
    Write-Host "  Checking CPU usage..." -ForegroundColor Gray
    $cpuLoad = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3
    $avgCpuLoad = ($cpuLoad.CounterSamples | Measure-Object -Property CookedValue -Average).Average
    $results.CPU = @{
        AverageLoad = [math]::Round($avgCpuLoad, 2)
        Status = if ($avgCpuLoad -gt 90) { "Critical" } elseif ($avgCpuLoad -gt 75) { "Warning" } else { "Good" }
    }
    if ($results.CPU.Status -ne "Good") {
        $results.Issues += "CPU usage is $($results.CPU.Status): $($results.CPU.AverageLoad)%"
    }
    
    # Memory Check
    Write-Host "  Checking memory usage..." -ForegroundColor Gray
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $totalMemory = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeMemory = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $usedMemory = $totalMemory - $freeMemory
    $memoryUsagePercent = [math]::Round(($usedMemory / $totalMemory) * 100, 2)
    
    $results.Memory = @{
        TotalGB = $totalMemory
        UsedGB = $usedMemory
        FreeGB = $freeMemory
        UsagePercent = $memoryUsagePercent
        Status = if ($memoryUsagePercent -gt 90) { "Critical" } elseif ($memoryUsagePercent -gt 80) { "Warning" } else { "Good" }
    }
    if ($results.Memory.Status -ne "Good") {
        $results.Issues += "Memory usage is $($results.Memory.Status): $($results.Memory.UsagePercent)%"
    }
    
    # Disk Check
    Write-Host "  Checking disk space..." -ForegroundColor Gray
    $disks = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3"
    $results.Disk.Drives = @()
    
    foreach ($disk in $disks) {
        $freeSpacePercent = [math]::Round(($disk.FreeSpace / $disk.Size) * 100, 2)
        $driveInfo = @{
            Drive = $disk.DeviceID
            TotalGB = [math]::Round($disk.Size / 1GB, 2)
            FreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
            UsedGB = [math]::Round(($disk.Size - $disk.FreeSpace) / 1GB, 2)
            FreePercent = $freeSpacePercent
            Status = if ($freeSpacePercent -lt 10) { "Critical" } elseif ($freeSpacePercent -lt 20) { "Warning" } else { "Good" }
        }
        $results.Disk.Drives += $driveInfo
        
        if ($driveInfo.Status -ne "Good") {
            $results.Issues += "Disk $($disk.DeviceID) space is $($driveInfo.Status): Only $($driveInfo.FreePercent)% free"
        }
    }
    
    # Critical Services Check
    Write-Host "  Checking critical services..." -ForegroundColor Gray
    $criticalServices = @("wuauserv", "BITS", "EventLog", "Winmgmt", "RpcSs")
    $results.Services.Critical = @()
    
    foreach ($serviceName in $criticalServices) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            $serviceInfo = @{
                Name = $service.Name
                DisplayName = $service.DisplayName
                Status = $service.Status
                StartType = $service.StartType
            }
            $results.Services.Critical += $serviceInfo
            
            if ($service.Status -ne "Running" -and $service.StartType -ne "Disabled") {
                $results.Issues += "Service '$($service.DisplayName)' is not running"
            }
        }
    }
    
    # Recent Error Events
    Write-Host "  Checking recent error events..." -ForegroundColor Gray
    $errorEvents = Get-EventLog -LogName System -EntryType Error -Newest 10 -ErrorAction SilentlyContinue
    $results.EventLog = @{
        RecentErrors = $errorEvents.Count
        LastError = if ($errorEvents.Count -gt 0) {
            @{
                Time = $errorEvents[0].TimeGenerated
                Source = $errorEvents[0].Source
                Message = $errorEvents[0].Message.Substring(0, [Math]::Min(100, $errorEvents[0].Message.Length))
            }
        } else { $null }
    }
    
    # Determine overall status
    if ($results.Issues.Count -gt 0) {
        $criticalIssues = $results.Issues | Where-Object { $_ -match "Critical" }
        if ($criticalIssues.Count -gt 0) {
            $results.OverallStatus = "Critical"
        } else {
            $results.OverallStatus = "Warning"
        }
    }
    
    return $results
}

function Show-HealthCheckMenu {
    Write-Host "`n================ System Health Check Tool ================" -ForegroundColor Cyan
    Write-Host "Comprehensive system health monitoring" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
    
    $result = Get-SystemHealth
    
    $statusColor = switch ($result.OverallStatus) {
        "Healthy" { "Green" }
        "Warning" { "Yellow" }
        "Critical" { "Red" }
    }
    
    Write-Host "`n--- System Health Report ---" -ForegroundColor Green
    Write-Host "Computer: $($result.ComputerName)"
    Write-Host "Timestamp: $($result.Timestamp)"
    Write-Host "Overall Status: $($result.OverallStatus)" -ForegroundColor $statusColor
    
    Write-Host "`nCPU Status: $($result.CPU.Status)" -ForegroundColor $(if ($result.CPU.Status -eq "Good") { "Green" } else { "Yellow" })
    Write-Host "  Average Load: $($result.CPU.AverageLoad)%"
    
    Write-Host "`nMemory Status: $($result.Memory.Status)" -ForegroundColor $(if ($result.Memory.Status -eq "Good") { "Green" } else { "Yellow" })
    Write-Host "  Total: $($result.Memory.TotalGB) GB"
    Write-Host "  Used: $($result.Memory.UsedGB) GB ($($result.Memory.UsagePercent)%)"
    Write-Host "  Free: $($result.Memory.FreeGB) GB"
    
    Write-Host "`nDisk Status:" -ForegroundColor Green
    foreach ($drive in $result.Disk.Drives) {
        $driveColor = switch ($drive.Status) {
            "Good" { "Green" }
            "Warning" { "Yellow" }
            "Critical" { "Red" }
        }
        Write-Host "  $($drive.Drive) - Status: $($drive.Status)" -ForegroundColor $driveColor
        Write-Host "    Total: $($drive.TotalGB) GB | Free: $($drive.FreeGB) GB ($($drive.FreePercent)%)"
    }
    
    Write-Host "`nCritical Services:" -ForegroundColor Green
    foreach ($service in $result.Services.Critical) {
        $serviceColor = if ($service.Status -eq "Running") { "Green" } else { "Red" }
        Write-Host "  $($service.DisplayName): $($service.Status)" -ForegroundColor $serviceColor
    }
    
    if ($result.Issues.Count -gt 0) {
        Write-Host "`nIssues Found:" -ForegroundColor Red
        foreach ($issue in $result.Issues) {
            Write-Host "  - $issue" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`nNo issues detected. System is healthy!" -ForegroundColor Green
    }
    
    return $result
}

# Run the tool
Show-HealthCheckMenu
