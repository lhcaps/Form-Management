$ErrorActionPreference = 'SilentlyContinue'
$tmp = Join-Path $env:TEMP 'bm058_verify2'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
$zip = Join-Path $env:TEMP 'bm058_verify.zip'
$src = 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058\BM-058_normalized.docx'
Copy-Item $src $zip -Force
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$docXml = Get-Content (Join-Path $tmp 'word\document.xml') -Raw -Encoding UTF8

# Find all mustache placeholders
$matches = [regex]::Matches($docXml, '\{\{document\.([^}]+)\}\}')
$placeholders = $matches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Host "All placeholders in fixed DOCX:"
$placeholders | ForEach-Object { Write-Host "  - document.$_" }

# Check for old generic names
$oldGeneric = @('field1','field2','field3','field4','field5','field6','field7','field8','field9','field10')
$oldFound = $placeholders | Where-Object { $oldGeneric -contains $_ }
if ($oldFound) {
    Write-Host "`nOLD GENERIC NAMES STILL IN DOCX: $($oldFound -join ', ')"
} else {
    Write-Host "`nNo old generic names found - all placeholders are semantic"
}

Remove-Item $tmp -Recurse -Force
Remove-Item $zip -Force
