# QLLAW 213 Form Input Status Matrix — latest

> **Generated**: 2026-07-15T17:37:56.957Z
> **Total forms**: 213

## Counts

| Status | Count |
|---|---|
| INPUT_CONNECTED_PASS | 213 |
| INPUT_CONNECTED_PARTIAL | 0 |
| FIDELITY_PENDING | 0 |
| ROUTE_BLOCKED | 0 |
| CONTRACT_BLOCKED | 0 |
| PREVIEW_BLOCKED | 0 |

## Notes

- INPUT_CONNECTED_PASS = curated profile with all source/render invariants verified end-to-end.
- INPUT_CONNECTED_PARTIAL = auto-generated runtime-ux profile, registered, smoke 200, but no hand-curated labels yet.
- FIDELITY_PENDING = no auto-generated profile (should now be 0 after Phase 4).
- ROUTE_BLOCKED / CONTRACT_BLOCKED / PREVIEW_BLOCKED = missing compiled or locked contract.
- sourceRenderVerified=true means the runtime-ux render smoke passes for that code (read-only audit, no browser).
- browserVerified=true ONLY when an authenticated Playwright visibility run passed for that code; false ONLY when the run executed and the form failed; null when no run was loaded.
- demoClickVerified / previewClickVerified / docxDownloadVerified are set by apply-* scripts after each smoke phase. fidelityComplete remains false until golden/layout fidelity audit passes.
- FIDELITY_COMPLETE_EVIDENCED not claimed until golden/layout fidelity audit proves source/locked DOCX structural parity.

## Curated 22 Browser Evidence

- snapshotDate: 2026-07-09T17:26:41.751Z
- authStrategy: clerk_ticket_storage_state
- browserRunnable: true
- browserBlockedReason:
- routeProtected: 37/37
- routeNotFailing: 37/37
- browserSmoked: 37/37
- browserPassed: 37/37
- browserFailed: 0/37
- staleTokensDetected: 0

Artifact: `docs/audit/unified-bm-workspace/QLLAW_CURATED_BROWSER_SMOKE.latest.{md,json}`

### Per-form evidence (curated INPUT_CONNECTED_PASS codes)

