# Quick Start Guide - IT Admin Console Panel

## Launch the Admin Panel

```powershell
# Navigate to scripts folder
cd C:\Development\2026\portafolio\scripts

# Run the admin panel
.\AdminPanel.ps1
```

## Menu Navigation

### Main Menu
```
[1] Network Tools
[2] Monitoring Tools
[3] Automation Tools
[4] Security Tools
[0] Exit
```

### Example: Using Network Tools

1. Launch AdminPanel.ps1
2. Press `1` for Network Tools
3. Choose from:
   - `1` DNS Tester
   - `2` Ping Tool
   - `3` Port Scanner
   - `4` Traceroute
   - `5` Bandwidth Monitor
   - `6` IP Configuration
   - `0` Back to Main Menu

## Quick Tool Examples

### DNS Tester
```powershell
# Direct execution
.\network\dns-tester.ps1

# Enter when prompted:
Domain: google.com
DNS Server: 8.8.8.8 (or press Enter for default)
```

### Port Scanner
```powershell
.\network\port-scanner.ps1

# Options:
# 1. Common ports (fast)
# 2. Well-known ports 1-1023 (slow)
# 3. Custom range
```

### System Health Check
```powershell
.\monitoring\health-check.ps1

# Automatically checks:
# - CPU usage
# - Memory usage
# - Disk space
# - Critical services
# - Recent errors
```

### Password Reset
```powershell
.\automation\password-reset.ps1

# Options:
# 1. Reset local user password
# 2. Reset AD password (simulation)
# 3. Generate strong password
# 4. List local users
```

### Security Audit
```powershell
.\security\security-audit.ps1

# Checks:
# - Windows Update
# - Firewall status
# - Antivirus status
# - User accounts
# - UAC status
# Provides security score
```

## All Available Tools

### Network (6 tools)
| Tool | File | Purpose |
|------|------|---------|
| DNS Tester | dns-tester.ps1 | Test DNS resolution |
| Ping Tool | ping-tool.ps1 | Network connectivity testing |
| Port Scanner | port-scanner.ps1 | Scan TCP ports |
| Traceroute | traceroute.ps1 | Trace network path |
| Bandwidth Monitor | bandwidth-monitor.ps1 | Monitor bandwidth usage |
| IP Configuration | ip-config.ps1 | Display IP settings |

### Monitoring (6 tools)
| Tool | File | Purpose |
|------|------|---------|
| Health Check | health-check.ps1 | System health status |
| Service Monitor | service-monitor.ps1 | Monitor Windows services |
| Log Analyzer | log-analyzer.ps1 | Analyze event logs |
| Process Monitor | process-monitor.ps1 | Monitor processes |
| Disk Monitor | disk-monitor.ps1 | Monitor disk space |
| Inventory Collection | inventory-collection.ps1 | System inventory |

### Automation (5 tools)
| Tool | File | Purpose |
|------|------|---------|
| AD User Management | ad-user-management.ps1 | Manage AD users |
| Password Reset | password-reset.ps1 | Reset passwords |
| Backup & Restore | backup-restore.ps1 | Backup files |
| Remote Desktop | remote-desktop.ps1 | Manage RDP |
| File Cleaner | file-cleaner.ps1 | Clean temp files |

### Security (1 tool)
| Tool | File | Purpose |
|------|------|---------|
| Security Audit | security-audit.ps1 | Security assessment |

## Tips

### Running as Administrator
Many tools work better with elevated privileges:

```powershell
# Right-click PowerShell
# Select "Run as Administrator"
cd C:\Development\2026\portafolio\scripts
.\AdminPanel.ps1
```

### Execution Policy
If you get execution policy errors:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Individual Tool Execution
You can run any tool directly without the admin panel:

```powershell
# Network tools
.\network\ping-tool.ps1

# Monitoring tools
.\monitoring\health-check.ps1

# Automation tools
.\automation\backup-restore.ps1
```

### Data Return
All tools return data that can be captured:

```powershell
# Capture output
$result = & .\monitoring\health-check.ps1

# Access properties
$result.ComputerName
$result.Timestamp
$result.CPU.AverageLoad
```

## Common Tasks

### Check System Health
```powershell
AdminPanel > 2 (Monitoring) > 1 (Health Check)
```

### Test Network Connectivity
```powershell
AdminPanel > 1 (Network) > 2 (Ping Tool)
```

### Scan Ports
```powershell
AdminPanel > 1 (Network) > 3 (Port Scanner)
```

### View Services
```powershell
AdminPanel > 2 (Monitoring) > 2 (Service Monitor)
```

### Backup Files
```powershell
AdminPanel > 3 (Automation) > 3 (Backup & Restore)
```

### Security Check
```powershell
AdminPanel > 4 (Security) > 1 (Security Audit)
```

## Troubleshooting

### Tool Not Found
Ensure you're in the scripts directory:
```powershell
cd C:\Development\2026\portafolio\scripts
```

### Access Denied
Run PowerShell as Administrator

### Script Won't Run
Check execution policy:
```powershell
Get-ExecutionPolicy
Set-ExecutionPolicy RemoteSigned
```

## Features

✅ All tools return structured data
✅ All tools have error handling
✅ All tools include help/instructions
✅ Color-coded output
✅ Interactive menus
✅ Standalone or integrated use

---

**Ready to use!** Launch AdminPanel.ps1 to get started.
