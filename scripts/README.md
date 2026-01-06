# IT Admin Console Panel - PowerShell Tool Suite

A comprehensive collection of PowerShell tools for IT system administration, network management, monitoring, and security.

## Overview

This admin panel provides a centralized interface for managing and monitoring Windows systems with organized categories of tools.

## Getting Started

### Running the Admin Panel

```powershell
cd scripts
.\AdminPanel.ps1
```

## Tool Categories

### 1. Network Tools (6 tools)
- **DNS Tester** - Test DNS resolution and query records
- **Ping Tool** - Advanced ping with statistics
- **Port Scanner** - Scan TCP ports on target systems
- **Traceroute** - Trace network path to destination
- **Bandwidth Monitor** - Monitor network adapter bandwidth
- **IP Configuration** - Display network adapter details

### 2. Monitoring Tools (6 tools)
- **System Health Check** - Comprehensive system health assessment
- **Service Monitor** - Monitor and manage Windows services
- **Log Analyzer** - Analyze Windows Event Logs
- **Process Monitor** - Monitor system processes and resources
- **Disk Monitor** - Monitor disk space and health
- **Inventory Collection** - Collect system inventory information

### 3. Automation Tools (5 tools)
- **AD User Management** - Manage Active Directory users
- **Password Reset** - Reset user passwords
- **Backup and Restore** - Automate file backups
- **Remote Desktop Manager** - Manage RDP connections
- **File System Cleaner** - Clean temp files and free space

### 4. Security Tools (1 tool)
- **Security Audit** - Perform security audits

## Features

- ✅ Categorized menu system
- ✅ 18 fully functional tools
- ✅ Color-coded interface
- ✅ Structured data return
- ✅ Comprehensive error handling
- ✅ Individual tool files
- ✅ Modular and extensible

## Requirements

- Windows 10/11 or Windows Server 2016+
- PowerShell 5.1 or later
- Administrator privileges (for some tools)

## Tool Structure

Each tool returns structured data:
```powershell
$results = @{
    Timestamp = Get-Date
    ComputerName = $env:COMPUTERNAME
    # Tool-specific data
    Success = $true/$false
}
```

## Version 1.0

Initial release with 18 tools across 4 categories.

---

*Portfolio Project - January 2026*
