# Ping Tool
# Advanced ping utility with statistics and continuous monitoring

function Test-AdvancedPing {
    param(
        [string]$Target,
        [int]$Count = 4,
        [bool]$Continuous = $false
    )
    
    $results = @{
        Target = $Target
        Timestamp = Get-Date
        PacketsSent = 0
        PacketsReceived = 0
        PacketsLost = 0
        MinResponseTime = [double]::MaxValue
        MaxResponseTime = 0
        AvgResponseTime = 0
        Details = @()
    }
    
    Write-Host "`nPinging $Target..." -ForegroundColor Yellow
    
    $iteration = 0
    $totalTime = 0
    
    do {
        $results.PacketsSent++
        
        try {
            # Use Test-Connection with explicit timeout
            $ping = Test-Connection -ComputerName $Target -Count 1 -BufferSize 32 -TimeToLive 128 -Delay 1 -ErrorAction Stop
            
            $results.PacketsReceived++
            
            # Get response time - handle both ResponseTime and Latency properties
            $responseTime = if ($ping.ResponseTime) { $ping.ResponseTime } elseif ($ping.Latency) { $ping.Latency } else { 0 }
            
            $totalTime += $responseTime
            if ($responseTime -lt $results.MinResponseTime) { $results.MinResponseTime = $responseTime }
            if ($responseTime -gt $results.MaxResponseTime) { $results.MaxResponseTime = $responseTime }
            
            # Get IP address - handle different property names
            $ipAddress = if ($ping.IPV4Address) { 
                $ping.IPV4Address.ToString() 
            } elseif ($ping.Address) { 
                $ping.Address.ToString() 
            } else { 
                $Target 
            }
            
            $detail = @{
                Sequence = $iteration + 1
                IPAddress = $ipAddress
                ResponseTime = $responseTime
                Status = "Success"
            }
            
            $results.Details += $detail
            Write-Host "Reply from $($ipAddress): bytes=32 time=$($responseTime)ms TTL=128" -ForegroundColor Green
            
        } catch {
            $detail = @{
                Sequence = $iteration + 1
                IPAddress = "N/A"
                ResponseTime = 0
                Status = "Failed"
                Error = $_.Exception.Message
            }
            $results.Details += $detail
            Write-Host "Request timed out." -ForegroundColor Red
        }
        
        $iteration++
        if ($Continuous -or $iteration -lt $Count) {
            Start-Sleep -Seconds 1
        }
        
    } while (($Continuous -and $iteration -lt 1000) -or ($iteration -lt $Count))
    
    # Calculate packets lost
    $results.PacketsLost = $results.PacketsSent - $results.PacketsReceived
    
    # Calculate average response time
    $results.AvgResponseTime = if ($results.PacketsReceived -gt 0) { 
        [math]::Round($totalTime / $results.PacketsReceived, 2) 
    } else { 0 }
    
    # Fix MinResponseTime if no packets received
    if ($results.MinResponseTime -eq [double]::MaxValue) {
        $results.MinResponseTime = 0
    }
    
    return $results
}

function Show-PingToolMenu {
    Write-Host "`n================ Ping Tool ================" -ForegroundColor Cyan
    Write-Host "Test network connectivity with ping" -ForegroundColor Gray
    Write-Host "===========================================" -ForegroundColor Cyan
    
    $target = Read-Host "`nEnter target (hostname or IP address)"
    $countInput = Read-Host "Enter number of pings (press Enter for 4)"
    
    $count = 4
    if (![string]::IsNullOrWhiteSpace($countInput)) {
        $count = [int]$countInput
    }
    
    # Quick DNS resolution test
    Write-Host "`nResolving hostname..." -ForegroundColor Yellow
    try {
        $resolvedIP = [System.Net.Dns]::GetHostAddresses($target) | Where-Object { $_.AddressFamily -eq 'InterNetwork' } | Select-Object -First 1
        if ($resolvedIP) {
            Write-Host "Resolved to: $($resolvedIP.IPAddressToString)" -ForegroundColor Green
        }
    } catch {
        Write-Host "Warning: Could not resolve hostname. Trying to ping anyway..." -ForegroundColor Yellow
    }
    
    $result = Test-AdvancedPing -Target $target -Count $count
    
    Write-Host "`n--- Ping Statistics ---" -ForegroundColor Green
    Write-Host "Target: $($result.Target)"
    $lossPercent = if ($result.PacketsSent -gt 0) { [math]::Round(($result.PacketsLost / $result.PacketsSent) * 100, 2) } else { 0 }
    Write-Host "Packets: Sent = $($result.PacketsSent), Received = $($result.PacketsReceived), Lost = $($result.PacketsLost) ($lossPercent% loss)"
    
    if ($result.PacketsReceived -gt 0) {
        Write-Host "`nApproximate round trip times:" -ForegroundColor Green
        Write-Host "  Minimum = $($result.MinResponseTime)ms"
        Write-Host "  Maximum = $($result.MaxResponseTime)ms"
        Write-Host "  Average = $($result.AvgResponseTime)ms"
    } else {
        Write-Host "`nNo replies received." -ForegroundColor Red
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  - Target is offline or unreachable"
        Write-Host "  - Firewall is blocking ICMP packets"
        Write-Host "  - Network connectivity issue"
        Write-Host "  - Incorrect hostname or IP address"
        
        # Check if there's a specific error
        $errorDetails = $result.Details | Where-Object { $_.Error } | Select-Object -First 1
        if ($errorDetails -and $errorDetails.Error) {
            Write-Host "`nError details: $($errorDetails.Error)" -ForegroundColor Gray
        }
    }
    
    return $result
}

# Run the tool
Show-PingToolMenu
