param(
    [switch]$PrepareEpochBaselineOnly
)

$ErrorActionPreference = "Stop"

$postgresBin = "C:\Program Files\PostgreSQL\18\bin"
$postgres = Join-Path $postgresBin "postgres.exe"
$initdb = Join-Path $postgresBin "initdb.exe"
$pgCtl = Join-Path $postgresBin "pg_ctl.exe"
$psql = Join-Path $postgresBin "psql.exe"
$createdb = Join-Path $postgresBin "createdb.exe"
$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$temporaryRoot = Join-Path $env:TEMP ("qubira-pg18-test-" + [Guid]::NewGuid().ToString("N"))
$dataDirectory = Join-Path $temporaryRoot "data"
$passwordFile = Join-Path $temporaryRoot "initdb-password.txt"
$serverLog = Join-Path $temporaryRoot "postgres.log"
$apiLog = Join-Path $temporaryRoot "api.log"
$apiErrorLog = Join-Path $temporaryRoot "api-error.log"
$serverStarted = $false
$apiProcess = $null

Add-Type -AssemblyName System.Net.Http

function Get-FreeLoopbackPort {
    $listener = [System.Net.Sockets.TcpListener]::new(
        [System.Net.IPAddress]::Parse("127.0.0.1"),
        0
    )
    $listener.Start()
    try {
        return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    }
    finally {
        $listener.Stop()
    }
}

