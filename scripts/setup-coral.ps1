# setup-coral.ps1 — Install Coral CLI and configure sources for MailRite (Windows)
# Usage: .\scripts\setup-coral.ps1
#
# This script:
#   1. Downloads and installs Coral CLI (if not already installed)
#   2. Adds LinkedIn and Gmail as Coral data sources
#   3. Verifies the setup with a test query

$ErrorActionPreference = "Stop"
$CoralBinDir = "$env:USERPROFILE\.local\bin"
$CoralExe = "$CoralBinDir\coral.exe"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host "🏴‍☠️  MailRite — Coral Setup (Windows)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Install Coral CLI ────────────────────────────────────
if (Test-Path $CoralExe) {
    Write-Host "✅ Coral CLI is already installed." -ForegroundColor Green
    & $CoralExe --version
} else {
    Write-Host "📦 Downloading Coral CLI for Windows..." -ForegroundColor Yellow

    $ZipUrl = "https://github.com/withcoral/coral/releases/latest/download/coral-x86_64-pc-windows-msvc.zip"
    $ZipPath = "$env:TEMP\coral-x86_64-pc-windows-msvc.zip"
    $ExtractPath = "$env:TEMP\coral-install"

    try {
        Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
        Write-Host "   Downloaded coral.zip" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not download from $ZipUrl" -ForegroundColor Yellow
        Write-Host "   Please download manually from: https://github.com/withcoral/coral/releases"
        Write-Host "   Extract coral.exe to: $CoralBinDir"
        exit 1
    }

    if (Test-Path $ExtractPath) { Remove-Item -Recurse -Force $ExtractPath }
    Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force

    if (-not (Test-Path $CoralBinDir)) {
        New-Item -ItemType Directory -Force -Path $CoralBinDir | Out-Null
    }

    Copy-Item "$ExtractPath\coral.exe" $CoralExe -Force
    Remove-Item -Recurse -Force $ExtractPath, $ZipPath

    # Add to user PATH if not already there
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$CoralBinDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$CoralBinDir;$userPath", "User")
        $env:Path = "$CoralBinDir;$env:Path"
        Write-Host "   Added $CoralBinDir to your user PATH" -ForegroundColor Green
        Write-Host "   ⚠️  You may need to restart your terminal for PATH changes to take effect." -ForegroundColor Yellow
    }

    Write-Host "✅ Coral CLI installed to $CoralExe" -ForegroundColor Green
}

Write-Host ""

# ─── Step 2: Add Data Sources ─────────────────────────────────────
Write-Host "🔌 Adding data sources..." -ForegroundColor Yellow

$linkedinSpec = Join-Path $RepoRoot "coral-sources\linkedin-source.yaml"
if (Test-Path $linkedinSpec) {
    Write-Host "   Adding LinkedIn (needs LINKEDIN_ACCESS_TOKEN env var)..."
    & $CoralExe source add --file $linkedinSpec 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ LinkedIn source added" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  LinkedIn source already exists or needs token — skipping" -ForegroundColor Yellow
    }
}

$gmailPeopleSpec = Join-Path $RepoRoot "coral-sources\gmail-people-source.yaml"
if (Test-Path $gmailPeopleSpec) {
    Write-Host "   Adding Google People (needs GMAIL_ACCESS_TOKEN env var)..."
    & $CoralExe source add --file $gmailPeopleSpec 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Google People source added" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Google People source already exists or needs token — skipping" -ForegroundColor Yellow
    }
}

$gmailThreadsSpec = Join-Path $RepoRoot "coral-sources\gmail-threads-source.yaml"
if (Test-Path $gmailThreadsSpec) {
    Write-Host "   Adding Gmail threads (needs GMAIL_ACCESS_TOKEN env var)..."
    & $CoralExe source add --file $gmailThreadsSpec 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Gmail threads source added" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Gmail threads source already exists or needs token — skipping" -ForegroundColor Yellow
    }
}

Write-Host ""

# ─── Step 3: Verify Setup ─────────────────────────────────────────
Write-Host "🧪 Verifying Coral setup..." -ForegroundColor Yellow
& $CoralExe source list
Write-Host ""

Write-Host "🎉 Coral setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Try running a query:"
Write-Host "  coral sql ""SELECT name, email FROM linkedin.connections LIMIT 5""" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or start MailRite and use the Coral Query panel:"
Write-Host "  npm run dev" -ForegroundColor Cyan
