# System Inventory Collection Tool
# Collect comprehensive system inventory information

function Get-SystemInventory {
    $inventory = @{
        Timestamp = Get-Date
        ComputerName = $env:COMPUTERNAME
        OS = @{}
        Hardware = @{}
        Network = @{}
        Software = @{}
    }
    
    Write-Host "`nCollecting system inventory..." -ForegroundColor Yellow
    
    # OS Information
    Write-Host "  Gathering OS information..." -ForegroundColor Gray
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $inventory.OS = @{
        Name = $os.Caption
        Version = $os.Version
        BuildNumber = $os.BuildNumber
        Architecture = $os.OSArchitecture
        InstallDate = $os.InstallDate
        LastBootTime = $os.LastBootUpTime
        TotalMemoryGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    }
    
    # Hardware Information
    Write-Host "  Gathering hardware information..." -ForegroundColor Gray
    $computer = Get-CimInstance -ClassName Win32_ComputerSystem
    $processor = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
    $bios = Get-CimInstance -ClassName Win32_BIOS
    
    $inventory.Hardware = @{
        Manufacturer = $computer.Manufacturer
        Model = $computer.Model
        SystemType = $computer.SystemType
        Processor = $processor.Name
        ProcessorCores = $processor.NumberOfCores
        ProcessorThreads = $processor.NumberOfLogicalProcessors
        BIOSVersion = $bios.SMBIOSBIOSVersion
        SerialNumber = $bios.SerialNumber
    }
    
    # Disk Information
    $disks = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3"
    $inventory.Hardware.Disks = @()
    foreach ($disk in $disks) {
        $inventory.Hardware.Disks += @{
            Drive = $disk.DeviceID
            TotalGB = [math]::Round($disk.Size / 1GB, 2)
            FreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
        }
    }
    
    # Network Information
    Write-Host "  Gathering network information..." -ForegroundColor Gray
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    $inventory.Network.Adapters = @()
    foreach ($adapter in $adapters) {
        $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
        $inventory.Network.Adapters += @{
            Name = $adapter.Name
            Description = $adapter.InterfaceDescription
            MacAddress = $adapter.MacAddress
            LinkSpeed = $adapter.LinkSpeed
            IPAddress = $ipConfig.IPAddress
        }
    }
    
    # Installed Software
    Write-Host "  Gathering installed software (top 20)..." -ForegroundColor Gray
    $software = Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" |
        Where-Object { $_.DisplayName } |
        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate -First 20
    
    $inventory.Software.Applications = @()
    foreach ($app in $software) {
        $inventory.Software.Applications += @{
            Name = $app.DisplayName
            Version = $app.DisplayVersion
            Publisher = $app.Publisher
            InstallDate = $app.InstallDate
        }
    }
    
    return $inventory
}

function Show-InventoryCollectionMenu {
    Write-Host "`n================ System Inventory Collection Tool ================" -ForegroundColor Cyan
    Write-Host "Collect comprehensive system information" -ForegroundColor Gray
    Write-Host "==================================================================" -ForegroundColor Cyan
    
    $inventory = Get-SystemInventory
    
    Write-Host "`n--- System Inventory Report ---" -ForegroundColor Green
    Write-Host "`nOperating System:" -ForegroundColor Cyan
    Write-Host "  $($inventory.OS.Name)"
    Write-Host "  Version: $($inventory.OS.Version) Build $($inventory.OS.BuildNumber)"
    Write-Host "  Memory: $($inventory.OS.TotalMemoryGB) GB"
    
    Write-Host "`nHardware:" -ForegroundColor Cyan
    Write-Host "  $($inventory.Hardware.Manufacturer) $($inventory.Hardware.Model)"
    Write-Host "  Processor: $($inventory.Hardware.Processor)"
    Write-Host "  Cores: $($inventory.Hardware.ProcessorCores) ($($inventory.Hardware.ProcessorThreads) threads)"
    
    Write-Host "`nNetwork Adapters:" -ForegroundColor Cyan
    foreach ($adapter in $inventory.Network.Adapters) {
        Write-Host "  $($adapter.Name) - $($adapter.IPAddress)"
    }
    
    Write-Host "`nDisk Drives:" -ForegroundColor Cyan
    foreach ($disk in $inventory.Hardware.Disks) {
        Write-Host "  $($disk.Drive) - Total: $($disk.TotalGB) GB, Free: $($disk.FreeGB) GB"
    }
    
    return $inventory
}

# Run the tool
Show-InventoryCollectionMenu
