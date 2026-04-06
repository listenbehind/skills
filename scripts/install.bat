@echo off
setlocal
REM Install `skills` from GitHub Releases (Windows).
REM Requires: PowerShell 5+ (ships with Windows 10+).
REM
REM   scripts\install.bat
REM   set SKILLS_GITHUB_REPO=owner/repo && scripts\install.bat
REM   set SKILLS_VERSION=v1.0.0 && scripts\install.bat
REM
REM install.ps1 must sit next to this file.

set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install.ps1" %*
if errorlevel 1 exit /b 1
