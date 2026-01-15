# Simulate Network Attacks for AI-IDS
# Sends traffic to both ML API and Backend

Write-Host "🎯 Simulating Network Attacks" -ForegroundColor Red
Write-Host "=" * 60

$backendUrl = "http://localhost:3000"
$mlUrl = "http://localhost:5000"

# Login to get auth token
Write-Host "`n🔐 Logging in as admin..." -ForegroundColor Cyan
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
$token = $loginResponse.token
Write-Host "✓ Authenticated successfully"

# Headers with auth token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Attack 1: DDoS Attack
Write-Host "`n💥 Attack 1: Simulating DDoS Attack" -ForegroundColor Red
$ddosTraffic = @{
    flow_duration = 100.2
    flow_bytes_s = 50000
    flow_packets_s = 500
    total_fwd_packets = 100
    total_bwd_packets = 5
    fwd_packet_length_max = 1500
    fwd_packet_length_mean = 800
    fwd_packet_length_std = 300
    bwd_packet_length_max = 500
    bwd_packet_length_mean = 200
    bwd_packet_length_std = 50
    fwd_psh_flags = 0
    fwd_urg_flags = 0
    bwd_psh_flags = 0
    bwd_urg_flags = 0
    fin_flag_count = 0
    syn_flag_count = 5
    rst_flag_count = 2
    psh_flag_count = 0
    ack_flag_count = 20
    urg_flag_count = 0
    fwd_iat_total = 50
    fwd_iat_mean = 2
    fwd_iat_std = 5
    fwd_iat_max = 20
    fwd_iat_min = 0.5
    bwd_iat_total = 100
    bwd_iat_mean = 10
    bwd_iat_std = 20
    bwd_iat_max = 50
    bwd_iat_min = 2
}

