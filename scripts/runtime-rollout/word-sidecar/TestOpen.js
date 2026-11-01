var fso = new ActiveXObject('Scripting.FileSystemObject');

if (WScript.Arguments.length < 1) {
    WScript.StdOut.WriteLine('usage: TestOpen.js <input.docx>');
    WScript.Quit(2);
}

var inputPath = WScript.Arguments(0);
WScript.StdOut.WriteLine('opening ' + inputPath);

var word = null;
var doc = null;
var exitCode = 1;
try {
    word = new ActiveXObject('Word.Application');
    word.Visible = false;
    word.DisplayAlerts = 0;
    WScript.StdOut.WriteLine('Word app created');

    doc = word.Documents.Open(inputPath, false, true);
    WScript.StdOut.WriteLine('doc opened: ' + (doc != null));

    var count = doc.Paragraphs.Count;
    WScript.StdOut.WriteLine('paragraph count: ' + count);

    doc.Close(false);
    WScript.StdOut.WriteLine('OK');
    exitCode = 0;
} catch (e) {
    WScript.StdOut.WriteLine('ERROR: ' + e.message);
} finally {
    try { if (doc != null) doc.Close(false); } catch (_) {}
    try { if (word != null) word.Quit(); } catch (_) {}
    doc = null;
    word = null;
}
WScript.Quit(exitCode);
