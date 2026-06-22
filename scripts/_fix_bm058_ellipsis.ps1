$ErrorActionPreference = 'Stop'

$baseDir = 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058'
$extractDir = Join-Path $baseDir '_extract058'
$outZip = Join-Path $baseDir '_fixed.zip'
$outDocx = Join-Path $baseDir 'BM-058_normalized_fixed.docx'
$originalDocx = Join-Path $baseDir 'BM-058_normalized.docx'

Write-Host "Step 1: Create new zip from extracted folder"
if (Test-Path $outZip) { Remove-Item $outZip -Force }
Compress-Archive -Path "$extractDir\*" -DestinationPath $outZip -CompressionLevel Optimal -Force

Write-Host "Step 2: Replace document.xml in original docx"
# Extract original to temp
$tempDir = Join-Path $baseDir '_temp_orig'
if (Test-Path $tempDir) { Remove-Item $tempDir -Force -Recurse }
$tempZip = Join-Path $baseDir '_temp_orig.zip'
Copy-Item $originalDocx $tempZip -Force
Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force

# Replace document.xml
$origDocXml = Join-Path $tempDir 'word\document.xml'
$newDocXml = Join-Path $extractDir 'word\document.xml'
Copy-Item $newDocXml $origDocXml -Force

Write-Host "Step 3: Repack as docx"
$finalZip = Join-Path $baseDir '_final_fixed.zip'
if (Test-Path $finalZip) { Remove-Item $finalZip -Force }
Compress-Archive -Path "$tempDir\*" -DestinationPath $finalZip -CompressionLevel Optimal -Force

if (Test-Path $outDocx) { Remove-Item $outDocx -Force }
Move-Item $finalZip $outDocx -Force

Write-Host "Step 4: Cleanup"
Remove-Item $tempDir -Force -Recurse
Remove-Item $tempZip -Force
Remove-Item $outZip -Force
Remove-Item (Join-Path $baseDir '_extract058.zip') -Force -ErrorAction SilentlyContinue

Write-Host "Done! Output: $outDocx"
