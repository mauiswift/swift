<#
.SYNOPSIS
    Purge sensitive files from git history using git-filter-repo and force-push the cleaned repository.

.DESCRIPTION
    This script performs a mirror clone of the repository, removes the listed sensitive files from the entire git history,
    and then force-pushes the cleaned branches and tags back to the remote.

    IMPORTANT: This rewrites git history. All collaborators will need to re-clone or reset their local copies after this.

.PARAMETER RemoteUrl
    The Git remote URL to use for the mirror clone.
    Default: git@github.com:PayBot-PH/paybot.git

.EXAMPLE
    .\purge-git-history-secrets.ps1

    .\purge-git-history-secrets.ps1 -RemoteUrl https://github.com/PayBot-PH/paybot.git
#>

param(
    [string]$RemoteUrl = 'git@github.com:PayBot-PH/paybot.git',
    [string]$MirrorDir = 'paybot.git.mirror'
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Ensure-Command {
    param(
        [string]$Name,
        [string]$CheckCmd,
        [string]$InstallHint
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "$Name is not installed or not in PATH. $InstallHint"
        exit 1
    }
}

Write-Step 'Checking prerequisites'
Ensure-Command -Name git -CheckCmd 'git --version' -InstallHint 'Install Git from https://git-scm.com/downloads.'
Ensure-Command -Name python -CheckCmd 'python --version' -InstallHint 'Install Python 3.11+ from https://www.python.org/downloads/'.

Write-Step 'Creating fresh mirror clone'
if (Test-Path $MirrorDir) {
    Write-Host "Removing existing mirror directory: $MirrorDir"
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $MirrorDir
}

git clone --mirror $RemoteUrl $MirrorDir

Write-Step 'Ensuring git-filter-repo is available'
$filterRepoOk = $false
try {
    python -m git_filter_repo --help > $null 2>&1
    $filterRepoOk = $true
} catch {
    Write-Host 'git-filter-repo not found; installing via pip --user'
    python -m pip install --user git-filter-repo
    python -m git_filter_repo --help > $null 2>&1
    $filterRepoOk = $true
}

if (-not $filterRepoOk) {
    Write-Error 'git-filter-repo could not be installed or found.'
    exit 1
}

Write-Step 'Running git-filter-repo to remove sensitive files from history'
Set-Location $MirrorDir

python -m git_filter_repo --invert-paths \
    --paths private_key_env.txt \
    --paths merchant_private.pem \
    --paths merchant_private_pkcs8.pem \
    --paths RSA.pem \
    --paths backend/core/mask_crypto.py \
    --paths backend/.env \
    --force

Write-Step 'Pushing cleaned history to remote'
git push --force --all
git push --force --tags

Write-Step 'Success'
Write-Host 'History rewrite is complete. You must rotate all exposed secrets immediately.' -ForegroundColor Yellow
Write-Host 'After the force-push, every local clone must be reset or recloned:'
Write-Host '  git fetch origin --prune'
Write-Host '  git checkout main'
Write-Host '  git reset --hard origin/main'
Write-Host '  git reflog expire --expire=now --all'
Write-Host '  git gc --prune=now --aggressive'
Write-Host 'Or simply reclone from the remote.'
