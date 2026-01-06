# Security Audit Tool
# Perform security audits on Windows systems

function Get-SecurityAudit {
    $audit = @{
        Timestamp = Get-Date
        ComputerName = $env:COMPUTERNAME
        Checks = @()
        Issues = @()
        Score = 0
    }
    
    Write-Host "`nPerforming security audit..." -ForegroundColor Yellow
    $totalChecks = 0
    $passedChecks = 0
    
    # Check 1: Windows Update Status
    Write-Host "  Checking Windows Update service..." -ForegroundColor Gray
    $wuService = Get-Service -Name wuauserv
    if ($wuService.Status -eq "Running") {
        $audit.Checks += "Windows Update Service: PASS"
        $passedChecks++
    } else {
        $audit.Checks += "Windows Update Service: FAIL"
        $audit.Issues += "Windows Update service is not running"
    }
    $totalChecks++
    
    # Check 2: Firewall Status
    Write-Host "  Checking Windows Firewall..." -ForegroundColor Gray
    $firewallProfiles = Get-NetFirewallProfile
    $firewallEnabled = $true
    foreach ($profile in $firewallProfiles) {
        if (-not $profile.Enabled) {
            $firewallEnabled = $false
            $audit.Issues += "Firewall profile '$($profile.Name)' is disabled"
        }
    }
    if ($firewallEnabled) {
        $audit.Checks += "Windows Firewall: PASS"
        $passedChecks++
    } else {
        $audit.Checks += "Windows Firewall: FAIL"
    }
    $totalChecks++
    
    # Check 3: Antivirus Status
    Write-Host "  Checking antivirus status..." -ForegroundColor Gray
    try {
        $defender = Get-MpComputerStatus -ErrorAction Stop
        if ($defender.AntivirusEnabled) {
            $audit.Checks += "Antivirus Protection: PASS"
            $passedChecks++
        } else {
            $audit.Checks += "Antivirus Protection: FAIL"
            $audit.Issues += "Antivirus protection is disabled"
        }
    } catch {
        $audit.Checks += "Antivirus Protection: UNABLE TO CHECK"
        $audit.Issues += "Could not check antivirus status"
    }
    $totalChecks++
    
    # Check 4: Administrator Account
    Write-Host "  Checking built-in Administrator account..." -ForegroundColor Gray
    $adminAccount = Get-LocalUser -Name "Administrator" -ErrorAction SilentlyContinue
    if ($adminAccount -and -not $adminAccount.Enabled) {
        $audit.Checks += "Built-in Administrator Disabled: PASS"
        $passedChecks++
    } else {
        $audit.Checks += "Built-in Administrator Disabled: FAIL"
        $audit.Issues += "Built-in Administrator account is enabled (security risk)"
    }
    $totalChecks++
    
    # Check 5: Guest Account
    Write-Host "  Checking Guest account..." -ForegroundColor Gray
    $guestAccount = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
    if ($guestAccount -and -not $guestAccount.Enabled) {
        $audit.Checks += "Guest Account Disabled: PASS"
        $passedChecks++
    } else {
        $audit.Checks += "Guest Account Disabled: FAIL"
        $audit.Issues += "Guest account is enabled (security risk)"
    }
    $totalChecks++
    
    # Check 6: UAC Status
    Write-Host "  Checking UAC status..." -ForegroundColor Gray
    $uacKey = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name EnableLUA -ErrorAction SilentlyContinue
    if ($uacKey.EnableLUA -eq 1) {
        $audit.Checks += "UAC Enabled: PASS"
        $passedChecks++
    } else {
        $audit.Checks += "UAC Enabled: FAIL"
        $audit.Issues += "User Account Control (UAC) is disabled"
    }
    $totalChecks++
    
    # Calculate security score
    $audit.Score = [math]::Round(($passedChecks / $totalChecks) * 100, 2)
    
    return $audit
}

function Show-SecurityAuditMenu {
    Write-Host "`n================ Security Audit Tool ================" -ForegroundColor Cyan
    Write-Host "Perform security audits on Windows systems" -ForegroundColor Gray
    Write-Host "=====================================================" -ForegroundColor Cyan
    
    $audit = Get-SecurityAudit
    
    $scoreColor = if ($audit.Score -ge 80) { "Green" } elseif ($audit.Score -ge 60) { "Yellow" } else { "Red" }
    
    Write-Host "`n--- Security Audit Report ---" -ForegroundColor Green
    Write-Host "Computer: $($audit.ComputerName)"
    Write-Host "Timestamp: $($audit.Timestamp)"
    Write-Host "Security Score: $($audit.Score)%" -ForegroundColor $scoreColor
    
    Write-Host "`nSecurity Checks:" -ForegroundColor Cyan
    foreach ($check in $audit.Checks) {
        if ($check -like "*PASS*") {
            Write-Host "  ✓ $check" -ForegroundColor Green
        } elseif ($check -like "*FAIL*") {
            Write-Host "  ✗ $check" -ForegroundColor Red
        } else {
            Write-Host "  ℹ $check" -ForegroundColor Yellow
        }
    }
    
    if ($audit.Issues.Count -gt 0) {
        Write-Host "`nSecurity Issues Found:" -ForegroundColor Red
        foreach ($issue in $audit.Issues) {
            Write-Host "  • $issue" -ForegroundColor Yellow
        }
        
        Write-Host "`nRecommendations:" -ForegroundColor Cyan
        Write-Host "  1. Address critical security issues immediately"
        Write-Host "  2. Enable Windows Update and install all patches"
        Write-Host "  3. Ensure firewall is enabled on all profiles"
        Write-Host "  4. Keep antivirus definitions up to date"
        Write-Host "  5. Disable unnecessary accounts"
    } else {
        Write-Host "`nNo security issues detected!" -ForegroundColor Green
    }
    
    return $audit
}

# Run the tool
Show-SecurityAuditMenu
