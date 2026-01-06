# PowerShell Admin Console Panel
# Comprehensive IT administration tool suite

$script:ScriptRoot = $PSScriptRoot

function Show-MainMenu {
    Clear-Host
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "                    IT ADMIN CONSOLE PANEL                                     " -ForegroundColor Cyan
    Write-Host "                    Comprehensive Tool Suite                                   " -ForegroundColor Cyan
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] Network Tools" -ForegroundColor Green
    Write-Host "  [2] Monitoring Tools" -ForegroundColor Yellow
    Write-Host "  [3] Automation Tools" -ForegroundColor Magenta
    Write-Host "  [4] Security Tools" -ForegroundColor Red
    Write-Host "  [0] Exit" -ForegroundColor Gray
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Cyan
}

function Show-NetworkMenu {
    Clear-Host
    Write-Host "================ NETWORK TOOLS ================" -ForegroundColor Green
    Write-Host "1. DNS Tester"
    Write-Host "2. Ping Tool"
    Write-Host "3. Port Scanner"
    Write-Host "4. Traceroute"
    Write-Host "5. Bandwidth Monitor"
    Write-Host "6. IP Configuration"
    Write-Host "0. Back to Main Menu"
    Write-Host "===============================================" -ForegroundColor Green
}

function Show-MonitoringMenu {
    Clear-Host
    Write-Host "================ MONITORING TOOLS ================" -ForegroundColor Yellow
    Write-Host "1. System Health Check"
    Write-Host "2. Service Monitor"
    Write-Host "3. Log Analyzer"
    Write-Host "4. Process Monitor"
    Write-Host "5. Disk Monitor"
    Write-Host "6. Inventory Collection"
    Write-Host "0. Back to Main Menu"
    Write-Host "==================================================" -ForegroundColor Yellow
}

function Show-AutomationMenu {
    Clear-Host
    Write-Host "================ AUTOMATION TOOLS ================" -ForegroundColor Magenta
    Write-Host "1. AD User Management"
    Write-Host "2. Password Reset"
    Write-Host "3. Backup and Restore"
    Write-Host "4. Remote Desktop Manager"
    Write-Host "5. File System Cleaner"
    Write-Host "0. Back to Main Menu"
    Write-Host "==================================================" -ForegroundColor Magenta
}

function Show-SecurityMenu {
    Clear-Host
    Write-Host "================ SECURITY TOOLS ================" -ForegroundColor Red
    Write-Host "1. Security Audit"
    Write-Host "2. Firewall Manager"
    Write-Host "3. Windows Defender Manager"
    Write-Host "4. User Permissions Auditor"
    Write-Host "5. Network Security Scanner"
    Write-Host "6. Certificate Manager"
    Write-Host "0. Back to Main Menu"
    Write-Host "================================================" -ForegroundColor Red
}

function Invoke-Tool {
    param(
        [string]$ScriptPath
    )
    
    $fullPath = Join-Path $script:ScriptRoot $ScriptPath
    
    if (Test-Path $fullPath) {
        Write-Host "`nLaunching tool..." -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Gray
        
        try {
            & $fullPath
        } catch {
            Write-Host "`nError executing tool: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "========================================" -ForegroundColor Gray
        Write-Host "Press any key to continue..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        Write-Host "`nTool not found: $fullPath" -ForegroundColor Red
        Write-Host "Press any key to continue..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

# Main program loop
while ($true) {
    Show-MainMenu
    $mainChoice = Read-Host "`nSelect a category (0-4)"
    
    switch ($mainChoice) {
        "1" {
            # Network Tools
            while ($true) {
                Show-NetworkMenu
                $choice = Read-Host "`nSelect a tool (0-6)"
                
                switch ($choice) {
                    "1" { Invoke-Tool "network\dns-tester.ps1" }
                    "2" { Invoke-Tool "network\ping-tool.ps1" }
                    "3" { Invoke-Tool "network\port-scanner.ps1" }
                    "4" { Invoke-Tool "network\traceroute.ps1" }
                    "5" { Invoke-Tool "network\bandwidth-monitor.ps1" }
                    "6" { Invoke-Tool "network\ip-config.ps1" }
                    "0" { break }
                    default { 
                        Write-Host "Invalid option. Please try again." -ForegroundColor Red
                        Start-Sleep -Seconds 1
                    }
                }
                
                if ($choice -eq "0") { break }
            }
        }
        "2" {
            # Monitoring Tools
            while ($true) {
                Show-MonitoringMenu
                $choice = Read-Host "`nSelect a tool (0-6)"
                
                switch ($choice) {
                    "1" { Invoke-Tool "monitoring\health-check.ps1" }
                    "2" { Invoke-Tool "monitoring\service-monitor.ps1" }
                    "3" { Invoke-Tool "monitoring\log-analyzer.ps1" }
                    "4" { Invoke-Tool "monitoring\process-monitor.ps1" }
                    "5" { Invoke-Tool "monitoring\disk-monitor.ps1" }
                    "6" { Invoke-Tool "monitoring\inventory-collection.ps1" }
                    "0" { break }
                    default { 
                        Write-Host "Invalid option. Please try again." -ForegroundColor Red
                        Start-Sleep -Seconds 1
                    }
                }
                
                if ($choice -eq "0") { break }
            }
        }
        "3" {
            # Automation Tools
            while ($true) {
                Show-AutomationMenu
                $choice = Read-Host "`nSelect a tool (0-5)"
                
                switch ($choice) {
                    "1" { Invoke-Tool "automation\ad-user-management.ps1" }
                    "2" { Invoke-Tool "automation\password-reset.ps1" }
                    "3" { Invoke-Tool "automation\backup-restore.ps1" }
                    "4" { Invoke-Tool "automation\remote-desktop.ps1" }
                    "5" { Invoke-Tool "automation\file-cleaner.ps1" }
                    "0" { break }
                    default { 
                        Write-Host "Invalid option. Please try again." -ForegroundColor Red
                        Start-Sleep -Seconds 1
                    }
                }
                
                if ($choice -eq "0") { break }
            }
        }
        "4" {
            # Security Tools
            while ($true) {
                Show-SecurityMenu
                $choice = Read-Host "`nSelect a tool (0-6)"
                
                switch ($choice) {
                    "1" { Invoke-Tool "security\security-audit.ps1" }
                    "2" { Invoke-Tool "security\firewall-manager.ps1" }
                    "3" { Invoke-Tool "security\defender-manager.ps1" }
                    "4" { Invoke-Tool "security\user-permissions.ps1" }
                    "5" { Invoke-Tool "security\network-security.ps1" }
                    "6" { Invoke-Tool "security\certificate-manager.ps1" }
                    "0" { break }
                    default { 
                        Write-Host "Invalid option. Please try again." -ForegroundColor Red
                        Start-Sleep -Seconds 1
                    }
                }
                
                if ($choice -eq "0") { break }
            }
        }
        "0" {
            Write-Host "`nExiting Admin Panel..." -ForegroundColor Cyan
            Write-Host "Thank you for using the IT Admin Console Panel!" -ForegroundColor Green
            exit
        }
        default {
            Write-Host "`nInvalid option. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