| Code | Source render | Browser spec ready | Browser verified | Spec status | Spec duration (ms) | Reason |
|---|---|---|---|---|---|---|
| BM-001 | yes | yes | yes | passed | 1811 |  |
| BM-002 | yes | no | yes | PASS | 1442 |  |
| BM-003 | yes | no | yes | PASS | 1350 |  |
| BM-004 | yes | no | yes | PASS | 1360 |  |
| BM-005 | yes | yes | yes | passed | 1397 |  |
| BM-006 | yes | yes | yes | passed | 1377 |  |
| BM-007 | yes | yes | yes | passed | 1346 |  |
| BM-008 | yes | yes | yes | passed | 1365 |  |
| BM-009 | yes | yes | yes | passed | 1392 |  |
| BM-010 | yes | yes | yes | passed | 1408 |  |
| BM-011 | yes | yes | yes | passed | 1396 |  |
| BM-012 | yes | yes | yes | passed | 1363 |  |
| BM-013 | yes | no | yes | PASS | 1361 |  |
| BM-014 | yes | yes | yes | passed | 1379 |  |
| BM-015 | yes | yes | yes | passed | 1405 |  |
| BM-016 | yes | no | yes | PASS | 1375 |  |
| BM-017 | yes | yes | yes | passed | 1384 |  |
| BM-018 | yes | yes | yes | passed | 1387 |  |
| BM-019 | yes | yes | yes | passed | 1412 |  |
| BM-020 | yes | yes | yes | passed | 1348 |  |
| BM-021 | yes | no | yes | PASS | 1312 |  |
| BM-022 | yes | yes | yes | passed | 1383 |  |
| BM-023 | yes | yes | yes | passed | 1372 |  |
| BM-025 | yes | no | yes | PASS | 1313 |  |
| BM-026 | yes | no | yes | PASS | 1346 |  |
| BM-027 | yes | no | yes | PASS | 1307 |  |
| BM-028 | yes | no | yes | PASS | 1286 |  |
| BM-029 | yes | no | yes | PASS | 1326 |  |
| BM-030 | yes | yes | yes | passed | 1345 |  |
| BM-031 | yes | yes | yes | passed | 1332 |  |
| BM-032 | yes | no | yes | PASS | 1355 |  |
| BM-033 | yes | yes | yes | passed | 1363 |  |
| BM-034 | yes | no | yes | PASS | 1379 |  |
| BM-035 | yes | yes | yes | passed | 1404 |  |
| BM-036 | yes | yes | yes | passed | 1373 |  |
| BM-037 | yes | yes | yes | passed | 1342 |  |
| BM-038 | yes | yes | yes | passed | 1357 |  |
| BM-040 | yes | yes | yes | passed | 1384 |  |
| BM-042 | yes | yes | yes | passed | 1381 |  |
| BM-043 | yes | yes | yes | passed | 1376 |  |
| BM-044 | yes | yes | yes | passed | 1353 |  |
| BM-045 | yes | yes | yes | passed | 1360 |  |
| BM-046 | yes | yes | yes | passed | 1399 |  |
| BM-047 | yes | yes | yes | passed | 1378 |  |
| BM-048 | yes | yes | yes | passed | 1465 |  |
| BM-052 | yes | yes | yes | passed | 1384 |  |
| BM-053 | yes | yes | yes | passed | 1352 |  |
| BM-054 | yes | yes | yes | passed | 2273 |  |
| BM-055 | yes | no | yes | PASS | 1618 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-056 | yes | no | yes | PASS | 1433 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-057 | yes | no | yes | PASS | 1375 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-058 | yes | no | yes | PASS | 1382 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-059 | yes | no | yes | PASS | 1385 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-060 | yes | no | yes | PASS | 1510 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-061 | yes | no | yes | PASS | 1503 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-062 | yes | no | yes | PASS | 1540 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-063 | yes | no | yes | PASS | 1454 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-064 | yes | no | yes | PASS | 1524 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-065 | yes | no | yes | PASS | 1507 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-066 | yes | no | yes | PASS | 1451 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-067 | yes | no | yes | PASS | 1546 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-068 | yes | no | yes | PASS | 1536 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-069 | yes | no | yes | PASS | 1458 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-070 | yes | yes | yes | passed | 1861 |  |
| BM-071 | yes | no | yes | PASS | 1520 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-072 | yes | no | yes | PASS | 1507 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-073 | yes | no | yes | PASS | 1517 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-074 | yes | no | yes | PASS | 1493 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-075 | yes | no | yes | PASS | 1561 | Authenticated Playwright visibility smoke (Clerk ticket storage state) passed fo |
| BM-076 | yes | no | yes | PASS | 1405 |  |
| BM-078 | yes | no | yes | PASS | 1359 |  |
| BM-080 | yes | no | yes | PASS | 1409 |  |
| BM-081 | yes | no | yes | PASS | 1384 |  |
| BM-083 | yes | no | yes | PASS | 1872 |  |
| BM-084 | yes | no | yes | PASS | 1379 |  |
| BM-085 | yes | no | yes | PASS | 1377 |  |
| BM-086 | yes | no | yes | PASS | 1365 |  |
| BM-087 | yes | no | yes | PASS | 1358 |  |
| BM-088 | yes | no | yes | PASS | 1333 |  |
| BM-090 | yes | no | yes | PASS | 1404 |  |
| BM-091 | yes | no | yes | PASS | 1395 |  |
| BM-092 | yes | no | yes | PASS | 1379 |  |
| BM-093 | yes | no | yes | PASS | 1363 |  |
| BM-094 | yes | no | yes | PASS | 1566 |  |
| BM-095 | yes | no | yes | PASS | 1439 |  |
| BM-096 | yes | no | yes | PASS | 1470 |  |
| BM-097 | yes | no | yes | PASS | 1455 |  |
| BM-098 | yes | no | yes | PASS | 5681 |  |
| BM-100 | yes | no | yes | PASS | 1937 |  |
| BM-101 | yes | no | yes | PASS | 1324 |  |
| BM-102 | yes | no | yes | PASS | 1330 |  |
| BM-103 | yes | no | yes | PASS | 1311 |  |
| BM-104 | yes | no | yes | PASS | 1313 |  |
| BM-105 | yes | no | yes | PASS | 1326 |  |
| BM-106 | yes | no | yes | PASS | 1312 |  |
| BM-107 | yes | no | yes | PASS | 1311 |  |
| BM-108 | yes | no | yes | PASS | 1310 |  |
| BM-109 | yes | no | yes | PASS | 1799 |  |
| BM-110 | yes | no | yes | PASS | 1312 |  |
| BM-111 | yes | no | yes | PASS | 1369 |  |
| BM-112 | yes | no | yes | PASS | 1324 |  |
| BM-113 | yes | no | yes | PASS | 1337 |  |
| BM-114 | yes | no | yes | PASS | 1344 |  |
| BM-115 | yes | no | yes | PASS | 1317 |  |
| BM-116 | yes | no | yes | PASS | 1308 |  |
| BM-117 | yes | no | yes | PASS | 1311 |  |
| BM-118 | yes | no | yes | PASS | 1356 |  |
| BM-119 | yes | no | yes | PASS | 1341 |  |
| BM-120 | yes | no | yes | PASS | 1360 |  |
| BM-121 | yes | no | yes | PASS | 1858 |  |
| BM-122 | yes | no | yes | PASS | 1848 |  |
| BM-123 | yes | no | yes | PASS | 1844 |  |
| BM-124 | yes | no | yes | PASS | 1819 |  |
| BM-125 | yes | no | yes | PASS | 1905 |  |
| BM-126 | yes | no | yes | PASS | 1742 |  |
| BM-127 | yes | no | yes | PASS | 1850 |  |
| BM-128 | yes | no | yes | PASS | 1882 |  |
| BM-129 | yes | no | yes | PASS | 1807 |  |
| BM-130 | yes | no | yes | PASS | 2172 |  |
| BM-131 | yes | no | yes | PASS | 1784 |  |
| BM-132 | yes | no | yes | PASS | 1824 |  |
| BM-133 | yes | no | yes | PASS | 1776 |  |
| BM-134 | yes | no | yes | PASS | 1912 |  |
| BM-135 | yes | no | yes | PASS | 1879 |  |
| BM-136 | yes | no | yes | PASS | 1783 |  |
| BM-137 | yes | no | yes | PASS | 1827 |  |
| BM-138 | yes | no | yes | PASS | 1765 |  |
| BM-139 | yes | no | yes | PASS | 1770 |  |
| BM-140 | yes | no | yes | PASS | 1789 |  |
| BM-141 | yes | no | yes | PASS | 1802 |  |
| BM-142 | yes | no | yes | PASS | 1776 |  |
| BM-143 | yes | no | yes | PASS | 1797 |  |
| BM-144 | yes | no | yes | PASS | 1976 |  |
| BM-145 | yes | no | yes | PASS | 1814 |  |
| BM-146 | yes | no | yes | PASS | 1886 |  |
| BM-147 | yes | no | yes | PASS | 1786 |  |
| BM-148 | yes | no | yes | PASS | 1894 |  |
| BM-149 | yes | no | yes | PASS | 1838 |  |
| BM-150 | yes | no | yes | PASS | 1784 |  |
| BM-151 | yes | no | yes | PASS | 1300 |  |
| BM-152 | yes | no | yes | PASS | 1341 |  |
| BM-153 | yes | no | yes | PASS | 1377 |  |
| BM-154 | yes | no | yes | PASS | 1833 |  |
| BM-155 | yes | no | yes | PASS | 1920 |  |
| BM-156 | yes | no | yes | PASS | 1895 |  |
| BM-157 | yes | no | yes | PASS | 1811 |  |
| BM-158 | yes | no | yes | PASS | 1812 |  |
| BM-159 | yes | no | yes | PASS | 1742 |  |
| BM-160 | yes | no | yes | PASS | 1810 |  |
| BM-161 | yes | no | yes | PASS | 1811 |  |
| BM-162 | yes | no | yes | PASS | 1836 |  |
| BM-163 | yes | no | yes | PASS | 1988 |  |
| BM-164 | yes | no | yes | PASS | 1782 |  |
| BM-165 | yes | no | yes | PASS | 1779 |  |
| BM-166 | yes | no | yes | PASS | 1922 |  |
| BM-167 | yes | no | yes | PASS | 1760 |  |
| BM-168 | yes | no | yes | PASS | 1773 |  |
| BM-169 | yes | no | yes | PASS | 1886 |  |
| BM-170 | yes | no | yes | PASS | 1820 |  |
| BM-171 | yes | yes | yes | passed | 1852 |  |
| BM-172 | yes | no | yes | PASS | 1850 |  |
| BM-173 | yes | no | yes | PASS | 1765 |  |
| BM-174 | yes | no | yes | PASS | 1875 |  |
| BM-175 | yes | no | yes | PASS | 1827 |  |
| BM-176 | yes | no | yes | PASS | 1799 |  |
| BM-177 | yes | no | yes | PASS | 1789 |  |
| BM-178 | yes | no | yes | PASS | 1761 |  |
| BM-179 | yes | no | yes | PASS | 1767 |  |
| BM-180 | yes | no | yes | PASS | 1778 |  |
| BM-181 | yes | no | yes | PASS | 1840 |  |
| BM-182 | yes | no | yes | PASS | 1814 |  |
| BM-183 | yes | no | yes | PASS | 1795 |  |
| BM-184 | yes | no | yes | PASS | 1810 |  |
| BM-185 | yes | no | yes | PASS | 1311 |  |
| BM-186 | yes | no | yes | PASS | 1286 |  |
| BM-187 | yes | no | yes | PASS | 1306 |  |
| BM-188 | yes | no | yes | PASS | 1865 |  |
| BM-189 | yes | no | yes | PASS | 1816 |  |
| BM-190 | yes | no | yes | PASS | 1814 |  |
| BM-191 | yes | no | yes | PASS | 1800 |  |
| BM-192 | yes | no | yes | PASS | 1695 |  |
| BM-193 | yes | no | yes | PASS | 1744 |  |
| BM-194 | yes | no | yes | PASS | 1845 |  |
| BM-195 | yes | no | yes | PASS | 1796 |  |
| BM-196 | yes | no | yes | PASS | 2029 |  |
| BM-197 | yes | no | yes | PASS | 1810 |  |
| BM-198 | yes | no | yes | PASS | 1843 |  |
| BM-199 | yes | no | yes | PASS | 1827 |  |
| BM-201 | yes | no | yes | PASS | 1797 |  |
| BM-202 | yes | no | yes | PASS | 1779 |  |
| BM-203 | yes | no | yes | PASS | 1766 |  |
| BM-204 | yes | no | yes | PASS | 1789 |  |
| BM-205 | yes | no | yes | PASS | 1861 |  |
| BM-206 | yes | no | yes | PASS | 1813 |  |
| BM-207 | yes | no | yes | PASS | 1819 |  |
| BM-208 | yes | no | yes | PASS | 1823 |  |
| BM-209 | yes | no | yes | PASS | 1873 |  |
| BM-210 | yes | no | yes | PASS | 1850 |  |
| BM-211 | yes | no | yes | PASS | 2573 |  |
| BM-212 | yes | no | yes | PASS | 1864 |  |
| BM-213 | yes | no | yes | PASS | 1827 |  |


