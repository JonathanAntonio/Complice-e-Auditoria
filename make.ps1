param(
  [Parameter(Position = 0)]
  [string]$Target = "help"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE: $FilePath $($Arguments -join ' ')"
  }
}

function Show-Help {
  Write-Host "Targets disponiveis:"
  Write-Host "  .\make.ps1 help    - mostra esta ajuda"
  Write-Host "  .\make.ps1 install - instala dependencias do monorepo"
  Write-Host "  .\make.ps1 infra-up   - sobe Postgres, Redis, RabbitMQ e Nginx (gateway)"
  Write-Host "  .\make.ps1 infra-wait - aguarda infraestrutura ficar saudavel (healthcheck)"
  Write-Host "  .\make.ps1 infra-down - derruba infraestrutura Docker"
  Write-Host "  .\make.ps1 migrate - executa migracoes dos servicos"
  Write-Host "  .\make.ps1 dev     - sobe todos os servicos"
  Write-Host "  .\make.ps1 run     - instala deps, sobe infra e inicia todos os servicos"
  Write-Host "  .\make.ps1 test    - roda testes"
  Write-Host "  .\make.ps1 lint    - roda lint"
  Write-Host "  .\make.ps1 build   - roda build de todos os pacotes"
}

function Wait-Infra {
  Write-Host "Aguardando infraestrutura ficar healthy..."

  for ($i = 0; $i -lt 90; $i++) {
    $status = (& docker ps --format '{{.Names}} {{.Status}}') 2>$null

    if (
      ($status | Select-String -Pattern 'lframework-postgres .*healthy' -Quiet) -and
      ($status | Select-String -Pattern 'lframework-redis .*healthy' -Quiet) -and
      ($status | Select-String -Pattern 'lframework-rabbitmq .*healthy' -Quiet) -and
      ($status | Select-String -Pattern 'lframework-nginx .*healthy' -Quiet)
    ) {
      Write-Host "Infra pronta."
      return
    }

    Start-Sleep -Seconds 1
  }

  Write-Host "Timeout aguardando healthchecks da infra."
  & docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | Select-String 'lframework-(postgres|redis|rabbitmq|nginx)' | ForEach-Object { $_.Line }
  throw "Infraestrutura nao ficou healthy a tempo."
}

function Run-Migrations {
  $prismaTasks = @(
    @{
      Name = "identity-service"
      Prisma = Join-Path $RepoRoot "packages/identity-service/node_modules/.bin/prisma.cmd"
      Schema = Join-Path $RepoRoot "packages/identity-service/prisma/schema.prisma"
    },
    @{
      Name = "compliance-service"
      Prisma = Join-Path $RepoRoot "packages/compliance-service/node_modules/.bin/prisma.cmd"
      Schema = Join-Path $RepoRoot "packages/compliance-service/prisma/schema.prisma"
    },
    @{
      Name = "integration-service"
      Prisma = Join-Path $RepoRoot "packages/integration-service/node_modules/.bin/prisma.cmd"
      Schema = Join-Path $RepoRoot "packages/integration-service/prisma/schema.prisma"
    },
    @{
      Name = "audit-service"
      Prisma = Join-Path $RepoRoot "packages/audit-service/node_modules/.bin/prisma.cmd"
      Schema = Join-Path $RepoRoot "packages/audit-service/prisma/schema.prisma"
    }
  )

  foreach ($task in $prismaTasks) {
    if (-not (Test-Path -Path $task.Prisma)) {
      throw "Prisma binary nao encontrado para $($task.Name): $($task.Prisma). Rode '.\make.ps1 install' primeiro."
    }
  }

  Push-Location $RepoRoot
  try {
    foreach ($task in $prismaTasks) {
      Write-Host "Executando migracao: $($task.Name)"
      Invoke-Step -FilePath $task.Prisma -Arguments @("migrate", "dev", "--name", "init", "--schema=$($task.Schema)")
    }
  }
  finally {
    Pop-Location
  }
}

switch ($Target.ToLowerInvariant()) {
  "help" {
    Show-Help
  }
  "install" {
    Push-Location $RepoRoot
    try {
      Invoke-Step -FilePath "pnpm" -Arguments @("install")
    }
    finally {
      Pop-Location
    }
  }
  "infra-up" {
    Push-Location $RepoRoot
    try {
      Invoke-Step -FilePath "pnpm" -Arguments @("docker:up")
    }
    finally {
      Pop-Location
    }
  }
  "infra-wait" {
    Wait-Infra
  }
  "infra-down" {
    Push-Location $RepoRoot
    try {
      Invoke-Step -FilePath "pnpm" -Arguments @("docker:down")
    }
    finally {
      Pop-Location
    }
  }
  "migrate" {
    Run-Migrations
  }
  "dev" {
    Push-Location $RepoRoot
    try {
      Invoke-Step -FilePath "pnpm" -Arguments @("dev")
    }
    finally {
      Pop-Location
    }
  }
  "run" {
    & $MyInvocation.MyCommand.Path install
    & $MyInvocation.MyCommand.Path infra-up
    & $MyInvocation.MyCommand.Path infra-wait
    & $MyInvocation.MyCommand.Path dev
  }
  "test" {
    Push-Location $RepoRoot
    try {
      Invoke-Step -FilePath "pnpm" -Arguments @("test")
    }
    finally {
      Pop-Location
    }
  }
  "lint" {
    Push-Location $RepoRoot
    try {
      Invoke-Step -FilePath "pnpm" -Arguments @("lint")
    }
    finally {
      Pop-Location
    }
  }
  "build" {
    Push-Location $RepoRoot
    try {
      Invoke-Step -FilePath "pnpm" -Arguments @("build")
    }
    finally {
      Pop-Location
    }
  }
  default {
    throw "Target desconhecido: '$Target'. Use '.\make.ps1 help'."
  }
}
