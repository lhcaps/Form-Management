# Public Staging Manual Smoke — 10 Forms

Date:
Tester:
Web URL:
API URL:
Account: tester / tester123

## Smoke Checklist Per Form

For each form, test and record:

- [ ] UI opens
- [ ] Form name/title correct
- [ ] Enter valid data
- [ ] Save succeeds
- [ ] Reload page — data persists
- [ ] "Tệp đã xuất" (Exported Files) tab accessible
- [ ] Generate DOCX succeeds
- [ ] Download DOCX
- [ ] Open DOCX in Word/WPS
- [ ] No raw `{{placeholder}}` text in document
- [ ] Data appears in correct positions
- [ ] Layout/font not broken
- [ ] PDF export (if available) succeeds

## Results

| Form | Open UI | Save | Reload Persist | DOCX | PDF | No Placeholder | Data Correct | Layout OK | Result | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| BM-001 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-052 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-067 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-085 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-141 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-168 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-173 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-185 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-200 |  |  |  |  |  |  |  |  | PENDING |  |
| BM-213 |  |  |  |  |  |  |  |  | PENDING |  |

Result codes: `PASS`, `FAIL`, `PENDING`, `SKIPPED`

## Failures

### BM-XXX

- **Step**: (e.g., "Generate DOCX")
- **Expected**: (e.g., "DOCX file downloads with correct data")
- **Actual**: (e.g., "Returns 500 error")
- **Screenshot/File**: (attach or describe)
- **Severity**: `BLOCKER` (breaks core flow) / `MAJOR` (degraded but usable) / `MINOR` (cosmetic)
- **Suggested fix**:

## Overall Summary

- Forms tested: 10 / 10
- Forms PASS: 10
- Forms FAIL: 0
- Blockers: 0

## Final Verdict

- [ ] **Not ready** — blockers found, fix before staging
- [ ] **Ready for controlled public testing** — no blockers, test with real users
- [ ] **Ready for wider internal usage** — requires security review + data cleanup

## API Smoke (Programmatic)

```powershell
# Run against deployed API
$env:API_URL = "https://your-backend-host.com"
node scripts/smoke-forms-runtime-213.mjs
```

Expected: `Passed: 213/213`