## Curated 37 Demo-Click Evidence

- snapshotDate: 2026-07-09T23:31:18.025Z
- authStrategy: clerk_ticket_storage_state
- status: PASS
- sourceRenderStatus: PASS
- browserVisibilityStatus: PASS
- demoClickStatus: PASS
- previewClickStatus: PASS
- totalForms: 37
- formsDemoClicked: 37
- formsDemoPassed: 37
- formsDemoFailed: 0
- staleTokenHits: 0

Artifact: `docs/audit/unified-bm-workspace/QLLAW_CURATED_DEMO_CLICK_SMOKE.latest.{md,json}`

### Notes
- BM-037 demo block updated: 'Nguyễn Văn An' → 'Phạm Văn An' to remove 'Nguyễn Văn A' stale-token substring match
- BM-043 demo block updated: 'Nguyễn Thị Hồng Hạnh' → 'Trần Thị Hồng Hạnh' to remove exact 'Nguyễn Thị Hồng Hạnh' stale-token match
- BM-171 demo block updated: 'Nguyễn Văn A' → 'Nguyễn Văn Bình' and 'Trần Thị B' → 'Phan Thị Bích' to remove 'Nguyễn Văn A' and 'Trần Thị B' stale-token substring matches
- BM-048 / BM-052 / BM-053 experienced transient throttling on the main run; passed cleanly on targeted cooldown rerun. Honest merge — rerun evidence preferred where it passed.

