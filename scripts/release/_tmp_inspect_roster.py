import re
txt = open(r'packages\form-contracts\src\runtime-readiness.generated.ts', encoding='utf-8').read()
codes = re.findall(r'formCode: "([^"]+)"', txt)
print('total entries:', len(codes))
print('BM-025 in roster:', 'BM-025' in codes)
print('BM-200 in roster:', 'BM-200' in codes)
shas = re.findall(r'evidenceSha256: "([a-f0-9]+)"', txt)
short = [(s, len(s)) for s in shas if len(s) != 64]
print('non-64-char SHA entries:', len(short))
for s, n in short[:10]:
    print(' ', s, 'len=', n)
# find BM-025 entry
m = re.search(r'\{[^{}]*BM-025[^{}]*\}', txt, re.DOTALL)
if m:
    print('--- BM-025 entry ---')
    print(m.group(0))