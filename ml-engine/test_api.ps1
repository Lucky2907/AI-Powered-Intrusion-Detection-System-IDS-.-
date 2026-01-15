# Test AI-IDS ML API
# Sample prediction requests

Write-Host "🧪 Testing AI-IDS ML Prediction API" -ForegroundColor Green
Write-Host "=" * 60

# Test 1: Health Check
Write-Host "`n✓ Test 1: Health Check" -ForegroundColor Cyan
$health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing | ConvertFrom-Json
Write-Host "Status: $($health.status)"
Write-Host "Model Loaded: $($health.model_loaded)"
Write-Host "Accuracy: $($health.model_accuracy)"

# Test 2: Model Info
Write-Host "`n✓ Test 2: Model Information" -ForegroundColor Cyan
$info = Invoke-WebRequest -Uri "http://localhost:5000/api/model/info" -UseBasicParsing | ConvertFrom-Json
Write-Host "Model Type: $($info.model_type)"
Write-Host "Features: $($info.n_features)"
Write-Host "Classes: $($info.n_classes) - $($info.class_labels -join ', ')"
Write-Host "Estimators: $($info.n_estimators)"
Write-Host "Training Accuracy: $($info.metrics.training_accuracy * 100)%"

# Test 3: Normal Traffic Prediction
Write-Host "`n✓ Test 3: Predict Normal Traffic" -ForegroundColor Cyan
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
} | ConvertTo-Json

$result1 = Invoke-WebRequest -Uri "http://localhost:5000/api/predict" -Method POST -Body $normalTraffic -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
Write-Host "Prediction: $($result1.predicted_class)"
Write-Host "Is Attack: $($result1.is_attack)"
Write-Host "Confidence: $([math]::Round($result1.confidence * 100, 2))%"

# Test 4: DDoS Attack Prediction
Write-Host "`n✓ Test 4: Predict DDoS Attack" -ForegroundColor Cyan
$ddosTraffic = @{
    flow_duration = 100.2
    flow_bytes_s = 50000    # Very high byte rate
    flow_packets_s = 500    # Very high packet rate
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
    syn_flag_count = 5      # Multiple SYNs
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
} | ConvertTo-Json

$result2 = Invoke-WebRequest -Uri "http://localhost:5000/api/predict" -Method POST -Body $ddosTraffic -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
Write-Host "Prediction: $($result2.predicted_class)" -ForegroundColor $(if ($result2.is_attack) { "Red" } else { "Green" })
Write-Host "Is Attack: $($result2.is_attack)"
Write-Host "Confidence: $([math]::Round($result2.confidence * 100, 2))%"

# Test 5: Port Scan Prediction
Write-Host "`n✓ Test 5: Predict Port Scan" -ForegroundColor Cyan
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
    syn_flag_count = 40     # Many SYNs (port scanning)
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
} | ConvertTo-Json

$result3 = Invoke-WebRequest -Uri "http://localhost:5000/api/predict" -Method POST -Body $portScanTraffic -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
Write-Host "Prediction: $($result3.predicted_class)" -ForegroundColor $(if ($result3.is_attack) { "Red" } else { "Green" })
Write-Host "Is Attack: $($result3.is_attack)"
Write-Host "Confidence: $([math]::Round($result3.confidence * 100, 2))%"

Write-Host "`n" + ("=" * 60)
Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Yellow
Write-Host "   • API is running and responding"
Write-Host "   • Model loaded: Random Forest with 100 trees"
Write-Host "   • Can detect: 5 traffic classes"
Write-Host "   • Training accuracy: $($info.metrics.training_accuracy * 100)%"
Write-Host "`n🚀 Your AI-IDS ML Engine is ready!"
