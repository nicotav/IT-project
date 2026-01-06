# IP Configuration Tool
# Display and manage network adapter configurations

function Get-DetailedIPConfig {
    $results = @{
        Timestamp = Get-Date
        ComputerName = $env:COMPUTERNAME
        Adapters = @()
    }
    
    $adapters = Get-NetAdapter
    
    foreach ($adapter in $adapters) {
        $adapterData = @{
            Name = $adapter.Name
            Description = $adapter.InterfaceDescription
            Status = $adapter.Status
            MacAddress = $adapter.MacAddress
            LinkSpeed = $adapter.LinkSpeed
            IPConfiguration = @()
        }
        
        $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -ErrorAction SilentlyContinue
        foreach ($ip in $ipConfig) {
            $adapterData.IPConfiguration += @{
                IPAddress = $ip.IPAddress
                PrefixLength = $ip.PrefixLength
                AddressFamily = $ip.AddressFamily
            }
        }
        
        # Get DNS servers
        $dnsServers = Get-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ErrorAction SilentlyContinue
        $adapterData.DNSServers = $dnsServers | Where-Object { $_.AddressFamily -eq 2 } | Select-Object -ExpandProperty ServerAddresses
        
        # Get default gateway
        $gateway = Get-NetRoute -InterfaceIndex $adapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
        $adapterData.DefaultGateway = $gateway.NextHop
        
        $results.Adapters += $adapterData
    }
    
    return $results
}

function Show-IPConfigMenu {
    Write-Host "`n================ IP Configuration Tool ================" -ForegroundColor Cyan
    Write-Host "Display network adapter configurations" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Cyan
    
    $result = Get-DetailedIPConfig
    
    Write-Host "`nComputer Name: $($result.ComputerName)" -ForegroundColor Yellow
    Write-Host "Timestamp: $($result.Timestamp)`n" -ForegroundColor Gray
    
    foreach ($adapter in $result.Adapters) {
        Write-Host "--- $($adapter.Name) ---" -ForegroundColor Cyan
        Write-Host "  Description: $($adapter.Description)"
        Write-Host "  Status: $($adapter.Status)" -ForegroundColor $(if ($adapter.Status -eq "Up") { "Green" } else { "Red" })
        Write-Host "  MAC Address: $($adapter.MacAddress)"
        Write-Host "  Link Speed: $($adapter.LinkSpeed)"
        
        if ($adapter.IPConfiguration.Count -gt 0) {
            Write-Host "  IP Configuration:" -ForegroundColor Green
            foreach ($ip in $adapter.IPConfiguration) {
                Write-Host "    - $($ip.IPAddress)/$($ip.PrefixLength) [$($ip.AddressFamily)]" -ForegroundColor Cyan
            }
        }
        
        if ($adapter.DefaultGateway) {
            Write-Host "  Default Gateway: $($adapter.DefaultGateway)" -ForegroundColor Green
        }
        
        if ($adapter.DNSServers) {
            Write-Host "  DNS Servers:" -ForegroundColor Green
            foreach ($dns in $adapter.DNSServers) {
                Write-Host "    - $dns" -ForegroundColor Cyan
            }
        }
        
        Write-Host ""
    }
    
    return $result
}

# Run the tool
Show-IPConfigMenu
