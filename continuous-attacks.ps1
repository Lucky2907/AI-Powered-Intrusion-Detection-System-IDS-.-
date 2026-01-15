# Continuous Attack Simulator
# Press Ctrl+C to stop

Write-Host "Starting continuous attack simulation..." -ForegroundColor Red
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Login once
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
Write-Host "Authenticated" -ForegroundColor Green
Write-Host ""

$attackTypes = @(
    @{name="DDoS"; confidence=0.59; port=80; size=1500}
    @{name="PortScan"; confidence=0.82; port=22; size=60}
    @{name="Brute Force"; confidence=0.77; port=22; size=500}
    @{name="Bot"; confidence=0.68; port=443; size=800}
)

$counter = 1

while ($true) {
    try {
        # Random attack type
        $attack = $attackTypes | Get-Random
        
        # Random IPs
        $srcIP = "192.168.1.$((Get-Random -Min 100 -Max 250))"
        $dstIP = "192.168.1.$((Get-Random -Min 1 -Max 50))"
        $srcPort = Get-Random -Min 30000 -Max 65000
        
        # Add attack
        $body = @{
            src_ip = $srcIP
            dst_ip = $dstIP
            src_port = $srcPort
            dst_port = $attack.port
            protocol = "TCP"
            packet_size = $attack.size
            is_attack = $true
            predicted_class = $attack.name
            confidence = $attack.confidence
            state = "ACTIVE"
        } | ConvertTo-Json
        
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST -Headers @{Authorization="Bearer $($login.token)"} -ContentType "application/json" -Body $body
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] Attack #$counter : " -NoNewline -ForegroundColor Cyan
        Write-Host "$($attack.name) " -NoNewline -ForegroundColor Red
        Write-Host "from $srcIP -> $dstIP " -NoNewline
        Write-Host "(Alert: $($result.alertCreated))" -ForegroundColor $(if($result.alertCreated){"Yellow"}else{"Gray"})
        
        $counter++
        
        # Wait 2-5 seconds between attacks
        Start-Sleep -Seconds (Get-Random -Min 2 -Max 5)
        
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host "Retrying in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Re-authenticate
        try {
            $login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
            Write-Host "Re-authenticated" -ForegroundColor Green
        } catch {
            Write-Host "Failed to re-authenticate. Check if backend is running." -ForegroundColor Red
            break
        }
    }
}
