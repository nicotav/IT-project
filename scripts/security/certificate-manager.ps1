# Certificate Manager Tool
# Manage and audit SSL/TLS certificates

function Show-CertificateManagerMenu {
    Write-Host "`n================ Certificate Manager Tool ================" -ForegroundColor Cyan
    Write-Host "Manage and audit SSL/TLS certificates" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
    
    Write-Host "`nOptions:"
    Write-Host "1. List installed certificates"
    Write-Host "2. Check certificate expiration"
    Write-Host "3. Test SSL/TLS connection"
    Write-Host "4. View certificate details"
    Write-Host "5. Find expired/expiring certificates"
    Write-Host "6. Archive certificate"
    
    $choice = Read-Host "`nSelect option (1-6)"
    
    switch ($choice) {
        "1" {
            Write-Host "`nSelect certificate store:" -ForegroundColor Cyan
            Write-Host "1. Personal (My)"
            Write-Host "2. Trusted Root"
            Write-Host "3. Intermediate"
            Write-Host "4. All stores"
            
            $storeChoice = Read-Host "`nSelect (1-4)"
            
            $storeName = switch ($storeChoice) {
                "1" { "My" }
                "2" { "Root" }
                "3" { "CA" }
                default { $null }
            }
            
            Write-Host "`nFetching certificates..." -ForegroundColor Yellow
            
            try {
                if ($storeName) {
                    $certs = Get-ChildItem -Path "Cert:\CurrentUser\$storeName"
                    Write-Host "`n--- Certificates in $storeName Store ---" -ForegroundColor Green
                } else {
                    Write-Host "`n--- All User Certificates ---" -ForegroundColor Green
                    $certs = Get-ChildItem -Path "Cert:\CurrentUser" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
                }
                
                foreach ($cert in $certs | Select-Object -First 20) {
                    $daysUntilExpiry = ($cert.NotAfter - (Get-Date)).Days
                    $expiryColor = if ($daysUntilExpiry -lt 30) { "Red" } elseif ($daysUntilExpiry -lt 90) { "Yellow" } else { "Green" }
                    
                    Write-Host "`n$($cert.Subject)" -ForegroundColor Cyan
                    Write-Host "  Thumbprint: $($cert.Thumbprint)"
                    Write-Host "  Issued By: $($cert.Issuer)" -ForegroundColor Gray
                    Write-Host "  Valid From: $($cert.NotBefore)"
                    Write-Host "  Valid Until: $($cert.NotAfter)" -ForegroundColor $expiryColor
                    Write-Host "  Days Until Expiry: $daysUntilExpiry" -ForegroundColor $expiryColor
                }
                
                Write-Host "`nTotal Certificates: $($certs.Count)" -ForegroundColor Gray
                if ($certs.Count -gt 20) {
                    Write-Host "(Showing first 20 only)" -ForegroundColor Gray
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "2" {
            $days = Read-Host "`nCheck certificates expiring within how many days? (default: 30)"
            if (-not $days) { $days = 30 }
            
            Write-Host "`nScanning for certificates expiring within $days days..." -ForegroundColor Yellow
            
            try {
                $cutoffDate = (Get-Date).AddDays($days)
                $allCerts = Get-ChildItem -Path "Cert:\CurrentUser" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
                $expiringCerts = $allCerts | Where-Object { $_.NotAfter -le $cutoffDate -and $_.NotAfter -gt (Get-Date) }
                
                if ($expiringCerts) {
                    Write-Host "`n--- Expiring Certificates ---" -ForegroundColor Red
                    foreach ($cert in $expiringCerts) {
                        $daysLeft = ($cert.NotAfter - (Get-Date)).Days
                        Write-Host "`n$($cert.Subject)" -ForegroundColor Yellow
                        Write-Host "  Expires: $($cert.NotAfter)"
                        Write-Host "  Days Left: $daysLeft" -ForegroundColor Red
                        Write-Host "  Thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
                    }
                    
                    Write-Host "`nTotal Expiring Certificates: $($expiringCerts.Count)" -ForegroundColor Gray
                } else {
                    Write-Host "`nNo certificates expiring within $days days!" -ForegroundColor Green
                }
                
                # Check for expired certificates
                $expiredCerts = $allCerts | Where-Object { $_.NotAfter -lt (Get-Date) }
                if ($expiredCerts) {
                    Write-Host "`n--- Expired Certificates ---" -ForegroundColor Red
                    Write-Host "Found $($expiredCerts.Count) expired certificate(s)" -ForegroundColor Yellow
                    Write-Host "RECOMMENDATION: Remove expired certificates" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "3" {
            $hostname = Read-Host "`nEnter hostname to test (e.g., google.com)"
            $port = Read-Host "Enter port (default: 443)"
            if (-not $port) { $port = 443 }
            
            Write-Host "`nTesting SSL/TLS connection to ${hostname}:${port}..." -ForegroundColor Yellow
            
            try {
                # Test TCP connection first
                $connection = Test-NetConnection -ComputerName $hostname -Port $port
                
                if ($connection.TcpTestSucceeded) {
                    Write-Host "  ✓ TCP connection successful" -ForegroundColor Green
                    
                    # Try to get certificate information
                    try {
                        $tcpClient = New-Object System.Net.Sockets.TcpClient($hostname, $port)
                        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream(), $false, 
                            { param($sender, $certificate, $chain, $errors) return $true })
                        $sslStream.AuthenticateAsClient($hostname)
                        
                        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($sslStream.RemoteCertificate)
                        
                        Write-Host "`n--- Certificate Details ---" -ForegroundColor Green
                        Write-Host "Subject: $($cert.Subject)" -ForegroundColor Cyan
                        Write-Host "Issuer: $($cert.Issuer)"
                        Write-Host "Valid From: $($cert.NotBefore)"
                        Write-Host "Valid Until: $($cert.NotAfter)"
                        
                        $daysUntilExpiry = ($cert.NotAfter - (Get-Date)).Days
                        $expiryColor = if ($daysUntilExpiry -lt 30) { "Red" } elseif ($daysUntilExpiry -lt 90) { "Yellow" } else { "Green" }
                        Write-Host "Days Until Expiry: $daysUntilExpiry" -ForegroundColor $expiryColor
                        
                        Write-Host "`nThumprint: $($cert.Thumbprint)" -ForegroundColor Gray
                        Write-Host "Serial Number: $($cert.SerialNumber)" -ForegroundColor Gray
                        
                        $sslStream.Close()
                        $tcpClient.Close()
                        
                    } catch {
                        Write-Host "  ✗ SSL/TLS handshake failed: $($_.Exception.Message)" -ForegroundColor Red
                    }
                } else {
                    Write-Host "  ✗ TCP connection failed" -ForegroundColor Red
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "4" {
            Write-Host "`nEnter certificate thumbprint (or part of subject name):" -ForegroundColor Cyan
            $search = Read-Host
            
            Write-Host "`nSearching for certificate..." -ForegroundColor Yellow
            
            try {
                $allCerts = Get-ChildItem -Path "Cert:\CurrentUser" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
                $matchingCerts = $allCerts | Where-Object { 
                    $_.Thumbprint -like "*$search*" -or $_.Subject -like "*$search*"
                }
                
                if ($matchingCerts) {
                    foreach ($cert in $matchingCerts | Select-Object -First 5) {
                        Write-Host "`n--- Certificate Details ---" -ForegroundColor Green
                        Write-Host "Subject: $($cert.Subject)" -ForegroundColor Cyan
                        Write-Host "Issuer: $($cert.Issuer)"
                        Write-Host "Serial Number: $($cert.SerialNumber)"
                        Write-Host "Thumbprint: $($cert.Thumbprint)"
                        Write-Host "Valid From: $($cert.NotBefore)"
                        Write-Host "Valid Until: $($cert.NotAfter)"
                        Write-Host "Has Private Key: $(if ($cert.HasPrivateKey) { 'Yes' } else { 'No' })"
                        Write-Host "Key Algorithm: $($cert.PublicKey.Oid.FriendlyName)"
                        Write-Host "Signature Algorithm: $($cert.SignatureAlgorithm.FriendlyName)"
                        
                        if ($cert.EnhancedKeyUsageList) {
                            Write-Host "`nEnhanced Key Usage:"
                            foreach ($usage in $cert.EnhancedKeyUsageList) {
                                Write-Host "  • $($usage.FriendlyName)" -ForegroundColor Gray
                            }
                        }
                    }
                    
                    if ($matchingCerts.Count -gt 5) {
                        Write-Host "`n(Showing first 5 of $($matchingCerts.Count) matches)" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "`nNo matching certificates found" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "5" {
            Write-Host "`nScanning for certificate issues..." -ForegroundColor Yellow
            
            try {
                $allCerts = Get-ChildItem -Path "Cert:\CurrentUser" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
                
                # Expired certificates
                $expired = $allCerts | Where-Object { $_.NotAfter -lt (Get-Date) }
                
                # Expiring soon (30 days)
                $expiringSoon = $allCerts | Where-Object { 
                    $_.NotAfter -gt (Get-Date) -and $_.NotAfter -le (Get-Date).AddDays(30)
                }
                
                # Self-signed certificates
                $selfSigned = $allCerts | Where-Object { $_.Subject -eq $_.Issuer }
                
                Write-Host "`n--- Certificate Health Report ---" -ForegroundColor Green
                
                Write-Host "`nExpired Certificates: $($expired.Count)" -ForegroundColor $(if ($expired.Count -gt 0) { "Red" } else { "Green" })
                if ($expired.Count -gt 0) {
                    foreach ($cert in $expired | Select-Object -First 5) {
                        Write-Host "  • $($cert.Subject) (Expired: $($cert.NotAfter))" -ForegroundColor Yellow
                    }
                }
                
                Write-Host "`nExpiring Soon (30 days): $($expiringSoon.Count)" -ForegroundColor $(if ($expiringSoon.Count -gt 0) { "Yellow" } else { "Green" })
                if ($expiringSoon.Count -gt 0) {
                    foreach ($cert in $expiringSoon | Select-Object -First 5) {
                        $daysLeft = ($cert.NotAfter - (Get-Date)).Days
                        Write-Host "  • $($cert.Subject) ($daysLeft days left)" -ForegroundColor Yellow
                    }
                }
                
                Write-Host "`nSelf-Signed Certificates: $($selfSigned.Count)" -ForegroundColor Cyan
                
                Write-Host "`nTotal Certificates: $($allCerts.Count)" -ForegroundColor Gray
            } catch {
                Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "6" {
            Write-Host "`n--- Archive Certificate ---" -ForegroundColor Cyan
            Write-Host "This will export certificates and remove them from the certificate store.`n" -ForegroundColor Gray
            
            Write-Host "Archive options:"
            Write-Host "1. Archive specific certificate"
            Write-Host "2. Archive ALL expired certificates"
            
            $archiveChoice = Read-Host "`nSelect option (1-2)"
            
            if ($archiveChoice -eq "2") {
                # Archive all expired certificates
                Write-Host "`nScanning for expired certificates..." -ForegroundColor Yellow
                
                try {
                    $allCerts = Get-ChildItem -Path "Cert:\CurrentUser" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
                    $expiredCerts = $allCerts | Where-Object { $_.NotAfter -lt (Get-Date) }
                    
                    if ($expiredCerts.Count -eq 0) {
                        Write-Host "`nNo expired certificates found!" -ForegroundColor Green
                    } else {
                        Write-Host "`nFound $($expiredCerts.Count) expired certificate(s):" -ForegroundColor Yellow
                        foreach ($cert in $expiredCerts) {
                            Write-Host "  • $($cert.Subject)" -ForegroundColor Gray
                            Write-Host "    Expired: $($cert.NotAfter)" -ForegroundColor Red
                        }
                        
                        $confirm = Read-Host "`nArchive all $($expiredCerts.Count) expired certificate(s)? (Y/N)"
                        
                        if ($confirm -eq "Y" -or $confirm -eq "y") {
                            # Create archive directory
                            $archivePath = Join-Path $env:USERPROFILE "Documents\ArchivedCertificates"
                            if (-not (Test-Path $archivePath)) {
                                New-Item -Path $archivePath -ItemType Directory -Force | Out-Null
                                Write-Host "`nCreated archive directory: $archivePath" -ForegroundColor Gray
                            }
                            
                            $successCount = 0
                            $failCount = 0
                            
                            foreach ($cert in $expiredCerts) {
                                try {
                                    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss_fff"
                                    $subjectName = ($cert.Subject -replace '[^a-zA-Z0-9]', '_') -replace '_+', '_'
                                    $subjectName = $subjectName.Substring(0, [Math]::Min(50, $subjectName.Length))
                                    
                                    # Export certificate
                                    $cerFile = Join-Path $archivePath "${subjectName}_${timestamp}.cer"
                                    $cert | Export-Certificate -FilePath $cerFile -Force | Out-Null
                                    
                                    # Export private key if available
                                    if ($cert.HasPrivateKey) {
                                        try {
                                            $pfxFile = Join-Path $archivePath "${subjectName}_${timestamp}.pfx"
                                            $password = ConvertTo-SecureString -String "archived" -AsPlainText -Force
                                            $cert | Export-PfxCertificate -FilePath $pfxFile -Password $password -Force | Out-Null
                                        } catch {
                                            # Continue even if private key export fails
                                        }
                                    }
                                    
                                    # Create metadata
                                    $metadataFile = Join-Path $archivePath "${subjectName}_${timestamp}.txt"
                                    $metadata = @"
Certificate Archive Information
================================
Archive Date: $(Get-Date)
Reason: Expired Certificate
Subject: $($cert.Subject)
Issuer: $($cert.Issuer)
Thumbprint: $($cert.Thumbprint)
Serial Number: $($cert.SerialNumber)
Valid From: $($cert.NotBefore)
Valid Until: $($cert.NotAfter)
Has Private Key: $(if ($cert.HasPrivateKey) { 'Yes' } else { 'No' })
Original Store: $($cert.PSPath -replace '.*\\CurrentUser\\', '')

Enhanced Key Usage:
$(if ($cert.EnhancedKeyUsageList) { ($cert.EnhancedKeyUsageList | ForEach-Object { "- $($_.FriendlyName)" }) -join "`n" } else { 'None' })
"@
                                    $metadata | Out-File -FilePath $metadataFile -Encoding UTF8
                                    
                                    # Remove from store
                                    Remove-Item -Path $cert.PSPath -Force -ErrorAction Stop
                                    
                                    Write-Host "✓ Archived: $($cert.Subject)" -ForegroundColor Green
                                    $successCount++
                                    
                                } catch {
                                    Write-Host "✗ Failed: $($cert.Subject) - $($_.Exception.Message)" -ForegroundColor Red
                                    $failCount++
                                }
                            }
                            
                            Write-Host "`n--- Archive Summary ---" -ForegroundColor Cyan
                            Write-Host "Successfully archived: $successCount" -ForegroundColor Green
                            Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
                            Write-Host "Archive location: $archivePath" -ForegroundColor Gray
                        } else {
                            Write-Host "`nArchive cancelled." -ForegroundColor Yellow
                        }
                    }
                } catch {
                    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                }
                
            } else {
                # Archive specific certificate
                Write-Host "`nSearch by:"
                Write-Host "1. Thumbprint"
                Write-Host "2. Subject name"
                
                $searchType = Read-Host "`nSelect search type (1-2)"
                $search = Read-Host "Enter search term"
            
                Write-Host "`nSearching for certificate..." -ForegroundColor Yellow
                
                try {
                    $allCerts = Get-ChildItem -Path "Cert:\CurrentUser" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
                    
                    if ($searchType -eq "1") {
                        $matchingCerts = $allCerts | Where-Object { $_.Thumbprint -like "*$search*" }
                    } else {
                        $matchingCerts = $allCerts | Where-Object { $_.Subject -like "*$search*" }
                    }
                
                if ($matchingCerts.Count -eq 0) {
                    Write-Host "`nNo matching certificates found." -ForegroundColor Yellow
                } elseif ($matchingCerts.Count -gt 1) {
                    Write-Host "`nMultiple certificates found. Please be more specific:" -ForegroundColor Yellow
                    foreach ($cert in $matchingCerts | Select-Object -First 5) {
                        Write-Host "`n$($cert.Subject)" -ForegroundColor Cyan
                        Write-Host "  Thumbprint: $($cert.Thumbprint)"
                        Write-Host "  Expires: $($cert.NotAfter)"
                        Write-Host "  Store: $($cert.PSPath -replace '.*\\CurrentUser\\', '')" -ForegroundColor Gray
                    }
                } else {
                    $cert = $matchingCerts[0]
                    
                    Write-Host "`n--- Certificate to Archive ---" -ForegroundColor Yellow
                    Write-Host "Subject: $($cert.Subject)" -ForegroundColor Cyan
                    Write-Host "Issuer: $($cert.Issuer)"
                    Write-Host "Thumbprint: $($cert.Thumbprint)"
                    Write-Host "Expires: $($cert.NotAfter)"
                    Write-Host "Store: $($cert.PSPath -replace '.*\\CurrentUser\\', '')" -ForegroundColor Gray
                    
                    $confirm = Read-Host "`nArchive this certificate? (Y/N)"
                    
                    if ($confirm -eq "Y" -or $confirm -eq "y") {
                        # Create archive directory if it doesn't exist
                        $archivePath = Join-Path $env:USERPROFILE "Documents\ArchivedCertificates"
                        if (-not (Test-Path $archivePath)) {
                            New-Item -Path $archivePath -ItemType Directory -Force | Out-Null
                            Write-Host "`nCreated archive directory: $archivePath" -ForegroundColor Gray
                        }
                        
                        # Generate filename with timestamp
                        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
                        $subjectName = ($cert.Subject -replace '[^a-zA-Z0-9]', '_') -replace '_+', '_'
                        $subjectName = $subjectName.Substring(0, [Math]::Min(50, $subjectName.Length))
                        
                        # Export certificate (public key only)
                        $cerFile = Join-Path $archivePath "${subjectName}_${timestamp}.cer"
                        $cert | Export-Certificate -FilePath $cerFile -Force | Out-Null
                        Write-Host "`n✓ Certificate exported to: $cerFile" -ForegroundColor Green
                        
                        # Export private key if available
                        if ($cert.HasPrivateKey) {
                            $password = Read-Host "Enter password to protect private key (or leave blank)" -AsSecureString
                            
                            try {
                                $pfxFile = Join-Path $archivePath "${subjectName}_${timestamp}.pfx"
                                $cert | Export-PfxCertificate -FilePath $pfxFile -Password $password -Force | Out-Null
                                Write-Host "✓ Certificate with private key exported to: $pfxFile" -ForegroundColor Green
                            } catch {
                                Write-Host "⚠ Could not export private key: $($_.Exception.Message)" -ForegroundColor Yellow
                                Write-Host "  Public certificate was exported successfully." -ForegroundColor Gray
                            }
                        } else {
                            Write-Host "ℹ Certificate does not have a private key." -ForegroundColor Gray
                        }
                        
                        # Create metadata file
                        $metadataFile = Join-Path $archivePath "${subjectName}_${timestamp}.txt"
                        $metadata = @"
Certificate Archive Information
================================
Archive Date: $(Get-Date)
Subject: $($cert.Subject)
Issuer: $($cert.Issuer)
Thumbprint: $($cert.Thumbprint)
Serial Number: $($cert.SerialNumber)
Valid From: $($cert.NotBefore)
Valid Until: $($cert.NotAfter)
Has Private Key: $(if ($cert.HasPrivateKey) { 'Yes' } else { 'No' })
Original Store: $($cert.PSPath -replace '.*\\CurrentUser\\', '')

Enhanced Key Usage:
$(if ($cert.EnhancedKeyUsageList) { ($cert.EnhancedKeyUsageList | ForEach-Object { "- $($_.FriendlyName)" }) -join "`n" } else { 'None' })
"@
                        $metadata | Out-File -FilePath $metadataFile -Encoding UTF8
                        Write-Host "✓ Metadata saved to: $metadataFile" -ForegroundColor Green
                        
                        # Remove certificate from store
                        try {
                            Remove-Item -Path $cert.PSPath -Force -ErrorAction Stop
                            Write-Host "`n✓ Certificate removed from certificate store" -ForegroundColor Green
                            Write-Host "`nArchive complete! Certificate has been backed up and removed." -ForegroundColor Green
                        } catch {
                            Write-Host "`n✗ Error removing certificate: $($_.Exception.Message)" -ForegroundColor Red
                            Write-Host "Certificate was exported but could not be removed from store." -ForegroundColor Yellow
                            Write-Host "Note: This operation may require administrator privileges." -ForegroundColor Gray
                        }
                    } else {
                        Write-Host "`nArchive cancelled." -ForegroundColor Yellow
                    }
                }
                } catch {
                    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
        }
    }
}

# Run the tool
Show-CertificateManagerMenu
