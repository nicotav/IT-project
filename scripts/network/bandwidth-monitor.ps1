# Bandwidth Monitor Tool
# Monitor network adapter bandwidth usage

function Get-NetworkBandwidth {
    param(
        [int]$Duration = 10,
        [int]$Interval = 1
    )
    
    $results = @{
        Timestamp = Get-Date
        Duration = $Duration
        Adapters = @()
    }
    
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    
    Write-Host "`nMonitoring network bandwidth for $Duration seconds..." -ForegroundColor Yellow
    Write-Host "Interval: $Interval second(s)`n" -ForegroundColor Gray
    
    foreach ($adapter in $adapters) {
        Write-Host "Adapter: $($adapter.Name)" -ForegroundColor Cyan
        
        $adapterData = @{
            Name = $adapter.Name
            Description = $adapter.InterfaceDescription
            LinkSpeed = $adapter.LinkSpeed
            Samples = @()
            AvgBytesReceived = 0
            AvgBytesSent = 0
            TotalBytesReceived = 0
            TotalBytesSent = 0
        }
        
        # Get initial statistics
        try {
            $stats1 = Get-NetAdapterStatistics -Name $adapter.Name -ErrorAction Stop
            $initialReceived = $stats1.ReceivedBytes
            $initialSent = $stats1.SentBytes
            
            $iterations = $Duration / $Interval
            for ($i = 0; $i -lt $iterations; $i++) {
                Start-Sleep -Seconds $Interval
                
                try {
                    $stats2 = Get-NetAdapterStatistics -Name $adapter.Name -ErrorAction Stop
                    
                    # Calculate bytes transferred in this interval
                    $bytesReceived = $stats2.ReceivedBytes - $initialReceived
                    $bytesSent = $stats2.SentBytes - $initialSent
                    
                    # Calculate rate (bytes per second)
                    $bytesReceivedPerSec = $bytesReceived / $Interval
                    $bytesSentPerSec = $bytesSent / $Interval
                    
                    $sample = @{
                        Time = Get-Date
                        BytesReceived = $bytesReceivedPerSec
                        BytesSent = $bytesSentPerSec
                        KbpsReceived = [math]::Round($bytesReceivedPerSec * 8 / 1024, 2)
                        KbpsSent = [math]::Round($bytesSentPerSec * 8 / 1024, 2)
                    }
                    
                    $adapterData.Samples += $sample
                    $adapterData.TotalBytesReceived += $bytesReceivedPerSec
                    $adapterData.TotalBytesSent += $bytesSentPerSec
                    
                    # Update initial values for next iteration
                    $initialReceived = $stats2.ReceivedBytes
                    $initialSent = $stats2.SentBytes
                    
                    Write-Host "  [$($i+1)/$iterations] Received: $($sample.KbpsReceived) Kbps | Sent: $($sample.KbpsSent) Kbps" -ForegroundColor Green
                    
                } catch {
                    Write-Host "  [$($i+1)/$iterations] Error reading statistics" -ForegroundColor Red
                }
            }
            
            if ($adapterData.Samples.Count -gt 0) {
                $adapterData.AvgBytesReceived = [math]::Round($adapterData.TotalBytesReceived / $adapterData.Samples.Count, 2)
                $adapterData.AvgBytesSent = [math]::Round($adapterData.TotalBytesSent / $adapterData.Samples.Count, 2)
            }
            
        } catch {
            Write-Host "  Error: Could not access adapter statistics" -ForegroundColor Red
            Write-Host "  $($_.Exception.Message)" -ForegroundColor Gray
        }
        
        $results.Adapters += $adapterData
        Write-Host ""
    }
    
    return $results
}

function Show-BandwidthMonitorMenu {
    Write-Host "`n================ Bandwidth Monitor Tool ================" -ForegroundColor Cyan
    Write-Host "Monitor network adapter bandwidth usage" -ForegroundColor Gray
    Write-Host "========================================================" -ForegroundColor Cyan
    
    $durationInput = Read-Host "`nEnter monitoring duration in seconds (press Enter for 10)"
    
    $duration = 10
    if (![string]::IsNullOrWhiteSpace($durationInput)) {
        $duration = [int]$durationInput
    }
    
    $result = Get-NetworkBandwidth -Duration $duration
    
    Write-Host "`n--- Bandwidth Summary ---" -ForegroundColor Green
    foreach ($adapter in $result.Adapters) {
        Write-Host "`nAdapter: $($adapter.Name)" -ForegroundColor Cyan
        Write-Host "  Link Speed: $($adapter.LinkSpeed)"
        Write-Host "  Avg Received: $([math]::Round($adapter.AvgBytesReceived * 8 / 1024, 2)) Kbps"
        Write-Host "  Avg Sent: $([math]::Round($adapter.AvgBytesSent * 8 / 1024, 2)) Kbps"
        Write-Host "  Total Received: $([math]::Round($adapter.TotalBytesReceived / 1MB, 2)) MB"
        Write-Host "  Total Sent: $([math]::Round($adapter.TotalBytesSent / 1MB, 2)) MB"
    }
    
    return $result
}

# Run the tool
Show-BandwidthMonitorMenu
