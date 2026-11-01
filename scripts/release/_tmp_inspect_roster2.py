import re
txt = open(r'packages\form-contracts\src\runtime-readiness.generated.ts', encoding='utf-8').read()
codes = re.findall(r'formCode: "([^"]+)"', txt)
print('total entries in generated roster:', len(codes))
print('first 10:', codes[:10])
print('last 10:', codes[-10:])

# Check the other runtime-readiness files
import os
for root, _, files in os.walk(r'packages\form-contracts\src'):
    for f in files:
        if 'runtime-ready' in f.lower() or 'runtime-ready' in root.lower():
            print('FILE:', os.path.join(root, f))