function Invoke-PsqlIdentity {
    param(
        [string]$Database,
        [string]$User,
        [int]$Port
    )

    $query = @"
SELECT current_setting('server_version'),
       current_database(),
       current_user,
       host(inet_server_addr()),
       current_setting('data_directory'),
       current_setting('listen_addresses'),
       current_setting('port');
"@
    $result = & $psql -X -h 127.0.0.1 -p $Port -U $User -d $Database `
        -v ON_ERROR_STOP=1 -A -t -F "|" -c $query
    if ($LASTEXITCODE -ne 0) {
        throw "Could not verify the isolated PostgreSQL server identity."
    }
    return ($result -join "").Trim().Split("|")
}

function Get-HttpStatus {
    param(
        [System.Net.Http.HttpClient]$Client,
        [string]$Uri
    )
    $response = $Client.GetAsync($Uri).GetAwaiter().GetResult()
    try {
        return [int]$response.StatusCode
    }
    finally {
        $response.Dispose()
    }
}

function Test-LoopbackAddress {
    param([string]$Address)
    try {
        $parsedAddress = [System.Net.IPAddress]::Parse($Address.Trim())
        if ($parsedAddress.IsIPv4MappedToIPv6) {
            $parsedAddress = $parsedAddress.MapToIPv4()
        }
        return [System.Net.IPAddress]::IsLoopback($parsedAddress)
    }
    catch {
        return $false
    }
}

try {
    foreach ($binary in @($postgres, $initdb, $pgCtl, $psql, $createdb)) {
        if (-not (Test-Path -LiteralPath $binary -PathType Leaf)) {
            throw "Required PostgreSQL 18 binary is missing: $binary"
        }
    }

    $version = (& $postgres --version | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $version -ne "postgres (PostgreSQL) 18.6") {
        throw "This test launcher requires PostgreSQL 18.6; found: $version"
    }

    $temporaryParent = [System.IO.Path]::GetFullPath($env:TEMP)
    [void](New-Item -ItemType Directory -Path $temporaryRoot)
    $resolvedTemporaryRoot = (Resolve-Path -LiteralPath $temporaryRoot).Path
    if (-not $resolvedTemporaryRoot.StartsWith(
        $temporaryParent,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
        throw "Temporary PostgreSQL directory is outside the system temp directory."
    }

    $owner = "qubira_test_owner"
    $database = "qubira_test_" + [Guid]::NewGuid().ToString("N")
    $port = Get-FreeLoopbackPort
    $randomBytes = New-Object byte[] 32
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $random.GetBytes($randomBytes)
        $password = [BitConverter]::ToString($randomBytes).Replace("-", "").ToLowerInvariant()
    }
    finally {
        $random.Dispose()
        [Array]::Clear($randomBytes, 0, $randomBytes.Length)
    }
    [System.IO.File]::WriteAllText(
        $passwordFile,
        $password,
        [System.Text.Encoding]::ASCII
    )

    Write-Output "Initializing disposable PostgreSQL cluster."
    & $initdb -D $dataDirectory -U $owner "--pwfile=$passwordFile" `
        --auth-local=trust --auth-host=scram-sha-256 --encoding=UTF8 --no-locale *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL 18.6 initdb failed; see the temporary server log."
    }
    Remove-Item -LiteralPath $passwordFile -Force

    Write-Output "Starting loopback-only PostgreSQL cluster."
    & $pgCtl -D $dataDirectory -l $serverLog `
        -o "-h 127.0.0.1 -p $port -c listen_addresses=127.0.0.1" `
        -w start
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL 18.6 did not start; see the temporary server log."
    }
    $serverStarted = $true

    $env:PGPASSWORD = $password
    Write-Output "Verifying cluster identity before creating the test database."
    $clusterIdentity = Invoke-PsqlIdentity -Database "postgres" -User $owner -Port $port
    $resolvedDataDirectory = [System.IO.Path]::GetFullPath($dataDirectory)
    $clusterIdentityChecks = @{
        FieldCount = $clusterIdentity.Count -eq 7
        Version = $clusterIdentity.Count -eq 7 -and $clusterIdentity[0] -eq "18.6"
        Database = $clusterIdentity.Count -eq 7 -and $clusterIdentity[1] -eq "postgres"
        User = $clusterIdentity.Count -eq 7 -and $clusterIdentity[2] -eq $owner
        ServerAddressLoopback = $clusterIdentity.Count -eq 7 -and (Test-LoopbackAddress $clusterIdentity[3])
        DataDirectory = $clusterIdentity.Count -eq 7 -and [System.IO.Path]::GetFullPath($clusterIdentity[4]) -eq $resolvedDataDirectory
        ListenAddress = $clusterIdentity.Count -eq 7 -and $clusterIdentity[5] -eq "127.0.0.1"
        Port = $clusterIdentity.Count -eq 7 -and [int]$clusterIdentity[6] -eq $port
    }
    if ($clusterIdentityChecks.Values -contains $false) {
        Write-Output (
            "Cluster identity checks: " +
            (($clusterIdentityChecks.GetEnumerator() | ForEach-Object {
                "$($_.Key)=$($_.Value)"
            }) -join " ") +
            " ServerAddress=" + [string]$clusterIdentity[3]
        )
        throw "The local PostgreSQL cluster identity did not match the isolated test instance."
    }

    Write-Output "Creating and verifying the uniquely named disposable database."
    & $createdb -h 127.0.0.1 -p $port -U $owner $database
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the uniquely named disposable test database."
    }

    $databaseIdentity = Invoke-PsqlIdentity -Database $database -User $owner -Port $port
    $databaseIdentityChecks = @{
        FieldCount = $databaseIdentity.Count -eq 7
        Version = $databaseIdentity.Count -eq 7 -and $databaseIdentity[0] -eq "18.6"
        Database = $databaseIdentity.Count -eq 7 -and $databaseIdentity[1] -eq $database
        User = $databaseIdentity.Count -eq 7 -and $databaseIdentity[2] -eq $owner
        ServerAddressLoopback = $databaseIdentity.Count -eq 7 -and (Test-LoopbackAddress $databaseIdentity[3])
        DataDirectory = $databaseIdentity.Count -eq 7 -and [System.IO.Path]::GetFullPath($databaseIdentity[4]) -eq $resolvedDataDirectory
        ListenAddress = $databaseIdentity.Count -eq 7 -and $databaseIdentity[5] -eq "127.0.0.1"
        Port = $databaseIdentity.Count -eq 7 -and [int]$databaseIdentity[6] -eq $port
    }
    if ($databaseIdentityChecks.Values -contains $false) {
        Write-Output (
            "Database identity checks: " +
            (($databaseIdentityChecks.GetEnumerator() | ForEach-Object {
                "$($_.Key)=$($_.Value)"
            }) -join " ")
        )
        throw "The disposable database identity did not match the isolated test instance."
    }

    $encodedPassword = [Uri]::EscapeDataString($password)
    $env:DATABASE_URL = "postgresql+psycopg://${owner}:${encodedPassword}@127.0.0.1:${port}/${database}"
    $env:ASYNC_DATABASE_URL = "postgresql+asyncpg://${owner}:${encodedPassword}@127.0.0.1:${port}/${database}"
    $env:QUBIRA_TEST_POSTGRESQL_URL = $env:DATABASE_URL
    $env:DATABASE_TYPE = "postgresql"
    $env:ENVIRONMENT = "test"
    $env:QUBIRA_TEST_MODE = "1"
    $env:QUBIRA_EPOCH_POSTGRESQL_TEST = "1"
    $env:MIGRATION_DATABASE_URL = ""
    $env:RESET_DB = "false"

    Write-Output "PostgreSQL 18.6 isolated cluster: verified (loopback only)"
    Write-Output "Disposable database identity: verified before test DDL"
    if ($PrepareEpochBaselineOnly) {
        @'
import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.engine import make_url

from app.database.migration_infrastructure.epoch_control import (
    create_epoch_control_schema,
)
from app.database.migration_infrastructure.migration_coordinator import (
    acquire_postgresql_migration_ownership,
)

backend = Path.cwd()
versions = backend / "alembic_epoch" / "versions"
existing = sorted(versions.glob("*.py"))
if existing:
    raise RuntimeError(
        "Refusing to overwrite an existing epoch migration: "
        + ", ".join(path.name for path in existing)
    )
url = make_url(os.environ["DATABASE_URL"])
with acquire_postgresql_migration_ownership(url) as ownership:
    create_epoch_control_schema(ownership.connection)
    ownership.connection.commit()
    config = Config(str(backend / "alembic_epoch.ini"))
    config.set_main_option("sqlalchemy.url", str(url).replace("%", "%%"))
    config.attributes["connection"] = ownership.connection
    config.attributes["migration_ownership"] = ownership
    config.attributes["coordinated_runner"] = True
    command.revision(
        config,
        message="Create PostgreSQL epoch baseline",
        autogenerate=True,
    )
'@ | python -
        if ($LASTEXITCODE -ne 0) {
            throw "Could not generate the epoch baseline draft from registered models."
        }
        Write-Output "Generated a DDL-only epoch baseline draft; no application migration was executed."
        return
    }

    Write-Output "Running PostgreSQL advisory-lock and migration-refusal tests."
    Set-Location $backendRoot
    & python -m pytest --confcutdir=tests/migration_infrastructure -q `
        tests/migration_infrastructure/test_postgresql_migration_coordinator.py
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL advisory-lock test suite failed."
    }

    $legacyDatabaseUrl = $env:DATABASE_URL
    $legacyAsyncDatabaseUrl = $env:ASYNC_DATABASE_URL
    $legacyTestDatabaseUrl = $env:QUBIRA_TEST_POSTGRESQL_URL
    $epochDatabase = "qubira_test_epoch_" + [Guid]::NewGuid().ToString("N")
    & $createdb -h 127.0.0.1 -p $port -U $owner $epochDatabase
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the isolated epoch-install test database."
    }
    $epochIdentity = Invoke-PsqlIdentity -Database $epochDatabase -User $owner -Port $port
    if (
        $epochIdentity.Count -ne 7 -or
        $epochIdentity[0] -ne "18.6" -or
        $epochIdentity[1] -ne $epochDatabase -or
        $epochIdentity[2] -ne $owner -or
        -not (Test-LoopbackAddress $epochIdentity[3])
    ) {
        throw "The isolated epoch-install database identity could not be verified."
    }
    $env:DATABASE_URL = "postgresql+psycopg://${owner}:${encodedPassword}@127.0.0.1:${port}/${epochDatabase}"
    $env:ASYNC_DATABASE_URL = "postgresql+asyncpg://${owner}:${encodedPassword}@127.0.0.1:${port}/${epochDatabase}"
    $env:QUBIRA_TEST_POSTGRESQL_URL = $env:DATABASE_URL
    Write-Output "Running the coordinated epoch fresh-install test on $epochDatabase."
    & python -m pytest --confcutdir=tests/migration_infrastructure -q `
        tests/migration_infrastructure/test_epoch_postgresql_runner.py::test_epoch_fresh_install_is_coordinated_and_readiness_is_read_only
    if ($LASTEXITCODE -ne 0) {
        throw "The coordinated epoch fresh-install test failed."
    }

    $failureDatabase = "qubira_test_epoch_failure_" + [Guid]::NewGuid().ToString("N")
    & $createdb -h 127.0.0.1 -p $port -U $owner $failureDatabase
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the isolated epoch failure-test database."
    }
    $failureIdentity = Invoke-PsqlIdentity -Database $failureDatabase -User $owner -Port $port
    if (
        $failureIdentity.Count -ne 7 -or
        $failureIdentity[0] -ne "18.6" -or
        $failureIdentity[1] -ne $failureDatabase -or
        $failureIdentity[2] -ne $owner -or
        -not (Test-LoopbackAddress $failureIdentity[3])
    ) {
        throw "The isolated epoch failure-test database identity could not be verified."
    }
    $env:DATABASE_URL = "postgresql+psycopg://${owner}:${encodedPassword}@127.0.0.1:${port}/${failureDatabase}"
    $env:ASYNC_DATABASE_URL = "postgresql+asyncpg://${owner}:${encodedPassword}@127.0.0.1:${port}/${failureDatabase}"
    $env:QUBIRA_TEST_POSTGRESQL_URL = $env:DATABASE_URL
    $env:QUBIRA_EPOCH_FAILURE_TEST = "1"
    Write-Output "Running durable epoch interruption and no-retry tests on $failureDatabase."
    & python -m pytest --confcutdir=tests/migration_infrastructure -q `
        tests/migration_infrastructure/test_epoch_postgresql_runner.py::test_interrupted_epoch_attempt_is_not_retried_automatically
    if ($LASTEXITCODE -ne 0) {
        throw "The epoch interruption and no-retry test failed."
    }
    Remove-Item Env:QUBIRA_EPOCH_FAILURE_TEST -ErrorAction SilentlyContinue

    $terminationDatabase = "qubira_test_epoch_termination_" + [Guid]::NewGuid().ToString("N")
    & $createdb -h 127.0.0.1 -p $port -U $owner $terminationDatabase
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the isolated epoch termination-test database."
    }
    $terminationIdentity = Invoke-PsqlIdentity -Database $terminationDatabase -User $owner -Port $port
    if (
        $terminationIdentity.Count -ne 7 -or
        $terminationIdentity[0] -ne "18.6" -or
        $terminationIdentity[1] -ne $terminationDatabase -or
        $terminationIdentity[2] -ne $owner -or
        -not (Test-LoopbackAddress $terminationIdentity[3])
    ) {
        throw "The isolated epoch termination-test database identity could not be verified."
    }
    $env:DATABASE_URL = "postgresql+psycopg://${owner}:${encodedPassword}@127.0.0.1:${port}/${terminationDatabase}"
    $env:ASYNC_DATABASE_URL = "postgresql+asyncpg://${owner}:${encodedPassword}@127.0.0.1:${port}/${terminationDatabase}"
    $env:QUBIRA_TEST_POSTGRESQL_URL = $env:DATABASE_URL
    $env:QUBIRA_EPOCH_TERMINATION_TEST = "1"
    $env:QUBIRA_EPOCH_TERMINATION_MARKER = Join-Path $temporaryRoot ("epoch-termination-" + [Guid]::NewGuid().ToString("N") + ".txt")
    Write-Output "Running process-termination recovery test on $terminationDatabase."
    & python -m pytest --confcutdir=tests/migration_infrastructure -q `
        tests/migration_infrastructure/test_epoch_postgresql_runner.py::test_process_termination_leaves_durable_intent_and_requires_recovery
    if ($LASTEXITCODE -ne 0) {
        throw "The epoch process-termination recovery test failed."
    }
    Remove-Item Env:QUBIRA_EPOCH_TERMINATION_TEST -ErrorAction SilentlyContinue
    Remove-Item Env:QUBIRA_EPOCH_TERMINATION_MARKER -ErrorAction SilentlyContinue

    $verificationDatabase = "qubira_test_epoch_verify_" + [Guid]::NewGuid().ToString("N")
    & $createdb -h 127.0.0.1 -p $port -U $owner $verificationDatabase
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the isolated epoch verification-test database."
    }
    $verificationIdentity = Invoke-PsqlIdentity -Database $verificationDatabase -User $owner -Port $port
    if (
        $verificationIdentity.Count -ne 7 -or
        $verificationIdentity[0] -ne "18.6" -or
        $verificationIdentity[1] -ne $verificationDatabase -or
        $verificationIdentity[2] -ne $owner -or
        -not (Test-LoopbackAddress $verificationIdentity[3])
    ) {
        throw "The isolated epoch verification-test database identity could not be verified."
    }
    $env:DATABASE_URL = "postgresql+psycopg://${owner}:${encodedPassword}@127.0.0.1:${port}/${verificationDatabase}"
    $env:ASYNC_DATABASE_URL = "postgresql+asyncpg://${owner}:${encodedPassword}@127.0.0.1:${port}/${verificationDatabase}"
    $env:QUBIRA_TEST_POSTGRESQL_URL = $env:DATABASE_URL
    $env:QUBIRA_EPOCH_VERIFY_FAILURE_TEST = "1"
    Write-Output "Running post-commit verification failure test on $verificationDatabase."
    & python -m pytest --confcutdir=tests/migration_infrastructure -q `
        tests/migration_infrastructure/test_epoch_postgresql_runner.py::test_committed_revision_with_failed_verification_requires_recovery
    if ($LASTEXITCODE -ne 0) {
        throw "The epoch post-commit verification failure test failed."
    }
    Remove-Item Env:QUBIRA_EPOCH_VERIFY_FAILURE_TEST -ErrorAction SilentlyContinue

    $env:DATABASE_URL = $legacyDatabaseUrl
    $env:ASYNC_DATABASE_URL = $legacyAsyncDatabaseUrl
    $env:QUBIRA_TEST_POSTGRESQL_URL = $legacyTestDatabaseUrl

    Write-Output "Starting API-only Uvicorn smoke test."
    $beforeRelations = (& $psql -X -h 127.0.0.1 -p $port -U $owner -d $database `
        -v ON_ERROR_STOP=1 -A -t -c `
        "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S')").Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Could not capture pre-start API schema inventory."
    }
    $beforeVersionTables = (& $psql -X -h 127.0.0.1 -p $port -U $owner -d $database `
        -v ON_ERROR_STOP=1 -A -t -c `
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='alembic_version'").Trim()
    if ($LASTEXITCODE -ne 0 -or $beforeVersionTables -ne "1") {
        throw "The synthetic Alembic connection probe did not create its expected disposable revision table."
    }
    $beforeRevisionRows = (& $psql -X -h 127.0.0.1 -p $port -U $owner -d $database `
        -v ON_ERROR_STOP=1 -A -t -c `
        "SELECT COALESCE(string_agg(version_num, ',' ORDER BY version_num), '') FROM public.alembic_version").Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Could not capture the synthetic revision state before API startup."
    }

    $apiPort = Get-FreeLoopbackPort
    $pythonPath = (Get-Command python -ErrorAction Stop).Source
    $apiProcess = Start-Process -FilePath $pythonPath `
        -ArgumentList @(
            "-m", "uvicorn", "app.main:app",
            "--host", "127.0.0.1", "--port", "$apiPort"
        ) `
        -WorkingDirectory $backendRoot `
        -PassThru -RedirectStandardOutput $apiLog -RedirectStandardError $apiErrorLog

    $client = [System.Net.Http.HttpClient]::new()
    $client.Timeout = [TimeSpan]::FromSeconds(5)
    try {
        $deadline = [DateTime]::UtcNow.AddSeconds(45)
        $healthStatus = 0
        while ([DateTime]::UtcNow -lt $deadline) {
            if ($apiProcess.HasExited) {
                throw "API-only Uvicorn exited before /health responded; inspect the temporary API log."
            }
            try {
                $healthStatus = Get-HttpStatus -Client $client -Uri "http://127.0.0.1:${apiPort}/health"
                if ($healthStatus -eq 200) {
                    break
                }
            }
            catch {
                Start-Sleep -Milliseconds 250
            }
        }
        if ($healthStatus -ne 200) {
            throw "API-only Uvicorn did not return HTTP 200 from /health."
        }

        $readyStatus = Get-HttpStatus -Client $client -Uri "http://127.0.0.1:${apiPort}/ready"
        $authStatus = Get-HttpStatus -Client $client -Uri "http://127.0.0.1:${apiPort}/api/v1/auth/me"
        $dashboardStatus = Get-HttpStatus -Client $client -Uri "http://127.0.0.1:${apiPort}/api/v1/dashboard"
        if ($readyStatus -ne 503 -or $authStatus -ne 401 -or $dashboardStatus -ne 401) {
            throw "API-only status mismatch: ready=$readyStatus auth/me=$authStatus dashboard=$dashboardStatus."
        }
    }
    finally {
        $client.Dispose()
        if ($apiProcess -and -not $apiProcess.HasExited) {
            Stop-Process -Id $apiProcess.Id
            $apiProcess.WaitForExit()
        }
    }

    $afterRelations = (& $psql -X -h 127.0.0.1 -p $port -U $owner -d $database `
        -v ON_ERROR_STOP=1 -A -t -c `
        "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S')").Trim()
    $versionTables = (& $psql -X -h 127.0.0.1 -p $port -U $owner -d $database `
        -v ON_ERROR_STOP=1 -A -t -c `
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='alembic_version'").Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Could not capture post-start Alembic table state."
    }
    $afterRevisionRows = (& $psql -X -h 127.0.0.1 -p $port -U $owner -d $database `
        -v ON_ERROR_STOP=1 -A -t -c `
        "SELECT COALESCE(string_agg(version_num, ',' ORDER BY version_num), '') FROM public.alembic_version").Trim()
    if (
        $LASTEXITCODE -ne 0 -or
        $beforeRelations -ne $afterRelations -or
        $beforeVersionTables -ne $versionTables -or
        $beforeRevisionRows -ne $afterRevisionRows
    ) {
        Write-Output "API schema inventory before=$beforeRelations after=$afterRelations"
        Write-Output "Synthetic revision rows preserved=$($beforeRevisionRows -eq $afterRevisionRows)"
        throw "API-only startup changed the disposable database schema or synthetic revision state."
    }

    Write-Output "API-only startup: /health=$healthStatus /ready=$readyStatus /api/v1/auth/me=$authStatus /api/v1/dashboard=$dashboardStatus"
    Write-Output "API-only startup schema check: unchanged; synthetic revision state preserved"
}
finally {
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id
        $apiProcess.WaitForExit()
    }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:ASYNC_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:QUBIRA_TEST_POSTGRESQL_URL -ErrorAction SilentlyContinue
    Remove-Item Env:QUBIRA_EPOCH_POSTGRESQL_TEST -ErrorAction SilentlyContinue
    Remove-Item Env:QUBIRA_EPOCH_FAILURE_TEST -ErrorAction SilentlyContinue
    Remove-Item Env:QUBIRA_EPOCH_TERMINATION_TEST -ErrorAction SilentlyContinue
    Remove-Item Env:QUBIRA_EPOCH_TERMINATION_MARKER -ErrorAction SilentlyContinue
    Remove-Item Env:QUBIRA_EPOCH_VERIFY_FAILURE_TEST -ErrorAction SilentlyContinue

    if ($serverStarted) {
        & $pgCtl -D $dataDirectory -m fast -w stop
        if ($LASTEXITCODE -ne 0) {
            throw "Could not stop the isolated PostgreSQL cluster cleanly."
        }
    }

    if (Test-Path -LiteralPath $temporaryRoot) {
        $resolvedTemporaryRoot = (Resolve-Path -LiteralPath $temporaryRoot).Path
        $temporaryParent = [System.IO.Path]::GetFullPath($env:TEMP)
        if (
            $resolvedTemporaryRoot.StartsWith(
                $temporaryParent,
                [System.StringComparison]::OrdinalIgnoreCase
            ) -and
            (Split-Path -Leaf $resolvedTemporaryRoot) -like "qubira-pg18-test-*"
        ) {
            Remove-Item -LiteralPath $resolvedTemporaryRoot -Recurse -Force
        }
    }
}
