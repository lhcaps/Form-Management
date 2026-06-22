codes = @('BM-021', 'BM-022', 'BM-024', 'BM-026', 'BM-028', 'BM-032', 'BM-034', 'BM-035', 'BM-041', 'BM-049', 'BM-050', 'BM-005', 'BM-006', 'BM-007')
foreach (code in codes) {
    docx = 'D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\' + code + '\' + code + '_normalized.docx'
    if (Test-Path docx) {
        try {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            zip = [System.IO.Compression.ZipFile]::OpenRead(docx)
            entry = zip.Entries | Where-Object { _.FullName -eq 'word/document.xml' }
            if (entry) {
                sr = New-Object System.IO.StreamReader(entry.Open())
                xml = sr.ReadToEnd()
                sr.Close()
                zip.Dispose()
                mustache = ([regex]::Matches(xml, '\{\{[^}]+\}\}') | Measure-Object).Count
                ellipsis = ([regex]::Matches(xml, '…') | Measure-Object).Count
                dotline = ([regex]::Matches(xml, '\.{5,}') | Measure-Object).Count
                Write-Output (code + '|' + mustache + '|' + ellipsis + '|' + dotline)
            } else {
                Write-Output (code + '|NO_DOCUMENT_XML')
            }
        } catch {
            Write-Output (code + '|ERROR: ' + _)
        }
    } else {
        Write-Output (code + '|NOT_FOUND')
    }
}