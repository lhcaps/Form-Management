$repoRoot = "D:\Study\Project\QLLaw-main"
$mustacheBMs = @()
$otherBMs = @()
for ($i = 1; $i -le 213; $i++) {
    $code = "BM-{0:D3}" -f $i
    $docx = "$repoRoot\storage\templates\normalized-docx\$code\$($code)_normalized.docx"
    if (Test-Path $docx) {
        try {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            $zip = [System.IO.Compression.ZipFile]::OpenRead($docx)
            $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
            if ($entry) {
                $sr = New-Object System.IO.StreamReader($entry.Open())
                $xml = $sr.ReadToEnd()
                $sr.Close()
                $zip.Dispose()
                $mustacheCount = ([regex]::Matches($xml, '\{\{[^}]+\}\}') | Measure-Object).Count
                $ellipsisCount = ([regex]::Matches($xml, '…') | Measure-Object).Count
                $dotlineCount = ([regex]::Matches($xml, '\.{5,}') | Measure-Object).Count
                $line = "$code|$mustacheCount|$ellipsisCount|$dotlineCount"
                if ($mustacheCount -gt 0) {
                    $mustacheBMs += $line
                } else {
                    $otherBMs += $line
                }
            }
        } catch {
            "$code|ERROR"
        }
    } else {
        "$code|NOT_FOUND"
    }
}
"MUSTACHE_BMs:"
$mustacheBMs | Sort-Object
"OTHER_BMs:"
$otherBMs | Sort-Object
