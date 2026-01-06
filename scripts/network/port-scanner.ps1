# Port Scanner Tool
# Scan TCP ports on target systems

function Test-PortScan {
    param(
        [string]$Target,
        [array]$Ports = @(21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080)
    )
    
    $results = @{
        Target = $Target
        Timestamp = Get-Date
        TotalPorts = $Ports.Count
        OpenPorts = @()
        ClosedPorts = @()
        FilteredPorts = @()
    }
    
    Write-Host "`nScanning $Target..." -ForegroundColor Yellow
    Write-Host "Total ports to scan: $($Ports.Count)" -ForegroundColor Gray
    
    $progressCount = 0
    foreach ($port in $Ports) {
        $progressCount++
        Write-Progress -Activity "Scanning Ports" -Status "Port $port" -PercentComplete (($progressCount / $Ports.Count) * 100)
        
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $connect = $tcpClient.BeginConnect($Target, $port, $null, $null)
            $wait = $connect.AsyncWaitHandle.WaitOne(1000, $false)
            
            if ($wait) {
                try {
                    $tcpClient.EndConnect($connect)
                    $serviceName = switch ($port) {
                        21 { "FTP" }
                        22 { "SSH" }
                        23 { "Telnet" }
                        25 { "SMTP" }
                        53 { "DNS" }
                        80 { "HTTP" }
                        110 { "POP3" }
                        143 { "IMAP" }
                        443 { "HTTPS" }
                        445 { "SMB" }
                        3306 { "MySQL" }
                        3389 { "RDP" }
                        5432 { "PostgreSQL" }
                        8080 { "HTTP-Alt" }
                        default { "Unknown" }
                    }
                    
                    $results.OpenPorts += @{
                        Port = $port
                        Service = $serviceName
                        Status = "Open"
                    }
                    Write-Host "Port $port ($serviceName): OPEN" -ForegroundColor Green
                } catch {
                    $results.FilteredPorts += $port
                }
            } else {
                $results.ClosedPorts += $port
            }
            
            $tcpClient.Close()
            $tcpClient.Dispose()
        } catch {
            $results.FilteredPorts += $port
        }
    }
    
    Write-Progress -Activity "Scanning Ports" -Completed
    return $results
}

function Show-PortScannerMenu {
    Write-Host "`n================ Port Scanner Tool ================" -ForegroundColor Cyan
    Write-Host "Scan TCP ports on target systems" -ForegroundColor Gray
    Write-Host "===================================================" -ForegroundColor Cyan
    
    $target = Read-Host "`nEnter target (hostname or IP address)"
    
    Write-Host "`nPort Range Options:"
    Write-Host "1. Common ports (21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080)"
    Write-Host "2. Well-known ports (1-1023)"
    Write-Host "3. Custom port range"
    
    $choice = Read-Host "Select option (1-3)"
    
    $ports = @()
    switch ($choice) {
        "1" {
            $ports = @(21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080)
        }
        "2" {
            $ports = 1..1023
            Write-Host "Warning: This will scan 1023 ports and may take several minutes..." -ForegroundColor Yellow
            $confirm = Read-Host "Continue? (Y/N)"
            if ($confirm -ne "Y") {
                Write-Host "Scan cancelled." -ForegroundColor Red
                return
            }
        }
        "3" {
            $startPort = Read-Host "Enter start port"
            $endPort = Read-Host "Enter end port"
            $ports = [int]$startPort..[int]$endPort
        }
        default {
            $ports = @(21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080)
        }
    }
    
    $result = Test-PortScan -Target $target -Ports $ports
    
    Write-Host "`n--- Port Scan Results ---" -ForegroundColor Green
    Write-Host "Target: $($result.Target)"
    Write-Host "Total Ports Scanned: $($result.TotalPorts)"
    Write-Host "Open Ports: $($result.OpenPorts.Count)" -ForegroundColor Green
    Write-Host "Closed/Filtered Ports: $($result.ClosedPorts.Count + $result.FilteredPorts.Count)" -ForegroundColor Yellow
    
    if ($result.OpenPorts.Count -gt 0) {
        Write-Host "`nOpen Ports Details:" -ForegroundColor Green
        foreach ($openPort in $result.OpenPorts) {
            Write-Host "  Port $($openPort.Port) - $($openPort.Service)" -ForegroundColor Cyan
        }
    }
    
    return $result
}

# Run the tool
Show-PortScannerMenu
