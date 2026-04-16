[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Target = "help"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$NgrokAuthToken = "3CPFFE4q2RRHyNayNOLCm3Mp0tI_2fnYKa95PeDtoNEqgVZKH"
$NgrokUrl = if ([string]::IsNullOrWhiteSpace($env:NGROK_URL)) {
    "rage-awhile-snowcap.ngrok-free.dev"
} else {
    $env:NGROK_URL
}

function Show-Help {
    Write-Host "Targets disponiveis:"
    Write-Host "  .\\make.cmd install     - instala dependencias do monorepo"
    Write-Host "  .\\make.cmd infra-up    - sobe Postgres, Redis, RabbitMQ e Nginx (gateway)"
    Write-Host "  .\\make.cmd infra-wait  - aguarda infraestrutura ficar saudavel (healthcheck)"
    Write-Host "  .\\make.cmd infra-down  - derruba infraestrutura Docker"
    Write-Host "  .\\make.cmd migrate     - executa migracoes dos servicos"
    Write-Host "  .\\make.cmd dev         - sobe todos os servicos"
    Write-Host "  .\\make.cmd run         - instala deps, sobe infra e inicia todos os servicos"
    Write-Host "  .\\make.cmd test        - roda testes"
    Write-Host "  .\\make.cmd lint        - roda lint"
    Write-Host "  .\\make.cmd build       - roda build de todos os pacotes"
    Write-Host "  .\\make.cmd ngrok       - expoe frontend via ngrok"
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args
    )

    $cmd = $Args -join " "
    Write-Host "> $cmd"
    if ($Args.Length -eq 1) {
        & $Args[0]
    } else {
        & $Args[0] $Args[1..($Args.Length - 1)]
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Comando falhou (exit code $LASTEXITCODE): $cmd"
    }
}

function Invoke-InfraWait {
    Write-Host "Aguardando infraestrutura ficar healthy..."

    for ($i = 1; $i -le 90; $i++) {
        $status = (& docker ps --format '{{.Names}} {{.Status}}' 2>$null)

        $postgresHealthy = $status -match 'lframework-postgres\s+.*healthy'
        $redisHealthy = $status -match 'lframework-redis\s+.*healthy'
        $rabbitHealthy = $status -match 'lframework-rabbitmq\s+.*healthy'
        $nginxHealthy = $status -match 'lframework-nginx\s+.*healthy'

        if ($postgresHealthy -and $redisHealthy -and $rabbitHealthy -and $nginxHealthy) {
            Write-Host "Infra pronta."
            return
        }

        Start-Sleep -Seconds 1
    }

    Write-Host "Timeout aguardando healthchecks da infra."
    & docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}" | Select-String -Pattern 'lframework-(postgres|redis|rabbitmq|nginx)'
    throw "Infra nao ficou saudavel dentro do tempo limite."
}

$targetNormalized = $Target.ToLowerInvariant()

switch ($targetNormalized) {
    "help" {
        Show-Help
    }
    "install" {
        Invoke-Step @("pnpm", "install")
    }
    "infra-up" {
        Invoke-Step @("pnpm", "docker:up")
    }
    "infra-wait" {
        Invoke-InfraWait
    }
    "infra-down" {
        Invoke-Step @("pnpm", "docker:down")
    }
    "migrate" {
        Invoke-Step @("pnpm", "--filter", "identity-service", "exec", "prisma", "migrate", "dev", "--name", "init", "--schema=./prisma/schema.prisma")
        Invoke-Step @("pnpm", "--filter", "compliance-service", "exec", "prisma", "migrate", "dev", "--name", "init", "--schema=./prisma/schema.prisma")
        Invoke-Step @("pnpm", "--filter", "integration-service", "exec", "prisma", "migrate", "dev", "--name", "init", "--schema=./prisma/schema.prisma")
        Invoke-Step @("pnpm", "--filter", "audit-service", "exec", "prisma", "migrate", "dev", "--name", "init", "--schema=./prisma/schema.prisma")
    }
    "dev" {
        Invoke-Step @("pnpm", "dev")
    }
    "run" {
        Invoke-Step @("pnpm", "install")
        Invoke-Step @("pnpm", "docker:up")
        Invoke-InfraWait
        Invoke-Step @("pnpm", "dev")
    }
    "test" {
        Invoke-Step @("pnpm", "test")
    }
    "lint" {
        Invoke-Step @("pnpm", "lint")
    }
    "build" {
        Invoke-Step @("pnpm", "build")
    }
    "ngrok" {
        $previousNgrokToken = $null
        $hadPreviousNgrokToken = Test-Path Env:NGROK_AUTHTOKEN
        if ($hadPreviousNgrokToken) {
            $previousNgrokToken = $env:NGROK_AUTHTOKEN
        }

        try {
            $env:NGROK_AUTHTOKEN = $NgrokAuthToken
            if ([string]::IsNullOrWhiteSpace($NgrokUrl)) {
                Invoke-Step @("ngrok", "http", "5173", "--authtoken=$NgrokAuthToken")
            } else {
                Invoke-Step @("ngrok", "http", "5173", "--authtoken=$NgrokAuthToken", "--url=$NgrokUrl")
            }
        } finally {
            if ($hadPreviousNgrokToken) {
                $env:NGROK_AUTHTOKEN = $previousNgrokToken
            } else {
                Remove-Item Env:NGROK_AUTHTOKEN -ErrorAction SilentlyContinue
            }
        }
    }
    default {
        Write-Error "Target desconhecido: $Target"
        Show-Help
        exit 1
    }
}
