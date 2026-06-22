$ErrorActionPreference = 'SilentlyContinue'
$tmp = Join-Path $env:TEMP 'bm058_verify3'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
$zip = Join-Path $env:TEMP 'bm058_verify.zip'
$src = 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058\BM-058_normalized.docx'
Copy-Item $src $zip -Force
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$docXml = Get-Content (Join-Path $tmp 'word\document.xml') -Raw -Encoding UTF8

# Find all w:t elements and show their content
$matches = [regex]::Matches($docXml, '<w:t[^>]*>([^<]*)</w:t>')
$total = $matches.Count
Write-Host "Total w:t elements: $total"

# Show the problematic one - the one containing "thangKhoiToBiCan" but with broken mustache
$found = $false
foreach ($m in $matches) {
    $content = $m.Groups[1].Value
    if ($content -like '*thangKhoiToBiCan*') {
        Write-Host "`nProblematic w:t: $($m.Value)"
        $found = $true
    }
}
if (-not $found) {
    Write-Host "`nNo 'thangKhoiToBiCan' found in w:t elements"
}

# Show paragraphs containing mustache
$paraPattern = '<w:p\b[^>]*>[\s\S]*?</w:p>'
$paraMatches = [regex]::Matches($docXml, $paraPattern)
$count = 0
foreach ($p in $paraMatches) {
    if ($p.Value -like '*{*') {
        $count++
        if ($count -le 3) {
            # Extract text nodes
            $tMatches = [regex]::Matches($p.Value, '<w:t[^>]*>([^<]*)</w:t>')
            $texts = $tMatches | ForEach-Object { $_.Groups[1].Value }
            $fullText = $texts -join ''
            if ($fullText -like '*{document*') {
                Write-Host "`nParagraph $count text: $fullText"
            }
        }
    }
}

Remove-Item $tmp -Recurse -Force
Remove-Item $zip -Force
