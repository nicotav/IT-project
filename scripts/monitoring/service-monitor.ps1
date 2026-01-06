# Service Monitor Tool
# Monitor Windows services status and manage them

function Get-ServiceStatus {
    param(
        [array]$ServiceNames = @()
    )
    
    $results = @{
        Timestamp = Get-Date
        ComputerName = $env:COMPUTERNAME
        Services = @()
    }
    
    if ($ServiceNames.Count -eq 0) {
        # Get all services
        $services = Get-Service | Sort-Object DisplayName
    } else {
        $services = @()
        foreach ($name in $ServiceNames) {
            $service = Get-Service -Name $name -ErrorAction SilentlyContinue
            if ($service) {
                $services += $service
            }
        }
    }
    
    foreach ($service in $services) {
        $serviceInfo = @{
            Name = $service.Name
            DisplayName = $service.DisplayName
            Status = $service.Status
            StartType = $service.StartType
            CanStop = $service.CanStop
            CanPauseAndContinue = $service.CanPauseAndContinue
        }
        
        # Get service details
        try {
            $wmiService = Get-CimInstance -ClassName Win32_Service -Filter "Name='$($service.Name)'"
            $serviceInfo.PathName = $wmiService.PathName
            $serviceInfo.StartName = $wmiService.StartName
        } catch {
            $serviceInfo.PathName = "N/A"
            $serviceInfo.StartName = "N/A"
        }
        
        $results.Services += $serviceInfo
    }
    
    return $results
}

function Show-ServiceMonitorMenu {
    Write-Host "`n================ Service Monitor Tool ================" -ForegroundColor Cyan
    Write-Host "Monitor and manage Windows services" -ForegroundColor Gray
    Write-Host "======================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. View all services"
    Write-Host "2. View running services only"
    Write-Host "3. View stopped services only"
    Write-Host "4. Search for specific service"
    Write-Host "5. Monitor critical services"
    
    $choice = Read-Host "`nSelect option (1-5)"
    
    $result = $null
    
    switch ($choice) {
        "1" {
            Write-Host "`nLoading all services..." -ForegroundColor Yellow
            $result = Get-ServiceStatus
            
            Write-Host "`n--- All Services ($($result.Services.Count) total) ---" -ForegroundColor Green
            foreach ($service in $result.Services) {
                $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Yellow" }
                Write-Host "$($service.DisplayName) [$($service.Name)]" -ForegroundColor Cyan
                Write-Host "  Status: $($service.Status) | StartType: $($service.StartType)" -ForegroundColor $statusColor
            }
        }
        "2" {
            Write-Host "`nLoading running services..." -ForegroundColor Yellow
            $result = Get-ServiceStatus
            $runningServices = $result.Services | Where-Object { $_.Status -eq "Running" }
            
            Write-Host "`n--- Running Services ($($runningServices.Count) total) ---" -ForegroundColor Green
            foreach ($service in $runningServices) {
                Write-Host "$($service.DisplayName) [$($service.Name)]" -ForegroundColor Green
                Write-Host "  StartType: $($service.StartType) | Account: $($service.StartName)"
            }
        }
        "3" {
            Write-Host "`nLoading stopped services..." -ForegroundColor Yellow
            $result = Get-ServiceStatus
            $stoppedServices = $result.Services | Where-Object { $_.Status -eq "Stopped" }
            
            Write-Host "`n--- Stopped Services ($($stoppedServices.Count) total) ---" -ForegroundColor Yellow
            foreach ($service in $stoppedServices) {
                Write-Host "$($service.DisplayName) [$($service.Name)]" -ForegroundColor Yellow
                Write-Host "  StartType: $($service.StartType)"
            }
        }
        "4" {
            $searchTerm = Read-Host "`nEnter service name or keyword to search"
            Write-Host "`nSearching for services matching '$searchTerm'..." -ForegroundColor Yellow
            
            $result = Get-ServiceStatus
            $matchingServices = $result.Services | Where-Object { 
                $_.Name -like "*$searchTerm*" -or $_.DisplayName -like "*$searchTerm*" 
            }
            
            if ($matchingServices.Count -gt 0) {
                Write-Host "`n--- Matching Services ($($matchingServices.Count) found) ---" -ForegroundColor Green
                foreach ($service in $matchingServices) {
                    $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Yellow" }
                    Write-Host "`n$($service.DisplayName) [$($service.Name)]" -ForegroundColor Cyan
                    Write-Host "  Status: $($service.Status)" -ForegroundColor $statusColor
                    Write-Host "  StartType: $($service.StartType)"
                    Write-Host "  Path: $($service.PathName)"
                    Write-Host "  Account: $($service.StartName)"
                }
            } else {
                Write-Host "`nNo services found matching '$searchTerm'" -ForegroundColor Red
            }
        }
        "5" {
            $criticalServices = @("wuauserv", "BITS", "EventLog", "Winmgmt", "RpcSs", "Spooler", "W32Time", "Dhcp", "Dnscache")
            Write-Host "`nMonitoring critical services..." -ForegroundColor Yellow
            
            $result = Get-ServiceStatus -ServiceNames $criticalServices
            
            Write-Host "`n--- Critical Services Status ---" -ForegroundColor Green
            $issueCount = 0
            foreach ($service in $result.Services) {
                $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Red" }
                Write-Host "$($service.DisplayName)" -ForegroundColor Cyan
                Write-Host "  Status: $($service.Status)" -ForegroundColor $statusColor
                
                if ($service.Status -ne "Running" -and $service.StartType -ne "Disabled") {
                    Write-Host "  WARNING: Service should be running!" -ForegroundColor Red
                    $issueCount++
                }
            }
            
            if ($issueCount -eq 0) {
                Write-Host "`nAll critical services are running normally." -ForegroundColor Green
            } else {
                Write-Host "`nFound $issueCount service(s) with issues." -ForegroundColor Red
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
    
    return $result
}

# Run the tool
Show-ServiceMonitorMenu
