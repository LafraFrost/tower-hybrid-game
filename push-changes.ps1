# push-changes.ps1
# Esegue commit e push delle modifiche. Usalo SOLO dopo aver installato/configurato git.
# Esegui da PowerShell come: .\push-changes.ps1

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

# Verifica se git è disponibile
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git non è installato o non è nel PATH. Installa Git da https://git-scm.com/download/win e riprova."
    exit 1
}

try {
    git add .
    git commit -m "Pulizia trigger miniera, rimozione duplicati, fix overlay e logica mappa completata" -q
    git push origin main
    Write-Host "Commit e push eseguiti con successo." -ForegroundColor Green
} catch {
    Write-Error "Errore durante commit/push: $_"
    exit 1
}
