# User Permissions Auditor Tool
# Audit user accounts and permissions

function Show-UserPermissionsMenu {
    Write-Host "`n================ User Permissions Auditor Tool ================" -ForegroundColor Cyan
    Write-Host "Audit user accounts and permissions" -ForegroundColor Gray
    Write-Host "===================================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. List all local users"
    Write-Host "2. View user group memberships"
    Write-Host "3. List administrator accounts"
    Write-Host "4. Check password policy"
    Write-Host "5. List inactive accounts"
    Write-Host "6. Audit folder permissions"
    
    $choice = Read-Host "`nSelect option (1-6)"
    
    switch ($choice) {
        "1" {
            Write-Host "`nListing all local users..." -ForegroundColor Yellow
            
            try {
                $users = Get-LocalUser
                
                Write-Host "`n--- Local User Accounts ---" -ForegroundColor Green
                foreach ($user in $users) {
                    $statusColor = if ($user.Enabled) { "Green" } else { "Red" }
                    $status = if ($user.Enabled) { "Enabled" } else { "Disabled" }
                    
                    Write-Host "`n$($user.Name)" -ForegroundColor Cyan
                    Write-Host "  Full Name: $($user.FullName)"
                    Write-Host "  Status: $status" -ForegroundColor $statusColor
                    Write-Host "  Last Logon: $($user.LastLogon)"
                    Write-Host "  Password Last Set: $($user.PasswordLastSet)"
                    Write-Host "  Password Expires: $($user.PasswordExpires)"
                    Write-Host "  Password Changeable: $($user.PasswordChangeableDate)"
                }
                
                Write-Host "`nTotal Users: $($users.Count)" -ForegroundColor Gray
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "2" {
            $username = Read-Host "`nEnter username to check"
            
            try {
                # Get Administrator group name using SID (language-independent)
                $adminGroup = Get-LocalGroup -SID "S-1-5-32-544" -ErrorAction SilentlyContinue
                $adminGroupName = if ($adminGroup) { $adminGroup.Name } else { "Administrators" }
                
                $user = Get-LocalUser -Name $username -ErrorAction Stop
                $groups = Get-LocalGroup | Where-Object {
                    (Get-LocalGroupMember -Group $_.Name -ErrorAction SilentlyContinue).Name -contains "$env:COMPUTERNAME\$username"
                }
                
                Write-Host "`n--- Group Memberships for $username ---" -ForegroundColor Green
                if ($groups) {
                    foreach ($group in $groups) {
                        $color = if ($group.Name -eq $adminGroupName) { "Red" } else { "Cyan" }
                        Write-Host "  • $($group.Name)" -ForegroundColor $color
                        Write-Host "    Description: $($group.Description)" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "User is not a member of any groups." -ForegroundColor Yellow
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "3" {
            Write-Host "`nListing administrator accounts..." -ForegroundColor Yellow
            
            try {
                # Get Administrators group by SID (works in all languages)
                # S-1-5-32-544 is the well-known SID for Administrators group
                $adminGroup = Get-LocalGroup -SID "S-1-5-32-544" -ErrorAction Stop
                $admins = Get-LocalGroupMember -Group $adminGroup.Name
                
                Write-Host "`n--- Administrator Accounts ---" -ForegroundColor Red
                Write-Host "Administrator Group Name: $($adminGroup.Name)" -ForegroundColor Cyan
                foreach ($admin in $admins) {
                    Write-Host "`n$($admin.Name)" -ForegroundColor Yellow
                    Write-Host "  Type: $($admin.ObjectClass)"
                    Write-Host "  Principal Source: $($admin.PrincipalSource)"
                    
                    # Try to get additional info if it's a local user
                    if ($admin.ObjectClass -eq "User") {
                        $username = ($admin.Name -split '\\')[-1]
                        $user = Get-LocalUser -Name $username -ErrorAction SilentlyContinue
                        if ($user) {
                            $statusColor = if ($user.Enabled) { "Green" } else { "Red" }
                            Write-Host "  Status: $(if ($user.Enabled) { 'Enabled' } else { 'Disabled' })" -ForegroundColor $statusColor
                            Write-Host "  Last Logon: $($user.LastLogon)"
                        }
                    }
                }
                
                Write-Host "`nTotal Administrators: $($admins.Count)" -ForegroundColor Gray
                if ($admins.Count -gt 2) {
                    Write-Host "WARNING: Multiple administrator accounts detected. Review for security." -ForegroundColor Red
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "4" {
            Write-Host "`nChecking password policy..." -ForegroundColor Yellow
            
            try {
                # Using net accounts to get password policy
                $accountsInfo = net accounts
                
                Write-Host "`n--- Password Policy ---" -ForegroundColor Green
                foreach ($line in $accountsInfo) {
                    if ($line -match "password|lockout|duration") {
                        Write-Host "  $line" -ForegroundColor Cyan
                    }
                }
                
                # Additional checks
                Write-Host "`n--- User Password Settings ---" -ForegroundColor Green
                $users = Get-LocalUser
                foreach ($user in $users | Where-Object { $_.Enabled }) {
                    Write-Host "`n$($user.Name):" -ForegroundColor Cyan
                    Write-Host "  Password Required: $(if ($user.PasswordRequired) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($user.PasswordRequired) { "Green" } else { "Red" })
                    Write-Host "  Password Changeable: $(if (-not $user.UserMayChangePassword) { 'No' } else { 'Yes' })"
                    Write-Host "  Password Expires: $(if (-not $user.PasswordExpires) { 'Never' } else { $user.PasswordExpires })"
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "5" {
            $days = Read-Host "`nEnter number of days of inactivity (default: 90)"
            if (-not $days) { $days = 90 }
            
            Write-Host "`nFinding users inactive for $days days..." -ForegroundColor Yellow
            
            try {
                $cutoffDate = (Get-Date).AddDays(-$days)
                $users = Get-LocalUser | Where-Object { 
                    $_.Enabled -and 
                    ($_.LastLogon -eq $null -or $_.LastLogon -lt $cutoffDate)
                }
                
                if ($users) {
                    Write-Host "`n--- Inactive User Accounts ---" -ForegroundColor Red
                    foreach ($user in $users) {
                        Write-Host "`n$($user.Name)" -ForegroundColor Yellow
                        Write-Host "  Last Logon: $(if ($user.LastLogon) { $user.LastLogon } else { 'Never' })"
                        Write-Host "  Account Created: $($user.Created)"
                        Write-Host "  Status: Enabled" -ForegroundColor Red
                    }
                    
                    Write-Host "`nTotal Inactive Accounts: $($users.Count)" -ForegroundColor Gray
                    Write-Host "RECOMMENDATION: Consider disabling inactive accounts for security." -ForegroundColor Yellow
                } else {
                    Write-Host "`nNo inactive accounts found!" -ForegroundColor Green
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "6" {
            $path = Read-Host "`nEnter folder path to audit"
            
            if (Test-Path $path) {
                Write-Host "`nAuditing permissions for: $path" -ForegroundColor Yellow
                
                try {
                    $acl = Get-Acl -Path $path
                    
                    Write-Host "`n--- Folder Permissions ---" -ForegroundColor Green
                    Write-Host "Owner: $($acl.Owner)" -ForegroundColor Cyan
                    
                    Write-Host "`nAccess Rules:" -ForegroundColor Cyan
                    foreach ($access in $acl.Access) {
                        $color = switch ($access.FileSystemRights) {
                            "FullControl" { "Red" }
                            {$_ -match "Write|Modify"} { "Yellow" }
                            default { "Green" }
                        }
                        
                        Write-Host "`n$($access.IdentityReference)" -ForegroundColor $color
                        Write-Host "  Rights: $($access.FileSystemRights)"
                        Write-Host "  Type: $($access.AccessControlType)"
                        Write-Host "  Inherited: $(if ($access.IsInherited) { 'Yes' } else { 'No' })"
                    }
                    
                    # Check for potentially risky permissions
                    $riskyPerms = $acl.Access | Where-Object {
                        ($_.IdentityReference -like "*Users*" -or $_.IdentityReference -like "*Everyone*") -and
                        ($_.FileSystemRights -match "FullControl|Write|Modify")
                    }
                    
                    if ($riskyPerms) {
                        Write-Host "`nWARNING: Potentially risky permissions detected!" -ForegroundColor Red
                        Write-Host "Users or Everyone group has write/modify access." -ForegroundColor Yellow
                    }
                    
                } catch {
                    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                }
            } else {
                Write-Host "`nPath does not exist!" -ForegroundColor Red
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-UserPermissionsMenu
