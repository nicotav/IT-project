# Backup and Restore Tool
# Automate file and folder backup operations

function Start-Backup {
    param(
        [string]$SourcePath,
        [string]$DestinationPath,
        [bool]$Compress = $true
    )
    
    $results = @{
        Timestamp = Get-Date
        SourcePath = $SourcePath
        DestinationPath = $DestinationPath
        Success = $false
        FilesCopied = 0
        TotalSize = 0
        Error = $null
    }
    
    try {
        if (-not (Test-Path $SourcePath)) {
            throw "Source path does not exist: $SourcePath"
        }
        
        # Create destination if it doesn't exist
        if (-not (Test-Path $DestinationPath)) {
            New-Item -Path $DestinationPath -ItemType Directory -Force | Out-Null
        }
        
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupName = "Backup_$timestamp"
        
        if ($Compress) {
            # Create compressed backup
            $zipPath = Join-Path $DestinationPath "$backupName.zip"
            Write-Host "`nCreating compressed backup: $zipPath" -ForegroundColor Yellow
            
            Compress-Archive -Path $SourcePath -DestinationPath $zipPath -Force
            
            $zipFile = Get-Item $zipPath
            $results.TotalSize = $zipFile.Length
            $results.FilesCopied = 1
            
        } else {
            # Copy files without compression
            $backupPath = Join-Path $DestinationPath $backupName
            Write-Host "`nCopying files to: $backupPath" -ForegroundColor Yellow
            
            $files = Get-ChildItem -Path $SourcePath -Recurse -File
            $results.FilesCopied = $files.Count
            
            Copy-Item -Path $SourcePath -Destination $backupPath -Recurse -Force
            
            $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
            $results.TotalSize = $totalSize
        }
        
        $results.Success = $true
        
    } catch {
        $results.Error = $_.Exception.Message
    }
    
    return $results
}

function Show-BackupRestoreMenu {
    Write-Host "`n================ Backup and Restore Tool ================" -ForegroundColor Cyan
    Write-Host "Automate file and folder backup operations" -ForegroundColor Gray
    Write-Host "=========================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. Create backup"
    Write-Host "2. List backups"
    Write-Host "3. Restore from backup"
    Write-Host "4. Schedule backup (simulation)"
    
    $choice = Read-Host "`nSelect option (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host "`n--- Create Backup ---" -ForegroundColor Cyan
            $sourcePath = Read-Host "Enter source path to backup"
            $destinationPath = Read-Host "Enter destination path for backup"
            $compressChoice = Read-Host "Compress backup? (Y/N)"
            
            $compress = $compressChoice -eq "Y" -or $compressChoice -eq "y"
            
            $result = Start-Backup -SourcePath $sourcePath -DestinationPath $destinationPath -Compress $compress
            
            if ($result.Success) {
                Write-Host "`n--- Backup Successful ---" -ForegroundColor Green
                Write-Host "Files Copied: $($result.FilesCopied)"
                Write-Host "Total Size: $([math]::Round($result.TotalSize / 1MB, 2)) MB"
                Write-Host "Destination: $($result.DestinationPath)"
            } else {
                Write-Host "`n--- Backup Failed ---" -ForegroundColor Red
                Write-Host "Error: $($result.Error)"
            }
        }
        "2" {
            $backupPath = Read-Host "`nEnter backup directory path"
            
            if (Test-Path $backupPath) {
                Write-Host "`nListing backups in: $backupPath" -ForegroundColor Yellow
                $backups = Get-ChildItem -Path $backupPath -Filter "Backup_*" | Sort-Object LastWriteTime -Descending
                
                if ($backups.Count -gt 0) {
                    Write-Host "`n--- Available Backups ---" -ForegroundColor Green
                    foreach ($backup in $backups) {
                        $size = if ($backup.PSIsContainer) {
                            $totalSize = (Get-ChildItem -Path $backup.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum
                            [math]::Round($totalSize / 1MB, 2)
                        } else {
                            [math]::Round($backup.Length / 1MB, 2)
                        }
                        
                        Write-Host "`n$($backup.Name)" -ForegroundColor Cyan
                        Write-Host "  Created: $($backup.LastWriteTime)"
                        Write-Host "  Size: $size MB"
                        Write-Host "  Type: $(if ($backup.PSIsContainer) { 'Folder' } else { 'Archive' })"
                    }
                } else {
                    Write-Host "`nNo backups found in the specified directory" -ForegroundColor Yellow
                }
            } else {
                Write-Host "`nBackup directory does not exist" -ForegroundColor Red
            }
        }
        "3" {
            Write-Host "`n--- Restore from Backup ---" -ForegroundColor Cyan
            $backupFile = Read-Host "Enter backup file/folder path"
            $restorePath = Read-Host "Enter restore destination path"
            
            if (Test-Path $backupFile) {
                Write-Host "`nRestoring from: $backupFile" -ForegroundColor Yellow
                Write-Host "To: $restorePath" -ForegroundColor Yellow
                
                try {
                    if ($backupFile -like "*.zip") {
                        Expand-Archive -Path $backupFile -DestinationPath $restorePath -Force
                    } else {
                        Copy-Item -Path $backupFile -Destination $restorePath -Recurse -Force
                    }
                    Write-Host "`nRestore completed successfully!" -ForegroundColor Green
                } catch {
                    Write-Host "`nRestore failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            } else {
                Write-Host "`nBackup file/folder does not exist" -ForegroundColor Red
            }
        }
        "4" {
            Write-Host "`n--- Schedule Backup (Simulation) ---" -ForegroundColor Cyan
            $sourcePath = Read-Host "Enter source path"
            $destinationPath = Read-Host "Enter destination path"
            $schedule = Read-Host "Enter schedule (Daily/Weekly/Monthly)"
            
            Write-Host "`nSimulating scheduled backup creation..." -ForegroundColor Yellow
            Write-Host "Source: $sourcePath" -ForegroundColor Green
            Write-Host "Destination: $destinationPath" -ForegroundColor Green
            Write-Host "Schedule: $schedule" -ForegroundColor Green
            Write-Host "`nNote: In production, this would create a scheduled task" -ForegroundColor Gray
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-BackupRestoreMenu
