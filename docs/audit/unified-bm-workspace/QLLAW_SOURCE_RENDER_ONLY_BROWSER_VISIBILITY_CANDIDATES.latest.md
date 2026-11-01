# QLLAW Source/Render-Only Browser Visibility Candidates - latest

> Generated: 2026-07-10T08:48:53.690Z
> Status: PASS
> Selected: 124
> Skipped (already browserVerified): 77
> Skipped (12 PARTIAL holdouts, none eligible): 12

## Selection Strategy

- Read 213-row matrix from QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json.
- Hard gate: status === INPUT_CONNECTED_PASS.
- Hard gate: sourceRenderVerified === true.
- Hard gate: browserVerified NOT_RUN / false / null / undefined (unless EXPLICIT_REVERIFY=true).
- Hard gate: NOT in 12 PARTIAL holdout set (BM-024, BM-039, BM-041, BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-089, BM-099, BM-200).
- Records source-batch provenance per row (curated-37 / batch3..batch9 / remaining-source-render-sweep).
- No target count is hardcoded. Selection is fully data-driven from the matrix.
- No DOCX/template/contract/DB/schema mutation is performed by this selector.

## Selected Candidates

| Code | Batch | browserVerified (before) | status (before) |
|---|---|---|---|
| BM-002 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-003 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-004 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-013 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-016 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-021 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-025 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-026 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-027 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-028 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-029 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-032 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-034 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-101 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-102 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-103 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-104 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-105 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-106 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-107 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-108 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-109 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-110 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-111 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-112 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-113 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-114 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-115 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-116 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-117 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-118 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-119 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-120 | batch5 | false | INPUT_CONNECTED_PASS |
| BM-121 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-122 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-123 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-124 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-125 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-126 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-127 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-128 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-129 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-130 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-131 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-132 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-133 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-134 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-135 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-136 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-137 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-138 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-139 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-140 | batch6 | false | INPUT_CONNECTED_PASS |
| BM-141 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-142 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-143 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-144 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-145 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-146 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-147 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-148 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-149 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-150 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-151 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-152 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-153 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-154 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-155 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-156 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-157 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-158 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-159 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-160 | batch7 | false | INPUT_CONNECTED_PASS |
| BM-161 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-162 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-163 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-164 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-165 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-166 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-167 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-168 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-169 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-170 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-172 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-173 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-174 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-175 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-176 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-177 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-178 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-179 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-180 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-181 | batch8 | false | INPUT_CONNECTED_PASS |
| BM-182 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-183 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-184 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-185 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-186 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-187 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-188 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-189 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-190 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-191 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-192 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-193 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-194 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-195 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-196 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-197 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-198 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-199 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-201 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-202 | remaining-source-render-sweep | false | INPUT_CONNECTED_PASS |
| BM-203 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-204 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-205 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-206 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-207 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-208 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-209 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-210 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-211 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-212 | batch9 | false | INPUT_CONNECTED_PASS |
| BM-213 | batch9 | false | INPUT_CONNECTED_PASS |

## Already browserVerified (not selected unless EXPLICIT_REVERIFY=true)

