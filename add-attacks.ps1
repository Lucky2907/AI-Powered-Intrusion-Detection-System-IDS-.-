# Add Multiple Attacks to Dashboard
Write-Host "Adding attacks to dashboard..." -ForegroundColor Yellow

# Login
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
Write-Host "Logged in" -ForegroundColor Green

# Add DDoS Attack
$r1 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST -Headers @{Authorization="Bearer $($login.token)"} -ContentType "application/json" -Body '{"src_ip":"192.168.1.100","dst_ip":"192.168.1.1","src_port":54321,"dst_port":80,"protocol":"TCP","packet_size":1500,"is_attack":true,"predicted_class":"DDoS","confidence":0.59,"state":"ACTIVE"}'
Write-Host "1. DDoS attack added" -ForegroundColor Red

# Add Port Scan
$r2 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST -Headers @{Authorization="Bearer $($login.token)"} -ContentType "application/json" -Body '{"src_ip":"192.168.1.150","dst_ip":"192.168.1.10","src_port":45678,"dst_port":22,"protocol":"TCP","packet_size":60,"is_attack":true,"predicted_class":"PortScan","confidence":0.82,"state":"ACTIVE"}'
Write-Host "2. Port Scan added" -ForegroundColor Red

# Add Brute Force
$r3 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST -Headers @{Authorization="Bearer $($login.token)"} -ContentType "application/json" -Body '{"src_ip":"192.168.1.200","dst_ip":"192.168.1.5","src_port":34567,"dst_port":22,"protocol":"TCP","packet_size":500,"is_attack":true,"predicted_class":"Brute Force","confidence":0.77,"state":"ACTIVE"}'
Write-Host "3. Brute Force added" -ForegroundColor Red

# Add Normal Traffic
$r4 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST -Headers @{Authorization="Bearer $($login.token)"} -ContentType "application/json" -Body '{"src_ip":"192.168.1.50","dst_ip":"8.8.8.8","src_port":12345,"dst_port":443,"protocol":"TCP","packet_size":1200,"is_attack":false,"predicted_class":"BENIGN","confidence":0.94,"state":"COMPLETED"}'
Write-Host "4. Normal traffic added" -ForegroundColor Green

Write-Host "`nDone! Refresh your dashboard now!" -ForegroundColor Yellow
Write-Host "Total traffic: 4 entries (3 attacks, 1 normal)" -ForegroundColor Cyan
