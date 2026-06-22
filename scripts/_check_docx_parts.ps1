$src = 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058\BM-058_normalized_fixed.docx'
$tmp = Join-Path $env:TEMP 'bm058_check_fix'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
$zip = Join-Path $env:TEMP 'bm058_check.zip'
Copy-Item $src $zip -Force
Expand-Archive -Path $zip -DestinationPath $tmp -Force

Write-Host '=== Files in fixed DOCX ==='
Get-ChildItem $tmp -Recurse | Select-Object FullName, Length | Format-Table FullName, Length -AutoSize

Write-Host '=== Word parts ==='
$wordDir = Join-Path $tmp 'word'
if (Test-Path $wordDir) {
    Get-ChildItem $wordDir | Select-Object Name, Length | Format-Table Name, Length -AutoSize
}

$origZip = Join-Path $env:TEMP 'orig_check.zip'
Copy-Item 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058\BM-058_normalized.docx' $origZip -Force
$origTmp = Join-Path $env:TEMP 'orig_check'
if (Test-Path $origTmp) { Remove-Item $origTmp -Recurse -Force }
Expand-Archive -Path $origZip -DestinationPath $origTmp -Force
Write-Host '=== Original word parts ==='
Get-ChildItem (Join-Path $origTmp 'word') | Select-Object Name, Length | Format-Table Name, Length -AutoSize

Remove-Item $tmp -Recurse -Force
Remove-Item $origTmp -Recurse -Force
Remove-Item $zip -Force
Remove-Item $origZip -Force
