import { createWriteStream, createReadStream, existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { join, relative, extname } from 'node:path';

const baseDir = 'D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058';
const fixedXml = join(baseDir, '_extract058', 'word', 'document.xml');
const tmpOrig = join(baseDir, '_orig_extract');
const outDocx = join(baseDir, 'BM-058_normalized_fixed2.docx');

// Clean tmp
if (existsSync(tmpOrig)) rmSync(tmpOrig, { recursive: true });
mkdirSync(tmpOrig, { recursive: true });

// Extract original to tmpOrig
const origDocx = join(baseDir, 'BM-058_normalized.docx');
const { execSync } = await import('node:child_process');
execSync(`powershell -Command "Expand-Archive -Path '${origDocx}' -DestinationPath '${tmpOrig}' -Force"`, { stdio: 'pipe' });

// Replace document.xml
const origDocXml = join(tmpOrig, 'word', 'document.xml');
const fixedXmlContent = readFileSync(fixedXml);
writeFileSync(origDocXml, fixedXmlContent);
console.log('Replaced document.xml');

// Create new zip using proper DOCX structure
// DOCX needs: [Content_Types].xml at root, _rels/.rels, word/, etc.
const archiver = await import('node:archive').catch(() => null);

if (archiver) {
  // Use node:archive
  const { Archive } = archiver;
  const archive = new Archive();
  // Add all files from tmpOrig
  function addDir(dir, base) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const rel = relative(base, full).replace(/\\/g, '/');
      const stat = statSync(full);
      if (stat.isDirectory()) {
        addDir(full, base);
      } else {
        const data = readFileSync(full);
        archive.append(data, { name: rel });
      }
    }
  }
  addDir(tmpOrig, tmpOrig);

  const out = createWriteStream(outDocx);
  await pipeline(archive, createGzip(), out);
  console.log('Created DOCX with node:archive');
} else {
  // Fallback: use powershell Compress-Archive with proper file ordering
  // Need to put [Content_Types].xml first
  // Create a staging dir with files in correct order
  const staging = join(baseDir, '_staging');
  if (existsSync(staging)) rmSync(staging, { recursive: true });
  mkdirSync(staging, { recursive: true });

  // Copy all files from tmpOrig to staging
  function copyDir(src, dst) {
    mkdirSync(dst, { recursive: true });
    for (const entry of readdirSync(src)) {
      const s = join(src, entry);
      const d = join(dst, entry);
      if (statSync(s).isDirectory()) {
        copyDir(s, d);
      } else {
        copyFileSync(s, d);
      }
    }
  }
  copyDir(tmpOrig, staging);

  // Repack using PowerShell with store compression (no compression = 0)
  execSync(
    `powershell -Command "Compress-Archive -Path '${staging}\\*' -DestinationPath '${outDocx}' -CompressionLevel NoCompression -Force"`,
    { stdio: 'pipe' }
  );
  rmSync(staging, { recursive: true });
  console.log('Created DOCX with PowerShell NoCompression');
}

// Cleanup
rmSync(tmpOrig, { recursive: true });
rmSync(fixedXml, { recursive: true }); // remove the fixed docXml (we don't need it separately)
rmSync(join(baseDir, '_extract058'), { recursive: true });
rmSync(join(baseDir, '_extract058.zip'), { force: true });

const { statSync: s } = await import('node:fs');
console.log(`\nOutput: ${outDocx}`);
console.log(`Size: ${s(outDocx).size} bytes`);
