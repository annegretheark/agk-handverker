$SupabaseUrl = "https://amsmdvjdmfvreueixsbv.supabase.co"
$SupabaseKey = "sb_publishable_A4gGBB7DiiEnFuog5mFQ1A_o8rIwIsI"

$BackupMappe = "C:\SupabaseBackup\handverker_" + (Get-Date -Format "yyyy-MM-dd_HH-mm")
New-Item -ItemType Directory -Force -Path $BackupMappe | Out-Null

$Tabeller = @(
    "firma",
    "kunder",
    "ansatte",
    "prosjekter",
    "timer",
    "varer",
    "fakturaer",
    "faktura_varer",
    "faktura_utlegg"
)

$Headers = @{
    "apikey" = $SupabaseKey
    "Authorization" = "Bearer $SupabaseKey"
    "Accept" = "text/csv"
}

foreach ($Tabell in $Tabeller) {

    Write-Host "Tar backup av $Tabell ..."

    $Url = "$SupabaseUrl/rest/v1/$Tabell`?select=*"

    try {

        $Fil = Join-Path $BackupMappe "$Tabell.csv"

        Invoke-WebRequest `
            -Uri $Url `
            -Headers $Headers `
            -Method Get `
            -OutFile $Fil

        Write-Host "OK: $Fil"

    }
    catch {
        Write-Host "FEIL på $Tabell : $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "Backup ferdig:"
Write-Host $BackupMappe