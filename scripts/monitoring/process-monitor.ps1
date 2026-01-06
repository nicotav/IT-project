# Process Monitor Tool
# Monitor system processes and resource usage

function Get-ProcessMonitoring {
    param(
        [int]$TopCount = 10
    )
    
    $results = @{
        Timestamp = Get-Date
        ComputerName = $env:COMPUTERNAME
        TotalProcesses = 0
        TopCPU = @()
        TopMemory = @()
        ProcessDetails = @()
    }
    
    Write-Host "`nGathering process information..." -ForegroundColor Yellow
    
    $processes = Get-Process | Where-Object { $_.Id -ne 0 }
    $results.TotalProcesses = $processes.Count
    
    # Top CPU consumers
    $topCPU = $processes | Sort-Object CPU -Descending | Select-Object -First $TopCount
    foreach ($proc in $topCPU) {
        $results.TopCPU += @{
            Name = $proc.ProcessName
            Id = $proc.Id
            CPU = [math]::Round($proc.CPU, 2)
            MemoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
            Threads = $proc.Threads.Count
        }
    }
    
    # Top Memory consumers
    $topMemory = $processes | Sort-Object WorkingSet64 -Descending | Select-Object -First $TopCount
    foreach ($proc in $topMemory) {
        $results.TopMemory += @{
            Name = $proc.ProcessName
            Id = $proc.Id
            MemoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
            CPU = [math]::Round($proc.CPU, 2)
            Handles = $proc.HandleCount
        }
    }
    
    return $results
}

function Show-ProcessMonitorMenu {
    Write-Host "`n================ Process Monitor Tool ================" -ForegroundColor Cyan
    Write-Host "Monitor system processes and resource usage" -ForegroundColor Gray
    Write-Host "======================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. View top CPU consuming processes"
    Write-Host "2. View top memory consuming processes"
    Write-Host "3. Search for specific process"
    Write-Host "4. View all processes summary"
    
    $choice = Read-Host "`nSelect option (1-4)"
    
    $result = Get-ProcessMonitoring
    
    switch ($choice) {
        "1" {
            Write-Host "`n--- Top CPU Consuming Processes ---" -ForegroundColor Green
            Write-Host ("Process Name".PadRight(30) + "PID".PadRight(10) + "CPU(s)".PadRight(12) + "Memory(MB)".PadRight(15) + "Threads") -ForegroundColor Cyan
            Write-Host ("-" * 80) -ForegroundColor Gray
            foreach ($proc in $result.TopCPU) {
                Write-Host ($proc.Name.PadRight(30) + $proc.Id.ToString().PadRight(10) + $proc.CPU.ToString().PadRight(12) + $proc.MemoryMB.ToString().PadRight(15) + $proc.Threads.ToString()) -ForegroundColor Yellow
            }
        }
        "2" {
            Write-Host "`n--- Top Memory Consuming Processes ---" -ForegroundColor Green
            Write-Host ("Process Name".PadRight(30) + "PID".PadRight(10) + "Memory(MB)".PadRight(15) + "CPU(s)".PadRight(12) + "Handles") -ForegroundColor Cyan
            Write-Host ("-" * 80) -ForegroundColor Gray
            foreach ($proc in $result.TopMemory) {
                Write-Host ($proc.Name.PadRight(30) + $proc.Id.ToString().PadRight(10) + $proc.MemoryMB.ToString().PadRight(15) + $proc.CPU.ToString().PadRight(12) + $proc.Handles.ToString()) -ForegroundColor Yellow
            }
        }
        "3" {
            $searchTerm = Read-Host "`nEnter process name to search"
            $processes = Get-Process -Name "*$searchTerm*" -ErrorAction SilentlyContinue
            
            if ($processes) {
                Write-Host "`n--- Matching Processes ---" -ForegroundColor Green
                foreach ($proc in $processes) {
                    Write-Host "`nProcess: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Cyan
                    Write-Host "  CPU: $([math]::Round($proc.CPU, 2))s"
                    Write-Host "  Memory: $([math]::Round($proc.WorkingSet64 / 1MB, 2)) MB"
                    Write-Host "  Threads: $($proc.Threads.Count)"
                    Write-Host "  Start Time: $($proc.StartTime)"
                    try {
                        Write-Host "  Path: $($proc.Path)"
                    } catch {
                        Write-Host "  Path: Access Denied"
                    }
                }
            } else {
                Write-Host "`nNo processes found matching '$searchTerm'" -ForegroundColor Red
            }
        }
        "4" {
            Write-Host "`n--- All Processes Summary ---" -ForegroundColor Green
            Write-Host "Total Processes: $($result.TotalProcesses)"
            
            $totalMemory = (Get-Process | Measure-Object WorkingSet64 -Sum).Sum
            Write-Host "Total Memory Used: $([math]::Round($totalMemory / 1GB, 2)) GB"
            
            Write-Host "`nTop 5 CPU Consumers:" -ForegroundColor Cyan
            for ($i = 0; $i -lt [Math]::Min(5, $result.TopCPU.Count); $i++) {
                Write-Host "  $($i+1). $($result.TopCPU[$i].Name) - $($result.TopCPU[$i].CPU)s" -ForegroundColor Yellow
            }
            
            Write-Host "`nTop 5 Memory Consumers:" -ForegroundColor Cyan
            for ($i = 0; $i -lt [Math]::Min(5, $result.TopMemory.Count); $i++) {
                Write-Host "  $($i+1). $($result.TopMemory[$i].Name) - $($result.TopMemory[$i].MemoryMB) MB" -ForegroundColor Yellow
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
    
    return $result
}

# Run the tool
Show-ProcessMonitorMenu
