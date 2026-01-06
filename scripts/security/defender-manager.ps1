# Windows Defender Manager Tool
# Manage Windows Defender antivirus and protection

function Show-DefenderManagerMenu {
    Write-Host "`n================ Windows Defender Manager Tool ================" -ForegroundColor Cyan
    Write-Host "Manage Windows Defender antivirus and protection" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. View Defender status"
    Write-Host "2. Run quick scan"
    Write-Host "3. Run full scan"
    Write-Host "4. Update definitions"
    Write-Host "5. View threat history"
    Write-Host "6. Manage exclusions"
    
    $choice = Read-Host "`nSelect option (1-6)"
    
    switch ($choice) {
        "1" {
            Write-Host "`nFetching Windows Defender status..." -ForegroundColor Yellow
            
            try {
                $status = Get-MpComputerStatus
                
                Write-Host "`n--- Windows Defender Status ---" -ForegroundColor Green
                Write-Host "`nReal-time Protection:" -ForegroundColor Cyan
                Write-Host "  Antivirus Enabled: $(if ($status.AntivirusEnabled) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($status.AntivirusEnabled) { "Green" } else { "Red" })
                Write-Host "  Real-time Protection: $(if ($status.RealTimeProtectionEnabled) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($status.RealTimeProtectionEnabled) { "Green" } else { "Red" })
                Write-Host "  Behavior Monitoring: $(if ($status.BehaviorMonitorEnabled) { 'Yes' } else { 'No' })"
                Write-Host "  IOAV Protection: $(if ($status.IoavProtectionEnabled) { 'Yes' } else { 'No' })"
                
                Write-Host "`nDefinitions:" -ForegroundColor Cyan
                Write-Host "  Antivirus Signature Age: $($status.AntivirusSignatureAge) days"
                Write-Host "  Last Quick Scan: $($status.QuickScanStartTime)"
                Write-Host "  Last Full Scan: $($status.FullScanStartTime)"
                
                Write-Host "`nThreat Detection:" -ForegroundColor Cyan
                Write-Host "  Cloud Protection: $(if ($status.CloudProtectionLevel) { 'Enabled' } else { 'Disabled' })"
                Write-Host "  Tamper Protection: $(if ($status.IsTamperProtected) { 'Yes' } else { 'No' })"
                
            } catch {
                Write-Host "`nError: Unable to retrieve Windows Defender status" -ForegroundColor Red
                Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        "2" {
            Write-Host "`nStarting Windows Defender Quick Scan..." -ForegroundColor Yellow
            Write-Host "This may take several minutes. The scan will run in the background." -ForegroundColor Gray
            
            try {
                Start-MpScan -ScanType QuickScan -ErrorAction Stop
                Write-Host "`nQuick scan initiated successfully!" -ForegroundColor Green
                Write-Host "Check Windows Security for scan progress and results." -ForegroundColor Cyan
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "Note: This operation requires administrator privileges" -ForegroundColor Yellow
            }
        }
        "3" {
            Write-Host "`nStarting Windows Defender Full Scan..." -ForegroundColor Yellow
            Write-Host "WARNING: Full scan can take 30+ minutes and may impact performance." -ForegroundColor Yellow
            $confirm = Read-Host "Continue? (Y/N)"
            
            if ($confirm -eq "Y" -or $confirm -eq "y") {
                try {
                    Start-MpScan -ScanType FullScan -ErrorAction Stop
                    Write-Host "`nFull scan initiated successfully!" -ForegroundColor Green
                    Write-Host "Check Windows Security for scan progress and results." -ForegroundColor Cyan
                } catch {
                    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                    Write-Host "Note: This operation requires administrator privileges" -ForegroundColor Yellow
                }
            }
        }
        "4" {
            Write-Host "`nUpdating Windows Defender definitions..." -ForegroundColor Yellow
            
            try {
                Update-MpSignature -ErrorAction Stop
                Write-Host "`nDefinitions updated successfully!" -ForegroundColor Green
                
                $status = Get-MpComputerStatus
                Write-Host "Signature Age: $($status.AntivirusSignatureAge) days" -ForegroundColor Cyan
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "Note: This operation requires administrator privileges and internet connection" -ForegroundColor Yellow
            }
        }
        "5" {
            Write-Host "`nRetrieving threat history..." -ForegroundColor Yellow
            
            try {
                $threats = Get-MpThreat
                
                if ($threats.Count -gt 0) {
                    Write-Host "`n--- Threat History ---" -ForegroundColor Red
                    foreach ($threat in $threats | Select-Object -First 10) {
                        Write-Host "`nThreat: $($threat.ThreatName)" -ForegroundColor Yellow
                        Write-Host "  Severity: $($threat.SeverityID)"
                        Write-Host "  Status: $($threat.ThreatStatusID)"
                        Write-Host "  Detection Time: $($threat.InitialDetectionTime)"
                        Write-Host "  Resources Affected: $($threat.Resources.Count)"
                    }
                    
                    if ($threats.Count -gt 10) {
                        Write-Host "`n(Showing 10 most recent threats. Total: $($threats.Count))" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "`nNo threats detected in history!" -ForegroundColor Green
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "6" {
            Write-Host "`n--- Manage Exclusions ---" -ForegroundColor Cyan
            Write-Host "1. View exclusions"
            Write-Host "2. Add path exclusion"
            Write-Host "3. Add process exclusion"
            Write-Host "4. Remove exclusion"
            
            $exclusionChoice = Read-Host "`nSelect option (1-4)"
            
            switch ($exclusionChoice) {
                "1" {
                    try {
                        $prefs = Get-MpPreference
                        
                        Write-Host "`n--- Current Exclusions ---" -ForegroundColor Green
                        
                        if ($prefs.ExclusionPath) {
                            Write-Host "`nPath Exclusions:" -ForegroundColor Cyan
                            foreach ($path in $prefs.ExclusionPath) {
                                Write-Host "  • $path"
                            }
                        }
                        
                        if ($prefs.ExclusionProcess) {
                            Write-Host "`nProcess Exclusions:" -ForegroundColor Cyan
                            foreach ($process in $prefs.ExclusionProcess) {
                                Write-Host "  • $process"
                            }
                        }
                        
                        if (-not $prefs.ExclusionPath -and -not $prefs.ExclusionProcess) {
                            Write-Host "`nNo exclusions configured." -ForegroundColor Gray
                        }
                    } catch {
                        Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                    }
                }
                "2" {
                    $path = Read-Host "`nEnter path to exclude"
                    try {
                        Add-MpPreference -ExclusionPath $path -ErrorAction Stop
                        Write-Host "`nPath exclusion added successfully!" -ForegroundColor Green
                    } catch {
                        Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                        Write-Host "Note: Requires administrator privileges" -ForegroundColor Yellow
                    }
                }
                "3" {
                    $process = Read-Host "`nEnter process name to exclude (e.g., notepad.exe)"
                    try {
                        Add-MpPreference -ExclusionProcess $process -ErrorAction Stop
                        Write-Host "`nProcess exclusion added successfully!" -ForegroundColor Green
                    } catch {
                        Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                        Write-Host "Note: Requires administrator privileges" -ForegroundColor Yellow
                    }
                }
                "4" {
                    Write-Host "`nRemove path or process exclusion? (Path/Process)"
                    $type = Read-Host
                    $exclusion = Read-Host "Enter exclusion to remove"
                    
                    try {
                        if ($type -like "Path*") {
                            Remove-MpPreference -ExclusionPath $exclusion -ErrorAction Stop
                        } else {
                            Remove-MpPreference -ExclusionProcess $exclusion -ErrorAction Stop
                        }
                        Write-Host "`nExclusion removed successfully!" -ForegroundColor Green
                    } catch {
                        Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                        Write-Host "Note: Requires administrator privileges" -ForegroundColor Yellow
                    }
                }
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-DefenderManagerMenu
