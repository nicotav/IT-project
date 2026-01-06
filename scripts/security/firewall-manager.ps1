# Firewall Manager Tool
# Manage Windows Firewall rules and profiles

function Show-FirewallManagerMenu {
    Write-Host "`n================ Firewall Manager Tool ================" -ForegroundColor Cyan
    Write-Host "Manage Windows Firewall rules and profiles" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. View firewall status"
    Write-Host "2. List firewall rules"
    Write-Host "3. Create new firewall rule"
    Write-Host "4. Enable/Disable firewall profiles"
    Write-Host "5. Block/Allow port"
    
    $choice = Read-Host "`nSelect option (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host "`nFirewall Status:" -ForegroundColor Cyan
            $profiles = Get-NetFirewallProfile
            
            foreach ($profile in $profiles) {
                $statusColor = if ($profile.Enabled) { "Green" } else { "Red" }
                $status = if ($profile.Enabled) { "Enabled" } else { "Disabled" }
                
                Write-Host "`n$($profile.Name) Profile:" -ForegroundColor Yellow
                Write-Host "  Status: $status" -ForegroundColor $statusColor
                Write-Host "  Default Inbound: $($profile.DefaultInboundAction)"
                Write-Host "  Default Outbound: $($profile.DefaultOutboundAction)"
                Write-Host "  Notifications: $($profile.NotifyOnListen)"
            }
        }
        "2" {
            Write-Host "`nSelect rule type:" -ForegroundColor Cyan
            Write-Host "1. Inbound rules"
            Write-Host "2. Outbound rules"
            Write-Host "3. All rules"
            
            $ruleChoice = Read-Host "`nSelect (1-3)"
            
            $direction = switch ($ruleChoice) {
                "1" { "Inbound" }
                "2" { "Outbound" }
                default { $null }
            }
            
            Write-Host "`nFetching firewall rules..." -ForegroundColor Yellow
            
            if ($direction) {
                $rules = Get-NetFirewallRule -Direction $direction -Enabled True | Select-Object -First 20
            } else {
                $rules = Get-NetFirewallRule -Enabled True | Select-Object -First 20
            }
            
            Write-Host "`nTop 20 Active Firewall Rules:" -ForegroundColor Green
            foreach ($rule in $rules) {
                $color = if ($rule.Action -eq "Allow") { "Green" } else { "Red" }
                Write-Host "`n$($rule.DisplayName)" -ForegroundColor Cyan
                Write-Host "  Direction: $($rule.Direction)"
                Write-Host "  Action: $($rule.Action)" -ForegroundColor $color
                Write-Host "  Profile: $($rule.Profile)"
            }
            
            Write-Host "`n(Showing first 20 rules only)" -ForegroundColor Gray
        }
        "3" {
            Write-Host "`n--- Create New Firewall Rule ---" -ForegroundColor Cyan
            $ruleName = Read-Host "Enter rule name"
            $protocol = Read-Host "Enter protocol (TCP/UDP/Any)"
            $port = Read-Host "Enter port number (or leave blank for all ports)"
            $direction = Read-Host "Enter direction (Inbound/Outbound)"
            $action = Read-Host "Enter action (Allow/Block)"
            
            Write-Host "`nCreating firewall rule..." -ForegroundColor Yellow
            
            try {
                $params = @{
                    DisplayName = $ruleName
                    Direction = $direction
                    Action = $action
                }
                
                if ($protocol -ne "Any") {
                    $params.Protocol = $protocol
                }
                
                if ($port) {
                    $params.LocalPort = $port
                }
                
                New-NetFirewallRule @params -ErrorAction Stop
                Write-Host "`nFirewall rule created successfully!" -ForegroundColor Green
            } catch {
                Write-Host "`nError creating rule: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "Note: This operation requires administrator privileges" -ForegroundColor Yellow
            }
        }
        "4" {
            Write-Host "`n--- Enable/Disable Firewall Profiles ---" -ForegroundColor Cyan
            Write-Host "1. Domain"
            Write-Host "2. Private"
            Write-Host "3. Public"
            Write-Host "4. All"
            
            $profileChoice = Read-Host "`nSelect profile (1-4)"
            $enableDisable = Read-Host "Enable or Disable? (E/D)"
            
            $profileName = switch ($profileChoice) {
                "1" { "Domain" }
                "2" { "Private" }
                "3" { "Public" }
                "4" { "Any" }
                default { "Any" }
            }
            
            $enabled = $enableDisable -eq "E"
            
            try {
                Set-NetFirewallProfile -Profile $profileName -Enabled $enabled -ErrorAction Stop
                $action = if ($enabled) { "enabled" } else { "disabled" }
                Write-Host "`nFirewall profile(s) $action successfully!" -ForegroundColor Green
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "Note: This operation requires administrator privileges" -ForegroundColor Yellow
            }
        }
        "5" {
            Write-Host "`n--- Block/Allow Port ---" -ForegroundColor Cyan
            $port = Read-Host "Enter port number"
            $protocol = Read-Host "Enter protocol (TCP/UDP)"
            $action = Read-Host "Block or Allow? (B/A)"
            
            $actionType = if ($action -eq "B") { "Block" } else { "Allow" }
            $ruleName = "$actionType Port $port ($protocol)"
            
            try {
                New-NetFirewallRule `
                    -DisplayName $ruleName `
                    -Direction Inbound `
                    -Protocol $protocol `
                    -LocalPort $port `
                    -Action $actionType `
                    -ErrorAction Stop
                
                Write-Host "`nFirewall rule created: Port $port ($protocol) is now ${actionType}ed" -ForegroundColor Green
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "Note: This operation requires administrator privileges" -ForegroundColor Yellow
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-FirewallManagerMenu
