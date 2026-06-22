import PizZip from 'pizzip';
import { readFileSync, writeFileSync } from 'node:fs';

function fixDocx(filePath) {
  const buf = readFileSync(filePath);
  const zip = new PizZip(buf);
  const docEntry = zip.file('word/document.xml');
  if (!docEntry) { console.log('  No document.xml'); return; }
  let xml = docEntry.asText();
  const originalXml = xml;

  // Find the split pattern:
  // </w:t>}</w:r><w:r>...<w:rPr>...<w:t>} </w:t></w:r>
  // This represents: prev run ends with {{field and next run is just }
  //
  // Fix strategy: use string operations on the raw XML
  // 1. Find </w:t>} </w:t></w:r><w:r>...<w:rPr>...<w:t>} </w:t></w:r>
  // 2. Replace with </w:t>}} </w:t></w:r>  (remove the isolated } run)

  let totalReplacements = 0;

  // Use string search to find isolated } runs
  // An isolated } run: </w:t>} </w:t></w:r><w:r>...[PROPS]...<w:t>} </w:t></w:r>
  // We look for </w:t>} followed by </w:r><w:r> (adjacent runs)
  while (true) {
    // Find </w:t>}</w:r> pattern (prev run has content ending with })
    const tClosePattern = /<\/w:t>\}\s*<\/w:r><w:r>/g;
    const matches = [...xml.matchAll(tClosePattern)];
    if (matches.length === 0) break;

    let madeChange = false;
    for (const match of matches) {
      const closeTIdx = match.index + match[0].indexOf('}');
      // Check if the </w:t> before this } ends with {
      const beforeT = xml.slice(Math.max(0, closeTIdx - 2000), closeTIdx);
      const lastCloseT = beforeT.lastIndexOf('</w:t>');
      const tContent = beforeT.slice(lastCloseT + 7);
      const textBeforeClose = tContent.replace(/<[^>]+>/g, '');

      if (textBeforeClose.endsWith('{')) {
        // Found split! Now find and remove the isolated } run
        // The isolated run is: </w:r><w:r>...<w:rPr>...<w:t>} </w:t></w:r>
        // Find </w:r> that starts the isolated run
        const isolatedStart = xml.indexOf('</w:r><w:r>', closeTIdx);
        if (isolatedStart < 0 || isolatedStart > closeTIdx + 100) {
          // Try finding the next </w:r> after closeTIdx
          const nextRunStart = xml.indexOf('<w:r>', closeTIdx);
          if (nextRunStart > closeTIdx && nextRunStart < closeTIdx + 100) {
            // Find the </w:r> that closes this run
            const isolatedRunEnd = xml.indexOf('</w:r>', nextRunStart);
            if (isolatedRunEnd > nextRunStart) {
              // Check if this run contains only }
              const isolatedRun = xml.slice(nextRunStart, isolatedRunEnd + 6);
              const isolatedT = isolatedRun.match(/<w:t[^>]*>([\s\S]*)<\/w:t>/);
              if (isolatedT && isolatedT[1].trim() === '}') {
                // Merge: remove the isolated run and fix the previous }
                // Change </w:t>} to </w:t>}}
                xml = xml.slice(0, closeTIdx) + '}}' + xml.slice(closeTIdx + 1);
                // Remove isolated run
                const newIsolatedStart = xml.indexOf('<w:r>', closeTIdx + 1);
                const newIsolatedEnd = xml.indexOf('</w:r>', newIsolatedStart) + 6;
                xml = xml.slice(0, newIsolatedStart) + xml.slice(newIsolatedEnd);
                madeChange = true;
                totalReplacements++;
              }
            }
          }
        }
      }
    }
    if (!madeChange) break;
  }

  if (totalReplacements === 0) {
    console.log('  No changes');
    return;
  }

  console.log(`  Applied ${totalReplacements} merge(s)`);

  const newZip = new PizZip();
  for (const [name, file] of Object.entries(zip.files)) {
    if (file.name === 'word/document.xml') {
      newZip.file(name, xml);
    } else {
      newZip.file(name, file.asNodeBuffer());
    }
  }
  writeFileSync(filePath, newZip.generate({ compression: 'DEFLATE', type: 'nodebuffer' }));
  console.log('  Fixed');
}

const fixes = {
  'BM-031': 'storage/templates/normalized-docx/BM-031/BM-031_normalized.docx',
  'BM-044': 'storage/templates/normalized-docx/BM-044/BM-044_normalized.docx',
  'BM-056': 'storage/templates/normalized-docx/BM-056/BM-056_normalized.docx',
  'BM-059': 'storage/templates/normalized-docx/BM-059/BM-059_normalized.docx',
};

for (const [code, path] of Object.entries(fixes)) {
  console.log(`Fixing ${code}...`);
  fixDocx(path);
}
