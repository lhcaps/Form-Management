// WordSidecar.js — isolated DOCX → PDF rendering sidecar
//
// Run via cscript:
//   cscript //nologo WordSidecar.js "<input.docx>" "<output.pdf>"
//
// Behaviour:
//   - Uses Word.Application COM to convert one DOCX to PDF.
//   - Visible = false, DisplayAlerts = 0.
//   - Opens read-only.
//   - Quits Word and releases COM references in finally.
//   - Writes a structured JSON status line to STDOUT:
//       {"ok":true,"input":...,"output":...,"method":"word.com","elapsedMs":N}
//     or
//       {"ok":false,"error":"...","input":"...","output":"..."}
//   - Exit code 0 only on success.

function jsonEscape(s) {
    if (s == null) return 'null';
    return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function emit(status) {
    var parts = [];
    for (var k in status) {
        var v = status[k];
        if (typeof v === 'string') {
            parts.push('"' + k + '":' + jsonEscape(v));
        } else if (typeof v === 'number' || typeof v === 'boolean') {
            parts.push('"' + k + '":' + v);
        } else {
            parts.push('"' + k + '":null');
        }
    }
    WScript.StdOut.WriteLine('{' + parts.join(',') + '}');
}

var fso = new ActiveXObject('Scripting.FileSystemObject');

if (WScript.Arguments.length < 2) {
    emit({ ok: false, error: 'usage: WordSidecar.js <input.docx> <output.pdf>' });
    WScript.Quit(2);
}

var inputPath = WScript.Arguments(0);
var outputPath = WScript.Arguments(1);

var startTime = (new Date()).getTime();
var status = { ok: false, input: inputPath, output: outputPath, method: 'word.com' };

if (!fso.FileExists(inputPath)) {
    status.error = 'input file not found';
    emit(status);
    WScript.Quit(3);
}

var word = null;
var doc = null;
var exitCode = 1;
try {
    word = new ActiveXObject('Word.Application');
    word.Visible = false;
    word.DisplayAlerts = 0; // wdAlertsNone

    // Open read-only
    doc = word.Documents.Open(inputPath, false, true); // ConfirmConversions, ReadOnly
    if (doc == null) throw new Error('Word.Documents.Open returned null');

    // Save as PDF (wdFormatPDF = 17)
    doc.SaveAs(outputPath, 17);

    status.ok = true;
    status.elapsedMs = (new Date()).getTime() - startTime;
    exitCode = 0;
} catch (e) {
    status.error = (e && e.message) ? e.message : String(e);
    status.elapsedMs = (new Date()).getTime() - startTime;
} finally {
    try { if (doc != null) doc.Close(false); } catch (_) {}
    try { if (word != null) word.Quit(); } catch (_) {}
    // Force COM object release
    doc = null;
    word = null;
    // Best-effort GC nudge
    try { CollectGarbage(); } catch (_) {}
}
// WScript.Quit inside try/catch can bypass the finally cleanup on cscript.
// Emit and exit only after Word and document COM objects are released.
emit(status);
WScript.Quit(exitCode);
