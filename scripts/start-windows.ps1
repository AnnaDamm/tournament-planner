param([switch]$PrintUrl)

$ErrorActionPreference = 'Stop'
$projectDirectory = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pathBytes = [Text.Encoding]::UTF8.GetBytes($projectDirectory.ToLowerInvariant())
$hashBytes = [Security.Cryptography.SHA256]::Create().ComputeHash($pathBytes)
$projectHash = (([BitConverter]::ToString($hashBytes) -replace '-', '').Substring(0, 8)).ToLowerInvariant()
$composeProject = if ($env:TOURNY_COMPOSE_PROJECT) { $env:TOURNY_COMPOSE_PROJECT } else { "tourny-$projectHash" }

function Test-PortAvailable([int]$candidate) {
  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
    $listener.Start()
    return $true
  } catch [System.Net.Sockets.SocketException] {
    return $false
  } finally {
    if ($listener) { $listener.Stop() }
  }
}

$viewerUrl = $env:TOURNY_VIEWER_URL
$port = $env:TOURNY_PORT
if ($viewerUrl) {
  try {
    $viewerPort = ([Uri]$viewerUrl).Port
  } catch {
    throw 'TOURNY_VIEWER_URL must be a valid URL.'
  }
  if ($port -and ([int]$port -ne $viewerPort)) {
    throw 'TOURNY_PORT must match the port in TOURNY_VIEWER_URL.'
  }
  $port = $viewerPort
}
if (-not $port) {
  $port = 8080..8180 | Where-Object { Test-PortAvailable $_ } | Select-Object -First 1
  if (-not $port) {
    throw 'No available port found between 8080 and 8180. Set TOURNY_PORT manually.'
  }
}

if (-not $viewerUrl) {
  $address = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)' -and
      $_.InterfaceAlias -notmatch 'Bluetooth|Docker|Loopback|vEthernet|WSL'
    } |
    Sort-Object { if ($_.InterfaceAlias -match 'Wi-Fi|Ethernet') { 0 } else { 1 } } |
    Select-Object -First 1 -ExpandProperty IPAddress

  if (-not $address) {
    throw 'No private LAN IPv4 address found. Set TOURNY_VIEWER_URL manually.'
  }
  $viewerUrl = "http://${address}:$port/"
}

if (-not $env:VITE_APP_VERSION) {
  $env:VITE_APP_VERSION = git describe --tags --exact-match --match 'v[0-9]*' HEAD 2>$null
  if (-not $env:VITE_APP_VERSION) {
    $env:VITE_APP_VERSION = git describe --tags --abbrev=0 --first-parent --match 'v[0-9]*' HEAD 2>$null
  }
}

if ($PrintUrl) {
  Write-Output $viewerUrl
  exit 0
}

$env:TOURNY_PORT = $port
$env:TOURNY_VIEWER_URL = $viewerUrl
$env:TOURNY_COMPOSE_PROJECT = $composeProject
Set-Location $projectDirectory
Write-Output "Compose project: $composeProject"
Write-Output "Viewer URL: $viewerUrl"
docker compose --project-name $composeProject up --build
exit $LASTEXITCODE
