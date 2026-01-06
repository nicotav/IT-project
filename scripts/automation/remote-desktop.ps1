# Remote Desktop Manager Tool
# Manage Remote Desktop connections

function Show-RDPManagerMenu {
    Write-Host "`n================ Remote Desktop Manager Tool ================" -ForegroundColor Cyan
    Write-Host "Manage Remote Desktop connections" -ForegroundColor Gray
    Write-Host "=============================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. Connect to remote computer"
    Write-Host "2. Check RDP service status"
    Write-Host "3. Enable RDP (requires admin)"
    Write-Host "4. Show RDP port configuration"
    Write-Host "5. List active RDP sessions"
    
    $choice = Read-Host "`nSelect option (1-5)"
    
    switch ($choice) {
        "1" {
            $computer = Read-Host "`nEnter computer name or IP address"
            Write-Host "`nConnecting to $computer..." -ForegroundColor Yellow
            try {
                Start-Process "mstsc.exe" -ArgumentList "/v:$computer"
                Write-Host "Remote Desktop client launched" -ForegroundColor Green
            } catch {
                Write-Host "Error launching Remote Desktop: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "2" {
            Write-Host "`nChecking Remote Desktop service..." -ForegroundColor Yellow
            $rdpService = Get-Service -Name TermService -ErrorAction SilentlyContinue
            if ($rdpService) {
                $statusColor = if ($rdpService.Status -eq "Running") { "Green" } else { "Red" }
                Write-Host "`nRemote Desktop Service Status:" -ForegroundColor Cyan
                Write-Host "  Service: $($rdpService.DisplayName)"
                Write-Host "  Status: $($rdpService.Status)" -ForegroundColor $statusColor
                Write-Host "  Start Type: $($rdpService.StartType)"
            } else {
                Write-Host "Remote Desktop service not found" -ForegroundColor Red
            }
        }
        "3" {
            Write-Host "`nEnabling Remote Desktop (requires admin)..." -ForegroundColor Yellow
            Write-Host "Note: This operation requires administrator privileges" -ForegroundColor Gray
            try {
                Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections" -Value 0
                Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
                Write-Host "`nRemote Desktop enabled successfully!" -ForegroundColor Green
            } catch {
                Write-Host "`nFailed to enable Remote Desktop: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "Please run as Administrator" -ForegroundColor Yellow
            }
        }
        "4" {
            Write-Host "`nRDP Port Configuration:" -ForegroundColor Cyan
            $rdpPort = Get-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -Name PortNumber -ErrorAction SilentlyContinue
            if ($rdpPort) {
                Write-Host "  RDP Port: $($rdpPort.PortNumber)" -ForegroundColor Green
            } else {
                Write-Host "  Could not retrieve RDP port" -ForegroundColor Yellow
            }
        }
        "5" {
            Write-Host "`nListing active RDP sessions..." -ForegroundColor Yellow
            try {
                # Use cmd to run query session (CMD command)
                $sessions = cmd /c "query session" 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "`n$sessions" -ForegroundColor Cyan
                } else {
                    Write-Host "`nNo active sessions found or unable to query sessions" -ForegroundColor Yellow
                    Write-Host "Note: This feature requires Terminal Services to be running" -ForegroundColor Gray
                }
            } catch {
                Write-Host "Error retrieving sessions: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-RDPManagerMenu
