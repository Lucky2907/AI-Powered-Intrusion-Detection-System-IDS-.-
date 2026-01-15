# Quick Attack Simulation
Write-Host "Simulating Attacks..." -ForegroundColor Red

# Login
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST `
    -ContentType "application/json" `
    -Body '{"username":"admin","password":"admin123"}'

$token = $login.token
Write-Host "Logged in. Token: $($token.Substring(0,20))..."

# Attack 1: DDoS
Write-Host "`nAttack 1: DDoS" -ForegroundColor Red
$ddos = Invoke-RestMethod -Uri "http://localhost:5000/api/predict" -Method POST `
    -ContentType "application/json" `
    -Body '{"flow_duration":100.2,"flow_bytes_s":50000,"flow_packets_s":500,"total_fwd_packets":100,"total_bwd_packets":5,"fwd_packet_length_max":1500,"fwd_packet_length_mean":800,"fwd_packet_length_std":300,"bwd_packet_length_max":500,"bwd_packet_length_mean":200,"bwd_packet_length_std":50,"fwd_psh_flags":0,"fwd_urg_flags":0,"bwd_psh_flags":0,"bwd_urg_flags":0,"fin_flag_count":0,"syn_flag_count":5,"rst_flag_count":2,"psh_flag_count":0,"ack_flag_count":20,"urg_flag_count":0,"fwd_iat_total":50,"fwd_iat_mean":2,"fwd_iat_std":5,"fwd_iat_max":20,"fwd_iat_min":0.5,"bwd_iat_total":100,"bwd_iat_mean":10,"bwd_iat_std":20,"bwd_iat_max":50,"bwd_iat_min":2}'

Write-Host "ML says: $($ddos.predicted_class) ($([math]::Round($ddos.confidence*100,2))%)"

$log1 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST `
    -Headers @{"Authorization"="Bearer $token"} `
    -ContentType "application/json" `
    -Body "{`"src_ip`":`"192.168.1.100`",`"dst_ip`":`"192.168.1.1`",`"src_port`":54321,`"dst_port`":80,`"protocol`":`"TCP`",`"packet_size`":1500,`"is_attack`":$($ddos.is_attack.ToString().ToLower()),`"predicted_class`":`"$($ddos.predicted_class)`",`"confidence`":$($ddos.confidence),`"state`":`"ACTIVE`"}"

Write-Host "Logged! Alert created: $($log1.alertCreated)"

# Attack 2: Port Scan
Write-Host "`nAttack 2: Port Scan" -ForegroundColor Red
$portscan = Invoke-RestMethod -Uri "http://localhost:5000/api/predict" -Method POST `
    -ContentType "application/json" `
    -Body '{"flow_duration":500.0,"flow_bytes_s":2000,"flow_packets_s":80,"total_fwd_packets":50,"total_bwd_packets":2,"fwd_packet_length_max":60,"fwd_packet_length_mean":40,"fwd_packet_length_std":10,"bwd_packet_length_max":40,"bwd_packet_length_mean":30,"bwd_packet_length_std":5,"fwd_psh_flags":0,"fwd_urg_flags":0,"bwd_psh_flags":0,"bwd_urg_flags":0,"fin_flag_count":0,"syn_flag_count":40,"rst_flag_count":5,"psh_flag_count":0,"ack_flag_count":10,"urg_flag_count":0,"fwd_iat_total":200,"fwd_iat_mean":10,"fwd_iat_std":20,"fwd_iat_max":100,"fwd_iat_min":2,"bwd_iat_total":300,"bwd_iat_mean":50,"bwd_iat_std":100,"bwd_iat_max":200,"bwd_iat_min":10}'

Write-Host "ML says: $($portscan.predicted_class) ($([math]::Round($portscan.confidence*100,2))%)"

