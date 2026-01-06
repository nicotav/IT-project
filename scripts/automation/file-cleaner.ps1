# File System Cleaner Tool
# Clean temporary files and free up disk space

function Start-SystemCleanup {
    $cleanup = @{
        Timestamp = Get-Date
        CleanedLocations = @()
        TotalSpaceFreed = 0
        Errors = @()
    }
    
    $locations = @(
        @{ Path = "$env:TEMP"; Name = "User Temp Files" }
        @{ Path = "C:\Windows\Temp"; Name = "System Temp Files" }
        @{ Path = "C:\Windows\Prefetch"; Name = "Prefetch Files" }
        @{ Path = "$env:LOCALAPPDATA\Microsoft\Windows\INetCache"; Name = "Internet Cache" }
        @{ Path = "C:\Windows\SoftwareDistribution\Download"; Name = "Windows Update Cache" }
    )
    
    Write-Host "`nStarting system cleanup..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes...`n" -ForegroundColor Gray
    
    foreach ($location in $locations) {
        Write-Host "Cleaning: $($location.Name)..." -ForegroundColor Cyan
        
        if (Test-Path $location.Path) {
            try {
                $beforeSize = (Get-ChildItem -Path $location.Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                
                Get-ChildItem -Path $location.Path -Recurse -Force -ErrorAction SilentlyContinue | 
                    Where-Object { -not $_.PSIsContainer -and $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
                    Remove-Item -Force -ErrorAction SilentlyContinue
                
                $afterSize = (Get-ChildItem -Path $location.Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                $freed = $beforeSize - $afterSize
                
                $cleanup.CleanedLocations += @{
                    Name = $location.Name
                    Path = $location.Path
                    SpaceFreed = $freed
                }
                $cleanup.TotalSpaceFreed += $freed
                
                Write-Host "  Freed: $([math]::Round($freed / 1MB, 2)) MB" -ForegroundColor Green
                
            } catch {
                $cleanup.Errors += "Error cleaning $($location.Name): $($_.Exception.Message)"
                Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "  Path not found, skipping..." -ForegroundColor Yellow
        }
    }
    
    return $cleanup
}

function Show-FileSystemCleanerMenu {
    Write-Host "`n================ File System Cleaner Tool ================" -ForegroundColor Cyan
    Write-Host "Clean temporary files and free up disk space" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. Quick cleanup (temp files older than 7 days)"
    Write-Host "2. Analyze disk space usage"
    Write-Host "3. Empty Recycle Bin"
    Write-Host "4. Run Windows Disk Cleanup"
    
    $choice = Read-Host "`nSelect option (1-4)"
    
    switch ($choice) {
        "1" {
            $confirm = Read-Host "`nThis will delete temporary files older than 7 days. Continue? (Y/N)"
            if ($confirm -eq "Y" -or $confirm -eq "y") {
                $result = Start-SystemCleanup
                
                Write-Host "`n--- Cleanup Summary ---" -ForegroundColor Green
                Write-Host "Total Space Freed: $([math]::Round($result.TotalSpaceFreed / 1MB, 2)) MB"
                Write-Host "Locations Cleaned: $($result.CleanedLocations.Count)"
                
                if ($result.Errors.Count -gt 0) {
                    Write-Host "`nErrors encountered:" -ForegroundColor Yellow
                    foreach ($error in $result.Errors) {
                        Write-Host "  - $error" -ForegroundColor Red
                    }
                }
            }
        }
        "2" {
            Write-Host "`nAnalyzing disk space usage..." -ForegroundColor Yellow
            $drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 -and $_.Name.Length -eq 1 }
            
            Write-Host "`n--- Disk Space Analysis ---" -ForegroundColor Green
            foreach ($drive in $drives) {
                $usedPercent = [math]::Round(($drive.Used / ($drive.Used + $drive.Free)) * 100, 2)
                Write-Host "`n$($drive.Name):\" -ForegroundColor Cyan
                Write-Host "  Total: $([math]::Round(($drive.Used + $drive.Free) / 1GB, 2)) GB"
                Write-Host "  Used: $([math]::Round($drive.Used / 1GB, 2)) GB ($usedPercent%)"
                Write-Host "  Free: $([math]::Round($drive.Free / 1GB, 2)) GB"
            }
        }
        "3" {
            $confirm = Read-Host "`nEmpty Recycle Bin for all users? (Y/N)"
            if ($confirm -eq "Y" -or $confirm -eq "y") {
                Write-Host "`nEmptying Recycle Bin..." -ForegroundColor Yellow
                try {
                    Clear-RecycleBin -Force -ErrorAction Stop
                    Write-Host "Recycle Bin emptied successfully!" -ForegroundColor Green
                } catch {
                    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        "4" {
            Write-Host "`nLaunching Windows Disk Cleanup..." -ForegroundColor Yellow
            try {
                Start-Process "cleanmgr.exe" -ArgumentList "/d C:"
                Write-Host "Disk Cleanup launched" -ForegroundColor Green
            } catch {
                Write-Host "Error launching Disk Cleanup: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-FileSystemCleanerMenu