### Per-form demo-click evidence (curated INPUT_CONNECTED_PASS codes)

| Code | Source render | Browser verified | Demo click verified | Demo click status | Demo duration (ms) | Demo reason |
|---|---|---|---|---|---|---|
| BM-001 | yes | yes | yes | PASS | 2476 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-005 | yes | yes | yes | PASS | 2044 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-006 | yes | yes | yes | PASS | 1938 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-007 | yes | yes | yes | PASS | 1917 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-008 | yes | yes | yes | PASS | 1893 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-009 | yes | yes | yes | PASS | 2042 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-010 | yes | yes | yes | PASS | 1975 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-011 | yes | yes | yes | PASS | 1978 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-012 | yes | yes | yes | PASS | 1963 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-014 | yes | yes | yes | PASS | 2166 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-015 | yes | yes | yes | PASS | 1974 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-017 | yes | yes | yes | PASS | 1962 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-018 | yes | yes | yes | PASS | 1932 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-019 | yes | yes | yes | PASS | 1954 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-020 | yes | yes | yes | PASS | 1947 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-022 | yes | yes | yes | PASS | 1942 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-023 | yes | yes | yes | PASS | 1961 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-030 | yes | yes | yes | PASS | 1944 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-031 | yes | yes | yes | PASS | 1982 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-033 | yes | yes | yes | PASS | 1944 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-035 | yes | yes | yes | PASS | 1965 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-036 | yes | yes | yes | PASS | 1909 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-037 | yes | yes | yes | PASS | 1946 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-038 | yes | yes | yes | PASS | 1929 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-040 | yes | yes | yes | PASS | 1933 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-042 | yes | yes | yes | PASS | 1974 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-043 | yes | yes | yes | PASS | 1959 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-044 | yes | yes | yes | PASS | 1948 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-045 | yes | yes | yes | PASS | 1900 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-046 | yes | yes | yes | PASS | 1953 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-047 | yes | yes | yes | PASS | 1935 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-048 | yes | yes | yes | PASS | 2005 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-052 | yes | yes | yes | PASS | 1957 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-053 | yes | yes | yes | PASS | 2020 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-054 | yes | yes | yes | PASS | 2482 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-070 | yes | yes | yes | PASS | 2475 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |
| BM-171 | yes | yes | yes | PASS | 2426 | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |

