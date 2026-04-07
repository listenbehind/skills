# Install `skills` CLI binary from GitHub Releases (Windows).
# Run via install.bat or: powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1
#
# Environment:
#   SKILLS_GITHUB_REPO   owner/repo (default: listenbehind/skills)
#   SKILLS_VERSION       tag like v1.4.9, or "latest" (default: latest)
#   SKILLS_INSTALL_DIR   directory for skills.exe (default: %USERPROFILE%\.local\bin)
#   GITHUB_TOKEN         optional; helps with API rate limits
#
# Downloads skills-windows-*-64.exe from the release. CI currently ships skills-windows-amd64.exe;
# ARM64 Windows requires that asset to exist on the release (add a matrix row to build it).

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
  $Tag = $Version
}

if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
  $Arch = "arm64"
} elseif ([Environment]::Is64BitOperatingSystem) {
  $Arch = "amd64"
} else {
  throw "32-bit Windows is not supported by this installer script."
}

$Asset = "skills-windows-$Arch.exe"
$Url = "https://github.com/$Repo/releases/download/$Tag/$Asset"

Write-Host "Downloading $Url"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
$OutExe = Join-Path $InstallDir "skills.exe"

Invoke-WebRequest -Uri $Url -OutFile $OutExe -UseBasicParsing

Write-Host "Installed: $OutExe"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$InstallDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$InstallDir", "User")
  Write-Host "Added to user PATH: $InstallDir"
  Write-Host "Open a new terminal, then run: skills"
} else {
  Write-Host "Run: skills"
}
