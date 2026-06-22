$ErrorActionPreference = 'SilentlyContinue'
$src = 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058\BM-058_normalized_fixed.docx'
$tmp = Join-Path $env:TEMP 'bm058_verify'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
$zip = Join-Path $env:TEMP 'bm058_verify.zip'
Copy-Item $src $zip -Force
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$docXml = Get-Content (Join-Path $tmp 'word\document.xml') -Raw -Encoding UTF8
$ellipsisCount = ([regex]::Matches($docXml, [char]0x2026)).Count
$size = (Get-Item $src).Length
Write-Host "Fixed file size: $size bytes"
Write-Host "Ellipsis remaining: $ellipsisCount"
Remove-Item $tmp -Recurse -Force
Remove-Item $zip -Force