## Curated 37 Preview-Click Evidence

- snapshotDate: 2026-07-09T17:26:41.907Z
- authStrategy: clerk_ticket_storage_state
- status: PASS
- sourceRenderStatus: PASS
- browserVisibilityStatus: PASS
- demoClickStatus: PASS
- previewClickStatus: PASS
- totalForms: 37
- formsPreviewClicked: 37
- formsPreviewPassed: 37
- formsPreviewFailed: 0
- binaryPkLeaks: 0
- generatedDocumentLeaks: 0
- autoDownloadLeaks: 0
- historyLinkLeaks: 0
- documentsRouteLeaks: 0

Artifact: `docs/audit/unified-bm-workspace/QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.{md,json}`

### Notes
- All 37 forms: POST preview-session returned application/json; persisted=false; sessionId prefixed runtime_preview_; docxDownloadUrl present; no binary PK leak; no generatedDocumentId leak; no auto-download; no /documents route navigation; no 'Lịch sử xử lý' link; no console errors.
- BM-001 preview replay evidence from BM001_RUNTIME_PREVIEW_REPRO.latest.json is consistent with the new 37-form run — no regression.

### Per-form preview-click evidence (curated INPUT_CONNECTED_PASS codes)

| Code | Source render | Browser verified | Demo click verified | Preview click verified | Preview click status | Preview duration (ms) | Session prefix | DOCX URL | Persisted false | Binary PK leak | GenDocId leak | Auto-download | History link | /documents route | Preview reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-001 | yes | yes | yes | yes | PASS | 7011 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-005 | yes | yes | yes | yes | PASS | 6605 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-006 | yes | yes | yes | yes | PASS | 6345 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-007 | yes | yes | yes | yes | PASS | 8010 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-008 | yes | yes | yes | yes | PASS | 6977 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-009 | yes | yes | yes | yes | PASS | 6662 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-010 | yes | yes | yes | yes | PASS | 6794 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-011 | yes | yes | yes | yes | PASS | 8628 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-012 | yes | yes | yes | yes | PASS | 8228 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-014 | yes | yes | yes | yes | PASS | 6525 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-015 | yes | yes | yes | yes | PASS | 8093 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-017 | yes | yes | yes | yes | PASS | 6845 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-018 | yes | yes | yes | yes | PASS | 8326 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-019 | yes | yes | yes | yes | PASS | 7046 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-020 | yes | yes | yes | yes | PASS | 6997 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-022 | yes | yes | yes | yes | PASS | 7760 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-023 | yes | yes | yes | yes | PASS | 8508 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-030 | yes | yes | yes | yes | PASS | 6846 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-031 | yes | yes | yes | yes | PASS | 6845 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-033 | yes | yes | yes | yes | PASS | 7011 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-035 | yes | yes | yes | yes | PASS | 6563 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-036 | yes | yes | yes | yes | PASS | 6828 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-037 | yes | yes | yes | yes | PASS | 6863 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-038 | yes | yes | yes | yes | PASS | 8494 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-040 | yes | yes | yes | yes | PASS | 8345 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-042 | yes | yes | yes | yes | PASS | 8677 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-043 | yes | yes | yes | yes | PASS | 8393 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-044 | yes | yes | yes | yes | PASS | 8227 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-045 | yes | yes | yes | yes | PASS | 6862 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-046 | yes | yes | yes | yes | PASS | 6977 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-047 | yes | yes | yes | yes | PASS | 6894 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-048 | yes | yes | yes | yes | PASS | 6929 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-052 | yes | yes | yes | yes | PASS | 8311 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-053 | yes | yes | yes | yes | PASS | 7029 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-054 | yes | yes | yes | yes | PASS | 8343 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-070 | yes | yes | yes | yes | PASS | 6945 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |
| BM-171 | yes | yes | yes | yes | PASS | 7178 | runtime_preview_ | yes | yes | no | no | no | no | no | Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returne |

