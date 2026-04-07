# Install `skills` CLI binary from GitHub Releases (Windows).
# Run via install.bat or: powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1
#
# Environment:
#   SKILLS_GITHUB_REPO   owner/repo (default: listenbehind/skills)
#   SKILLS_VERSION       tag like v1.4.13, or "latest" (default: latest)
#   SKILLS_INSTALL_DIR   directory for skills.exe (default: %USERPROFILE%\.local\bin)
#   GITHUB_TOKEN         optional; helps with API rate limits
#   SKILLS_WINDOWS_ARCH  amd64 (default) or arm64 — must match a release asset name

$ErrorActionPreference = "Stop"

$Repo = if ($env:SKILLS_GITHUB_REPO) { $env:SKILLS_GITHUB_REPO } else { "listenbehind/skills" }
$Version = if ($env:SKILLS_VERSION) { $env:SKILLS_VERSION } else { "latest" }
$InstallDir = if ($env:SKILLS_INSTALL_DIR) { $env:SKILLS_INSTALL_DIR } else { Join-Path $env:USERPROFILE ".local\bin" }

$Headers = @{ Accept = "application/vnd.github+json" }
if ($env:GITHUB_TOKEN) {
  $Headers["Authorization"] = "Bearer $($env:GITHUB_TOKEN)"
}

if ($Version -eq "latest") {
  $uri = "https://api.github.com/repos/$Repo/releases/latest"
  $release = Invoke-RestMethod -Uri $uri -Headers $Headers
  $Tag = $release.tag_name
  if (-not $Tag) { throw "Could not read tag_name from GitHub API (rate limit? set GITHUB_TOKEN)." }
} else {
  $Tag = $Version.Trim()
  if ($Tag -match '^\d' -and $Tag -notmatch '^v') {
    $Tag = "v$Tag"
  }
}

if ($env:SKILLS_WINDOWS_ARCH) {
  $Arch = $env:SKILLS_WINDOWS_ARCH.ToLowerInvariant()
  if ($Arch -ne "amd64" -and $Arch -ne "arm64") {
    throw "SKILLS_WINDOWS_ARCH must be amd64 or arm64, got: $Arch"
  }
} elseif ([Environment]::Is64BitOperatingSystem) {
  # listenbehind/skills CI only publishes skills-windows-amd64.exe; ARM64 Windows must use x64 emulation for that asset.
  $Arch = "amd64"
} else {
  throw "32-bit Windows is not supported by this installer script."
}

if ($Arch -eq "amd64" -and $env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
  Write-Host "Using skills-windows-amd64.exe (x64). For ARM64-native builds, publish skills-windows-arm64.exe and set SKILLS_WINDOWS_ARCH=arm64."
}

$Asset = "skills-windows-$Arch.exe"
$Url = "https://github.com/$Repo/releases/download/$Tag/$Asset"

Write-Host "Downloading $Url"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
$OutExe = Join-Path $InstallDir "skills.exe"

$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curl) {
  & curl.exe -fL --proto "=https" --tlsv1.2 -o $OutExe $Url
  if ($LASTEXITCODE -ne 0) {
    throw @"
Download failed (curl exit $LASTEXITCODE). Common causes:
  - Tag or asset missing: open https://github.com/$Repo/releases/tag/$Tag and confirm ``$Asset`` exists.
  - Wrong arch: this script uses ``$Asset``. Override with SKILLS_WINDOWS_ARCH=arm64 if you publish that file.
URL: $Url
"@
  }
} else {
  $prev = $ProgressPreference
  $ProgressPreference = "SilentlyContinue"
  try {
    Invoke-WebRequest -Uri $Url -OutFile $OutExe -UseBasicParsing
  } catch {
    throw "Download failed: $($_.Exception.Message). URL: $Url (install curl.exe for clearer errors, or open the URL in a browser)."
  } finally {
    $ProgressPreference = $prev
  }
}

$info = Get-Item $OutExe
if ($info.Length -lt 512KB) {
  Remove-Item $OutExe -Force -ErrorAction SilentlyContinue
  throw "Download too small ($($info.Length) bytes); likely an error page. Check: $Url"
}
$hdr = [IO.File]::ReadAllBytes($OutExe)[0..1]
if ($hdr[0] -ne 0x4D -or $hdr[1] -ne 0x5A) {
  Remove-Item $OutExe -Force -ErrorAction SilentlyContinue
  throw "File is not a PE executable (expected MZ header). Check: $Url"
}

Write-Host "Installed: $OutExe"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) { $userPath = "" }
if ($userPath -notlike "*$InstallDir*") {
  $newUserPath = if ($userPath) { "$userPath;$InstallDir" } else { $InstallDir }
  [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
  Write-Host "Added to user PATH: $InstallDir"
}

# Current terminal still had the old PATH; refresh so this session finds `skills` immediately.
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ([string]::IsNullOrEmpty($machinePath)) { $machinePath = "" }
$userPathFresh = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPathFresh)) { $userPathFresh = "" }
$env:Path = "$machinePath;$userPathFresh"

Write-Host ""
Write-Host "Use: skills   (or full path below). Do not rely on an old terminal tab without reopening it."
Write-Host "  $OutExe"
Write-Host ""

try {
  & $OutExe --version
} catch {
  Write-Host "(Could not run skills here; open a new PowerShell window and try: skills --version)"
}