| Code | Browser Verified | Demo | Preview | DOCX | Fidelity |
|---|---|---|---|---|---|
| BM-001 | true | true | true | true | undefined |
| BM-005 | true | true | true | true | undefined |
| BM-006 | true | true | true | true | undefined |
| BM-007 | true | true | true | true | undefined |
| BM-008 | true | true | true | true | undefined |
| BM-009 | true | true | true | true | undefined |
| BM-010 | true | true | true | true | undefined |
| BM-011 | true | true | true | true | undefined |
| BM-012 | true | true | true | true | undefined |
| BM-014 | true | true | true | true | undefined |
| BM-015 | true | true | true | true | undefined |
| BM-017 | true | true | true | true | undefined |
| BM-018 | true | true | true | true | undefined |
| BM-019 | true | true | true | true | undefined |
| BM-020 | true | true | true | true | undefined |
| BM-022 | true | true | true | true | undefined |
| BM-023 | true | true | true | true | undefined |
| BM-030 | true | true | true | true | undefined |
| BM-031 | true | true | true | true | undefined |
| BM-033 | true | true | true | true | undefined |
| BM-035 | true | true | true | true | undefined |
| BM-036 | true | true | true | true | undefined |
| BM-037 | true | true | true | true | undefined |
| BM-038 | true | true | true | true | undefined |
| BM-040 | true | true | true | true | undefined |
| BM-042 | true | true | true | true | undefined |
| BM-043 | true | true | true | true | undefined |
| BM-044 | true | true | true | true | undefined |
| BM-045 | true | true | true | true | undefined |
| BM-046 | true | true | true | true | undefined |
| BM-047 | true | true | true | true | undefined |
| BM-048 | true | true | true | true | undefined |
| BM-052 | true | true | true | true | undefined |
| BM-053 | true | true | true | true | undefined |
| BM-054 | true | true | true | true | undefined |
| BM-055 | true | true | true | true | PASS |
| BM-056 | true | true | true | true | PASS |
| BM-057 | true | true | true | true | PASS |
| BM-058 | true | true | true | true | PASS |
| BM-059 | true | true | true | true | PASS |
| BM-060 | true | true | true | true | PASS |
| BM-061 | true | true | true | true | PASS |
| BM-062 | true | true | true | true | PASS |
| BM-063 | true | true | true | true | PASS |
| BM-064 | true | true | true | true | PASS |
| BM-065 | true | true | true | true | PASS |
| BM-066 | true | true | true | true | PASS |
| BM-067 | true | true | true | true | PASS |
| BM-068 | true | true | true | true | PASS |
| BM-069 | true | true | true | true | PASS |
| BM-070 | true | true | true | true | undefined |
| BM-071 | true | true | true | true | PASS |
| BM-072 | true | true | true | true | PASS |
| BM-073 | true | true | true | true | PASS |
| BM-074 | true | true | true | true | PASS |
| BM-075 | true | true | true | true | PASS |
| BM-076 | true | true | true | true | PASS |
| BM-078 | true | true | true | true | PASS |
| BM-080 | true | true | true | true | PASS |
| BM-081 | true | true | true | true | PASS |
| BM-083 | true | true | true | true | PASS |
| BM-084 | true | true | true | true | PASS |
| BM-085 | true | true | true | true | PASS |
| BM-086 | true | true | true | true | PASS |
| BM-087 | true | true | true | true | PASS |
| BM-088 | true | true | true | true | PASS |
| BM-090 | true | true | true | true | PASS |
| BM-091 | true | true | true | true | PASS |
| BM-092 | true | true | true | true | PASS |
| BM-093 | true | true | true | true | PASS |
| BM-094 | true | true | true | true | PASS |
| BM-095 | true | true | true | true | PASS |
| BM-096 | true | true | true | true | PASS |
| BM-097 | true | true | true | true | PASS |
| BM-098 | true | true | true | true | PASS |
| BM-100 | true | true | true | true | PASS |
| BM-171 | true | true | true | true | undefined |

## 12 PARTIAL Holdouts (must remain INPUT_CONNECTED_PARTIAL)

| Code | Class | Reason |
|---|---|---|
| BM-024 | CANARY_HOLDOUT | curated-runtime-ux-batch canary (must remain auto-generated) |
| BM-039 | SPECIAL_SKIP | known special/skipped form |
| BM-041 | SPECIAL_SKIP | known special/skipped form |
| BM-049 | SPECIAL_SKIP | known special/skipped form |
| BM-050 | SPECIAL_SKIP | known special/skipped form |
| BM-051 | SPECIAL_SKIP | known special/skipped form |
| BM-077 | SPECIAL_SKIP | known special/skipped form |
| BM-079 | SPECIAL_SKIP | known special/skipped form |
| BM-082 | SPECIAL_SKIP | known special/skipped form |
| BM-089 | SPECIAL_SKIP | known special/skipped form |
| BM-099 | SPECIAL_SKIP | known special/skipped form |
| BM-200 | CANARY_HOLDOUT | curated-runtime-ux-batch canary (must remain auto-generated) |

## Per-Batch Provenance

| Batch | Selected |
|---|---|
| remaining-source-render-sweep | 24 |
| batch9 | 20 |
| batch5 | 20 |
| batch6 | 20 |
| batch7 | 20 |
| batch8 | 20 |
