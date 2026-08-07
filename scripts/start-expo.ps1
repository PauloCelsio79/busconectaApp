# Arranca o Expo Go com IP da Wi-Fi detetado automaticamente.
# Uso: npm run start

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Get-WifiIPv4 {
  $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Sort-Object -Property InterfaceMetric |
    Select-Object -First 1

  if (-not $wifi) {
    return $null
  }

  return $wifi.IPAddress
}

$ip = Get-WifiIPv4
if (-not $ip) {
  Write-Error 'Não foi possível detetar o IPv4 da Wi‑Fi. Confirme ligação à rede e execute ipconfig.'
}

$envFile = Join-Path $ProjectRoot '.env'
$expectedApiUrl = "http://${ip}:8000/api/v1"

if (Test-Path $envFile) {
  $envContent = Get-Content $envFile -Raw
  if ($envContent -notmatch [regex]::Escape($ip)) {
    Write-Host "Aviso: o .env parece ter um IP antigo. Atualize para:" -ForegroundColor Yellow
    Write-Host "EXPO_PUBLIC_API_URL=$expectedApiUrl" -ForegroundColor Yellow
  }
}

$portInUse = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
  Write-Host 'Metro já está a correr na porta 8081.' -ForegroundColor Green
} else {
  Write-Host 'A iniciar Metro/Expo...' -ForegroundColor Cyan
}

Write-Host ''
Write-Host 'No telemóvel (Expo Go), use a mesma rede Wi‑Fi e ligue-se a:' -ForegroundColor Green
Write-Host "  exp://${ip}:8081" -ForegroundColor White
Write-Host ''
Write-Host 'Se LAN falhar, tente: npm run start:tunnel' -ForegroundColor DarkGray
Write-Host ''

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
npx expo start -c --lan
