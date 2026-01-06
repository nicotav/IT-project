# DNS Tester Tool
# Tests DNS resolution and provides detailed DNS query information

function Test-DNSResolution {
    param(
        [string]$Domain,
        [string]$DNSServer = "8.8.8.8"
    )
    
    $result = @{
        Domain = $Domain
        DNSServer = $DNSServer
        Timestamp = Get-Date
        Success = $false
        IPAddresses = @()
        ResponseTime = 0
        Error = $null
    }
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $dnsResult = Resolve-DnsName -Name $Domain -Server $DNSServer -ErrorAction Stop
        $stopwatch.Stop()
        
        $result.Success = $true
        $result.ResponseTime = $stopwatch.ElapsedMilliseconds
        $result.IPAddresses = $dnsResult | Where-Object { $_.Type -eq "A" } | ForEach-Object { $_.IPAddress }
        
    } catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Show-DNSTesterMenu {
    Write-Host "`n================ DNS Tester Tool ================" -ForegroundColor Cyan
    Write-Host "Test DNS resolution and query DNS records" -ForegroundColor Gray
    Write-Host "=================================================" -ForegroundColor Cyan
    
    $domain = Read-Host "`nEnter domain name to test (e.g., google.com)"
    $dnsServer = Read-Host "Enter DNS Server (press Enter for 8.8.8.8)"
    
    if ([string]::IsNullOrWhiteSpace($dnsServer)) {
        $dnsServer = "8.8.8.8"
    }
    
    Write-Host "`nTesting DNS resolution..." -ForegroundColor Yellow
    $result = Test-DNSResolution -Domain $domain -DNSServer $dnsServer
    
    Write-Host "`n--- DNS Test Results ---" -ForegroundColor Green
    Write-Host "Domain: $($result.Domain)"
    Write-Host "DNS Server: $($result.DNSServer)"
    Write-Host "Success: $($result.Success)"
    Write-Host "Response Time: $($result.ResponseTime)ms"
    
    if ($result.Success) {
        Write-Host "IP Addresses:" -ForegroundColor Green
        foreach ($ip in $result.IPAddresses) {
            Write-Host "  - $ip" -ForegroundColor Cyan
        }
        
        # Additional DNS record types
        Write-Host "`nQuerying additional DNS records..." -ForegroundColor Yellow
        try {
            $mxRecords = Resolve-DnsName -Name $domain -Type MX -Server $dnsServer -ErrorAction SilentlyContinue
            if ($mxRecords) {
                Write-Host "MX Records:" -ForegroundColor Green
                foreach ($mx in $mxRecords) {
                    Write-Host "  - $($mx.NameExchange) (Priority: $($mx.Preference))" -ForegroundColor Cyan
                }
            }
            
            $txtRecords = Resolve-DnsName -Name $domain -Type TXT -Server $dnsServer -ErrorAction SilentlyContinue
            if ($txtRecords) {
                Write-Host "TXT Records:" -ForegroundColor Green
                foreach ($txt in $txtRecords) {
                    Write-Host "  - $($txt.Strings)" -ForegroundColor Cyan
                }
            }
        } catch {
            Write-Host "Could not retrieve additional records" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "Error: $($result.Error)" -ForegroundColor Red
    }
    
    return $result
}

# Run the tool
Show-DNSTesterMenu
