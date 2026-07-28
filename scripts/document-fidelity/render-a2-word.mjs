// A2 Stage A2  render every candidate DOCX through Microsoft Word COM.
// Each form is rendered in a fresh Word instance with a bounded timeout so
// that a single hung document cannot freeze the entire pipeline.
import { spawnSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';

const ROOT = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const FORMS = ['BM-001','BM-136','BM-148','BM-156','BM-157','BM-168','BM-171','BM-174','BM-181','BM-206','BM-213'];
const OUT_ROOT = join(ROOT, '.tmp-document-fidelity-fix', 'candidate-render');
const TIMEOUT_MS = 75_000;

function relativePath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

function describeFile(path) {
  const stat = statSync(path);
  return { path: relativePath(path), sizeBytes: stat.length, modifiedAt: stat.mtime.toISOString() };
}

async function main() {
  const startedAt = new Date().toISOString();
  const records = [];
  for (const form of FORMS) {
    const candidatePath = join(ROOT, '.tmp-document-fidelity-fix', form, `${form}_normalized.candidate.docx`);
    const outDir = join(OUT_ROOT, form, 'word');
    mkdirSync(outDir, { recursive: true });
    const pdfPath = join(outDir, `${form}_normalized.candidate.pdf`);
    const scriptPath = join(outDir, `${form}_word_render.ps1`);
    const safeCandidate = candidatePath.replaceAll("'", "''");
    const safePdf = pdfPath.replaceAll("'", "''");
    const script = `$ErrorActionPreference='Stop'\n$word=$null;$document=$null\ntry{$word=New-Object -ComObject Word.Application;$word.Visible=$false;$word.DisplayAlerts=0;$document=$word.Documents.Open('${safeCandidate}',$false,$true);$document.ExportAsFixedFormat('${safePdf}',17);Write-Output 'OK'}catch{Write-Output ('ERROR:'+$_.Exception.Message);exit 2}finally{if($document){try{$document.Close(0)}catch{};[System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($document)|Out-Null};if($word){try{$word.Quit()}catch{};[System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)|Out-Null};[GC]::Collect();[GC]::WaitForPendingFinalizers()}\n`;
    writeFileSync(scriptPath, script, 'utf8');
    let run = null;
    try {
      run = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], { encoding: 'utf8', timeout: TIMEOUT_MS });
    } catch (err) {
      run = { status: null, stdout: '', stderr: err.message };
    }
    const ok = run.status === 0 && run.stdout && run.stdout.trim().endsWith('OK');
    const pdfExists = (() => { try { statSync(pdfPath); return true; } catch { return false; } })();
    const record = {
      formCode: form,
      candidate: describeFile(candidatePath),
      pdfPath: relativePath(pdfPath),
      pdfExists,
      exitCode: run.status,
      stdout: (run.stdout ?? '').trim(),
      stderr: (run.stderr ?? '').trim(),
      renderResult: ok && pdfExists ? 'PASS' : 'FAIL',
    };
    if (pdfExists) {
      record.pdf = describeFile(pdfPath);
    }
    records.push(record);
    try {
      spawnSync('powershell', ['-NoProfile', '-Command', "Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddMinutes(-2) } | Stop-Process -Force"], { encoding: 'utf8', timeout: 10_000 });
    } catch { /* ignore */ }
    await wait(200);
  }
  const output = {
    generatedAt: startedAt,
    completedAt: new Date().toISOString(),
    renderer: 'Microsoft Word COM',
    rendererExecutable: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
    records,
    passCount: records.filter((record) => record.renderResult === 'PASS').length,
    failCount: records.filter((record) => record.renderResult !== 'PASS').length,
  };
  mkdirSync(OUT_ROOT, { recursive: true });
  const outPath = join(OUT_ROOT, 'word-render-results.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath: relativePath(outPath), passCount: output.passCount, failCount: output.failCount, verdicts: Object.fromEntries(records.map((record) => [record.formCode, record.renderResult])) }, null, 2));
  process.exitCode = output.failCount === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