# Get ML prediction
$mlPrediction = Invoke-WebRequest -Uri "$mlUrl/api/predict" -Method POST -Body ($ddosTraffic | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json

Write-Host "ML Prediction: $($mlPrediction.predicted_class)" -ForegroundColor $(if ($mlPrediction.is_attack) { "Red" } else { "Green" })
Write-Host "Confidence: $([math]::Round($mlPrediction.confidence * 100, 2))%"

# Log traffic to backend
$trafficLog = @{
    src_ip = "192.168.1.100"
    dst_ip = "192.168.1.1"
    src_port = 54321
    dst_port = 80
    protocol = "TCP"
    packet_size = 1500
    is_attack = $mlPrediction.is_attack
    predicted_class = $mlPrediction.predicted_class
    confidence = $mlPrediction.confidence
    state = "ACTIVE"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$backendUrl/api/traffic/log" -Method POST -Body $trafficLog -Headers $headers -UseBasicParsing | Out-Null
Write-Host "✓ Logged to backend"

# Attack 2: Port Scan
Write-Host "`n🔍 Attack 2: Simulating Port Scan" -ForegroundColor Red
$portScanTraffic = @{
    flow_duration = 500.0
    flow_bytes_s = 2000
    flow_packets_s = 80
    total_fwd_packets = 50
    total_bwd_packets = 2
    fwd_packet_length_max = 60
    fwd_packet_length_mean = 40
    fwd_packet_length_std = 10
    bwd_packet_length_max = 40
    bwd_packet_length_mean = 30
    bwd_packet_length_std = 5
    fwd_psh_flags = 0
    fwd_urg_flags = 0
    bwd_psh_flags = 0
    bwd_urg_flags = 0
    fin_flag_count = 0
    syn_flag_count = 40
    rst_flag_count = 5
    psh_flag_count = 0
    ack_flag_count = 10
    urg_flag_count = 0
    fwd_iat_total = 200
    fwd_iat_mean = 10
    fwd_iat_std = 20
    fwd_iat_max = 100
    fwd_iat_min = 2
    bwd_iat_total = 300
    bwd_iat_mean = 50
    bwd_iat_std = 100
    bwd_iat_max = 200
    bwd_iat_min = 10
}

$mlPrediction2 = Invoke-WebRequest -Uri "$mlUrl/api/predict" -Method POST -Body ($portScanTraffic | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json

Write-Host "ML Prediction: $($mlPrediction2.predicted_class)" -ForegroundColor $(if ($mlPrediction2.is_attack) { "Red" } else { "Green" })
Write-Host "Confidence: $([math]::Round($mlPrediction2.confidence * 100, 2))%"

$trafficLog2 = @{
    src_ip = "192.168.1.150"
    dst_ip = "192.168.1.10"
    src_port = 45678
    dst_port = 22
    protocol = "TCP"
    packet_size = 60
    is_attack = $mlPrediction2.is_attack
    predicted_class = $mlPrediction2.predicted_class
    confidence = $mlPrediction2.confidence
    state = "ACTIVE"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$backendUrl/api/traffic/log" -Method POST -Body $trafficLog2 -Headers $headers -UseBasicParsing | Out-Null
Write-Host "✓ Logged to backend"

# Attack 3: Brute Force
Write-Host "`n🔨 Attack 3: Simulating Brute Force Attack" -ForegroundColor Red
$bruteForceTraffic = @{
    flow_duration = 5000.0
    flow_bytes_s = 1000
    flow_packets_s = 20
    total_fwd_packets = 100
    total_bwd_packets = 100
    fwd_packet_length_max = 500
    fwd_packet_length_mean = 200
    fwd_packet_length_std = 50
    bwd_packet_length_max = 300
    bwd_packet_length_mean = 150
    bwd_packet_length_std = 30
    fwd_psh_flags = 50
    fwd_urg_flags = 0
    bwd_psh_flags = 50
    bwd_urg_flags = 0
    fin_flag_count = 10
    syn_flag_count = 10
    rst_flag_count = 5
    psh_flag_count = 100
    ack_flag_count = 200
    urg_flag_count = 0
    fwd_iat_total = 2000
    fwd_iat_mean = 50
    fwd_iat_std = 20
    fwd_iat_max = 200
    fwd_iat_min = 10
    bwd_iat_total = 2000
    bwd_iat_mean = 50
    bwd_iat_std = 20
    bwd_iat_max = 200
    bwd_iat_min = 10
}

$mlPrediction3 = Invoke-WebRequest -Uri "$mlUrl/api/predict" -Method POST -Body ($bruteForceTraffic | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json

Write-Host "ML Prediction: $($mlPrediction3.predicted_class)" -ForegroundColor $(if ($mlPrediction3.is_attack) { "Red" } else { "Green" })
Write-Host "Confidence: $([math]::Round($mlPrediction3.confidence * 100, 2))%"

$trafficLog3 = @{
    src_ip = "192.168.1.200"
    dst_ip = "192.168.1.5"
    src_port = 34567
    dst_port = 22
    protocol = "TCP"
    packet_size = 500
    is_attack = $mlPrediction3.is_attack
    predicted_class = $mlPrediction3.predicted_class
    confidence = $mlPrediction3.confidence
    state = "ACTIVE"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$backendUrl/api/traffic/log" -Method POST -Body $trafficLog3 -Headers $headers -UseBasicParsing | Out-Null
Write-Host "✓ Logged to backend"

# Normal Traffic for comparison
Write-Host "`n✅ Simulating Normal Traffic" -ForegroundColor Green
$normalTraffic = @{
    flow_duration = 1000.5
    flow_bytes_s = 5000
    flow_packets_s = 50
    total_fwd_packets = 10
    total_bwd_packets = 8
    fwd_packet_length_max = 1200
    fwd_packet_length_mean = 600
    fwd_packet_length_std = 200
    bwd_packet_length_max = 1000
    bwd_packet_length_mean = 500
    bwd_packet_length_std = 150
    fwd_psh_flags = 2
    fwd_urg_flags = 0
    bwd_psh_flags = 2
    bwd_urg_flags = 0
    fin_flag_count = 1
    syn_flag_count = 1
    rst_flag_count = 0
    psh_flag_count = 4
    ack_flag_count = 50
    urg_flag_count = 0
    fwd_iat_total = 500
    fwd_iat_mean = 25
    fwd_iat_std = 50
    fwd_iat_max = 200
    fwd_iat_min = 5
    bwd_iat_total = 400
    bwd_iat_mean = 20
    bwd_iat_std = 40
    bwd_iat_max = 150
    bwd_iat_min = 5
}

$mlPrediction4 = Invoke-WebRequest -Uri "$mlUrl/api/predict" -Method POST -Body ($normalTraffic | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json

Write-Host "ML Prediction: $($mlPrediction4.predicted_class)" -ForegroundColor Green
Write-Host "Confidence: $([math]::Round($mlPrediction4.confidence * 100, 2))%"

$trafficLog4 = @{
    src_ip = "192.168.1.50"
    dst_ip = "8.8.8.8"
    src_port = 12345
    dst_port = 443
    protocol = "TCP"
    packet_size = 1200
    is_attack = $mlPrediction4.is_attack
    predicted_class = $mlPrediction4.predicted_class
    confidence = $mlPrediction4.confidence
    state = "COMPLETED"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$backendUrl/api/traffic/log" -Method POST -Body $trafficLog4 -Headers $headers -UseBasicParsing | Out-Null
Write-Host "✓ Logged to backend"

Write-Host "`n" + ("=" * 60)
Write-Host "Attack simulation completed!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Yellow
Write-Host "   - 3 Attacks simulated (DDoS, Port Scan, Brute Force)"
Write-Host "   - 1 Normal traffic baseline"
Write-Host "   - All traffic logged to backend database"
Write-Host "`nCheck your dashboard at http://localhost:5173"
Write-Host "   - Traffic Logs page will show all events"
Write-Host "   - Alerts page may show security alerts"