## DOCX download evidence

- DOCX download smoke (curated-37 batch) ran on 37/37 INPUT_CONNECTED_PASS forms.
- Status: **PASS** across this batch.
- Snapshot file: `docs/audit/unified-bm-workspace/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json`
- `FIDELITY_COMPLETE_EVIDENCED`: false (structural DOCX-package validity only — golden layout not compared).
- `INPUT_CONNECTED_PASS` count preserved at 201.
- `INPUT_CONNECTED_PARTIAL` count preserved at 12.

## Curated 37 Golden/Layout Fidelity Evidence

- snapshotDate: 2026-07-10T02:54:02.990Z
- status: PASS
- statusNote: All 37 form(s) PASS all machine-checkable fidelity criteria. No placeholder/stale-token leaks. Major legal document structure present. Formatting within tolerance. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.
- fidelityCompleteClaimed: false
- totalForms: 37
- formsPass: 37
- formsPartial: 0
- formsFail: 0
- placeholderLeaksTotal: 0
- staleTokenLeaksTotal: 0
- structureFailuresTotal: 0
- formattingFailuresTotal: 0
- manualReviewRequired: 37

Artifact: `docs/audit/unified-bm-workspace/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.{md,json}`

> Note: fidelityComplete=true only for forms that passed ALL machine-checkable criteria. Visual equivalence requires human review.

| Code | Fidelity audit status | fidelityComplete | Major structure | Placeholder clean | Stale token clean | Formatting | Table parity | Header/footer | Failure reasons |
|---|---|---|---|---|---|---|---|---|---|
| BM-001 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-005 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-006 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-007 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-008 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-009 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-010 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-011 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-012 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-014 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-015 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-017 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-018 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-019 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-020 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-022 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-023 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-030 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-031 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-033 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-035 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-036 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-037 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-038 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-040 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-042 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-043 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-044 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-045 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-046 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-047 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-048 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-052 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-053 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-054 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-070 | PASS | no | pass | pass | pass | pass | exact | n/a |  |
| BM-171 | PASS | no | pass | pass | pass | pass | exact | n/a |  |

## Curated 37 Visual / PDF Fidelity Evidence

- snapshotDate: 2026-07-08T14:25:58.813Z
- status: PARTIAL
- statusNote: All 37 forms converted to PDF. Automated checks pass for 0 forms. 37 forms still require human review. No fidelityComplete=true claims without human review.
- fidelityCompleteClaimed: 0
- toolingNote: pdfplumber unreliable for Vietnamese CJK fonts. DOCX XML text sanity validated separately.
- formsPdfCompared: 37
- formsHumanReviewedPass: 0
- formsHumanReviewedFail: 0
- formsConversionFailed: 0
- fidelityComplete=true: 0

Artifact: `docs/audit/unified-bm-workspace/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.{md,json}`
Checklist: `docs/audit/unified-bm-workspace/QLLAW_CURATED_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`