$log2 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST `
    -Headers @{"Authorization"="Bearer $token"} `
    -ContentType "application/json" `
    -Body "{`"src_ip`":`"192.168.1.150`",`"dst_ip`":`"192.168.1.10`",`"src_port`":45678,`"dst_port`":22,`"protocol`":`"TCP`",`"packet_size`":60,`"is_attack`":$($portscan.is_attack.ToString().ToLower()),`"predicted_class`":`"$($portscan.predicted_class)`",`"confidence`":$($portscan.confidence),`"state`":`"ACTIVE`"}"

Write-Host "Logged! Alert created: $($log2.alertCreated)"

# Attack 3: Brute Force
Write-Host "`nAttack 3: Brute Force" -ForegroundColor Red
$brute = Invoke-RestMethod -Uri "http://localhost:5000/api/predict" -Method POST `
    -ContentType "application/json" `
    -Body '{"flow_duration":5000.0,"flow_bytes_s":1000,"flow_packets_s":20,"total_fwd_packets":100,"total_bwd_packets":100,"fwd_packet_length_max":500,"fwd_packet_length_mean":200,"fwd_packet_length_std":50,"bwd_packet_length_max":300,"bwd_packet_length_mean":150,"bwd_packet_length_std":30,"fwd_psh_flags":50,"fwd_urg_flags":0,"bwd_psh_flags":50,"bwd_urg_flags":0,"fin_flag_count":10,"syn_flag_count":10,"rst_flag_count":5,"psh_flag_count":100,"ack_flag_count":200,"urg_flag_count":0,"fwd_iat_total":2000,"fwd_iat_mean":50,"fwd_iat_std":20,"fwd_iat_max":200,"fwd_iat_min":10,"bwd_iat_total":2000,"bwd_iat_mean":50,"bwd_iat_std":20,"bwd_iat_max":200,"bwd_iat_min":10}'

Write-Host "ML says: $($brute.predicted_class) ($([math]::Round($brute.confidence*100,2))%)"

$log3 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST `
    -Headers @{"Authorization"="Bearer $token"} `
    -ContentType "application/json" `
    -Body "{`"src_ip`":`"192.168.1.200`",`"dst_ip`":`"192.168.1.5`",`"src_port`":34567,`"dst_port`":22,`"protocol`":`"TCP`",`"packet_size`":500,`"is_attack`":$($brute.is_attack.ToString().ToLower()),`"predicted_class`":`"$($brute.predicted_class)`",`"confidence`":$($brute.confidence),`"state`":`"ACTIVE`"}"

Write-Host "Logged! Alert created: $($log3.alertCreated)"

# Normal Traffic
Write-Host "`nNormal Traffic" -ForegroundColor Green
$normal = Invoke-RestMethod -Uri "http://localhost:5000/api/predict" -Method POST `
    -ContentType "application/json" `
    -Body '{"flow_duration":1000.5,"flow_bytes_s":5000,"flow_packets_s":50,"total_fwd_packets":10,"total_bwd_packets":8,"fwd_packet_length_max":1200,"fwd_packet_length_mean":600,"fwd_packet_length_std":200,"bwd_packet_length_max":1000,"bwd_packet_length_mean":500,"bwd_packet_length_std":150,"fwd_psh_flags":2,"fwd_urg_flags":0,"bwd_psh_flags":2,"bwd_urg_flags":0,"fin_flag_count":1,"syn_flag_count":1,"rst_flag_count":0,"psh_flag_count":4,"ack_flag_count":50,"urg_flag_count":0,"fwd_iat_total":500,"fwd_iat_mean":25,"fwd_iat_std":50,"fwd_iat_max":200,"fwd_iat_min":5,"bwd_iat_total":400,"bwd_iat_mean":20,"bwd_iat_std":40,"bwd_iat_max":150,"bwd_iat_min":5}'

Write-Host "ML says: $($normal.predicted_class) ($([math]::Round($normal.confidence*100,2))%)"

$log4 = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/log" -Method POST `
    -Headers @{"Authorization"="Bearer $token"} `
    -ContentType "application/json" `
    -Body "{`"src_ip`":`"192.168.1.50`",`"dst_ip`":`"8.8.8.8`",`"src_port`":12345,`"dst_port`":443,`"protocol`":`"TCP`",`"packet_size`":1200,`"is_attack`":$($normal.is_attack.ToString().ToLower()),`"predicted_class`":`"$($normal.predicted_class)`",`"confidence`":$($normal.confidence),`"state`":`"COMPLETED`"}"

Write-Host "Logged! Alert created: $($log4.alertCreated)"

Write-Host "`nDone! Check dashboard: http://localhost:5173" -ForegroundColor Yellow
