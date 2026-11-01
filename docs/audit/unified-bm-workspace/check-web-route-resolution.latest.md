# Web Route Resolution Audit

Base URL: `http://localhost:3000`
Generated: 2026-07-07T17:13:44.972Z

| Route | Expected | Status | Bucket | return_url | OK |
| --- | --- | --- | --- | --- | --- |
| `/sign-in` | auth-public | 200 | auth-public | — | PASS |
| `/sign-up` | auth-public | 200 | auth-public | — | PASS |
| `/templates/BM-001` | redirect-to-signin | 200 | redirect-to-signin | — | PASS |
| `/templates/BM-171` | redirect-to-signin | 200 | redirect-to-signin | — | PASS |
| `/templates/BM-002` | redirect-to-signin | 200 | redirect-to-signin | — | PASS |

## Verdict

All routes resolved correctly. No global not-found boundary detected.
