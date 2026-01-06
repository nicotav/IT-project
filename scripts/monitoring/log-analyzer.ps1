# Log Analyzer Tool
# Analyze Windows Event Logs for issues and patterns

function Get-LogAnalysis {
    param(
        [string]$LogName = "System",
        [int]$Hours = 24,
        [array]$EntryTypes = @("Error", "Warning")
    )
    
    $results = @{
        Timestamp = Get-Date
        LogName = $LogName
        TimeRange = $Hours
        Analysis = @{
            TotalEvents = 0
            ErrorCount = 0
            WarningCount = 0
            TopSources = @()
            RecentEvents = @()
        }
    }
    
    Write-Host "`nAnalyzing $LogName log (last $Hours hours)..." -ForegroundColor Yellow
    
    $startTime = (Get-Date).AddHours(-$Hours)
    
    try {
        $events = Get-EventLog -LogName $LogName -After $startTime -EntryType $EntryTypes -ErrorAction Stop
        
        $results.Analysis.TotalEvents = $events.Count
        $results.Analysis.ErrorCount = ($events | Where-Object { $_.EntryType -eq "Error" }).Count
        $results.Analysis.WarningCount = ($events | Where-Object { $_.EntryType -eq "Warning" }).Count
        
        # Top error sources
        $sourceGroups = $events | Group-Object Source | Sort-Object Count -Descending | Select-Object -First 10
        foreach ($group in $sourceGroups) {
            $results.Analysis.TopSources += @{
                Source = $group.Name
                Count = $group.Count
            }
        }
        
        # Recent events
        $recentEvents = $events | Select-Object -First 20
        foreach ($event in $recentEvents) {
            $results.Analysis.RecentEvents += @{
                Time = $event.TimeGenerated
                EntryType = $event.EntryType
                Source = $event.Source
                EventID = $event.EventID
                Message = $event.Message.Substring(0, [Math]::Min(200, $event.Message.Length))
            }
        }
        
    } catch {
        Write-Host "Error accessing log: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return $results
}

function Show-LogAnalyzerMenu {
    Write-Host "`n================ Log Analyzer Tool ================" -ForegroundColor Cyan
    Write-Host "Analyze Windows Event Logs" -ForegroundColor Gray
    Write-Host "====================================================" -ForegroundColor Cyan
    
    Write-Host "`nAvailable Logs:"
    Write-Host "1. System"
    Write-Host "2. Application"
    Write-Host "3. Security"
    
    $logChoice = Read-Host "`nSelect log to analyze (1-3)"
    
    $logName = switch ($logChoice) {
        "1" { "System" }
        "2" { "Application" }
        "3" { "Security" }
        default { "System" }
    }
    
    $hoursInput = Read-Host "Enter hours to analyze (press Enter for 24)"
    $hours = if ([string]::IsNullOrWhiteSpace($hoursInput)) { 24 } else { [int]$hoursInput }
    
    $result = Get-LogAnalysis -LogName $logName -Hours $hours
    
    Write-Host "`n--- Log Analysis Report ---" -ForegroundColor Green
    Write-Host "Log Name: $($result.LogName)"
    Write-Host "Time Range: Last $($result.TimeRange) hours"
    Write-Host "Total Events: $($result.Analysis.TotalEvents)"
    Write-Host "Errors: $($result.Analysis.ErrorCount)" -ForegroundColor $(if ($result.Analysis.ErrorCount -gt 0) { "Red" } else { "Green" })
    Write-Host "Warnings: $($result.Analysis.WarningCount)" -ForegroundColor $(if ($result.Analysis.WarningCount -gt 0) { "Yellow" } else { "Green" })
    
    if ($result.Analysis.TopSources.Count -gt 0) {
        Write-Host "`nTop Event Sources:" -ForegroundColor Cyan
        foreach ($source in $result.Analysis.TopSources) {
            Write-Host "  $($source.Source): $($source.Count) events" -ForegroundColor Yellow
        }
    }
    
    if ($result.Analysis.RecentEvents.Count -gt 0) {
        Write-Host "`nRecent Events (Most Recent 10):" -ForegroundColor Cyan
        $displayCount = [Math]::Min(10, $result.Analysis.RecentEvents.Count)
        for ($i = 0; $i -lt $displayCount; $i++) {
            $event = $result.Analysis.RecentEvents[$i]
            $typeColor = if ($event.EntryType -eq "Error") { "Red" } else { "Yellow" }
            Write-Host "`n[$($event.Time)] $($event.EntryType) - $($event.Source)" -ForegroundColor $typeColor
            Write-Host "  Event ID: $($event.EventID)"
            Write-Host "  Message: $($event.Message)..."
        }
    }
    
    return $result
}

# Run the tool
Show-LogAnalyzerMenu
