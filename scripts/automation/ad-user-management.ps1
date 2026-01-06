# AD User Management Tool
# Simulate AD user management operations (requires Active Directory module)

function Show-ADUserManagementMenu {
    Write-Host "`n================ AD User Management Tool ================" -ForegroundColor Cyan
    Write-Host "Manage Active Directory users" -ForegroundColor Gray
    Write-Host "======================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. Search for user"
    Write-Host "2. Create new user (simulation)"
    Write-Host "3. Disable user account (simulation)"
    Write-Host "4. Enable user account (simulation)"
    Write-Host "5. Reset user password (simulation)"
    Write-Host "6. List local users"
    
    $choice = Read-Host "`nSelect option (1-6)"
    
    switch ($choice) {
        "1" {
            $username = Read-Host "`nEnter username to search"
            Write-Host "`nSearching for user '$username'..." -ForegroundColor Yellow
            
            # Check local users
            $user = Get-LocalUser -Name "*$username*" -ErrorAction SilentlyContinue
            if ($user) {
                Write-Host "`n--- User Found (Local) ---" -ForegroundColor Green
                foreach ($u in $user) {
                    Write-Host "`nUsername: $($u.Name)" -ForegroundColor Cyan
                    Write-Host "  Full Name: $($u.FullName)"
                    Write-Host "  Enabled: $($u.Enabled)"
                    Write-Host "  Last Logon: $($u.LastLogon)"
                    Write-Host "  Password Last Set: $($u.PasswordLastSet)"
                }
            } else {
                Write-Host "`nNo local user found matching '$username'" -ForegroundColor Yellow
                Write-Host "Note: For AD users, this requires Active Directory module" -ForegroundColor Gray
            }
        }
        "2" {
            Write-Host "`n--- Create New User (Simulation) ---" -ForegroundColor Cyan
            $username = Read-Host "Enter username"
            $fullName = Read-Host "Enter full name"
            $password = Read-Host "Enter password" -AsSecureString
            
            Write-Host "`nSimulating user creation..." -ForegroundColor Yellow
            Write-Host "Username: $username" -ForegroundColor Green
            Write-Host "Full Name: $fullName" -ForegroundColor Green
            Write-Host "Password: [SECURED]" -ForegroundColor Green
            Write-Host "`nNote: In production, this would create an AD user account" -ForegroundColor Gray
        }
        "3" {
            $username = Read-Host "`nEnter username to disable"
            Write-Host "`nSimulating account disable for '$username'..." -ForegroundColor Yellow
            Write-Host "Account would be disabled in Active Directory" -ForegroundColor Green
        }
        "4" {
            $username = Read-Host "`nEnter username to enable"
            Write-Host "`nSimulating account enable for '$username'..." -ForegroundColor Yellow
            Write-Host "Account would be enabled in Active Directory" -ForegroundColor Green
        }
        "5" {
            $username = Read-Host "`nEnter username"
            $newPassword = Read-Host "Enter new password" -AsSecureString
            Write-Host "`nSimulating password reset for '$username'..." -ForegroundColor Yellow
            Write-Host "Password would be reset in Active Directory" -ForegroundColor Green
        }
        "6" {
            Write-Host "`nListing local users..." -ForegroundColor Yellow
            $localUsers = Get-LocalUser
            
            Write-Host "`n--- Local Users ---" -ForegroundColor Green
            foreach ($user in $localUsers) {
                $statusColor = if ($user.Enabled) { "Green" } else { "Red" }
                Write-Host "`n$($user.Name)" -ForegroundColor Cyan
                Write-Host "  Full Name: $($user.FullName)"
                Write-Host "  Enabled: $($user.Enabled)" -ForegroundColor $statusColor
                Write-Host "  Last Logon: $($user.LastLogon)"
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-ADUserManagementMenu