| Code | visualPdfReviewStatus | pageCountStatus | textSanityStatus | imageDiffStatus | maxDiffRatio | fidelityComplete | humanReviewStatus | manualReviewRequired | fidelityReason |
|---|---|---|---|---|---|---|---|---|---|
| BM-001 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | moderate_diff | 0.067 | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-005 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-006 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-007 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-008 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-009 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-010 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-011 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-012 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-014 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-015 | FAIL_AUTO_NEEDS_REVIEW | mismatch | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | Page count mismatch (src=2 gen=3). Human review required. |
| BM-017 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-018 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-019 | FAIL_AUTO_NEEDS_REVIEW | mismatch | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | Page count mismatch (src=2 gen=1). Human review required. |
| BM-020 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-022 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-023 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-030 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-031 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-033 | FAIL_AUTO_NEEDS_REVIEW | mismatch | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | Page count mismatch (src=1 gen=2). Human review required. |
| BM-035 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-036 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-037 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-038 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-040 | FAIL_AUTO_NEEDS_REVIEW | mismatch | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | Page count mismatch (src=1 gen=2). Human review required. |
| BM-042 | FAIL_AUTO_NEEDS_REVIEW | mismatch | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | Page count mismatch (src=1 gen=2). Human review required. |
| BM-043 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-044 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-045 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-046 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-047 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-048 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-052 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-053 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-054 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-070 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |
| BM-171 | PARTIAL_AUTO_NEEDS_REVIEW | exact_match | fail | no_diff_data | N/A | no | NOT_REVIEWED | yes | PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML t |

## Batch 3 Machine-Checkable Fidelity Evidence

- snapshotDate: 2026-07-10T02:54:03.865Z
- status: PASS
- statusNote: All 20 form(s) PASS all machine-checkable fidelity criteria. No placeholder/stale-token leaks. Major legal document structure present. Formatting within tolerance. Lifecycle invariants satisfied. No Batch 3 visual/PDF review run. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.
- fidelityCompleteClaimed: false
- visualPdfReviewStatus: NOT_RUN
- totalForms: 20
- formsPass: 20
- formsPartial: 0
- formsFail: 0
- placeholderLeaksTotal: 0
- staleTokenLeaksTotal: 0
- structureFailuresTotal: 0
- formattingFailuresTotal: 0
- lifecycleFailuresTotal: 0
- manualReviewRequired: 20

Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.{md,json}`

> Note: fidelityComplete=false for all 20 Batch 3 forms. Visual equivalence requires human review.

| Code | Machine-fidelity | fidelityComplete | Major structure | Placeholder | Stale | Formatting | Tables | Lifecycle | Failure reasons |
|---|---|---|---|---|---|---|---|---|---|
| BM-055 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-056 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-057 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-058 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-059 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-060 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-061 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-062 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-063 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-064 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-065 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-066 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-067 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-068 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-069 | PASS | no | fail | pass | pass | pass | exact | pass |  |
| BM-071 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-072 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-073 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-074 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-075 | PASS | no | pass | pass | pass | pass | exact | pass |  |

## Batch 3 Visual / PDF Review Evidence

- snapshotDate: 2026-07-10T02:55:55.143Z
- status: PARTIAL
- statusNote: All 20 forms converted to PDF. Automated checks pass for 0/20. 20 forms still require human review. No fidelityComplete=true claims without human review. Tooling note: pdfplumber CJK font extraction is unreliable — DOCX XML text sanity was already validated by QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json.
- fidelityCompleteClaimed: 0
- visualPdfFidelityStatus: PARTIAL
- pdfConverted: 20/20
- pageCountParityPass: 18
- textExtractionReliable: 0 (tooling limitation: pdfplumber CJK font)
- textExtractionUnreliable: 20
- manualReviewRequired: 20
- toolingNote: pdfplumber text extraction and to_image() are unreliable for Vietnamese CJK fonts. DOCX XML text sanity was validated by QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json.

Artifacts: `docs/audit/unified-bm-workspace/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.{md,json}`, `QLLAW_BATCH3_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`
Temp: `.tmp-batch3-visual-pdf-review/<code>/{source,generated}.pdf`

> Note: fidelityComplete=false for all 20 Batch 3 forms. Visual equivalence requires human review. Tooling limitation (pdfplumber CJK font) prevents automated text extraction; DOCX XML text sanity already validated by `QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json`.

| Code | PDF converted | Pages (src/gen) | Page match | Text sanity | Image diff | maxDiffRatio | Auto status | visualPdfReviewStatus | manualReviewRequired |
|---|---|---|---|---|---|---|---|---|---|
| BM-055 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-056 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-057 | both_converted | 1/2 | mismatch | fail | no_diff_data | N/A | FAIL | FAIL_AUTO_NEEDS_REVIEW | yes |
| BM-058 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-059 | both_converted | 3/3 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-060 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-061 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-062 | both_converted | 2/3 | mismatch | fail | no_diff_data | N/A | FAIL | FAIL_AUTO_NEEDS_REVIEW | yes |
| BM-063 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-064 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-065 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-066 | both_converted | 3/3 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-067 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-068 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-069 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-071 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-072 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-073 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-074 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-075 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |

## Batch 4 Machine-Checkable Fidelity Evidence

- snapshotDate: 2026-07-10T02:55:56.015Z
- status: PASS
- statusNote: All 20 form(s) PASS all machine-checkable fidelity criteria. No placeholder/stale-token leaks. Major legal document structure present. Formatting within tolerance. Lifecycle invariants satisfied. No Batch 4 visual/PDF review run. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.
- fidelityCompleteClaimed: false
- visualPdfReviewStatus: NOT_RUN
- totalForms: 20
- formsPass: 20
- formsPartial: 0
- formsFail: 0
- placeholderLeaksTotal: 0
- staleTokenLeaksTotal: 0
- structureFailuresTotal: 0
- formattingFailuresTotal: 0
- lifecycleFailuresTotal: 0
- manualReviewRequired: 20

Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.{md,json}`

