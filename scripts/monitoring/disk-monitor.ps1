# Disk Monitor Tool
# Monitor disk space, health, and performance

function Get-DiskMonitoring {
    $results = @{
        Timestamp = Get-Date
        ComputerName = $env:COMPUTERNAME
        Disks = @()
        PhysicalDisks = @()
    }
    
    Write-Host "`nGathering disk information..." -ForegroundColor Yellow
    
    # Logical Disks
    $logicalDisks = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3"
    foreach ($disk in $logicalDisks) {
        $freePercent = [math]::Round(($disk.FreeSpace / $disk.Size) * 100, 2)
        $diskInfo = @{
            Drive = $disk.DeviceID
            Label = $disk.VolumeName
            FileSystem = $disk.FileSystem
            TotalGB = [math]::Round($disk.Size / 1GB, 2)
            FreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
            UsedGB = [math]::Round(($disk.Size - $disk.FreeSpace) / 1GB, 2)
            FreePercent = $freePercent
            Status = if ($freePercent -lt 10) { "Critical" } elseif ($freePercent -lt 20) { "Warning" } else { "Good" }
        }
        $results.Disks += $diskInfo
    }
    
    # Physical Disks
    $physicalDisks = Get-PhysicalDisk
    foreach ($disk in $physicalDisks) {
        $diskInfo = @{
            FriendlyName = $disk.FriendlyName
            MediaType = $disk.MediaType
            BusType = $disk.BusType
            HealthStatus = $disk.HealthStatus
            OperationalStatus = $disk.OperationalStatus
            SizeGB = [math]::Round($disk.Size / 1GB, 2)
        }
        $results.PhysicalDisks += $diskInfo
    }
    
    return $results
}

function Show-DiskMonitorMenu {
    Write-Host "`n================ Disk Monitor Tool ================" -ForegroundColor Cyan
    Write-Host "Monitor disk space, health, and performance" -ForegroundColor Gray
    Write-Host "====================================================" -ForegroundColor Cyan
    
    $result = Get-DiskMonitoring
    
    Write-Host "`n--- Logical Disks ---" -ForegroundColor Green
    foreach ($disk in $result.Disks) {
        $statusColor = switch ($disk.Status) {
            "Good" { "Green" }
            "Warning" { "Yellow" }
            "Critical" { "Red" }
        }
        
        Write-Host "`nDrive: $($disk.Drive) [$($disk.Label)]" -ForegroundColor Cyan
        Write-Host "  File System: $($disk.FileSystem)"
        Write-Host "  Total Size: $($disk.TotalGB) GB"
        Write-Host "  Used: $($disk.UsedGB) GB"
        Write-Host "  Free: $($disk.FreeGB) GB ($($disk.FreePercent)%)" -ForegroundColor $statusColor
        Write-Host "  Status: $($disk.Status)" -ForegroundColor $statusColor
        
        # Visual bar
        $barLength = 40
        $usedBars = [int](($disk.UsedGB / $disk.TotalGB) * $barLength)
        $freeBars = $barLength - $usedBars
        Write-Host "  [" -NoNewline
        Write-Host ("█" * $usedBars) -NoNewline -ForegroundColor Red
        Write-Host ("░" * $freeBars) -NoNewline -ForegroundColor Green
        Write-Host "]"
    }
    
    Write-Host "`n--- Physical Disks ---" -ForegroundColor Green
    foreach ($disk in $result.PhysicalDisks) {
        $healthColor = if ($disk.HealthStatus -eq "Healthy") { "Green" } else { "Red" }
        
        Write-Host "`n$($disk.FriendlyName)" -ForegroundColor Cyan
        Write-Host "  Media Type: $($disk.MediaType)"
        Write-Host "  Bus Type: $($disk.BusType)"
        Write-Host "  Size: $($disk.SizeGB) GB"
        Write-Host "  Health: $($disk.HealthStatus)" -ForegroundColor $healthColor
        Write-Host "  Status: $($disk.OperationalStatus)"
    }
    
    # Summary
    $totalSpace = ($result.Disks | Measure-Object TotalGB -Sum).Sum
    $totalFree = ($result.Disks | Measure-Object FreeGB -Sum).Sum
    $totalUsed = $totalSpace - $totalFree
    
    Write-Host "`n--- Summary ---" -ForegroundColor Green
    Write-Host "Total Disk Space: $([math]::Round($totalSpace, 2)) GB"
    Write-Host "Total Used: $([math]::Round($totalUsed, 2)) GB"
    Write-Host "Total Free: $([math]::Round($totalFree, 2)) GB"
    
    return $result
}

# Run the tool
Show-DiskMonitorMenu
