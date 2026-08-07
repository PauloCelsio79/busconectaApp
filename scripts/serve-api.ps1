# Inicia a API Laravel acessível na rede local (telemóvel + Expo Go).
# Ajuste $ApiPath se a API não estiver em Laragon.

$ApiPath = "C:\laragon\www\busconecta-api"

if (-not (Test-Path "$ApiPath\artisan")) {
    Write-Error "Não encontrado: $ApiPath\artisan. Edite scripts\serve-api.ps1 com o caminho da API."
    exit 1
}

Write-Host "A parar servidores PHP na porta 8000 (se existirem)..."
Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Set-Location $ApiPath
Write-Host "API: http://0.0.0.0:8000 (use o IPv4 Wi-Fi do PC no .env)"
php artisan serve --host=0.0.0.0 --port=8000
