# Traceroute Tool
# Trace the network path to a target host

function Invoke-Traceroute {
    param(
        [string]$Target,
        [int]$MaxHops = 30
    )
    
    $results = @{
        Target = $Target
        Timestamp = Get-Date
        Hops = @()
        Completed = $false
        TotalHops = 0
    }
    
    Write-Host "`nTracing route to $Target..." -ForegroundColor Yellow
    Write-Host "Maximum hops: $MaxHops`n" -ForegroundColor Gray
    
    for ($ttl = 1; $ttl -le $MaxHops; $ttl++) {
        $hop = @{
            HopNumber = $ttl
            IPAddress = $null
            HostName = $null
            ResponseTime = @()
            Status = "Unknown"
        }
        
        Write-Host "$ttl  " -NoNewline
        
        # Attempt 3 pings per hop
        for ($i = 0; $i -lt 3; $i++) {
            try {
                $ping = New-Object System.Net.NetworkInformation.Ping
                $options = New-Object System.Net.NetworkInformation.PingOptions($ttl, $true)
                $reply = $ping.Send($Target, 1000, ([byte[]]@(0) * 32), $options)
                
                if ($reply.Status -eq "TtlExpired" -or $reply.Status -eq "Success") {
                    $hop.ResponseTime += $reply.RoundtripTime
                    if ($null -eq $hop.IPAddress) {
                        $hop.IPAddress = $reply.Address.ToString()
                        $hop.Status = $reply.Status.ToString()
                        
                        try {
                            $hostEntry = [System.Net.Dns]::GetHostEntry($reply.Address)
                            $hop.HostName = $hostEntry.HostName
                        } catch {
                            $hop.HostName = $reply.Address.ToString()
                        }
                    }
                    Write-Host "$($reply.RoundtripTime)ms  " -NoNewline -ForegroundColor Green
                } else {
                    Write-Host "*  " -NoNewline -ForegroundColor Yellow
                }
                
                if ($reply.Status -eq "Success") {
                    $results.Completed = $true
                }
                
            } catch {
                Write-Host "*  " -NoNewline -ForegroundColor Yellow
            }
        }
        
        if ($hop.IPAddress) {
            Write-Host "$($hop.IPAddress) [$($hop.HostName)]" -ForegroundColor Cyan
        } else {
            Write-Host "Request timed out." -ForegroundColor Red
        }
        
        $results.Hops += $hop
        $results.TotalHops = $ttl
        
        if ($results.Completed) {
            Write-Host "`nTrace complete." -ForegroundColor Green
            break
        }
    }
    
    if (-not $results.Completed) {
        Write-Host "`nTrace incomplete. Maximum hops reached." -ForegroundColor Yellow
    }
    
    return $results
}

function Show-TracerouteMenu {
    Write-Host "`n================ Traceroute Tool ================" -ForegroundColor Cyan
    Write-Host "Trace the network path to a target host" -ForegroundColor Gray
    Write-Host "=================================================" -ForegroundColor Cyan
    
    $target = Read-Host "`nEnter target (hostname or IP address)"
    $maxHopsInput = Read-Host "Enter maximum hops (press Enter for 30)"
    
    $maxHops = 30
    if (![string]::IsNullOrWhiteSpace($maxHopsInput)) {
        $maxHops = [int]$maxHopsInput
    }
    
    $result = Invoke-Traceroute -Target $target -MaxHops $maxHops
    
    Write-Host "`n--- Traceroute Summary ---" -ForegroundColor Green
    Write-Host "Target: $($result.Target)"
    Write-Host "Total Hops: $($result.TotalHops)"
    Write-Host "Completed: $($result.Completed)"
    
    return $result
}

# Run the tool
Show-TracerouteMenu
