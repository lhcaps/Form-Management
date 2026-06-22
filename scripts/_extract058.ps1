$baseDir = 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058'
$origDocx = Join-Path $baseDir 'BM-058_normalized.docx'
$extractDir = Join-Path $baseDir '_extract058'
$tempZip = Join-Path $baseDir '_extract058.zip'

if (Test-Path $extractDir) { Remove-Item $extractDir -Force -Recurse }
if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
Copy-Item $origDocx $tempZip -Force
Expand-Archive -Path $tempZip -DestinationPath $extractDir -Force
Write-Host 'Re-extracted to _extract058'
