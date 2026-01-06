# Network Security Scanner Tool
# Scan and analyze network security

function Show-NetworkSecurityMenu {
    Write-Host "`n================ Network Security Scanner Tool ================" -ForegroundColor Cyan
    Write-Host "Scan and analyze network security" -ForegroundColor Gray
    Write-Host "===================================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. Scan open ports"
    Write-Host "2. List active network connections"
    Write-Host "3. Check for suspicious connections"
    Write-Host "4. View listening services"
    Write-Host "5. Test common vulnerabilities"
    
    $choice = Read-Host "`nSelect option (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host "`nScanning common ports on localhost..." -ForegroundColor Yellow
            Write-Host "This may take a minute...`n" -ForegroundColor Gray
            
            $commonPorts = @{
                21 = "FTP"
                22 = "SSH"
                23 = "Telnet"
                25 = "SMTP"
                53 = "DNS"
                80 = "HTTP"
                110 = "POP3"
                143 = "IMAP"
                443 = "HTTPS"
                445 = "SMB"
                1433 = "SQL Server"
                3306 = "MySQL"
                3389 = "RDP"
                5985 = "WinRM HTTP"
                5986 = "WinRM HTTPS"
                8080 = "HTTP Alternate"
            }
            
            Write-Host "--- Open Ports on Localhost ---" -ForegroundColor Green
            $openPorts = @()
            
            foreach ($port in $commonPorts.Keys | Sort-Object) {
                $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
                
                if ($connection) {
                    $service = $commonPorts[$port]
                    $color = if ($port -in @(23, 21, 445)) { "Red" } else { "Yellow" }
                    Write-Host "  Port $port ($service): OPEN" -ForegroundColor $color
                    $openPorts += $port
                }
            }
            
            if ($openPorts.Count -eq 0) {
                Write-Host "  No common ports are open" -ForegroundColor Green
            } else {
                Write-Host "`nTotal Open Ports: $($openPorts.Count)" -ForegroundColor Gray
                
                # Security warnings
                if (23 -in $openPorts) {
                    Write-Host "`nWARNING: Telnet (port 23) is open - insecure protocol!" -ForegroundColor Red
                }
                if (21 -in $openPorts) {
                    Write-Host "WARNING: FTP (port 21) is open - consider using SFTP instead!" -ForegroundColor Red
                }
                if (445 -in $openPorts) {
                    Write-Host "INFO: SMB (port 445) is open - ensure proper firewall rules!" -ForegroundColor Yellow
                }
            }
        }
        "2" {
            Write-Host "`nListing active network connections..." -ForegroundColor Yellow
            
            try {
                $connections = Get-NetTCPConnection -State Established | Select-Object -First 20
                
                Write-Host "`n--- Active TCP Connections (Top 20) ---" -ForegroundColor Green
                foreach ($conn in $connections) {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    
                    Write-Host "`nLocal: $($conn.LocalAddress):$($conn.LocalPort) -> Remote: $($conn.RemoteAddress):$($conn.RemotePort)" -ForegroundColor Cyan
                    Write-Host "  State: $($conn.State)"
                    Write-Host "  Process: $($process.ProcessName) (PID: $($conn.OwningProcess))"
                }
                
                $totalConnections = (Get-NetTCPConnection -State Established).Count
                Write-Host "`nTotal Established Connections: $totalConnections" -ForegroundColor Gray
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "3" {
            Write-Host "`nScanning for suspicious connections..." -ForegroundColor Yellow
            
            try {
                $connections = Get-NetTCPConnection -State Established
                $suspiciousConnections = @()
                
                foreach ($conn in $connections) {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    
                    # Check for suspicious patterns
                    $suspicious = $false
                    $reason = ""
                    
                    # Suspicious ports
                    if ($conn.RemotePort -in @(4444, 6666, 6667, 31337)) {
                        $suspicious = $true
                        $reason = "Known malware/backdoor port"
                    }
                    
                    # Non-standard remote ports for common apps
                    if ($process.ProcessName -in @("notepad", "calc", "mspaint") -and $conn.RemotePort -notin @(80, 443)) {
                        $suspicious = $true
                        $reason = "Unexpected network activity from basic app"
                    }
                    
                    # Connections to unusual ports
                    if ($conn.RemotePort -gt 49152) {
                        $suspicious = $true
                        $reason = "Connection to high port number"
                    }
                    
                    if ($suspicious) {
                        $suspiciousConnections += [PSCustomObject]@{
                            LocalAddress = $conn.LocalAddress
                            LocalPort = $conn.LocalPort
                            RemoteAddress = $conn.RemoteAddress
                            RemotePort = $conn.RemotePort
                            Process = $process.ProcessName
                            PID = $conn.OwningProcess
                            Reason = $reason
                        }
                    }
                }
                
                if ($suspiciousConnections.Count -gt 0) {
                    Write-Host "`n--- Suspicious Connections Detected ---" -ForegroundColor Red
                    foreach ($conn in $suspiciousConnections | Select-Object -First 10) {
                        Write-Host "`nRemote: $($conn.RemoteAddress):$($conn.RemotePort)" -ForegroundColor Yellow
                        Write-Host "  Process: $($conn.Process) (PID: $($conn.PID))"
                        Write-Host "  Reason: $($conn.Reason)" -ForegroundColor Red
                    }
                    
                    Write-Host "`nTotal Suspicious Connections: $($suspiciousConnections.Count)" -ForegroundColor Gray
                    Write-Host "RECOMMENDATION: Investigate these connections further!" -ForegroundColor Yellow
                } else {
                    Write-Host "`nNo obvious suspicious connections detected." -ForegroundColor Green
                    Write-Host "Note: This is a basic scan. Consider using specialized security tools for comprehensive analysis." -ForegroundColor Gray
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "4" {
            Write-Host "`nListing services listening on network ports..." -ForegroundColor Yellow
            
            try {
                $listening = Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess | Sort-Object LocalPort
                
                Write-Host "`n--- Listening Services ---" -ForegroundColor Green
                foreach ($listener in $listening) {
                    $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
                    
                    $color = "Cyan"
                    if ($listener.LocalAddress -eq "0.0.0.0") {
                        $color = "Yellow"  # Listening on all interfaces
                    }
                    
                    Write-Host "`nPort $($listener.LocalPort) on $($listener.LocalAddress)" -ForegroundColor $color
                    Write-Host "  Process: $($process.ProcessName) (PID: $($listener.OwningProcess))"
                    Write-Host "  Path: $($process.Path)" -ForegroundColor Gray
                }
                
                Write-Host "`nTotal Listening Ports: $($listening.Count)" -ForegroundColor Gray
                
                # Check for services listening on all interfaces
                $publicListeners = $listening | Where-Object { $_.LocalAddress -eq "0.0.0.0" }
                if ($publicListeners) {
                    Write-Host "`nWARNING: $($publicListeners.Count) service(s) listening on all interfaces (0.0.0.0)!" -ForegroundColor Yellow
                    Write-Host "These services are potentially accessible from external networks." -ForegroundColor Yellow
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "5" {
            Write-Host "`n--- Testing Common Vulnerabilities ---" -ForegroundColor Cyan
            Write-Host "Running security checks...`n" -ForegroundColor Yellow
            
            $vulnerabilities = @()
            
            # Check 1: SMBv1
            Write-Host "Checking SMBv1 status..." -ForegroundColor Gray
            try {
                $smb1 = Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -ErrorAction SilentlyContinue
                if ($smb1.State -eq "Enabled") {
                    $vulnerabilities += "SMBv1 is enabled (vulnerable to WannaCry/EternalBlue)"
                    Write-Host "  ✗ SMBv1 is ENABLED (CRITICAL VULNERABILITY!)" -ForegroundColor Red
                } else {
                    Write-Host "  ✓ SMBv1 is disabled" -ForegroundColor Green
                }
            } catch {
                Write-Host "  ℹ Unable to check SMBv1 status" -ForegroundColor Yellow
            }
            
            # Check 2: Remote Desktop
            Write-Host "Checking Remote Desktop configuration..." -ForegroundColor Gray
            $rdpEnabled = Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -ErrorAction SilentlyContinue
            if ($rdpEnabled.fDenyTSConnections -eq 0) {
                Write-Host "  ℹ Remote Desktop is enabled (ensure strong passwords)" -ForegroundColor Yellow
            } else {
                Write-Host "  ✓ Remote Desktop is disabled" -ForegroundColor Green
            }
            
            # Check 3: PowerShell Remoting
            Write-Host "Checking PowerShell Remoting..." -ForegroundColor Gray
            $winrm = Get-Service -Name WinRM -ErrorAction SilentlyContinue
            if ($winrm.Status -eq "Running") {
                Write-Host "  ℹ WinRM/PowerShell Remoting is enabled (ensure firewall rules)" -ForegroundColor Yellow
            } else {
                Write-Host "  ✓ PowerShell Remoting is not running" -ForegroundColor Green
            }
            
            # Check 4: Windows Update
            Write-Host "Checking Windows Update service..." -ForegroundColor Gray
            $wuService = Get-Service -Name wuauserv -ErrorAction SilentlyContinue
            if ($wuService.Status -ne "Running") {
                $vulnerabilities += "Windows Update service is not running"
                Write-Host "  ✗ Windows Update service is NOT running" -ForegroundColor Red
            } else {
                Write-Host "  ✓ Windows Update service is running" -ForegroundColor Green
            }
            
            # Check 5: Guest Account
            Write-Host "Checking Guest account status..." -ForegroundColor Gray
            $guest = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
            if ($guest -and $guest.Enabled) {
                $vulnerabilities += "Guest account is enabled"
                Write-Host "  ✗ Guest account is ENABLED" -ForegroundColor Red
            } else {
                Write-Host "  ✓ Guest account is disabled" -ForegroundColor Green
            }
            
            # Summary
            Write-Host "`n--- Vulnerability Summary ---" -ForegroundColor Cyan
            if ($vulnerabilities.Count -gt 0) {
                Write-Host "Vulnerabilities Found: $($vulnerabilities.Count)" -ForegroundColor Red
                foreach ($vuln in $vulnerabilities) {
                    Write-Host "  • $vuln" -ForegroundColor Yellow
                }
            } else {
                Write-Host "No major vulnerabilities detected!" -ForegroundColor Green
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-NetworkSecurityMenu
