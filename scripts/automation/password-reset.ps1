# Password Reset Tool
# Reset user passwords for local and AD accounts

function Reset-UserPassword {
    param(
        [string]$Username,
        [securestring]$NewPassword,
        [bool]$IsLocalUser = $true
    )
    
    $results = @{
        Timestamp = Get-Date
        Username = $Username
        Success = $false
        Error = $null
    }
    
    try {
        if ($IsLocalUser) {
            $user = Get-LocalUser -Name $Username -ErrorAction Stop
            $user | Set-LocalUser -Password $NewPassword
            $results.Success = $true
        } else {
            # AD user password reset (simulation)
            Write-Host "AD password reset requires Active Directory module" -ForegroundColor Yellow
            $results.Success = $false
            $results.Error = "AD module not available - simulation mode"
        }
    } catch {
        $results.Error = $_.Exception.Message
    }
    
    return $results
}

function Show-PasswordResetMenu {
    Write-Host "`n================ Password Reset Tool ================" -ForegroundColor Cyan
    Write-Host "Reset user passwords" -ForegroundColor Gray
    Write-Host "=====================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. Reset local user password"
    Write-Host "2. Reset AD user password (simulation)"
    Write-Host "3. Generate strong password"
    Write-Host "4. List local users"
    
    $choice = Read-Host "`nSelect option (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host "`n--- Reset Local User Password ---" -ForegroundColor Cyan
            $username = Read-Host "Enter username"
            $newPassword = Read-Host "Enter new password" -AsSecureString
            $confirmPassword = Read-Host "Confirm new password" -AsSecureString
            
            # Convert to plain text for comparison
            $pwd1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($newPassword))
            $pwd2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmPassword))
            
            if ($pwd1 -eq $pwd2) {
                Write-Host "`nResetting password for '$username'..." -ForegroundColor Yellow
                $result = Reset-UserPassword -Username $username -NewPassword $newPassword -IsLocalUser $true
                
                if ($result.Success) {
                    Write-Host "`nPassword reset successful!" -ForegroundColor Green
                } else {
                    Write-Host "`nPassword reset failed: $($result.Error)" -ForegroundColor Red
                }
            } else {
                Write-Host "`nPasswords do not match!" -ForegroundColor Red
            }
        }
        "2" {
            Write-Host "`n--- Reset AD User Password (Simulation) ---" -ForegroundColor Cyan
            $username = Read-Host "Enter AD username"
            $newPassword = Read-Host "Enter new password" -AsSecureString
            
            Write-Host "`nSimulating AD password reset for '$username'..." -ForegroundColor Yellow
            Write-Host "Password would be reset in Active Directory" -ForegroundColor Green
            Write-Host "User would be required to change password at next logon" -ForegroundColor Gray
        }
        "3" {
            Write-Host "`n--- Generate Strong Password ---" -ForegroundColor Cyan
            $length = Read-Host "Enter password length (default: 12)"
            if ([string]::IsNullOrWhiteSpace($length)) { $length = 12 } else { $length = [int]$length }
            
            # Generate strong password
            Add-Type -AssemblyName 'System.Web'
            $password = [System.Web.Security.Membership]::GeneratePassword($length, 3)
            
            Write-Host "`nGenerated Password: $password" -ForegroundColor Green
            Write-Host "`nPassword Strength:" -ForegroundColor Cyan
            Write-Host "  Length: $length characters"
            Write-Host "  Contains: Uppercase, Lowercase, Numbers, Special Characters"
            Write-Host "`nNote: Store this password securely!" -ForegroundColor Yellow
        }
        "4" {
            Write-Host "`nListing local users..." -ForegroundColor Yellow
            $localUsers = Get-LocalUser
            
            Write-Host "`n--- Local Users ---" -ForegroundColor Green
            foreach ($user in $localUsers) {
                $statusColor = if ($user.Enabled) { "Green" } else { "Red" }
                Write-Host "`n$($user.Name)" -ForegroundColor Cyan
                Write-Host "  Enabled: $($user.Enabled)" -ForegroundColor $statusColor
                Write-Host "  Password Last Set: $($user.PasswordLastSet)"
                Write-Host "  Password Changeable: $($user.PasswordChangeableDate)"
                Write-Host "  Password Expires: $($user.PasswordExpires)"
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-PasswordResetMenu