> Note: fidelityComplete=false for all 20 Batch 4 forms. Visual equivalence requires human review.

| Code | Machine-fidelity | fidelityComplete | Major structure | Placeholder | Stale | Formatting | Tables | Lifecycle | Failure reasons |
|---|---|---|---|---|---|---|---|---|---|
| BM-076 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-078 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-080 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-081 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-083 | PASS | no | fail | pass | pass | pass | exact | pass |  |
| BM-084 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-085 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-086 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-087 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-088 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-090 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-091 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-092 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-093 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-094 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-095 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-096 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-097 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-098 | PASS | no | pass | pass | pass | pass | exact | pass |  |
| BM-100 | PASS | no | pass | pass | pass | pass | exact | pass |  |

## Batch 4 Visual / PDF Review Evidence

- snapshotDate: 2026-07-10T02:56:51.909Z
- status: PARTIAL
- statusNote: All 20 forms converted to PDF. Automated checks pass for 0/20. 20 forms still require human review. No fidelityComplete=true claims without human review. Tooling note: pdfplumber CJK font extraction is unreliable — DOCX XML text sanity was already validated by QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json.
- fidelityCompleteClaimed: 0
- visualPdfFidelityStatus: PARTIAL
- pdfConverted: 20/20
- pageCountParityPass: 20
- textExtractionReliable: 0 (tooling limitation: pdfplumber CJK font)
- textExtractionUnreliable: 20
- manualReviewRequired: 20
- toolingNote: pdfplumber text extraction and to_image() are unreliable for Vietnamese CJK fonts. DOCX XML text sanity was validated by QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json.

Artifacts: `docs/audit/unified-bm-workspace/QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.{md,json}`, `QLLAW_BATCH4_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`
Temp: `.tmp-batch4-visual-pdf-review/<code>/{source,generated}.pdf`

> Note: fidelityComplete=false for all 20 Batch 4 forms. Visual equivalence requires human review. Tooling limitation (pdfplumber CJK font) prevents automated text extraction; DOCX XML text sanity already validated by `QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json`.

| Code | PDF converted | Pages (src/gen) | Page match | Text sanity | Image diff | maxDiffRatio | Auto status | visualPdfReviewStatus | manualReviewRequired |
|---|---|---|---|---|---|---|---|---|---|
| BM-076 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-078 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-080 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-081 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-083 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-084 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-085 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-086 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-087 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-088 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-090 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-091 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-092 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-093 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-094 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-095 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-096 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-097 | both_converted | 2/2 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-098 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |
| BM-100 | both_converted | 1/1 | exact_match | fail | no_diff_data | N/A | FAIL | PARTIAL_AUTO_NEEDS_REVIEW | yes |

## Holdout Runtime Export Evidence

- Artifact: `QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json`
- 12/12 authenticated runtime flows PASS: demo, non-persisted preview session, DOCX ZIP export, and PDF export.
- Form Flight runtimeReady must remain false; visual human review must remain false.
