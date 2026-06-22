-- Phase D publish: 213 locked contracts
-- Generated: 2026-06-22 13:29:39
-- Official ID: 1 
-- Agency ID: (none — global scope)

BEGIN;

-- BM-001: Biên bản tiếp nhận nguồn tin về tội phạm
--   contract_hash: bcc616eb5301470a972fef1a13f19d417f95b0816a56af80a72ba8c96905e95b
--   template_hash: e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-001\BM-001_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-001__f4c2aa3682d3') AND scope_key = 'BM-001' AND contract_hash = 'bcc616eb5301470a972fef1a13f19d417f95b0816a56af80a72ba8c96905e95b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-002: Phiếu chuyển nguồn tin về tội phạm
--   contract_hash: 70bf94d494311f08a594f001aab4865f32ca5a20dae1821731fe3cb58bcf4555
--   template_hash: c3164f9f4fd074bf7cefed649f947bce2005540035a0c3c8ab0934a1af417b5c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-002\BM-002_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-002__f78301178da7') AND scope_key = 'BM-002' AND contract_hash = '70bf94d494311f08a594f001aab4865f32ca5a20dae1821731fe3cb58bcf4555' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-003: QĐ phân công THQCT, KS việc tiếp nhận, giải quyết nguồn tin về tội phạm
--   contract_hash: c23105b25f6842963d24933412635581ed2ae8601489f3729433ad70c669d422
--   template_hash: 1a5baf6739edc3d7769853a6b8d8d3be80a72e4ca105c7850278590ca4e31128
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-003\BM-003_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-003__bb64990bc49b') AND scope_key = 'BM-003' AND contract_hash = 'c23105b25f6842963d24933412635581ed2ae8601489f3729433ad70c669d422' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-004: QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin
--   contract_hash: 3a31a2b6ac7048760cacfc99eed2a6628f5d160e72d405da16b4ffe6d39f7d00
--   template_hash: 1a1ace3d7f315338a4e20709a74a278784e5850805e4d3c6a286115e202ec8b5
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-004\BM-004_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-004__2775520fd22c') AND scope_key = 'BM-004' AND contract_hash = '3a31a2b6ac7048760cacfc99eed2a6628f5d160e72d405da16b4ffe6d39f7d00' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-005: Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm
--   contract_hash: a50afb744602ae5d128c839cb126f647ecbecddebb7b627813bb617ada75c88b
--   template_hash: fba44bdd233aeeb99aa8dd7f61ba49c0bfd85ffc4327ffe1b1f5f88b367a49bb
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-005\BM-005_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-005__4cf240724a90') AND scope_key = 'BM-005' AND contract_hash = 'a50afb744602ae5d128c839cb126f647ecbecddebb7b627813bb617ada75c88b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-006: Yêu cầu tiếp nhận, kiểm tra, xác minh, ra QĐ giải quyết nguồn tin về tội phạm
--   contract_hash: 93a8a21a845c99deda9d2044c0576629b4ac6aab678a2c83c8a9d046413225e2
--   template_hash: c990b43a7604832f4026a6315affc57c3c5f9dc671943316567d4be3dbca93db
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-006\BM-006_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-006__87ff96f9a866') AND scope_key = 'BM-006' AND contract_hash = '93a8a21a845c99deda9d2044c0576629b4ac6aab678a2c83c8a9d046413225e2' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-007: Yêu cầu cung cấp tài liệu để kiểm sát việc giải quyết nguồn tin về tội phạm
--   contract_hash: 3622add13c3712120c9c577d02a90e8c75b848504ab220ce8af043ca2a511932
--   template_hash: de8266d8a0dd89dd2b0df6106a2d8b1ccf3283de9cd7b1396a5ea2b47bcc99f6
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-007\BM-007_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-007__549970d471d1') AND scope_key = 'BM-007' AND contract_hash = '3622add13c3712120c9c577d02a90e8c75b848504ab220ce8af043ca2a511932' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-008: Yêu cầu chuyển nguồn tin về tội phạm
--   contract_hash: 515f827fcf27e107e3c1dcf0fc6389177a48d46f86a27d1fa042e84380db4ba0
--   template_hash: 829050b490a932482dcb2ad03dc8a98eeccbbf93dfd4dd8f84bb332c49b78946
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-008\BM-008_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-008__87981f1c5cf8') AND scope_key = 'BM-008' AND contract_hash = '515f827fcf27e107e3c1dcf0fc6389177a48d46f86a27d1fa042e84380db4ba0' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-009: QĐ gia hạn thời hạn giải quyết nguồn tin về tội phạm
--   contract_hash: faefbbe16743ff7ed5b00e0eb79bbfc1546d3cc51774fc0fe194ec05d5d72492
--   template_hash: b4ee3bb04d740a0a21a8c263433fe7911cc0d1a10e365557b031a17252bc0a26
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-009\BM-009_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-009__ad542fd7bc45') AND scope_key = 'BM-009' AND contract_hash = 'faefbbe16743ff7ed5b00e0eb79bbfc1546d3cc51774fc0fe194ec05d5d72492' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-010: QĐ tạm đình chỉ giải quyết nguồn tin về tội phạm
--   contract_hash: a214611aee54dfd04194af3c32d9b78224bed356b869b3101f20d840f80f3300
--   template_hash: 64d69e5b3f82d9b0dec36e092a0e2523a1974bd86a0079aec2554632765ba2ec
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-010\BM-010_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-010__3814cd2b4bcf') AND scope_key = 'BM-010' AND contract_hash = 'a214611aee54dfd04194af3c32d9b78224bed356b869b3101f20d840f80f3300' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-011: QĐ huỷ bỏ QĐ tạm đình chỉ việc giải quyết nguồn tin về tội phạm
--   contract_hash: a3239e65079a763ae34a3624adc965f279c3498f579cf9b05b4c992948a08990
--   template_hash: d886c3d08793de9adf048037c786a1039777eab18dd48865bc7f6f411a9de2a2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-011\BM-011_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-011__26e6e688d223') AND scope_key = 'BM-011' AND contract_hash = 'a3239e65079a763ae34a3624adc965f279c3498f579cf9b05b4c992948a08990' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-012: QĐ phục hồi giải quyết nguồn tin
--   contract_hash: 552ae508aec646d431dfdc2af45aa8de82fdc8aecafe31142a0deae2858229ac
--   template_hash: bf9d4d4ce7e92254b1728f41dc88b513da188a716c30c8ea5f31f87538fb6904
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-012\BM-012_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-012__7733d5ac8e86') AND scope_key = 'BM-012' AND contract_hash = '552ae508aec646d431dfdc2af45aa8de82fdc8aecafe31142a0deae2858229ac' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-013: QĐ giải quyết tranh chấp về thẩm quyền giải quyết nguồn tin
--   contract_hash: 8c0ea2de0fba92187725acb046f840c13b5e7570ba6f0b0f2cc2016a8580ca97
--   template_hash: b5889a608e3b987fae0c3a8787d48cccbff42c9214aa5ba3a0a954a3625dd770
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-013\BM-013_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-013__9a1f7d37fec9') AND scope_key = 'BM-013' AND contract_hash = '8c0ea2de0fba92187725acb046f840c13b5e7570ba6f0b0f2cc2016a8580ca97' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-014: QĐ trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm
--   contract_hash: 0341f981620f11b2659c083abe4c62d28069966457c78b25d67bba0a3a631ecb
--   template_hash: d39671125155e8914e47dfa129343b57d64dfe626416078ddc016a14f62ba168
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-014\BM-014_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-014__ff318bb91779') AND scope_key = 'BM-014' AND contract_hash = '0341f981620f11b2659c083abe4c62d28069966457c78b25d67bba0a3a631ecb' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-015: KH trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm
--   contract_hash: 1dea1f42240e79848a33205c0d28e613017ab91e8f7eddef4b8da437c92fca91
--   template_hash: 5a80fbb9038f02dba3c2cd3ca2d238695ecf2b1ffb15365986b03d50674270a3
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-015\BM-015_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-015__08f17df338d2') AND scope_key = 'BM-015' AND contract_hash = '1dea1f42240e79848a33205c0d28e613017ab91e8f7eddef4b8da437c92fca91' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-016: KL trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm
--   contract_hash: 3f474c0688b66f62ec85496ce95288f4fbe109f5ab41a7e5842bba35723fecb5
--   template_hash: 6cfaffe681ff4e7b0c31f64ddc40828af7acba28734bb55c1f549fbca9c44d85
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-016\BM-016_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-016__565ec1fc2103') AND scope_key = 'BM-016' AND contract_hash = '3f474c0688b66f62ec85496ce95288f4fbe109f5ab41a7e5842bba35723fecb5' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-017: Yêu cầu khởi tố vụ án hình sự
--   contract_hash: f272afdbc8006e6b8718b0ef089861e06aeac1614dadd0cb6ed4564cc9434bac
--   template_hash: 5cb1a6543c7cec4b60a76428cb6c89fcb0d65d38c0344bc45706a012ca22734d
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-017\BM-017_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-017__6b3cad999c61') AND scope_key = 'BM-017' AND contract_hash = 'f272afdbc8006e6b8718b0ef089861e06aeac1614dadd0cb6ed4564cc9434bac' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-018: Yêu cầu ra QĐ thay đổi QĐ khởi tố vụ án hình sự
--   contract_hash: 98a74a807c7133f21d21a81b7326f69b661ba06dd7f774b526a4f0534ad2a578
--   template_hash: 37c6ffc105e660561d7fbc8ce831314ae7a849874df0b5af7b75fe3bcd639ec9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-018\BM-018_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-018__fe8c39468552') AND scope_key = 'BM-018' AND contract_hash = '98a74a807c7133f21d21a81b7326f69b661ba06dd7f774b526a4f0534ad2a578' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-019: Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự
--   contract_hash: 08979222a93902e1700b58230e875ec06e11b43ba3de390565a3703482aacec4
--   template_hash: 84169120d2a94668c1c132a36632f2020868421c7b6958c498082b9a2878e5ae
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-019\BM-019_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-019__3c2858f47dad') AND scope_key = 'BM-019' AND contract_hash = '08979222a93902e1700b58230e875ec06e11b43ba3de390565a3703482aacec4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-020: Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố
--   contract_hash: c551e31961543563e45f818184614da183645de1a69186fca075e561895a915d
--   template_hash: 636e5e38bf1ff68301f69c7579735d70b147618b32ec2c789cb5dd772ebdbfb9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-020\BM-020_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-020__0f61c04c750d') AND scope_key = 'BM-020' AND contract_hash = 'c551e31961543563e45f818184614da183645de1a69186fca075e561895a915d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-021: QĐ không khởi tố vụ án hình sự
--   contract_hash: 252a1efa6bc872cd8989e27bab8e456bd0049f4052067987994efbdf38fd8c93
--   template_hash: e15da4a368e287a96d6dd7233e491bf0af91f154168d6c7054dbb9ef44e33865
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-021\BM-021_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-021__772319486f41') AND scope_key = 'BM-021' AND contract_hash = '252a1efa6bc872cd8989e27bab8e456bd0049f4052067987994efbdf38fd8c93' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-022: QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự
--   contract_hash: 1c2084b12d2b8d8f1f6da393689a9e13f842f71986d48a6526500e6244c22fba
--   template_hash: 9d0ead3e409a0cbca5cac34ceb09fec04be58dc795d098efe6ca0bc708f3018b
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-022\BM-022_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-022__13d342bdfc56') AND scope_key = 'BM-022' AND contract_hash = '1c2084b12d2b8d8f1f6da393689a9e13f842f71986d48a6526500e6244c22fba' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-023: QĐ khởi tố vụ án hình sự
--   contract_hash: 3a195c79abb9047bb34917d57490a9a8caa2fe83362805f307a292c75a46f90b
--   template_hash: 760346fba10094d009298d36fb7c9d679a8dd658ee7d735b99ed2ca3a2675741
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-023\BM-023_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-023__78e4f3906e4c') AND scope_key = 'BM-023' AND contract_hash = '3a195c79abb9047bb34917d57490a9a8caa2fe83362805f307a292c75a46f90b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-024: QĐ thay đổi QĐ khởi tố vụ án hình sự
--   contract_hash: 94dbb7f9ae1c8f3f19f05b95241f63d0942d729aa6f2a1b427494fc69648b51e
--   template_hash: c6c0bb8e4fe8c5700a35ef29f008037856b113059f4e70b5b3043507cb5181fe
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-024\BM-024_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-024__575a6d8e9173') AND scope_key = 'BM-024' AND contract_hash = '94dbb7f9ae1c8f3f19f05b95241f63d0942d729aa6f2a1b427494fc69648b51e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-025: QĐ bổ sung QĐ khởi tố vụ án hình sự
--   contract_hash: 611e2644a35878f9bb674428f070c8df2dfc112515d7f0f4a0dd0cb3f9d6a7dd
--   template_hash: 5b55dadf5084333cd721368d9c28b06ccfd7f2dd55cddaeafb1dd9bff722b248
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-025\BM-025_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-025__5dcf0eb7f481') AND scope_key = 'BM-025' AND contract_hash = '611e2644a35878f9bb674428f070c8df2dfc112515d7f0f4a0dd0cb3f9d6a7dd' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-026: QĐ huỷ bỏ QĐ khởi tố vụ án hình sự
--   contract_hash: c5a40db6ee2cd3c15f66ae6659dd01ed5490d6f89395537f02e8b77c1f7f74a6
--   template_hash: 68c14ae34cf768b61df629786e6d0d7b0d0ff2d41ef213e5b67684359b30c30c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-026\BM-026_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-026__6e339663e320') AND scope_key = 'BM-026' AND contract_hash = 'c5a40db6ee2cd3c15f66ae6659dd01ed5490d6f89395537f02e8b77c1f7f74a6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-027: Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự
--   contract_hash: 5ea155bebf6845f2898020f018a45ba9cdf58e79beac79e526807179e09371de
--   template_hash: 21cf64c165ccefbcf910997e59bdd34a639a32d8def31d072f3da799b6ae3ca4
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-027\BM-027_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-027__7c207d24faee') AND scope_key = 'BM-027' AND contract_hash = '5ea155bebf6845f2898020f018a45ba9cdf58e79beac79e526807179e09371de' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-028: QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự
--   contract_hash: 57e8b460e4b2cd32e6ae0f0e7cbd1ddd70c3dd6dc5fb142d21c37f7eeeb2951e
--   template_hash: 80e099f5d7a1e483cf335f71c289572b657e7dd3a7dffa16bd0b1058df6d97eb
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-028\BM-028_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-028__e895e0889340') AND scope_key = 'BM-028' AND contract_hash = '57e8b460e4b2cd32e6ae0f0e7cbd1ddd70c3dd6dc5fb142d21c37f7eeeb2951e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-029: QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố vụ án hình sự
--   contract_hash: bd6612d85ce409c4ba0bd5962c56a82f19d1c978e46eabe582829d6b2251f483
--   template_hash: 0631aa008f74eb2f471a39047d10f7daa5bc10dccfd14b9c2a8a4e734de16862
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-029\BM-029_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-029__0bf65fba614a') AND scope_key = 'BM-029' AND contract_hash = 'bd6612d85ce409c4ba0bd5962c56a82f19d1c978e46eabe582829d6b2251f483' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-030: Thông báo kết quả giải quyết nguồn tin về tội phạm
--   contract_hash: 6845bd53c07776efc8a6119e93772b4ec7490540f5601393bbb83580fe649f1b
--   template_hash: 5fd54470481fcea24bc89a9e37b79d31a7bc599d9a30702f16c9b57be9ea22c4
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-030\BM-030_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-030__0cfa7ae4b177') AND scope_key = 'BM-030' AND contract_hash = '6845bd53c07776efc8a6119e93772b4ec7490540f5601393bbb83580fe649f1b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-031: QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp
--   contract_hash: 2798106a54f6ccc801ae54012e02e98deda38c94ed85c98df67b66e02a5436d1
--   template_hash: 3fa100d7c24f4d1c8f5b94a071b60190e926e5bfe024e9be2d6537702e7a7e14
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-031\BM-031_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-031__ec3276d1eebe') AND scope_key = 'BM-031' AND contract_hash = '2798106a54f6ccc801ae54012e02e98deda38c94ed85c98df67b66e02a5436d1' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-032: QĐ không phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp
--   contract_hash: 4b7de7b822261ec9d4ed120bc5c35104162376b2ca7f509bf7c456b9823ac540
--   template_hash: f3a6aff9f38f26bb8aca0a122be7dd8720c41fbcce36040f4276522938d4b2ac
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-032\BM-032_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-032__cce50086cd38') AND scope_key = 'BM-032' AND contract_hash = '4b7de7b822261ec9d4ed120bc5c35104162376b2ca7f509bf7c456b9823ac540' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-033: QĐ phê chuẩn QĐ gia hạn tạm giữ
--   contract_hash: 093bf1ffe26891e85bca2ed2d5e5bcde0d47648f402a49277feb8998d6bc8722
--   template_hash: 89c6bc116e15e12ce1fe1999c06c38121f3dc3260a72c46a6f3c301e36827e7d
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-033\BM-033_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-033__51058a699877') AND scope_key = 'BM-033' AND contract_hash = '093bf1ffe26891e85bca2ed2d5e5bcde0d47648f402a49277feb8998d6bc8722' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-034: QĐ không phê chuẩn QĐ gia hạn tạm giữ
--   contract_hash: 5d8394242ef6ef0e3168fb68e9c96b30275e5582051becf663e6d57d9c00bf0f
--   template_hash: 1dfb680d8d8e47d9655254b2ed92e14ec41df4cefeb486981d6555949b21d38a
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-034\BM-034_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-034__e02f842b6038') AND scope_key = 'BM-034' AND contract_hash = '5d8394242ef6ef0e3168fb68e9c96b30275e5582051becf663e6d57d9c00bf0f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-035: QĐ huỷ bỏ QĐ tạm giữ, quyết định gia hạn tạm giữ
--   contract_hash: 36bea690721f3014f424ab3ae52bc2be7017cdbeccc832349bfa366603af7927
--   template_hash: 549f38862899b5cfedab4bd4f6e15c4a4e89eb059ee712a87a9784c92b2499ee
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-035\BM-035_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-035__be0035952622') AND scope_key = 'BM-035' AND contract_hash = '36bea690721f3014f424ab3ae52bc2be7017cdbeccc832349bfa366603af7927' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-036: QĐ trả tự do cho người bị tạm giữ
--   contract_hash: 25ffff5b5939d9da07a16624d6ad09a3c0da718f044b9c8203f1e526bc7a5980
--   template_hash: feadce0db218e209531d5d9f5963df56f35a1e4470ad8d6e0a10d2c2968a0b80
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-036\BM-036_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-036__6f4466480a94') AND scope_key = 'BM-036' AND contract_hash = '25ffff5b5939d9da07a16624d6ad09a3c0da718f044b9c8203f1e526bc7a5980' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-037: QĐ phê chuẩn Lệnh bắt bị can để tạm giam
--   contract_hash: 19a3f5f9a8de57b8fa754b4ccbf127c064c81aad766e21c9a3cc0be3037bafb4
--   template_hash: af5691b80cac8c5b7b80e61fc3b8ec6f9089ed0dc99df4aa0a073fee1578405c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-037\BM-037_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-037__1fa31d43251e') AND scope_key = 'BM-037' AND contract_hash = '19a3f5f9a8de57b8fa754b4ccbf127c064c81aad766e21c9a3cc0be3037bafb4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-038: QĐ không phê chuẩn Lệnh bắt bị can để tạm giam
--   contract_hash: 2b62b6204ea9939e1181bae9a32bb28db9164ada8f648025bd8a775e0d9c44ac
--   template_hash: 7e62defd5f54921df1b4a59e590cd720e174eae768ee3dfd5b10d17ea17c74a0
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-038\BM-038_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-038__7a37ca9c9d8e') AND scope_key = 'BM-038' AND contract_hash = '2b62b6204ea9939e1181bae9a32bb28db9164ada8f648025bd8a775e0d9c44ac' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-039: Lệnh bắt bị can bị tạm giam
--   contract_hash: 56fed3dd7fe68d4a57f7402d9be7493240a8d8f8005104b7b0352e0e69b30550
--   template_hash: 638f77b17089c5833b5cd34d6f1e2922218b0c1a1705942b6cfea43110006fd7
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-039\BM-039_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-039__733f9ddd4783') AND scope_key = 'BM-039' AND contract_hash = '56fed3dd7fe68d4a57f7402d9be7493240a8d8f8005104b7b0352e0e69b30550' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-040: QĐ phê chuẩn Lệnh tạm giam
--   contract_hash: 84443f75b1dfecba46ccfefc88f49d0f96218ee4cb0edf7e275aeb9556e364de
--   template_hash: 26bbbc2833661e9faa183177bcd731e496948992a1b03145af7105b7ed26c5b8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-040\BM-040_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-040__aab092911088') AND scope_key = 'BM-040' AND contract_hash = '84443f75b1dfecba46ccfefc88f49d0f96218ee4cb0edf7e275aeb9556e364de' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-041: QĐ không phê chuẩn Lệnh tạm giam
--   contract_hash: 68cd2c07613bcf337379e85bd11430d23f9187429ec052db523146968ab15c2c
--   template_hash: 75098660524974a9c8c75d2afb31deb3d29f8d3192aad64d6d98809b3add2bf5
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-041\BM-041_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-041__9a027eeceb3a') AND scope_key = 'BM-041' AND contract_hash = '68cd2c07613bcf337379e85bd11430d23f9187429ec052db523146968ab15c2c' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-042: QĐ gia hạn tạm giam
--   contract_hash: ca6850ddc790e62486b2fbfe1f8d98b5b6ef888bb493b3a881ccaebaedb62c95
--   template_hash: 7ccc802c7911d45e0a2c65626c78d72e2581c95c4d975b064f6d560eb342d48b
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-042\BM-042_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-042__a4da3c74d437') AND scope_key = 'BM-042' AND contract_hash = 'ca6850ddc790e62486b2fbfe1f8d98b5b6ef888bb493b3a881ccaebaedb62c95' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-043: QĐ huỷ bỏ biện pháp tạm giam
--   contract_hash: a8ff3be80d9ef0a49e7d2fd161775da00e46fa47b23e5dfb64eeaf003664bf41
--   template_hash: 917955efdfbd575ba312dd4211f90bae3157e62bf2f6a713449b4b636cf9891e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-043\BM-043_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-043__8eab35cfeedb') AND scope_key = 'BM-043' AND contract_hash = 'a8ff3be80d9ef0a49e7d2fd161775da00e46fa47b23e5dfb64eeaf003664bf41' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-044: QĐ thay thế biện pháp tạm giam
--   contract_hash: bcbc305d6afef74cfa0e12250d4ee5b7ef478da969be622937f6140f033436a6
--   template_hash: 59385ec899971b74bbc0946f77d428bac80c28af5edc84014fc55e0bd6504671
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-044\BM-044_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-044__8552b13c78ff') AND scope_key = 'BM-044' AND contract_hash = 'bcbc305d6afef74cfa0e12250d4ee5b7ef478da969be622937f6140f033436a6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-045: QĐ phê chuẩn QĐ về việc bảo lĩnh
--   contract_hash: 561f84c17441bc62ae97fc3e46faec48310923e8c60592e4992b831368edc287
--   template_hash: 34b192c768eb4607540f1a1f634ba5367c12979adf486d566f8872604e12d87e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-045\BM-045_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-045__13efe0d94756') AND scope_key = 'BM-045' AND contract_hash = '561f84c17441bc62ae97fc3e46faec48310923e8c60592e4992b831368edc287' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-046: QĐ không phê chuẩn QĐ về việc bảo lĩnh
--   contract_hash: 8974356d1c92e0f2267df31cacdee4cc0fc1e479410f63218d5c0d09ee474885
--   template_hash: 479868fcf569efef3f13fcdacb75384a213a4719ef33b48e6f944eb56284b4b0
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-046\BM-046_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-046__501a15f0fbb7') AND scope_key = 'BM-046' AND contract_hash = '8974356d1c92e0f2267df31cacdee4cc0fc1e479410f63218d5c0d09ee474885' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-047: QĐ về việc bảo lĩnh
--   contract_hash: 7b7589b3dbcd5dbc5275b203c1f64dddd05466da1528d8c4c2cb2c2627a87508
--   template_hash: af15b4ac8ba439061a2fcf0f5937b791a78c0daf7d579df3a5a4c9167899a452
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-047\BM-047_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-047__ec7dc3448f91') AND scope_key = 'BM-047' AND contract_hash = '7b7589b3dbcd5dbc5275b203c1f64dddd05466da1528d8c4c2cb2c2627a87508' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-048: QĐ huỷ bỏ biện pháp bảo lĩnh
--   contract_hash: 7da9cbc5a14b29fb68dba584728bec586cad5c42ff6cfdc3601afa1b6f0b9548
--   template_hash: c7f00ae0d19322b68fa455ffdf0d3de97083b9a8b5a9a6f455de12eb4b13f1a5
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-048\BM-048_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-048__724a5a8b3421') AND scope_key = 'BM-048' AND contract_hash = '7da9cbc5a14b29fb68dba584728bec586cad5c42ff6cfdc3601afa1b6f0b9548' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-049: QĐ phê chuẩn QĐ về việc đặt tiền để bảo đảm
--   contract_hash: b275b6b8ab87beb2a431130425a4a720f863cabd6766282b6f82bf395275cd61
--   template_hash: 4d8b42b216a922ee2d77fab07ec48f1b366ea45fb87babca6ace1d6110c049e5
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-049\BM-049_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-049__798e9b21ce2e') AND scope_key = 'BM-049' AND contract_hash = 'b275b6b8ab87beb2a431130425a4a720f863cabd6766282b6f82bf395275cd61' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-050: QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm
--   contract_hash: 57377fe6c902f22a8807c9cf223cc9addbec353f6a441a0169ae6252d51bdca3
--   template_hash: 1aba6730aabc9a43d85fd675d940534a467c67d095bf4d176f4f8099e0b29ec2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-050\BM-050_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-050__2d31c941887e') AND scope_key = 'BM-050' AND contract_hash = '57377fe6c902f22a8807c9cf223cc9addbec353f6a441a0169ae6252d51bdca3' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-051: QĐ về việc đặt tiền để bảo đảm
--   contract_hash: 4621cf79275483cba7a71c5c2363f2a072f48fc56b7d9062868a9d64e2ddd51d
--   template_hash: 4ebdde2e7b1e4cea4030184a45492fe90a4a8f2a05f80f435f92311ffe19f2bb
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-051\BM-051_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-051__594c6c63b397') AND scope_key = 'BM-051' AND contract_hash = '4621cf79275483cba7a71c5c2363f2a072f48fc56b7d9062868a9d64e2ddd51d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-052: QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm
--   contract_hash: d39fdf784067a59497b84009c7e357a0650e487465302a48b5e0045dd25e1d05
--   template_hash: 4bce3344999de71c2c4661a23fb5f55d3af854057b8982dcdee247f799f40b4d
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-052\BM-052_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-052__9919ecdb3971') AND scope_key = 'BM-052' AND contract_hash = 'd39fdf784067a59497b84009c7e357a0650e487465302a48b5e0045dd25e1d05' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-053: Lệnh cấm đi khỏi nơi cư trú
--   contract_hash: 422a6da423519e630d94106f7f0f57c8c7c2b28960e2b30b2dab09b7d2f8d8a0
--   template_hash: 8ed7c44137fd9498fc41d536347fc099c80f4fce167b11a22f3880895a817db7
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-053\BM-053_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-053__0a5a43238f28') AND scope_key = 'BM-053' AND contract_hash = '422a6da423519e630d94106f7f0f57c8c7c2b28960e2b30b2dab09b7d2f8d8a0' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-054: Thông báo về việc áp dụng biện pháp cấm đi khỏi nơi cư trú
--   contract_hash: f0b68cad74f9e1db1d657c613ffbad76f2f1b172805c19d9460a1df947afaa37
--   template_hash: 8994733f834cd27b8572f847b8b9cff4c47ead5852e2d0896ab789564fa0ac03
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-054\BM-054_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-054__71a4c9ac7e0e') AND scope_key = 'BM-054' AND contract_hash = 'f0b68cad74f9e1db1d657c613ffbad76f2f1b172805c19d9460a1df947afaa37' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-055: QĐ huỷ bỏ biện pháp cấm đi khỏi nơi cư trú
--   contract_hash: af0dd04809d83aad77d91c3eacbeb7fd904f6b86209f5b128639c8cf60d5a818
--   template_hash: 9395591b85a72003c4737da8817484081be23b92f3118e4ce181881f5b4dd3d9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-055\BM-055_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-055__b1819db1f92b') AND scope_key = 'BM-055' AND contract_hash = 'af0dd04809d83aad77d91c3eacbeb7fd904f6b86209f5b128639c8cf60d5a818' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-056: QĐ tạm hoãn xuất cảnh
--   contract_hash: d40817684e35a97aba22a98ac51baa293dfb3bfbd6bb1878f4f0babe990c571f
--   template_hash: 844c6dfaca556529b96ac71cfa17653d03a9dc4407604a4605d54be5315f556d
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-056\BM-056_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-056__eea9a3391f5f') AND scope_key = 'BM-056' AND contract_hash = 'd40817684e35a97aba22a98ac51baa293dfb3bfbd6bb1878f4f0babe990c571f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-057: QĐ huỷ bỏ biện pháp tạm hoãn xuất cảnh
--   contract_hash: 5f2e0695217337922f626daf1cc3cab5a88f699f87193ce8e1314bb02feb0581
--   template_hash: 4aa92cf8ac8a8beda307c1eec4f29907e786e51858c97e0600d133cc406ddb61
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-057\BM-057_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-057__9053c61ee677') AND scope_key = 'BM-057' AND contract_hash = '5f2e0695217337922f626daf1cc3cab5a88f699f87193ce8e1314bb02feb0581' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-058: Lệnh tạm giam
--   contract_hash: e3713dad2f19da004efb7728ebd68070a5ba76f0fbf7ea51c64bacb7b5ed3337
--   template_hash: 18a4e058ae013dacd2a35169100b84d616ee83ec5bc1dc979b93bcbb9168ff46
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-058\BM-058_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-058__6de8f0022bff') AND scope_key = 'BM-058' AND contract_hash = 'e3713dad2f19da004efb7728ebd68070a5ba76f0fbf7ea51c64bacb7b5ed3337' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-059: QĐ gia hạn thời hạn tạm giam để truy tố 1
--   contract_hash: 8d44454ed9440b5536c7c78d7877bcff454a1fc1640695e51f5c595b3d97238a
--   template_hash: 6044cdbf07c608afaa5ca73971d2875a1a4e905b8d0cd8883a3ed21e141247bc
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-059\BM-059_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-059__4cdec41fdb1d') AND scope_key = 'BM-059' AND contract_hash = '8d44454ed9440b5536c7c78d7877bcff454a1fc1640695e51f5c595b3d97238a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-060: QĐ áp giải bị can
--   contract_hash: 0606a479f6ce065d380d3ca34570fc88958547f2a1d1320f59ed772c9fa54d14
--   template_hash: b969aea53abd9b8e2108037f5996d323d81494e90f2fe8e6b3820634c0a201cc
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-060\BM-060_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-060__55a252b4f98f') AND scope_key = 'BM-060' AND contract_hash = '0606a479f6ce065d380d3ca34570fc88958547f2a1d1320f59ed772c9fa54d14' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-061: QĐ dẫn giải
--   contract_hash: 121227ff93f5cbd5bcb5a30e4f7cf96a1318d4f501f7382f2bc3b0d979654ac9
--   template_hash: 001e202abcd4fa10c087c978971f4516799b394685069b26d2bc2ad2d1d6fae8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-061\BM-061_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-061__ec44550246e9') AND scope_key = 'BM-061' AND contract_hash = '121227ff93f5cbd5bcb5a30e4f7cf96a1318d4f501f7382f2bc3b0d979654ac9' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-062: Lệnh kê biên tài sản
--   contract_hash: ab6c2b6a2dc9cc3688096aeda5e3030fb94f6b6909aed6ccaa4bcf8b684f2d3c
--   template_hash: b4b237215df25dd5cbf062277094eb2979fda427a3a8410b7257716cd5d0f5e9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-062\BM-062_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-062__110961a781fa') AND scope_key = 'BM-062' AND contract_hash = 'ab6c2b6a2dc9cc3688096aeda5e3030fb94f6b6909aed6ccaa4bcf8b684f2d3c' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-063: Biên bản kê biên tài sản
--   contract_hash: 5980fed028112e7103c35482bb8ce191f4e3fa1c1a5b10bd7daa9052fb3abf41
--   template_hash: 7befd184eb5103347016f9e9971def618d8eed97ba00bcd6706da7ba3b10d4da
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-063\BM-063_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-063__54b73110a34f') AND scope_key = 'BM-063' AND contract_hash = '5980fed028112e7103c35482bb8ce191f4e3fa1c1a5b10bd7daa9052fb3abf41' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-064: QĐ huỷ bỏ biện pháp kê biên tài sản
--   contract_hash: 8e57f7fe8b6f03304355f31f803a2a12f1d7c080575626510e5ac728b63c4712
--   template_hash: 40c15301b06058d8ca8b1cd58eca62e5c7c6912ad3639b8e0792c6d46560a295
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-064\BM-064_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-064__4d8cebc3515b') AND scope_key = 'BM-064' AND contract_hash = '8e57f7fe8b6f03304355f31f803a2a12f1d7c080575626510e5ac728b63c4712' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-065: BB về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản
--   contract_hash: fe64b3cd22bbea37cfa86ca1095f9db1add3fff1d9935bdcf55b77895e6cb81d
--   template_hash: ced055b8f358edaf04095bb246b6db754f5d47bb1e2adf7035a7c3b059099330
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-065\BM-065_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-065__4a64c8d7e96c') AND scope_key = 'BM-065' AND contract_hash = 'fe64b3cd22bbea37cfa86ca1095f9db1add3fff1d9935bdcf55b77895e6cb81d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-066: Lệnh phong toả tài khoản
--   contract_hash: c8c182861ff2424008d635649b867e989b89fc2cbed2cc00aa9a5d0735def9cf
--   template_hash: d5288f2cc44e8d1075c4100a544238a2f790140d34d05ec4778a401aad15a5d4
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-066\BM-066_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-066__e3bc56081554') AND scope_key = 'BM-066' AND contract_hash = 'c8c182861ff2424008d635649b867e989b89fc2cbed2cc00aa9a5d0735def9cf' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-067: Biên bản phong tỏa tài khoản
--   contract_hash: 87c2f5af40780cb2dbe4ffef479be0e36d9b585d41de5cdd236a29ca977b97da
--   template_hash: fcf741da18d62f946bfbb883bb15c13ca3f072b09aff81d52e799e7828ef07e6
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-067\BM-067_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-067__0f7607122f29') AND scope_key = 'BM-067' AND contract_hash = '87c2f5af40780cb2dbe4ffef479be0e36d9b585d41de5cdd236a29ca977b97da' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-068: QĐ huỷ bỏ biện pháp phong toả tài khoản
--   contract_hash: b28cbe3744ccebd0d08346e6ec8a2642d202f18a9567416d4a09f06438ae5249
--   template_hash: dac180a58cda5b3c233d8f7f6f8568b89f9111c8728e229dd85c1aaa32b5b73b
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-068\BM-068_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-068__6c1275cc752e') AND scope_key = 'BM-068' AND contract_hash = 'b28cbe3744ccebd0d08346e6ec8a2642d202f18a9567416d4a09f06438ae5249' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-069: BB về việc hủy bỏ biện pháp phong tỏa tài khoản
--   contract_hash: 936230569823a0de75622ea0c727fc2e6b7b8db857e34d44f023e7d423ebd0eb
--   template_hash: d62a50056d820afa3cac7feb761a019ea7d4c435dc538bc4add9853491fc7a91
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-069\BM-069_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-069__3a67d1a2e298') AND scope_key = 'BM-069' AND contract_hash = '936230569823a0de75622ea0c727fc2e6b7b8db857e34d44f023e7d423ebd0eb' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-070: QĐ phân công PVT THQCT, KS việc giải quyết VAHS
--   contract_hash: 4b8ef8123535ccd37a0a616f494d8d5804629e597cd8501a82936923d7799d99
--   template_hash: b6d45ccc1620b1021fe7633a3f708c2abaabdaa92d4dcde4820bcedae2cdf60c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-070\BM-070_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-070__e63499f6fc20') AND scope_key = 'BM-070' AND contract_hash = '4b8ef8123535ccd37a0a616f494d8d5804629e597cd8501a82936923d7799d99' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-071: QĐ phân công KSV, KTV THQCT, KS việc giải quyết VAHS
--   contract_hash: f70d5cacbb02ca17d5936d1de66e3e9996fd49d21bf13a500d9e0c5a0ebf321e
--   template_hash: bb31e78d732e90ad80a409cb058982e9b8d59b57bfbf2d2595db19bdeda01edc
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-071\BM-071_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-071__cacf3f480888') AND scope_key = 'BM-071' AND contract_hash = 'f70d5cacbb02ca17d5936d1de66e3e9996fd49d21bf13a500d9e0c5a0ebf321e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-072: QĐ thay đổi VT, PVT, KSV, KTV THQCT, KS việc giải quyết vụ án hình sự
--   contract_hash: b0eb623cbd2a9442bb5014547bd24a99df5f84ff5b386593d887d0e0a9500c14
--   template_hash: 361f296c07d718af347d67ef9cd8e605bef0c7be0d9df7575036801f25a1ee22
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-072\BM-072_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-072__fadb53cde2cb') AND scope_key = 'BM-072' AND contract_hash = 'b0eb623cbd2a9442bb5014547bd24a99df5f84ff5b386593d887d0e0a9500c14' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-073: Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra
--   contract_hash: c6d76c70b1961b0aed4433bb60e527ec7c7305a91a6824134812d1627452e7a6
--   template_hash: 5bdc7163ec96530fe345ac0a962d222f668ee62ca9c702a024b2d387540ee5e9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-073\BM-073_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-073__e412fccad227') AND scope_key = 'BM-073' AND contract_hash = 'c6d76c70b1961b0aed4433bb60e527ec7c7305a91a6824134812d1627452e7a6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-074: Yêu cầu cử người phiên dịch, người dịch thuật
--   contract_hash: 431d99e77367ae9cbf4f1a571c9042796dad31e6044dcb46033e9f3388f98304
--   template_hash: 4f787ad8d204fd9657b75644de7cc07099600230c836a92cef5558aebb28ccc5
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-074\BM-074_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-074__e7b3ef2ccb68') AND scope_key = 'BM-074' AND contract_hash = '431d99e77367ae9cbf4f1a571c9042796dad31e6044dcb46033e9f3388f98304' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-075: Đề nghị thay đổi người phiên dịch, người dịch thuật
--   contract_hash: d1d2509fc4b0460da995051e0280ab89f595d2906e9bdd72b9f41622ffe3c4c7
--   template_hash: 1773c98f41e380d58a12861581a9c5c63ddf319fcb38647a57e5ea094c531ddf
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-075\BM-075_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-075__dc493cfb5fd3') AND scope_key = 'BM-075' AND contract_hash = 'd1d2509fc4b0460da995051e0280ab89f595d2906e9bdd72b9f41622ffe3c4c7' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-076: QĐ thay đổi người phiên dịch, người dịch thuật
--   contract_hash: 06db36355e12129a52587506c8723ac59a2b0528fda9cd8a4d07fcee2afe91e6
--   template_hash: 5df0e2bc86a95617bd9d1e44238890c1823cdd0b0117d64850bec01c61780cfe
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-076\BM-076_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-076__cd44ed3c7e5d') AND scope_key = 'BM-076' AND contract_hash = '06db36355e12129a52587506c8723ac59a2b0528fda9cd8a4d07fcee2afe91e6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-077: Yêu cầu, đề nghị cử người bào chữa
--   contract_hash: bda1b8dc0cf9f46cfb5a5d996fd7d19d56c86e9c1c941517061a87764b877d46
--   template_hash: d9560ba094329a87cc971b82a5ef8b583a4ce64383ca73ff80a640eb51926c40
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-077\BM-077_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-077__99d7843f9f9e') AND scope_key = 'BM-077' AND contract_hash = 'bda1b8dc0cf9f46cfb5a5d996fd7d19d56c86e9c1c941517061a87764b877d46' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-078: Thông báo người bào chữa
--   contract_hash: 580ddd64d13522a5a6bab4c774c67876cedd787e0f61c6fe1ebe66968d1949c8
--   template_hash: 1f07ab82bdb107701cbdd94e426c17a791ba7a06a22072e4de066e6a216ba00c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-078\BM-078_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-078__6845bd7e6cb1') AND scope_key = 'BM-078' AND contract_hash = '580ddd64d13522a5a6bab4c774c67876cedd787e0f61c6fe1ebe66968d1949c8' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-079: Thông báo huỷ bỏ việc đăng ký bào chữa
--   contract_hash: bd29c9897de0b6b2bf4e73176a7065af108df8bdedd3883916a2150b26ef2343
--   template_hash: 3bba3af33434757a04c8968d50bd2040ffad5e46bc0eaa080734a72cadfa9e69
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-079\BM-079_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-079__80698c347564') AND scope_key = 'BM-079' AND contract_hash = 'bd29c9897de0b6b2bf4e73176a7065af108df8bdedd3883916a2150b26ef2343' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-080: Thông báo từ chối việc đăng ký bào chữa
--   contract_hash: 5a7bad8f56d777787fbeb6a81d67049de3920da47342b31a461be2f12cebd77e
--   template_hash: 09dcf96b9cdb0a61d385b363b2cb0ecb67a73317e7c63406da726c60591bcf21
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-080\BM-080_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-080__a7aa64d4b889') AND scope_key = 'BM-080' AND contract_hash = '5a7bad8f56d777787fbeb6a81d67049de3920da47342b31a461be2f12cebd77e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-081: QĐ thời điểm người bào chữa tham gia tố tụng
--   contract_hash: 1547d35f2fe2fb8c435dc54c32d405254d2f6664adbb8cc5f70dc147cd4a4184
--   template_hash: bb1ea549c53540769064f1fb262c47931c3bf47bf5f321206a221c96afa6df3e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-081\BM-081_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-081__232b8c1d66ae') AND scope_key = 'BM-081' AND contract_hash = '1547d35f2fe2fb8c435dc54c32d405254d2f6664adbb8cc5f70dc147cd4a4184' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-082: Thông báo về thời gian, địa điểm tiến hành tố tụng cho người bào chữa
--   contract_hash: 78b45a1426e029dec644d9099b274c9ea959f6397d8299aa911830e214817ed4
--   template_hash: 47d809d3d5a8b43e1ff93566833f92848ea4a7531b454fdde4e06cf447a203a8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-082\BM-082_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-082__44cc2b043383') AND scope_key = 'BM-082' AND contract_hash = '78b45a1426e029dec644d9099b274c9ea959f6397d8299aa911830e214817ed4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-083: Yêu cầu thay đổi người giám định, người định giá tài sản
--   contract_hash: e3eddfebed38411c8e4a079c1edc52bf9d5ac722b9ba534d92f388e1ca875b39
--   template_hash: 68bc00bf25611f8b68a8169c1da8d3cace7d7aa43c654a92cc5bbc8227d5c787
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-083\BM-083_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-083__71218955a7c2') AND scope_key = 'BM-083' AND contract_hash = 'e3eddfebed38411c8e4a079c1edc52bf9d5ac722b9ba534d92f388e1ca875b39' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-084: QĐ thay đổi người giám định, người định giá tài sản
--   contract_hash: 2d3ffe1427dee726b290c88a0f1946cf84f2517245305d243dc392f76587ae67
--   template_hash: 0a029b30f6ddadede4aa30987f1df02377dab09001d4e8951f060584d1f3306f
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-084\BM-084_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-084__c21e2b7fa5cc') AND scope_key = 'BM-084' AND contract_hash = '2d3ffe1427dee726b290c88a0f1946cf84f2517245305d243dc392f76587ae67' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-085: QĐ chuyển vụ án hình sự để điều tra theo thẩm quyền
--   contract_hash: 653dcdebef0e3430177a9eb02cd55017d0e966a2956fbad197ecd4454f8ea511
--   template_hash: 16271efcb25b56531341e0b1e464f26aad7b7264b674b73c4948a68f06157ff2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-085\BM-085_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-085__ae0054d1db43') AND scope_key = 'BM-085' AND contract_hash = '653dcdebef0e3430177a9eb02cd55017d0e966a2956fbad197ecd4454f8ea511' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-086: QĐ chuyển việc thực hiện thẩm quyền thực hành quyền công tố, kiểm sát giải quyết nguồn tin, khởi tố điều tra
--   contract_hash: 4ddf33ed703e17ea203d41e0dd8786829068389e3cebc9b34e6b9de8a9028477
--   template_hash: 848d60389761a6235764d41dfecc373b6bf0c8848dfb176f16e6e71ec4492c34
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-086\BM-086_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-086__df834c030dc6') AND scope_key = 'BM-086' AND contract_hash = '4ddf33ed703e17ea203d41e0dd8786829068389e3cebc9b34e6b9de8a9028477' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-087: Yêu cầu điều tra
--   contract_hash: 2073fc4f62f6c90bedb7db9e43725378e17b76cc4ae65c0d09d7e415ac4ecbbd
--   template_hash: c12e13feefff283c4505f8ae1023e0077ebfb5cc3817f0a0272c69c41862a746
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-087\BM-087_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-087__80e8edb6b8b2') AND scope_key = 'BM-087' AND contract_hash = '2073fc4f62f6c90bedb7db9e43725378e17b76cc4ae65c0d09d7e415ac4ecbbd' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-088: QĐ huỷ bỏ QĐ nhập vụ án hình sự
--   contract_hash: 32e95678abded8cdda5d2c52e5ff991c634a9c1bab59284f9c1a45b9395b1e7a
--   template_hash: a427beb974ae4fe1dc2979e782056957502497be2355002903fa32646f52d069
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-088\BM-088_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-088__d9d213d94690') AND scope_key = 'BM-088' AND contract_hash = '32e95678abded8cdda5d2c52e5ff991c634a9c1bab59284f9c1a45b9395b1e7a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-089: QĐ huỷ bỏ QĐ tách vụ án hình sự
--   contract_hash: 20f40e3a9bd6144ab1ce8b5b4e2fd941cc6f96df142bfe7f5e6a4d9e4513dcb9
--   template_hash: 92896c7d48cf7c01db9fee692fccfd60becc27b5447d870af6c3ff04fd35290a
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-089\BM-089_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-089__9d0d4280c6a1') AND scope_key = 'BM-089' AND contract_hash = '20f40e3a9bd6144ab1ce8b5b4e2fd941cc6f96df142bfe7f5e6a4d9e4513dcb9' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-090: QĐ phê chuẩn QĐ khởi tố bị can
--   contract_hash: 4647c472fe0a209ca2d3f555e0aa42e40d25474569e0eb5215193194cf342ba8
--   template_hash: 2946af8259d24263fae8dd4f48d9cbbdb7d8592eb4c9630b87cdce1eda6123ba
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-090\BM-090_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-090__1c7858168558') AND scope_key = 'BM-090' AND contract_hash = '4647c472fe0a209ca2d3f555e0aa42e40d25474569e0eb5215193194cf342ba8' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-091: QĐ phê chuẩn QĐ thay đổi QĐ khởi tố bị can
--   contract_hash: 9cb3c9e1bf11a7d58b7cd90261b68cb1f534f02d4322f83634dccf71c73e8279
--   template_hash: 57699f2ff7fab1ee0a8407813ababb0e9aa8dd9d19ec417d56c783e657a56063
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-091\BM-091_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-091__18a41431ecae') AND scope_key = 'BM-091' AND contract_hash = '9cb3c9e1bf11a7d58b7cd90261b68cb1f534f02d4322f83634dccf71c73e8279' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-092: QĐ phê chuẩn QĐ bổ sung QĐ khởi tố bị can
--   contract_hash: 10cb653253ce98b4831635c361cc6599c59c79bf5f4d13449eab0e22d66afb14
--   template_hash: 5d74fc09805d6c0ab4f1542c4bd98aace28d05e9f175abdf07d76f959d7cf074
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-092\BM-092_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-092__f8ca4bc8033d') AND scope_key = 'BM-092' AND contract_hash = '10cb653253ce98b4831635c361cc6599c59c79bf5f4d13449eab0e22d66afb14' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-093: QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố bị can
--   contract_hash: 5168f7604b81ecc18ec3e0d7f2f397626a53955a9873b95398104f5afcc42968
--   template_hash: 094ab6bc1748dae433efc00c54d6c11344494fec28e645a456b71e34a1a306d1
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-093\BM-093_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-093__7273ce5a66b8') AND scope_key = 'BM-093' AND contract_hash = '5168f7604b81ecc18ec3e0d7f2f397626a53955a9873b95398104f5afcc42968' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-094: QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố bị can
--   contract_hash: 24e6d7a65b3ac82f08e078cb604d10f9a786e236d2d70f917eb478dda9c6db12
--   template_hash: eeb14dd685e24aaf67b69e6c68bb6d8535d8ebe1bb06da25d3d39b1cbcc11d42
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-094\BM-094_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-094__12ad016b36d2') AND scope_key = 'BM-094' AND contract_hash = '24e6d7a65b3ac82f08e078cb604d10f9a786e236d2d70f917eb478dda9c6db12' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-095: QĐ huỷ bỏ QĐ huỷ bỏ QĐ khởi tố bị can
--   contract_hash: f29fe31ae70557abcb0592af67ba8983645d94eb0dc2c4c5a56fdcaf60b3b95a
--   template_hash: 26db68c0c62ca6a7a4ecc055d5fc34d73fd231b7bab3986032e96f58d284d487
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-095\BM-095_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-095__83c3c1ef212f') AND scope_key = 'BM-095' AND contract_hash = 'f29fe31ae70557abcb0592af67ba8983645d94eb0dc2c4c5a56fdcaf60b3b95a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-096: Yêu cầu ra QĐ khởi tố bị can
--   contract_hash: 8f191de1ed66302a2450e1603ffa51dc40b9e80d7f97d1e6e51f240d313e7fa9
--   template_hash: 60d7b59ad62d23d2d833c119d9b6c110b789436497e4cd050a4005a3cd6c397c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-096\BM-096_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-096__a50a08efa62f') AND scope_key = 'BM-096' AND contract_hash = '8f191de1ed66302a2450e1603ffa51dc40b9e80d7f97d1e6e51f240d313e7fa9' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-097: QĐ khởi tố bị can
--   contract_hash: fd4b0c14e4602f667211f79cbe3ef0a340a9a3fd684d3b46d6af6b407625d79d
--   template_hash: 8b667d5129f35aa35e0cf629654bd4dbb2fc564b16a17bd5850c00f62466cffb
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-097\BM-097_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-097__17f981bf5afd') AND scope_key = 'BM-097' AND contract_hash = 'fd4b0c14e4602f667211f79cbe3ef0a340a9a3fd684d3b46d6af6b407625d79d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-098: Yêu cầu ra QĐ thay đổi quyết định khởi tố bị can
--   contract_hash: 41bdad342541684bec0906ca959ed0cd9ee6e04f1a43f0b264e10113517dd8c7
--   template_hash: 04a1ce2d1ae5d9bbdcffc5bbf5754cb26b489030eceacc34fa17eaf81ce00084
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-098\BM-098_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-098__949d75027001') AND scope_key = 'BM-098' AND contract_hash = '41bdad342541684bec0906ca959ed0cd9ee6e04f1a43f0b264e10113517dd8c7' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-099: QĐ thay đổi QĐ khởi tố bị can
--   contract_hash: 4bac2dd807fa785fe4a2a44bbffce7466c53b96349f5130c2a6e8cd5e48faf4a
--   template_hash: 5a004cf4b8e9864255aa5a880da2864c0edf1cb404db247a1b7e1fe211a53518
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-099\BM-099_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-099__ce4aa505a071') AND scope_key = 'BM-099' AND contract_hash = '4bac2dd807fa785fe4a2a44bbffce7466c53b96349f5130c2a6e8cd5e48faf4a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-100: Yêu cầu ra QĐ bổ sung QĐ khởi tố bị can
--   contract_hash: 38f5369eec0f00bffbf08e1484eeb9a6e9259f7b293405d15bc05c82ac078007
--   template_hash: 6f9af2f1bc42b46a484154b90d8769aaaf7420b4efb3968146ce6eb071efa733
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-100\BM-100_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-100__a359d20c8fed') AND scope_key = 'BM-100' AND contract_hash = '38f5369eec0f00bffbf08e1484eeb9a6e9259f7b293405d15bc05c82ac078007' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-101: QĐ bổ sung QĐ khởi tố bị can
--   contract_hash: 9b3ac258721a0db19fd15d8d363a64b26e5a91f185421c21dbc81fb2432915f2
--   template_hash: 8a1992838ac49d963866efe69658e71e4b02fbfec38db2ac33ca0f680825987b
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-101\BM-101_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-101__2fe2187f4777') AND scope_key = 'BM-101' AND contract_hash = '9b3ac258721a0db19fd15d8d363a64b26e5a91f185421c21dbc81fb2432915f2' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-102: QĐ huỷ bỏ QĐ khởi tố bị can
--   contract_hash: 5110cbe52f68b09bfc7a5d58143c9b8111ec01bcd60178b21b7fd6f1432c7c19
--   template_hash: 92155cbdc93c2e64f1be865c8fa3e2195e030094657aa2e340d067dbbf9b32b5
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-102\BM-102_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-102__88bde5060df8') AND scope_key = 'BM-102' AND contract_hash = '5110cbe52f68b09bfc7a5d58143c9b8111ec01bcd60178b21b7fd6f1432c7c19' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-103: Đề nghị gia hạn thời hạn điều tra
--   contract_hash: 81de09d6dba0e2dfa9dcc710331bb0bff09c30f35fc87e0b9e7f980f500f48d6
--   template_hash: 8e1cef60f0070c6700be04a0483b8cb11b71d2bc8a47f8c6328d7d5cce1dd207
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-103\BM-103_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-103__665eb32a5626') AND scope_key = 'BM-103' AND contract_hash = '81de09d6dba0e2dfa9dcc710331bb0bff09c30f35fc87e0b9e7f980f500f48d6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-104: quyết định gia hạn thời hạn điều tra VAHS
--   contract_hash: a25f7d3e9d7cbdebe707b5c428b2a3f2c22fded76535e88fda4976767c02a60c
--   template_hash: 1441fa5ea49637b1482b975bc38bc0682a04e836c55a93905fd64e5fd6be10af
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-104\BM-104_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-104__6d6f5903cad3') AND scope_key = 'BM-104' AND contract_hash = 'a25f7d3e9d7cbdebe707b5c428b2a3f2c22fded76535e88fda4976767c02a60c' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-105: QĐ không gia hạn thời hạn điều tra VAHS
--   contract_hash: b7086521d3dfc166fe467b126c569d6a95d594ca0692b9da61a3498fb41a3ead
--   template_hash: 222385f5266b9ff708dfa0c2bc73e9033af04553c157adf41f22b18514ebc553
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-105\BM-105_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-105__c83181e6b64b') AND scope_key = 'BM-105' AND contract_hash = 'b7086521d3dfc166fe467b126c569d6a95d594ca0692b9da61a3498fb41a3ead' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-106: Yêu cầu truy nã bị can
--   contract_hash: 3da2dcf3bb82a6a600e9fc6a33ec969856304c4969f16e8588eddcbb2d41db56
--   template_hash: c89f5b14fded08fa860f7740b456af2eeef3b1aff0cf9dc53a1b859a03e17fb4
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-106\BM-106_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-106__7f44c9dd261a') AND scope_key = 'BM-106' AND contract_hash = '3da2dcf3bb82a6a600e9fc6a33ec969856304c4969f16e8588eddcbb2d41db56' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-107: QĐ huỷ bỏ QĐ tạm đình chỉ điều tra VAHS
--   contract_hash: ed80ba7be17e6dc91480cff35e59bbe13a606258883157ac2d5418e719f845bf
--   template_hash: ef94c1780d1de54a7ba8bb44028908d0e9dc7bdf021c84d88e43a9d4acd64213
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-107\BM-107_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-107__9b3379af7cfe') AND scope_key = 'BM-107' AND contract_hash = 'ed80ba7be17e6dc91480cff35e59bbe13a606258883157ac2d5418e719f845bf' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-108: QĐ huỷ bỏ QĐ tạm đình chỉ điều tra bị can
--   contract_hash: e4bd4186a857d7f95b07ac4dba879bd908230d57b959c7ed3b83ed2c7f7a9c8b
--   template_hash: d8ee54bb0f3411f094c9fa03aec7a8ece2ea6c1231f32c54a09fdad92b2214a2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-108\BM-108_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-108__baea4e0f603e') AND scope_key = 'BM-108' AND contract_hash = 'e4bd4186a857d7f95b07ac4dba879bd908230d57b959c7ed3b83ed2c7f7a9c8b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-109: QĐ huỷ bỏ QĐ tạm đình chỉ điều tra VAHS đối với bị can
--   contract_hash: 97d9c4ee9711fb4efac572c79d417e13fb4a9f22f2a17a5c7abd86c2ad1194d9
--   template_hash: 926a7d0d9f9bfa38968a463b7c9e5e4e8525e56dfeae6446d33db65e51fc905e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-109\BM-109_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-109__0fe502079a3e') AND scope_key = 'BM-109' AND contract_hash = '97d9c4ee9711fb4efac572c79d417e13fb4a9f22f2a17a5c7abd86c2ad1194d9' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-110: QĐ huỷ bỏ QĐ đình chỉ điều tra VAHS
--   contract_hash: 055efd484bac7ab959c752378bf657b66cad12697ac7cbeff662afafcc967523
--   template_hash: b8ddfddb65323bf3f3c26f93460936ba93aea9e00b39ef6640f5dc980fb86282
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-110\BM-110_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-110__a1f991fed29c') AND scope_key = 'BM-110' AND contract_hash = '055efd484bac7ab959c752378bf657b66cad12697ac7cbeff662afafcc967523' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-111: QĐ huỷ bỏ QĐ đình chỉ điều tra bị can
--   contract_hash: 7a3e1c623d963e297935c0bcc5b094b920ae9e4bd4228ababbb7d975cb010aab
--   template_hash: d9e29fbcdc75645dfa30bab7039f7b6ee7695fde0d36dde7f527ebebfccf2275
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-111\BM-111_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-111__33851c577165') AND scope_key = 'BM-111' AND contract_hash = '7a3e1c623d963e297935c0bcc5b094b920ae9e4bd4228ababbb7d975cb010aab' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-112: QĐ huỷ bỏ QĐ đình chỉ điều tra VAHS đối với bị can
--   contract_hash: 050baf284a9f9f2a117ac14765f62e9c15ed16b326590f1d33754d0f54c5a127
--   template_hash: be561a60d763ec3ae45be536b1d3895d28c27ae2d7943d9f7b9442b9278f0b33
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-112\BM-112_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-112__109c846bbe17') AND scope_key = 'BM-112' AND contract_hash = '050baf284a9f9f2a117ac14765f62e9c15ed16b326590f1d33754d0f54c5a127' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-113: Yêu cầu phục hồi điều tra VAHS
--   contract_hash: 4ba626dfcf86eae25c36ce08a9dd58ba2c6c5f127b16b6b8ddcfd420d8ea9c7f
--   template_hash: c95dc8eed9933299dd57e1ba06b8646b156218614cc93a2fa553e9aab325a49e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-113\BM-113_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-113__2651c6185250') AND scope_key = 'BM-113' AND contract_hash = '4ba626dfcf86eae25c36ce08a9dd58ba2c6c5f127b16b6b8ddcfd420d8ea9c7f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-114: Yêu cầu phục hồi điều tra bị can
--   contract_hash: 002ddd3aedd16d197f8a626834740e30df1789e088969a021499b15efa368318
--   template_hash: 173dd15b898eebf2db9ede93e85730db40fa7e363cc84bf8978b6fdc7e96a5be
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-114\BM-114_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-114__84cec283ce1b') AND scope_key = 'BM-114' AND contract_hash = '002ddd3aedd16d197f8a626834740e30df1789e088969a021499b15efa368318' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-115: Yêu cầu phục hồi điều tra VAHS đối với bị can
--   contract_hash: 8c9f4098af26e7fc5aa6502b0a5660fbf31bd28b77127b3e72ddf96fb4b35ac4
--   template_hash: 8f48a1220fdc8e379ae23b46c59d142a43518f93ad382061aab010170c535826
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-115\BM-115_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-115__94659bf76001') AND scope_key = 'BM-115' AND contract_hash = '8c9f4098af26e7fc5aa6502b0a5660fbf31bd28b77127b3e72ddf96fb4b35ac4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-116: QĐ phục hồi điều tra vụ án hình sự
--   contract_hash: 7c40691f3b79e90268c8b9a79b28e88e4d13d61449cc832a6cee72a04896abef
--   template_hash: 8498fc557b8f40a5a7713714c82505c2335abc38929d85e93d77a3b1456f2873
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-116\BM-116_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-116__23c45f530ed1') AND scope_key = 'BM-116' AND contract_hash = '7c40691f3b79e90268c8b9a79b28e88e4d13d61449cc832a6cee72a04896abef' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-117: QĐ phục hồi điều tra bị can
--   contract_hash: 32f16e8a4d525d3755dd3e0470fecb76fb2dabdc1692144aefdb53d73b63d274
--   template_hash: cd7aadeed6477f733aebe25a3f728a26cbe65b615121abd25ae6c1a208b4add3
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-117\BM-117_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-117__c9531f5e460e') AND scope_key = 'BM-117' AND contract_hash = '32f16e8a4d525d3755dd3e0470fecb76fb2dabdc1692144aefdb53d73b63d274' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-118: QĐ phục hồi điều tra VA đối với bị can
--   contract_hash: 45df88fe9bc46ed834b421d8c5f9e601a141b8b0396748b13ee9653a68bcb12e
--   template_hash: f3e4e5e867683270e037c186230dbaeb4282c7c77a2d3ab1e068d7de68984e79
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-118\BM-118_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-118__7d13f5eae86d') AND scope_key = 'BM-118' AND contract_hash = '45df88fe9bc46ed834b421d8c5f9e601a141b8b0396748b13ee9653a68bcb12e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-119: QĐ phê chuẩn Lệnh khám xét
--   contract_hash: df0e42afcbcc23d5be75f330425167446ac1ee771981aa883cd79fb582e2adee
--   template_hash: 24b2adb75422961c3fb4d3d2c1501291b1cfcfaa14699ff8cc93c1afea6c5ced
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-119\BM-119_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-119__bb054433cbac') AND scope_key = 'BM-119' AND contract_hash = 'df0e42afcbcc23d5be75f330425167446ac1ee771981aa883cd79fb582e2adee' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-120: QĐ không phê chuẩn Lệnh khám xét
--   contract_hash: c916864762903c4b068009b5d2e19edf4ea641c938925c2cb5c04e8355cac626
--   template_hash: 215a556b5b3c774c2444ce560d96da64dcd2680959ad8eb2a19fb9715d68f2c7
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-120\BM-120_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-120__e702d429a0f3') AND scope_key = 'BM-120' AND contract_hash = 'c916864762903c4b068009b5d2e19edf4ea641c938925c2cb5c04e8355cac626' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-121: QĐ phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm
--   contract_hash: c819af3de40da4039703816500a10fb3363cc5e112cfe0b7ba19a09f41b34a18
--   template_hash: 441f285d303d368e6840f7e14c2cb6dded569eb43cb9af900c9d699ef374cbc1
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-121\BM-121_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-121__a7983088c6ec') AND scope_key = 'BM-121' AND contract_hash = 'c819af3de40da4039703816500a10fb3363cc5e112cfe0b7ba19a09f41b34a18' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-122: QĐ không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm
--   contract_hash: 286655c9c450577b8269e624863e4072c3a996f851f42ed277102b8d7a72eb3f
--   template_hash: b80534fb9803ea9e27dcf3dbb7b23c449bb07ba9d3910c90d3260120e7af63f3
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-122\BM-122_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-122__c6efcf63e36a') AND scope_key = 'BM-122' AND contract_hash = '286655c9c450577b8269e624863e4072c3a996f851f42ed277102b8d7a72eb3f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-123: QĐ thực nghiệm điều tra
--   contract_hash: 0c1f9650b6e96665c39a32c2c5c9fa56e7b63397498002011186234faa73a98c
--   template_hash: fad375d409abb7f10759beb4b94924640c550d0c71512656fdbfcd0575adace7
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-123\BM-123_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-123__8aa275f0ac70') AND scope_key = 'BM-123' AND contract_hash = '0c1f9650b6e96665c39a32c2c5c9fa56e7b63397498002011186234faa73a98c' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-124: Biên bản thực nghiệm điều tra
--   contract_hash: 0a21aa647459e92567d7a5d01a711500dec9746002eb023b77ec26945e6f2d5f
--   template_hash: ec281f1d677dc8667e1860fce69a75c8b30d18c9acd99525d7f011a769ac803b
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-124\BM-124_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-124__1fca98cb2e90') AND scope_key = 'BM-124' AND contract_hash = '0a21aa647459e92567d7a5d01a711500dec9746002eb023b77ec26945e6f2d5f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-125: Thông báo về việc không chấp nhận đề nghị trưng cầu giám định, định giá tài sản
--   contract_hash: 8240f9aa7add45daa3506459b7634af8894324663247fa6d5660c40ced869595
--   template_hash: 8c9c36fe2f69d053e4cd00ec50c4c8150dded506990f6e8b7f3f755d9416b1d9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-125\BM-125_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-125__77ec214513fb') AND scope_key = 'BM-125' AND contract_hash = '8240f9aa7add45daa3506459b7634af8894324663247fa6d5660c40ced869595' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-126: QĐ trưng cầu giám định
--   contract_hash: f93804333e225d34d925dd47d9bfb9917a374ec3c2d656cf63de3a22237de4f9
--   template_hash: b0d59e4a605ca4b4a7e5a0730054084927d2ee76a3589f7a252188481b521d1a
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-126\BM-126_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-126__2d8c3d38368b') AND scope_key = 'BM-126' AND contract_hash = 'f93804333e225d34d925dd47d9bfb9917a374ec3c2d656cf63de3a22237de4f9' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-127: Yêu cầu định giá tài sản
--   contract_hash: ac2d000bd22dae3e9a493eb585cbda2499306d16ca3dc528a9784f039f4fd0d9
--   template_hash: ccf87c0715410f7ecdcc8d0d3cd34a24ec70ab18a6d211b666eb6d2abfe2cbca
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-127\BM-127_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-127__582febaeadf0') AND scope_key = 'BM-127' AND contract_hash = 'ac2d000bd22dae3e9a493eb585cbda2499306d16ca3dc528a9784f039f4fd0d9' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-128: Thông báo nội dung kết luận giám định, định giá tài sản
--   contract_hash: b95c5512e94551b98c870407788563fa5ed3ac20de69d343a0073e14834de151
--   template_hash: ff31548bb5bb1f3299fe54ed3bdd27fc4309053daef79097699a2d0d3bbc2158
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-128\BM-128_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-128__8eab646ee06f') AND scope_key = 'BM-128' AND contract_hash = 'b95c5512e94551b98c870407788563fa5ed3ac20de69d343a0073e14834de151' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-129: QĐ trưng cầu giám định bổ sung
--   contract_hash: c9c27f4a4ca1147785f97f91b7d15c804194b2fc4a9b53883e1bfe7401927ce7
--   template_hash: 205842ad200239a4cbf5aee9242db8e51c51bc906bb1e0ef4638c03312862c1a
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-129\BM-129_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-129__7fb66a442c28') AND scope_key = 'BM-129' AND contract_hash = 'c9c27f4a4ca1147785f97f91b7d15c804194b2fc4a9b53883e1bfe7401927ce7' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-130: QĐ trưng cầu giám định lại
--   contract_hash: 779090f57361131debbbce9d7de521910440e9876312fd48e1fffecb3e4546cc
--   template_hash: be6030c675f0304a11423ef5ba130b53fbf8d622f5f5f9ed2d58ff31c57a2e5a
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-130\BM-130_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-130__9a859e843d48') AND scope_key = 'BM-130' AND contract_hash = '779090f57361131debbbce9d7de521910440e9876312fd48e1fffecb3e4546cc' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-131: Yêu cầu định giá lại tài sản
--   contract_hash: 7329bb0f96ec4c247fde037ce9754f014114d2fbb5ea3b839472924d88ba9b20
--   template_hash: 451b9f776deb72245f58c00a68f538989b6fd8b20e81e1d6a03430ca41c64611
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-131\BM-131_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-131__91726e55d979') AND scope_key = 'BM-131' AND contract_hash = '7329bb0f96ec4c247fde037ce9754f014114d2fbb5ea3b839472924d88ba9b20' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-132: QĐ định giá lại tài sản trong trường hợp đặc biệt
--   contract_hash: ac3c61f4a52c1b2625ce137d0f8706a7613719156c91a7c208bc1d934bf5a8c4
--   template_hash: 2c9bb5df65eafbd7d545d6451ac67a164d454b95b814187915580ddb288e098f
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-132\BM-132_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-132__670b47f0b235') AND scope_key = 'BM-132' AND contract_hash = 'ac3c61f4a52c1b2625ce137d0f8706a7613719156c91a7c208bc1d934bf5a8c4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-133: QĐ giám định lại trong trường hợp đặc biệt
--   contract_hash: d0b683feb7611556aef4c2d460880085c44ec8b2eda5c44c264067894db97f25
--   template_hash: af6243e4c30e7bd97b21aaf3844f247e252f94238517235e49008459f61fa2f9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-133\BM-133_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-133__1f7f12f1a249') AND scope_key = 'BM-133' AND contract_hash = 'd0b683feb7611556aef4c2d460880085c44ec8b2eda5c44c264067894db97f25' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-134: BB ghi lời khai
--   contract_hash: 686094fe58a08f140e85211743ac31d5e00de79b6c5f8e3c7b8a0576be70a6c5
--   template_hash: 1f3918875cacd7a6b7852db04d9b08ef7febdfb009f3a63e8aa6d0e59993cdd4
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-134\BM-134_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-134__7c1e123c01b0') AND scope_key = 'BM-134' AND contract_hash = '686094fe58a08f140e85211743ac31d5e00de79b6c5f8e3c7b8a0576be70a6c5' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-135: BB hỏi cung bị can
--   contract_hash: 8f3c0215685013faf6247545cb013d86f12457474d4b0ea9e94bc9b36e7853a7
--   template_hash: 260862dd3ddc7c022cee6d90c26b84ada9b47e36f8bc74b384e27487936347e0
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-135\BM-135_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-135__79b31ad7511e') AND scope_key = 'BM-135' AND contract_hash = '8f3c0215685013faf6247545cb013d86f12457474d4b0ea9e94bc9b36e7853a7' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-136: BB đối chất
--   contract_hash: 83e99a639caebcf50dabb61c17813c785b6400523b85b84186458f6af9d66b11
--   template_hash: 7895ed9d72eeebe6c80963d14e2fa672adbea39e47f89eccbdf070c6834f1e05
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-136\BM-136_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-136__f7c2e28ddd12') AND scope_key = 'BM-136' AND contract_hash = '83e99a639caebcf50dabb61c17813c785b6400523b85b84186458f6af9d66b11' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-137: Biên bản xác minh-làm việc
--   contract_hash: ff9ffa0d92a1283a21ab1cf05489555354c9e330aebe4cb912b5e946a5ae4479
--   template_hash: 6baa8de02bf419aa6575e1736c3c6426eee2fb37136520f6bd9acdcddf8b63b4
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-137\BM-137_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-137__d2c569c61fb7') AND scope_key = 'BM-137' AND contract_hash = 'ff9ffa0d92a1283a21ab1cf05489555354c9e330aebe4cb912b5e946a5ae4479' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-138: Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng có vi phạm pháp luật trong điều tra
--   contract_hash: de585f30c7f0f5533cf6055e4ec4de6f531d9d362cca6aede65d68fa617fdd75
--   template_hash: c897e3f65ac5da0c0bcdcce27119edbe5bcc56b652e82ff63cf20f2f0df408b2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-138\BM-138_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-138__bf31a1f547b0') AND scope_key = 'BM-138' AND contract_hash = 'de585f30c7f0f5533cf6055e4ec4de6f531d9d362cca6aede65d68fa617fdd75' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-139: Kiến nghị khắc phục vi phạm trong hoạt động khởi tố, điều tra
--   contract_hash: a77e1220da66359ecd54ab25d8d85dc163a8c9faf1a61db268933c95750b9446
--   template_hash: 3578741610760ce1e1051bafbc4c875b153a5719e18efdee3e2846b15a5f96bd
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-139\BM-139_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-139__23306e6022bd') AND scope_key = 'BM-139' AND contract_hash = 'a77e1220da66359ecd54ab25d8d85dc163a8c9faf1a61db268933c95750b9446' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-140: Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp luật
--   contract_hash: e564a5fc3d5afccaafe47a8c673b7d45e411716a10de5fa8ff2beec585c3d197
--   template_hash: af5fb4fb1eeaa5b389ca1905f1704acee9e129b16bb9a09ca66996541b92dd8c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-140\BM-140_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-140__13e1ade15acd') AND scope_key = 'BM-140' AND contract_hash = 'e564a5fc3d5afccaafe47a8c673b7d45e411716a10de5fa8ff2beec585c3d197' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-141: QĐ chuyển vụ án để truy tố
--   contract_hash: 837cfc3090acf7ca38b4985689ff8d206014c2c1aaa98e02dc356dca0a873677
--   template_hash: e3cd4d0e1fbfbaf1b7ed5eca6e481615c38ffc818a93560bce457df959ea1901
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-141\BM-141_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-141__abc5fb5fb096') AND scope_key = 'BM-141' AND contract_hash = '837cfc3090acf7ca38b4985689ff8d206014c2c1aaa98e02dc356dca0a873677' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-142: Quyết định nhập vụ án hình sự trong giai đoạn truy tố
--   contract_hash: af232a7d9cd3559278008fbf24ceff566751b9520319e5401949b50f93a151d7
--   template_hash: 2b921963bb91ad2ca3c31fe6eb2f840f60c9cab75950a792cc898e7293aa1d38
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-142\BM-142_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-142__02d373abb354') AND scope_key = 'BM-142' AND contract_hash = 'af232a7d9cd3559278008fbf24ceff566751b9520319e5401949b50f93a151d7' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-143: Quyết định tách vụ án hình sự trong giai đoạn truy tố
--   contract_hash: 4f3b27a41a80870ab94817a8af41050b03c6aa821d6d73005338e04dac0b08a3
--   template_hash: 15ee63500b3c3405dbdf1edf8b2eb13227dd35ba4a31124d6a5ea0195137c20c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-143\BM-143_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-143__7ad54f65b3a0') AND scope_key = 'BM-143' AND contract_hash = '4f3b27a41a80870ab94817a8af41050b03c6aa821d6d73005338e04dac0b08a3' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-144: QĐ gia hạn thời hạn QĐ việc truy tố
--   contract_hash: ac0afea48d2f3f117c4b597836a5077044161ec38dcf0b29896490d5f3873fe1
--   template_hash: c976de6189c5da19b47ac7308a57ea3867f8801c00a603c3cebea5f715cb9c41
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-144\BM-144_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-144__720233712d47') AND scope_key = 'BM-144' AND contract_hash = 'ac0afea48d2f3f117c4b597836a5077044161ec38dcf0b29896490d5f3873fe1' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-145: QĐ trả hồ sơ vụ án để điều tra bổ sung
--   contract_hash: 626fdac11474e75eb41bc798d3087651367c486df64f2c0774e3bbd1c5300e2d
--   template_hash: f3bd3942a4bf7eac10a55a59d621d71163599d029939e550bb7ba889655eddee
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-145\BM-145_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-145__fc22267f4a63') AND scope_key = 'BM-145' AND contract_hash = '626fdac11474e75eb41bc798d3087651367c486df64f2c0774e3bbd1c5300e2d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-146: QĐ tạm đình chỉ vụ án
--   contract_hash: 188e9b2d3d997e79e423ee1ab72735657936b38773d9e12b0318a30235240b84
--   template_hash: 889c656a1cac84a5b7718f846e53a4cfb7138e7b38c158c073290ac14ec720ba
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-146\BM-146_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-146__59e5d7e21119') AND scope_key = 'BM-146' AND contract_hash = '188e9b2d3d997e79e423ee1ab72735657936b38773d9e12b0318a30235240b84' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-147: QĐ huỷ bỏ QĐ tạm đình chỉ vụ án
--   contract_hash: c995d913ae723c5189daf9c2be28d6dbc32008aea804e724b111d110efdf2f71
--   template_hash: 21d2be51876b3b665559dfbaa0535a3625de277a8bb1dd17536bb00eb08b2d40
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-147\BM-147_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-147__7bf9bc811cad') AND scope_key = 'BM-147' AND contract_hash = 'c995d913ae723c5189daf9c2be28d6dbc32008aea804e724b111d110efdf2f71' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-148: QĐ tạm đình chỉ vụ án đối với bị can
--   contract_hash: bbc099825c38e364ad78e62c80d506ae31445aeaf206c896d7ad4ad6aab692a8
--   template_hash: 5c288714eed53bf8614c437f0c443ed8bd755d30c621f51c8f1b696a5a9eac43
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-148\BM-148_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-148__d4d27bb90141') AND scope_key = 'BM-148' AND contract_hash = 'bbc099825c38e364ad78e62c80d506ae31445aeaf206c896d7ad4ad6aab692a8' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-149: QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can
--   contract_hash: 2e94da4157b0dc659096f753ce76c5d03b0731aec5f82c122d422c9dc8e8f4f4
--   template_hash: 9f31afd57a604a143a30ac32c43a409af79052da2b593993b047e147442b36c2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-149\BM-149_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-149__3990ac4442f1') AND scope_key = 'BM-149' AND contract_hash = '2e94da4157b0dc659096f753ce76c5d03b0731aec5f82c122d422c9dc8e8f4f4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-150: QĐ đình chỉ vụ án
--   contract_hash: 925eb11e03fcec146d51316fecded952fa01e5613294b98e8a616310110f697d
--   template_hash: ce003441daafab6550c6ce7a05db0873002120e76c1f1f809d356d835e5c55c8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-150\BM-150_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-150__d19a8665087c') AND scope_key = 'BM-150' AND contract_hash = '925eb11e03fcec146d51316fecded952fa01e5613294b98e8a616310110f697d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-151: QĐ huỷ bỏ QĐ đình chỉ vụ án
--   contract_hash: f2e04bb8fa0ce8d53a7aab7033aa139983e1dd07a028edc07b17e10038f6fd9c
--   template_hash: f45ef84b4dd12bdf87018c6975f09c176ff1ada4413fb4172d5dcdfc064a6623
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-151\BM-151_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-151__d3ead7c40b56') AND scope_key = 'BM-151' AND contract_hash = 'f2e04bb8fa0ce8d53a7aab7033aa139983e1dd07a028edc07b17e10038f6fd9c' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-152: QĐ đình chỉ vụ án đối với bị can
--   contract_hash: 72543f4ac2ec33adc97958b5da298aacf16adbfd792cb984de7e70aa3479054e
--   template_hash: 6c50f1626f2292c8218a0466e45322abdd73b2c8cd0590ece8f99f6d264f04c0
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-152\BM-152_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-152__d28f03a3f72b') AND scope_key = 'BM-152' AND contract_hash = '72543f4ac2ec33adc97958b5da298aacf16adbfd792cb984de7e70aa3479054e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-153: QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can
--   contract_hash: 7264e42d8519c662bb7fa39038c4bfa509b7e60a1f1a476f98f9fa190ce0f234
--   template_hash: b839450111db6164e54901b2ef57805e48024c9e5a665017ef63d794b89d8500
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-153\BM-153_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-153__829ed04c824a') AND scope_key = 'BM-153' AND contract_hash = '7264e42d8519c662bb7fa39038c4bfa509b7e60a1f1a476f98f9fa190ce0f234' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-154: QĐ phục hồi vụ án
--   contract_hash: 9b3de5b49f5891124b161722bd2c81e17c32d7c1d521526a0477030b7b53bd7b
--   template_hash: 4ec5e222a92e31af9c4a082ebaefb20e4b6e673899d757fabbfed5f686f2d057
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-154\BM-154_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-154__618d13a959ca') AND scope_key = 'BM-154' AND contract_hash = '9b3de5b49f5891124b161722bd2c81e17c32d7c1d521526a0477030b7b53bd7b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-155: QĐ phục hồi vụ án đối với bị can
--   contract_hash: daf72621ef6c0845d6effe8d16b35271faa90435b34f0dadd77a376d69ef7ecf
--   template_hash: 48777fdad36005657bbd76a7ca9caf04357e5ca6d55e5ad88126592b782eb249
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-155\BM-155_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-155__d89766f2092a') AND scope_key = 'BM-155' AND contract_hash = 'daf72621ef6c0845d6effe8d16b35271faa90435b34f0dadd77a376d69ef7ecf' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-156: Cáo trạng
--   contract_hash: ef91af6560841906457fd57e290cad28d7382011a66b46a7e4445261dfbdfce6
--   template_hash: 2f7472289368b2a55fda50e327e97cb2f19334aadb7acea8e52d92ca0a60519e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-156\BM-156_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-156__ef438a40e567') AND scope_key = 'BM-156' AND contract_hash = 'ef91af6560841906457fd57e290cad28d7382011a66b46a7e4445261dfbdfce6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-157: Bản kê vật chứng kèm theo Cáo trạng
--   contract_hash: 1b4dadd4eac7d31ae21c293d2b55fbd017a1b9afdbbd640ef28f468a24b1789d
--   template_hash: 3e16234507694f830aa90c2fc0bdbd31c05672b65b5788eff36f3015d0dcc946
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-157\BM-157_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-157__a5c6971a69d2') AND scope_key = 'BM-157' AND contract_hash = '1b4dadd4eac7d31ae21c293d2b55fbd017a1b9afdbbd640ef28f468a24b1789d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-158: Danh sách đề nghị triệu tập đến phiên tòa
--   contract_hash: b14015f5f3aa0f2f1def6306d21310f28c2c099925fbd1b8025385d08eb839f7
--   template_hash: d3029b81d9c5c1dce0b83c716b09c03f8d92f3572b23dbe799c0fc4f0c7f93c3
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-158\BM-158_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-158__7a98055a3e9c') AND scope_key = 'BM-158' AND contract_hash = 'b14015f5f3aa0f2f1def6306d21310f28c2c099925fbd1b8025385d08eb839f7' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-159: QĐ phân công VKS cấp dưới THQCT, KS xét xử VAHS
--   contract_hash: db261e02c5e0a564886c0799132dd862791989feca96bee25ec9018529bf85ac
--   template_hash: 39172e9b00bc4d7c9a3256d9c3f1f343b1f528d8b7f874d51658adace6e5cc5c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-159\BM-159_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-159__d95eb7bda8e3') AND scope_key = 'BM-159' AND contract_hash = 'db261e02c5e0a564886c0799132dd862791989feca96bee25ec9018529bf85ac' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-160: Biên bản niêm yết công khai văn bản tố tụng
--   contract_hash: 6cfc35b71ca477a6bd70cf34e4fdb7f504768621dfe4be309871aee05a253fcd
--   template_hash: 714074ddca4a8d05a49e08714eec80aa4d3d5bb0480b91e3e5eb51577d01201c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-160\BM-160_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-160__2f8e7c014448') AND scope_key = 'BM-160' AND contract_hash = '6cfc35b71ca477a6bd70cf34e4fdb7f504768621dfe4be309871aee05a253fcd' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-161: Phiếu yêu cầu trích xuất
--   contract_hash: b4cbbb2b43a508e51a59f66d6e8691a9ef91fd132e7ac7b86c70c2f45d399c84
--   template_hash: a74375f2d89bdcc7c87acaf9f734a87be0fcedba729f65a17fb9b4fc53fa30c9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-161\BM-161_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-161__5c910ef4adf5') AND scope_key = 'BM-161' AND contract_hash = 'b4cbbb2b43a508e51a59f66d6e8691a9ef91fd132e7ac7b86c70c2f45d399c84' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-162: Giấy mời
--   contract_hash: 2057195d8793a6708f49574cf58b8705b0977cbf15e49f813e6b9c6c2649d194
--   template_hash: 9f9fdc07a8d88442d8e25a3fe234b34a96043ae1fb43ee5596817739cc0fcd57
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-162\BM-162_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-162__6e7e16348066') AND scope_key = 'BM-162' AND contract_hash = '2057195d8793a6708f49574cf58b8705b0977cbf15e49f813e6b9c6c2649d194' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-163: Giấy triệu tập
--   contract_hash: 7183df52a87590d54899230f12925f5d5aa287661f531410f62195c9758afb68
--   template_hash: 40c48cb6531ff30c2d6de6bbf77204030b161c627b07c1212f5d3a322e406d79
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-163\BM-163_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-163__61941122b9e4') AND scope_key = 'BM-163' AND contract_hash = '7183df52a87590d54899230f12925f5d5aa287661f531410f62195c9758afb68' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-164: BB giao nhận Cáo trạng, QĐ truy tố theo thủ tục rút gọn, QĐ tạm đình chỉ vụ án, đình chỉ vụ án
--   contract_hash: 0d5a45fc628443aeab95cf6fc7b9e2b58a04a7ae581cc49317f6f2cd3dbf3bbd
--   template_hash: bbba91d484a41d2260630e89b066b528d6d2ee54983c6de50012b7bd85a2d127
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-164\BM-164_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-164__04fa37dd8384') AND scope_key = 'BM-164' AND contract_hash = '0d5a45fc628443aeab95cf6fc7b9e2b58a04a7ae581cc49317f6f2cd3dbf3bbd' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-165: Thông báo về việc vụ án có bị can bị tạm giam
--   contract_hash: 6e1e1974a774423bcd03891eede2c73d1ef15516679c59d73664044e4f44e1d6
--   template_hash: edccedcb087c746122b9d49062bad9f072918b9c7d3f8be3d6bee836d1dcc4a4
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-165\BM-165_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-165__d391dc4d1ffb') AND scope_key = 'BM-165' AND contract_hash = '6e1e1974a774423bcd03891eede2c73d1ef15516679c59d73664044e4f44e1d6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-166: QĐ trả hồ sơ vụ án để điều tra lại
--   contract_hash: e804756acf6cbd87aeb61c0d0b78f8e09d574851992ba0fd789c2e8e6ca0e54e
--   template_hash: da576a8778e44927857208ce6070c8086cea764104ff10806672a4a44bf157d9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-166\BM-166_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-166__d0762a0ffb28') AND scope_key = 'BM-166' AND contract_hash = 'e804756acf6cbd87aeb61c0d0b78f8e09d574851992ba0fd789c2e8e6ca0e54e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-167: Thông báo về việc trả hồ sơ, ban hành cáo trạng
--   contract_hash: 9628d2e78f26ba3bd7093768d0daa49dfd55fbdfd12d05b36cead0032604887a
--   template_hash: 80d5fead22292ec8bc3419357b13412d52ecd3681a5e2ed0716db0d2283e0f49
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-167\BM-167_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-167__70817b325370') AND scope_key = 'BM-167' AND contract_hash = '9628d2e78f26ba3bd7093768d0daa49dfd55fbdfd12d05b36cead0032604887a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-168: BB giao nhận hồ sơ vụ án, vụ việc
--   contract_hash: 3b9b63ca608d696041ef4d362bd42500ed0170bac5d0db9b881c0f8f85e8cfe3
--   template_hash: a6820df65409e4a08e9678207b323ebccba19fc89dd7666fa793e3f348c3d931
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-168\BM-168_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-168__3369df5870b2') AND scope_key = 'BM-168' AND contract_hash = '3b9b63ca608d696041ef4d362bd42500ed0170bac5d0db9b881c0f8f85e8cfe3' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-169: QĐ xử lý vật chứng
--   contract_hash: a532eca2250b7897ceac8d2f9ee8318f07810991b4bf4523c36bcfbb496a69ac
--   template_hash: ff3d0e99ad14618ca9417f4fe540c74b871547376b757283b5b6a22bc0c83971
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-169\BM-169_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-169__b737aefc0c16') AND scope_key = 'BM-169' AND contract_hash = 'a532eca2250b7897ceac8d2f9ee8318f07810991b4bf4523c36bcfbb496a69ac' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-170: QĐ huỷ bỏ QĐ xử lý vật chứng
--   contract_hash: 0cb9cfa5f861af915debbb076f5e76d73edce14078eca85776481ad30e3aaf17
--   template_hash: df691e4ef0c45dba11d3e6fcc72e20f87edc301f3f8e1913fe5320a1ed74bb53
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-170\BM-170_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-170__c8f50b0e9f5b') AND scope_key = 'BM-170' AND contract_hash = '0cb9cfa5f861af915debbb076f5e76d73edce14078eca85776481ad30e3aaf17' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-171: QĐ trả lại tài sản
--   contract_hash: 5eb8aba3c8f72e21af21cc24cec1bbdf7b19e4a0ba57580dc509b5478cd8d34f
--   template_hash: bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-171\BM-171_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-171__46b9a8be4e01') AND scope_key = 'BM-171' AND contract_hash = '5eb8aba3c8f72e21af21cc24cec1bbdf7b19e4a0ba57580dc509b5478cd8d34f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-172: QĐ huỷ bỏ QĐ trả lại tài sản
--   contract_hash: 38138002c8dbc756e7e92d8f8768db76d33dd5b424749ba67bad24d54d733420
--   template_hash: 4cfe9545d063fa0808ce10000bece129bc22bfff179aab676bfc1d7a95fc94a7
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-172\BM-172_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-172__e3a3eb687d2f') AND scope_key = 'BM-172' AND contract_hash = '38138002c8dbc756e7e92d8f8768db76d33dd5b424749ba67bad24d54d733420' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-173: QĐ chuyển vật chứng
--   contract_hash: 2a4d93d8c510ab456130678a301d612b64b5bc932779d3d0b35d2461a26c4951
--   template_hash: ed17d3c9abaa972ef5dbf64e31f5c8c61c262d97932fadbd7646188795d70e3f
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-173\BM-173_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-173__2e06ac25958d') AND scope_key = 'BM-173' AND contract_hash = '2a4d93d8c510ab456130678a301d612b64b5bc932779d3d0b35d2461a26c4951' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-174: Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt
--   contract_hash: 3f8d9758074aaef91bb0684e356392e04c0f6111c4878a076c461995a231357a
--   template_hash: a222332dd6a37d87f68b06f5a11be9727ee61dfbc0debd182fc2b31fea1690ee
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-174\BM-174_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-174__f8e45c638bb6') AND scope_key = 'BM-174' AND contract_hash = '3f8d9758074aaef91bb0684e356392e04c0f6111c4878a076c461995a231357a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-175: QĐ phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt
--   contract_hash: 7eb6ce37450a272c92dbd14dcfcfea0cad21448d408d5aa8a9f69897daddf23a
--   template_hash: e97aabea7cbed91760f651c7b1a08a845194bb4f7fbb9940789d9d727f922aa9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-175\BM-175_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-175__6d3f2b46283d') AND scope_key = 'BM-175' AND contract_hash = '7eb6ce37450a272c92dbd14dcfcfea0cad21448d408d5aa8a9f69897daddf23a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-176: QĐ không phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt
--   contract_hash: 6b0b909d4fec3ad3a07cc81dd9b5c16f8fdb2923b4944cb829e63a08d1bde570
--   template_hash: b7f7c453deb20cf51483745e76de7ae1fdf996a002b1580abd9fed627074cfc8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-176\BM-176_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-176__8f1b057e17a7') AND scope_key = 'BM-176' AND contract_hash = '6b0b909d4fec3ad3a07cc81dd9b5c16f8fdb2923b4944cb829e63a08d1bde570' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-177: QĐ gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt
--   contract_hash: 32a9aaeb46c46d1f1ca6fa2f1c3102a128151e99578873f9ac4eb8c2194f493d
--   template_hash: e045b0f9c3c0255f119710ee42b511d4dec72b2a127cb0234a9f4942e816c6b9
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-177\BM-177_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-177__05be0ed97398') AND scope_key = 'BM-177' AND contract_hash = '32a9aaeb46c46d1f1ca6fa2f1c3102a128151e99578873f9ac4eb8c2194f493d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-178: QĐ huỷ bỏ QĐ áp dụng biện pháp điều tra tố tụng đặc biệt
--   contract_hash: e7508ce9c780b65fab07ffbe1dd2b1ec5a00e4a93d076061e66c01b91bbd539d
--   template_hash: 773b5330f9f6b5fe5d63ccecda2465a036bd009c970a9fa49d1c5a456b1f1b98
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-178\BM-178_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-178__7f2719dcacc7') AND scope_key = 'BM-178' AND contract_hash = 'e7508ce9c780b65fab07ffbe1dd2b1ec5a00e4a93d076061e66c01b91bbd539d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-179: QĐ áp dụng biện pháp chữa bệnh
--   contract_hash: 56b5eb21065c216a6d7016ed194f83f1deda41898fe9578e55730e3c34164f9b
--   template_hash: 114bcd86c5a51d81d09b0c3fce809c2df65576cd4047eb18a305b3940c085bde
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-179\BM-179_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-179__186c49575a2e') AND scope_key = 'BM-179' AND contract_hash = '56b5eb21065c216a6d7016ed194f83f1deda41898fe9578e55730e3c34164f9b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-180: QĐ đình chỉ thi hành biện pháp bắt buộc chữa bệnh
--   contract_hash: c91b2e57b153bcd7ecb5d901d5adaec62aaeaafb75367411cf964e016477682c
--   template_hash: 775ad30f0dc245778928ceb9f0e2394042fdb06a0da5d8189a399496088c02d1
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-180\BM-180_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-180__d608f62a685a') AND scope_key = 'BM-180' AND contract_hash = 'c91b2e57b153bcd7ecb5d901d5adaec62aaeaafb75367411cf964e016477682c' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-181: QĐ áp dụng thủ tục rút gọn
--   contract_hash: 12896425f17981b73b8fed74e9358f3a517da14453927461f426221c36625433
--   template_hash: c202c6ef2f1655282a492d00480eff840a05c4e3c27aabdc3ef8eaf01c8dfed7
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-181\BM-181_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-181__ec1d8701fc13') AND scope_key = 'BM-181' AND contract_hash = '12896425f17981b73b8fed74e9358f3a517da14453927461f426221c36625433' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-182: QĐ huỷ bỏ QĐ áp dụng thủ tục rút gọn 1
--   contract_hash: 01c2d4df64dd94e4b8b68ecd45449a86a0129181578f7bc62185bb83aa667f69
--   template_hash: d1af166f62a78d97a9eea8bf66cf2d87f4e8641d32a5348449e80647a2d6c11c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-182\BM-182_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-182__95dc6d1f57ab') AND scope_key = 'BM-182' AND contract_hash = '01c2d4df64dd94e4b8b68ecd45449a86a0129181578f7bc62185bb83aa667f69' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-183: QĐ truy tố theo thủ tục rút gọn
--   contract_hash: 1d0f7dd72a1ef412297966109c0d0773ee193ccec5fd7b7b4ac03493e21e5415
--   template_hash: 26ae27d5b6bcc002f591a3d08d63b6a8e87e6151b2bf5a2bb03894a97ddfb922
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-183\BM-183_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-183__294fc847169f') AND scope_key = 'BM-183' AND contract_hash = '1d0f7dd72a1ef412297966109c0d0773ee193ccec5fd7b7b4ac03493e21e5415' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-184: Đề nghị áp dụng biện pháp bảo vệ
--   contract_hash: 4f9cc8ec438627417fc43555a05aab29f8ff4f6f383e7cf29709b5df09461673
--   template_hash: be7d82a4abcc71c4034387b98355bf4c2cf463b94f29437f880a4509e7fdd377
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-184\BM-184_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-184__fb1c01087fa5') AND scope_key = 'BM-184' AND contract_hash = '4f9cc8ec438627417fc43555a05aab29f8ff4f6f383e7cf29709b5df09461673' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-185: Yêu cầu lập Báo cáo điều tra xã hội bổ sung
--   contract_hash: 779d49e41ad290065aedecda22a4f6b37694071afdc50385292ef2a3e9b26a41
--   template_hash: c8c70941c8d4259c74b8c45178d950421dda7e8900691d46842000133da1772d
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-185\BM-185_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-185__69c976088827') AND scope_key = 'BM-185' AND contract_hash = '779d49e41ad290065aedecda22a4f6b37694071afdc50385292ef2a3e9b26a41' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-186: Thông báo áp dụng thủ tục xử lý chuyển hướng
--   contract_hash: ed23156a308e80fcbf6d9ee67369b206ea3c29aa91b401224ddb072f0f2da77f
--   template_hash: fdd29fbdbcb3512adea77471acd0e619b68033e14079963f963eadbb43d51f4e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-186\BM-186_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-186__84cb2023273b') AND scope_key = 'BM-186' AND contract_hash = 'ed23156a308e80fcbf6d9ee67369b206ea3c29aa91b401224ddb072f0f2da77f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-187: Yêu cầu NLCTXH xây dựng kế hoạch XLCH hoặc kế hoạch XLCH bổ sung
--   contract_hash: a48ceb1a40b3fc1af25fc3c3f3f0a2153006900d881bcb33ce0f20c7add00ab0
--   template_hash: 998bf1a4d2d5ce91831db9df926a779c5203f613bed6a2d9fb36da5b93d4dc25
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-187\BM-187_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-187__e47644149068') AND scope_key = 'BM-187' AND contract_hash = 'a48ceb1a40b3fc1af25fc3c3f3f0a2153006900d881bcb33ce0f20c7add00ab0' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-188: Đề nghị Tòa án giải quyết vấn đề bồi thường thiệt hại
--   contract_hash: b166499253d1bc8840d421249f97d15f7c6e3f1f7316054fec70d33ab92c9aee
--   template_hash: 06fe805d96cf5a7c92d4371fc18bbdfd09fca1585e7921a64d3e0a4c72637079
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-188\BM-188_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-188__cb14348d184c') AND scope_key = 'BM-188' AND contract_hash = 'b166499253d1bc8840d421249f97d15f7c6e3f1f7316054fec70d33ab92c9aee' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-189: Yêu cầu CQĐT đề nghị TA xem xét áp dụng biện pháp giáo dục tại trường giáo dưỡng
--   contract_hash: b4fa63f4444d91eb2fa20ce8f47fd436c15c78b453a6348020c0a35f4d1aa0b4
--   template_hash: 50946851e8676f305eabedb13330f4f49dc96263379c70ac7a6fd5a3c078cd55
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-189\BM-189_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-189__70da8df0a0da') AND scope_key = 'BM-189' AND contract_hash = 'b4fa63f4444d91eb2fa20ce8f47fd436c15c78b453a6348020c0a35f4d1aa0b4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-190: Đề nghị Tòa án xem xét, quyết định áp dụng biện pháp giáo dục tại trường giáo dưỡng
--   contract_hash: 125bb8db2cf619836048d9d29ec3b2f96f18777f4f535b78800e0590e2df9559
--   template_hash: c23e37b92aa9401bd4f1e5e3eec00f369cea3fb66212c44ec3674fa511289e6c
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-190\BM-190_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-190__36fb96ee1a73') AND scope_key = 'BM-190' AND contract_hash = '125bb8db2cf619836048d9d29ec3b2f96f18777f4f535b78800e0590e2df9559' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-191: Quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng
--   contract_hash: 19098fa9fddf3fe2a3f2f1abd6526bd3b929eb438e45bb2675e6d90cb0c885ee
--   template_hash: 40c50b631071ae4ff9e7ef3f0c7fd28c1cac55c673cd0b27af2478c23e2a8288
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-191\BM-191_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-191__11335dc18806') AND scope_key = 'BM-191' AND contract_hash = '19098fa9fddf3fe2a3f2f1abd6526bd3b929eb438e45bb2675e6d90cb0c885ee' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-192: Quyết định không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng
--   contract_hash: 9caccad591d6e5ba017eacf2719d508c4e4b7e74d45f1b2b3bd1a613386602f1
--   template_hash: 156eef0387a03bf036dc0259e60149c8cf136dd1e81a8a3167d9ae0c3a39c475
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-192\BM-192_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-192__42db503bed2a') AND scope_key = 'BM-192' AND contract_hash = '9caccad591d6e5ba017eacf2719d508c4e4b7e74d45f1b2b3bd1a613386602f1' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-193: Quyết định thay đổi biện pháp xử lý chuyển hướng tại cộng đồng
--   contract_hash: 23277592febf878006126edd37055491adf991b68f8b5c989f1e8b1f2727b06d
--   template_hash: fe7f581444e64cbc164c702cd447fd7df81ab34ac8c99bba8b66672b4ce9e967
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-193\BM-193_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-193__e24862458ecb') AND scope_key = 'BM-193' AND contract_hash = '23277592febf878006126edd37055491adf991b68f8b5c989f1e8b1f2727b06d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-194: Quyết định hủy bỏ quyết định áp dụng biện pháp xử lý chuyển hướng
--   contract_hash: a7b1c64c9059242726d731833e19e28a431992d07066aa21f7435d219dabd24b
--   template_hash: 654a4f6cadef5ddfea4b6bc5f12ff571130a08c0ac90b357d33de70df104ff22
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-194\BM-194_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-194__946009a4f0e0') AND scope_key = 'BM-194' AND contract_hash = 'a7b1c64c9059242726d731833e19e28a431992d07066aa21f7435d219dabd24b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-195: Quyết định hủy bỏ quyết định không áp dụng biện pháp xử lý chuyển hướng
--   contract_hash: 2525c1e4dd78d21950a33e64064594110acdbd7a4fa996337b75cfb7263203bb
--   template_hash: bb5ea4e30b3bb590281f15792a8fa596b5d7a290d0fe6276f735a298a0b4f5f8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-195\BM-195_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-195__0b409423eb38') AND scope_key = 'BM-195' AND contract_hash = '2525c1e4dd78d21950a33e64064594110acdbd7a4fa996337b75cfb7263203bb' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-196: Quyết định mở phiên họp xem xét, áp dụng biện pháp xử lý chuyển hướng tại cộng đồng - Copy
--   contract_hash: b807845f57299c4a913e031fc4232c6761f8989fd5689500e702a374c678199f
--   template_hash: 674a67139cba2a551ef9eebcb0cb4395a2ac3124e25a7f37e5c2b99077dfbede
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-196\BM-196_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-196__0c6aec084a26') AND scope_key = 'BM-196' AND contract_hash = 'b807845f57299c4a913e031fc4232c6761f8989fd5689500e702a374c678199f' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-197: BB phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng
--   contract_hash: dd6d323f0845b025ad078a205e6db1afc04dffff99559a181e1e64360a30288e
--   template_hash: f5195d5e67ddd06d561b6be63f8830f671f334b225b713f45c78ab0e8663c421
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-197\BM-197_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-197__37dda9913570') AND scope_key = 'BM-197' AND contract_hash = 'dd6d323f0845b025ad078a205e6db1afc04dffff99559a181e1e64360a30288e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-198: Quyết định hoãn phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng - Copy - Copy
--   contract_hash: f0a94149593ccde1bb907667ec4137d36a6816d33b3597e94a337848e5894202
--   template_hash: 4f1bb0c2645ea2d7e549c9a47761f9af1690eb6bb19716d768517a3aca0008d5
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-198\BM-198_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-198__269efb9590af') AND scope_key = 'BM-198' AND contract_hash = 'f0a94149593ccde1bb907667ec4137d36a6816d33b3597e94a337848e5894202' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-199: Kiến nghị về quyết định áp dụng BPXLCH của Tòa án - Copy
--   contract_hash: 1696b4a70679f729aabea9e916795132678f2b6e2a046872b146ae04edf0668b
--   template_hash: 09e0234c33d361907e70100f3e8162e2c4bb6c17610d2e66252d9ba289bde29e
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-199\BM-199_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-199__e4724bd967ad') AND scope_key = 'BM-199' AND contract_hash = '1696b4a70679f729aabea9e916795132678f2b6e2a046872b146ae04edf0668b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-200: Thông báo tiếp nhận khiếu nại, kiến nghị cân nhắc tính cần thiết
--   contract_hash: aa8dd663695a935f476e2e97d108fe025669ac2f81b0f65318411596eab61c1d
--   template_hash: 161e42d802bdc9766d5880d1e2c74a1bdf9a44b6d2f0518078deb6ec0e4fe51b
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-200\BM-200_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-200__d340f628394e') AND scope_key = 'BM-200' AND contract_hash = 'aa8dd663695a935f476e2e97d108fe025669ac2f81b0f65318411596eab61c1d' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-201: Quyết định giải quyết khiếu nại, kiến nghị
--   contract_hash: 171c9494f73ff6148c017400cfeec47a54a4569a98dbefecd2c7618b97e84f00
--   template_hash: eb481fc2547fc56fc1f9b0f8d56ecc177e3f2d8cc098d95241dcf0ffb0d7b637
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-201\BM-201_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-201__2d0aab05928d') AND scope_key = 'BM-201' AND contract_hash = '171c9494f73ff6148c017400cfeec47a54a4569a98dbefecd2c7618b97e84f00' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-202: Quyết định đình chỉ việc giải quyết khiếu nại, kiến nghị
--   contract_hash: 9af50055878931014cb685da425f8db9b9541f79abef0cc6b3a8abdb8ce7ed7a
--   template_hash: 160134e7eeaeecd02dc7ab7ff6e9386bfa0fbb0b0689806f095de8e8619d88c2
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-202\BM-202_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-202__0c74f6ae9727') AND scope_key = 'BM-202' AND contract_hash = '9af50055878931014cb685da425f8db9b9541f79abef0cc6b3a8abdb8ce7ed7a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-203: Thông báo về hoạt động tố tụng
--   contract_hash: b1c86d797087e370d28689b8a36b3ab76797814b81d56af1f1bc31834cb4755b
--   template_hash: ba2b2f1b460bd1f204b48de802ce1dacbde4496a72b209467c281e1a58b61e63
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-203\BM-203_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-203__7572e687ae0f') AND scope_key = 'BM-203' AND contract_hash = 'b1c86d797087e370d28689b8a36b3ab76797814b81d56af1f1bc31834cb4755b' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-204: QĐ việc tham gia tố tụng của người đại diện, tổ chức
--   contract_hash: 89b1900092fbaf7ddac7a9f89ea1b611832a5a8843260f8fed728ede4a0de00e
--   template_hash: 5310dcdd049c12e050487d8318dcb1122f44e89cc96551eb6700352136b7525d
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-204\BM-204_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-204__f334b93daabe') AND scope_key = 'BM-204' AND contract_hash = '89b1900092fbaf7ddac7a9f89ea1b611832a5a8843260f8fed728ede4a0de00e' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-205: Thông báo áp dụng biện pháp ngăn chặn đối với NCTN
--   contract_hash: c7d4f9ad9f0a3259ca6c5531077ef0fc56a1bdc9c01e7075db2d696e5bbb07ae
--   template_hash: 65ac3936300284d46d97066a652d2bfd8d76066e78dec99de5575da3d398c3c8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-205\BM-205_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-205__e6427663d551') AND scope_key = 'BM-205' AND contract_hash = 'c7d4f9ad9f0a3259ca6c5531077ef0fc56a1bdc9c01e7075db2d696e5bbb07ae' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-206: Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - Copy
--   contract_hash: db080d940c258b4f7790252bed649bc969a57e0c52bca08a986fdbfd63a4cd1a
--   template_hash: 7308ae70f3d6edd90605d7e284e8927fbcb625e499aac5426bac08858b848401
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-206\BM-206_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-206__83dd8f078d92') AND scope_key = 'BM-206' AND contract_hash = 'db080d940c258b4f7790252bed649bc969a57e0c52bca08a986fdbfd63a4cd1a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-207: Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN
--   contract_hash: 6f96bf29cda8dad9ee5c0fffd71e7682747c776d7509cffaed7d5d5780efcc48
--   template_hash: e20a3a3aa4acae87f285d33072df2249fe2adb143fba4ed2d8703593185e0f89
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-207\BM-207_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-207__34a77bfcbd63') AND scope_key = 'BM-207' AND contract_hash = '6f96bf29cda8dad9ee5c0fffd71e7682747c776d7509cffaed7d5d5780efcc48' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-208: Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN
--   contract_hash: a73fa06bfa964c0bebc15f31616440c892ecc23598e058d8a794238888f767d6
--   template_hash: cb46a1dd9ca48230ca1ec0c75b8ef6afe7bee8b45cc505648b0a4d12b6bb37d8
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-208\BM-208_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-208__93ee4a40d673') AND scope_key = 'BM-208' AND contract_hash = 'a73fa06bfa964c0bebc15f31616440c892ecc23598e058d8a794238888f767d6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-209: Quyết định áp dụng biện pháp giám sát bởi người đại diện
--   contract_hash: 06ea730ffa64ea495b0329257499ffc886dcf9e7c431533ba3af58162757c1d4
--   template_hash: a3c6e49c5ed2a823a4b495ea27ee88eb2076b2f44e105b1e27b1b6a7d0a3ea9b
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-209\BM-209_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-209__2547ef797798') AND scope_key = 'BM-209' AND contract_hash = '06ea730ffa64ea495b0329257499ffc886dcf9e7c431533ba3af58162757c1d4' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-210: Quyết định thay đổi người đại diện
--   contract_hash: c6d69c5908e03b3dd3991140d8239bb28f373d1dac1e2509bbe2bbcb747f10e2
--   template_hash: 7a2d20b472a257fd40249eed5171c9af1fc8dbe2fdc32234487714a4f24a3519
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-210\BM-210_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-210__7266a312afb8') AND scope_key = 'BM-210' AND contract_hash = 'c6d69c5908e03b3dd3991140d8239bb28f373d1dac1e2509bbe2bbcb747f10e2' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-211: Thông báo về việc thụ lý vụ án
--   contract_hash: 3473b3339f64d6df2b5d277dd79e47ac4c452fc335cfb728b7faadf83985253a
--   template_hash: a59df031ffd7550ec74dd4382da43cb9f9bd6370236d8e5183f8a37623077b4a
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-211\BM-211_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-211__ff91d4c3b4e0') AND scope_key = 'BM-211' AND contract_hash = '3473b3339f64d6df2b5d277dd79e47ac4c452fc335cfb728b7faadf83985253a' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-212: Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên
--   contract_hash: 441530034c4c7ec2db6bc26f958a0265423d6f5088d1662e142ba58004945fcb
--   template_hash: 9bfbba15197477064706672bd4303642e4c440acc2c4faa9684f7d3a9721706a
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-212\BM-212_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-212__b1bab1e5a854') AND scope_key = 'BM-212' AND contract_hash = '441530034c4c7ec2db6bc26f958a0265423d6f5088d1662e142ba58004945fcb' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- BM-213: Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN
--   contract_hash: ba9c97d8d5afd972f7767798d6dc47ed3c67cc93f2615f9918ae5d43e9852de6
--   template_hash: 2bd23373e46dd84b507c8cab274250c4d2816f3d1d761fe9a82a348741a24087
--   normalized_docx: d:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-213\BM-213_normalized.docx
--   reviewed_by: Le Huy @ 2026-06-22T08:15:00.000+07:00
--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = 'BM-213__33383be18132') AND scope_key = 'BM-213' AND contract_hash = 'ba9c97d8d5afd972f7767798d6dc47ed3c67cc93f2615f9918ae5d43e9852de6' AND status = 'PUBLISHED';
--   If found: this version already published, skipping.

-- Upsert pattern (replace <template_id> placeholders after reviewing above):
-- INSERT INTO form_contract_versions
--   (template_id, agency_id, scope_key, version_no, status,
--    revision, base_contract_hash, contract_hash, template_hash,
--    normalized_docx_path, draft_json, compiled_json,
--    created_by_official_id, approved_by_official_id, published_by_official_id,
--    submitted_at, approved_at, published_at, created_at)
-- SELECT <template_id>, NULL, 'BM-001', 1, 'PUBLISHED',
--   0, NULL, 'bcc616eb5301470a972fef1a13f19d417f95b0816a56af80a72ba8c96905e95b', 'e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77',
--   'd:\\Study\\Project\\QLLaw-main\\storage\\templates\\normalized-docx\\BM-001\\BM-001_normalized.docx',
--   '{"schemaVersion":"1.0","sourceId":"BM-001__f4c2aa3682d3","templateCode":"BM-001","documentKind":"form","duplicateIndex":1,"duplicateCount":1,"isDuplicateCode":false,"templateTitle":"Biên bản tiếp nhận nguồn tin về tội phạm","docx":{"sha256":"f4c2aa3682d3c2fbe68e1b88293e5a6024dfbce003e0203bdf1d163e12819d8e","fileName":"01-Biên bản tiếp nhận nguồn tin về tội phạm.doc","relativePath":"docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/01. TIEP NHAN GIAI QUYET NGUON TIN VE TOI PHAM/01-Biên bản tiếp nhận nguồn tin về tội phạm.doc","format":"doc"},"extractionSource":{"kind":"normalized-docx","relativePath":"storage/templates/normalized-docx/BM-001/BM-001_normalized.docx","sha256":"e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77","format":"docx"},"status":"locked","docxSlots":[{"slotId":"document.issuePlaceDateLine","location":{"partName":"word/document.xml","blockId":"P0010","tableCellId":null},"context":"{{document.issuePlaceDateLine}}","label":"Dia danh, ngay ban hanh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{document.issuePlaceDateLine}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{document.issuePlaceDateLine}}","context":"[Auto-generated] {{document.issuePlaceDateLine}}","blockId":"P0010"}},{"slotId":"reception.startedAtTimeText","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Thoi diem bat dau tiep nhan (gio)","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi","textAfter":", ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.lo","rawPattern":"{{reception.startedAtTimeText}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi","textAfter":", ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.lo","rawPattern":"{{reception.startedAtTimeText}}","context":"[Auto-generated] Hồi","blockId":"P0015"}},{"slotId":"reception.startedAtDay","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Ngay bat dau tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày","textAfter":"tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày","textAfter":"tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtDay}}","context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày","blockId":"P0015"}},{"slotId":"reception.startedAtMonth","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Thang bat dau tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","textAfter":"năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","textAfter":"năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtMonth}}","context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","blockId":"P0015"}},{"slotId":"reception.startedAtYear","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Nam bat dau tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","textAfter":", tại {{reception.locationName}}","rawPattern":"{{reception.startedAtYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","textAfter":", tại {{reception.locationName}}","rawPattern":"{{reception.startedAtYear}}","context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","blockId":"P0015"}},{"slotId":"reception.locationName","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Dia diem tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","textAfter":"","rawPattern":"{{reception.locationName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","textAfter":"","rawPattern":"{{reception.locationName}}","context":"[Auto-generated] edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","blockId":"P0015"}},{"slotId":"receiver.fullName","location":{"partName":"word/document.xml","blockId":"P0016","tableCellId":null},"context":"Tôi: {{receiver.fullName}};chức danh: {{receiver.positionTitle}}","label":"Ho ten nguoi tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Tôi:","textAfter":";chức danh: {{receiver.positionTitle}}","rawPattern":"{{receiver.fullName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Tôi:","textAfter":";chức danh: {{receiver.positionTitle}}","rawPattern":"{{receiver.fullName}}","context":"[Auto-generated] Tôi:","blockId":"P0016"}},{"slotId":"receiver.positionTitle","location":{"partName":"word/document.xml","blockId":"P0016","tableCellId":null},"context":"Tôi: {{receiver.fullName}};chức danh: {{receiver.positionTitle}}","label":"Chuc danh nguoi tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Tôi: {{receiver.fullName}};chức danh:","textAfter":"","rawPattern":"{{receiver.positionTitle}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Tôi: {{receiver.fullName}};chức danh:","textAfter":"","rawPattern":"{{receiver.positionTitle}}","context":"[Auto-generated] Tôi: {{receiver.fullName}};chức danh:","blockId":"P0016"}},{"slotId":"receiver.departmentName","location":{"partName":"word/document.xml","blockId":"P0017","tableCellId":null},"context":"Đơn vị công tác {{receiver.departmentName}}","label":"Don vi cong tac","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Đơn vị công tác","textAfter":"","rawPattern":"{{receiver.departmentName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Đơn vị công tác","textAfter":"","rawPattern":"{{receiver.departmentName}}","context":"[Auto-generated] Đơn vị công tác","blockId":"P0017"}},{"slotId":"informant.fullName","location":{"partName":"word/document.xml","blockId":"P0019","tableCellId":null},"context":"Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}}","label":"Ho ten nguoi cung cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Họ tên:","textAfter":"Giới tính: {{informant.genderLabel}}","rawPattern":"{{informant.fullName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Họ tên:","textAfter":"Giới tính: {{informant.genderLabel}}","rawPattern":"{{informant.fullName}}","context":"[Auto-generated] Họ tên:","blockId":"P0019"}},{"slotId":"informant.genderLabel","location":{"partName":"word/document.xml","blockId":"P0019","tableCellId":null},"context":"Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}}","label":"Gioi tinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Họ tên: {{informant.fullName}} Giới tính:","textAfter":"","rawPattern":"{{informant.genderLabel}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Họ tên: {{informant.fullName}} Giới tính:","textAfter":"","rawPattern":"{{informant.genderLabel}}","context":"[Auto-generated] Họ tên: {{informant.fullName}} Giới tính:","blockId":"P0019"}},{"slotId":"informant.otherName","location":{"partName":"word/document.xml","blockId":"P0020","tableCellId":null},"context":"Tên gọi khác: {{informant.otherName}}","label":"Ten goi khac","slotType":"text","required":false,"confidence":1,"evidence":{"textBefore":"Tên gọi khác:","textAfter":"","rawPattern":"{{informant.otherName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Tên gọi khác:","textAfter":"","rawPattern":"{{informant.otherName}}","context":"[Auto-generated] Tên gọi khác:","blockId":"P0020"}},{"slotId":"informant.birthDay","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Ngay sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày","textAfter":"tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày","textAfter":"tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthDay}}","context":"[Auto-generated] Sinh ngày","blockId":"P0021"}},{"slotId":"informant.birthMonth","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Thang sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng","textAfter":"năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng","textAfter":"năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthMonth}}","context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng","blockId":"P0021"}},{"slotId":"informant.birthYear","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Nam sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","textAfter":"tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","textAfter":"tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthYear}}","context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","blockId":"P0021"}},{"slotId":"informant.placeOfBirth","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Noi sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","textAfter":"","rawPattern":"{{informant.placeOfBirth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","textAfter":"","rawPattern":"{{informant.placeOfBirth}}","context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","blockId":"P0021"}},{"slotId":"informant.nationality","location":{"partName":"word/document.xml","blockId":"P0022","tableCellId":null},"context":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","label":"Quoc tich","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Quốc tịch:","textAfter":"; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.nationality}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Quốc tịch:","textAfter":"; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.nationality}}","context":"[Auto-generated] Quốc tịch:","blockId":"P0022"}},{"slotId":"informant.ethnicity","location":{"partName":"word/document.xml","blockId":"P0022","tableCellId":null},"context":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","label":"Dan toc","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc:","textAfter":"; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.ethnicity}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc:","textAfter":"; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.ethnicity}}","context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc:","blockId":"P0022"}},{"slotId":"informant.religion","location":{"partName":"word/document.xml","blockId":"P0022","tableCellId":null},"context":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","label":"Ton giao","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","textAfter":"","rawPattern":"{{informant.religion}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","textAfter":"","rawPattern":"{{informant.religion}}","context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","blockId":"P0022"}},{"slotId":"informant.occupation","location":{"partName":"word/document.xml","blockId":"P0023","tableCellId":null},"context":"Nghề nghiệp: {{informant.occupation}}","label":"Nghe nghiep","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Nghề nghiệp:","textAfter":"","rawPattern":"{{informant.occupation}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nghề nghiệp:","textAfter":"","rawPattern":"{{informant.occupation}}","context":"[Auto-generated] Nghề nghiệp:","blockId":"P0023"}},{"slotId":"informant.identityNo","location":{"partName":"word/document.xml","blockId":"P0024","tableCellId":null},"context":"Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.identityNo}}","label":"So CMND/CCCD/HC","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","textAfter":"","rawPattern":"{{informant.identityNo}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","textAfter":"","rawPattern":"{{informant.identityNo}}","context":"[Auto-generated] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","blockId":"P0024"}},{"slotId":"informant.identityIssuedDay","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Ngay cap CMND","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Cấp ngày","textAfter":"tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Cấp ngày","textAfter":"tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedDay}}","context":"[Auto-generated] Cấp ngày","blockId":"P0025"}},{"slotId":"informant.identityIssuedMonth","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Thang cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng","textAfter":"năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng","textAfter":"năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedMonth}}","context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng","blockId":"P0025"}},{"slotId":"informant.identityIssuedYear","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Nam cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","textAfter":"Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","textAfter":"Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedYear}}","context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","blockId":"P0025"}},{"slotId":"informant.identityIssuedPlace","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Noi cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","textAfter":"","rawPattern":"{{informant.identityIssuedPlace}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","textAfter":"","rawPattern":"{{informant.identityIssuedPlace}}","context":"[Auto-generated] y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","blockId":"P0025"}},{"slotId":"informant.permanentAddress","location":{"partName":"word/document.xml","blockId":"P0026","tableCellId":null},"context":"Nơi thường trú: {{informant.permanentAddress}}","label":"Noi thuong tru","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Nơi thường trú:","textAfter":"","rawPattern":"{{informant.permanentAddress}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nơi thường trú:","textAfter":"","rawPattern":"{{informant.permanentAddress}}","context":"[Auto-generated] Nơi thường trú:","blockId":"P0026"}},{"slotId":"informant.temporaryAddress","location":{"partName":"word/document.xml","blockId":"P0027","tableCellId":null},"context":"Nơi tạm trú: {{informant.temporaryAddress}}","label":"Noi tam tru","slotType":"text","required":false,"confidence":1,"evidence":{"textBefore":"Nơi tạm trú:","textAfter":"","rawPattern":"{{informant.temporaryAddress}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nơi tạm trú:","textAfter":"","rawPattern":"{{informant.temporaryAddress}}","context":"[Auto-generated] Nơi tạm trú:","blockId":"P0027"}},{"slotId":"informant.currentAddress","location":{"partName":"word/document.xml","blockId":"P0028","tableCellId":null},"context":"Nơi ở hiện tại: {{informant.currentAddress}}","label":"Noi o hien tai","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Nơi ở hiện tại:","textAfter":"","rawPattern":"{{informant.currentAddress}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nơi ở hiện tại:","textAfter":"","rawPattern":"{{informant.currentAddress}}","context":"[Auto-generated] Nơi ở hiện tại:","blockId":"P0028"}},{"slotId":"informant.phone","location":{"partName":"word/document.xml","blockId":"P0029","tableCellId":null},"context":"Số điện thoại: {{informant.phone}}","label":"So dien thoai","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Số điện thoại:","textAfter":"","rawPattern":"{{informant.phone}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Số điện thoại:","textAfter":"","rawPattern":"{{informant.phone}}","context":"[Auto-generated] Số điện thoại:","blockId":"P0029"}},{"slotId":"informant.representedOrganization","location":{"partName":"word/document.xml","blockId":"P0030","tableCellId":null},"context":"Là người đại diện của cơ quan, tổ chức (nếu có): {{informant.representedOrganization}}","label":"Co quan/To chuc dai dien","slotType":"text","required":false,"confidence":1,"evidence":{"textBefore":"Là người đại diện của cơ quan, tổ chức (nếu có):","textAfter":"","rawPattern":"{{informant.representedOrganization}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Là người đại diện của cơ quan, tổ chức (nếu có):","textAfter":"","rawPattern":"{{informant.representedOrganization}}","context":"[Auto-generated] Là người đại diện của cơ quan, tổ chức (nếu có):","blockId":"P0030"}},{"slotId":"crimeReport.content","location":{"partName":"word/document.xml","blockId":"P0031","tableCellId":null},"context":"I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM: {{crimeReport.content}}","label":"Noi dung nguon tin ve toi pham","slotType":"multilineText","required":true,"confidence":1,"evidence":{"textBefore":"I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","textAfter":"","rawPattern":"{{crimeReport.content}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","textAfter":"","rawPattern":"{{crimeReport.content}}","context":"[Auto-generated] I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","blockId":"P0031"}},{"slotId":"crimeReport.attachedItemsDescription","location":{"partName":"word/document.xml","blockId":"P0032","tableCellId":null},"context":"II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có): {{crimeReport.attachedItemsDescription}}","label":"Tai lieu/dam cuoi kem theo","slotType":"multilineText","required":false,"confidence":1,"evidence":{"textBefore":"II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","textAfter":"","rawPattern":"{{crimeReport.attachedItemsDescription}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","textAfter":"","rawPattern":"{{crimeReport.attachedItemsDescription}}","context":"[Auto-generated] II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","blockId":"P0032"}},{"slotId":"reception.endedAtTimeText","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Thoi diem ket thuc tiep nhan (gio)","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","textAfter":"ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtTimeText}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","textAfter":"ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtTimeText}}","context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","blockId":"P0034"}},{"slotId":"reception.endedAtDay","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Ngay ket thuc tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","textAfter":"tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","textAfter":"tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtDay}}","context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","blockId":"P0034"}},{"slotId":"reception.endedAtMonth","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Thang ket thuc tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","textAfter":"năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","textAfter":"năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtMonth}}","context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","blockId":"P0034"}},{"slotId":"reception.endedAtYear","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Nam ket thuc tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","textAfter":".","rawPattern":"{{reception.endedAtYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","textAfter":".","rawPattern":"{{reception.endedAtYear}}","context":"[Auto-generated] tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","blockId":"P0034"}},{"slotId":"informant.signerName","location":{"partName":"word/document.xml","blockId":"P0041","tableCellId":null},"context":"{{informant.signerName}}","label":"Nguoi cung cap ky","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{informant.signerName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{informant.signerName}}","context":"[Auto-generated] {{informant.signerName}}","blockId":"P0041"}},{"slotId":"receiver.signerName","location":{"partName":"word/document.xml","blockId":"P0047","tableCellId":null},"context":"{{receiver.signerName}}","label":"Nguoi tiep nhan ky","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{receiver.signerName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{receiver.signerName}}","context":"[Auto-generated] {{receiver.signerName}}","blockId":"P0047"}},{"slotId":"recipients.archiveLine","location":{"partName":"word/document.xml","blockId":"P0048","tableCellId":null},"context":"{{recipients.archiveLine}}","label":"Luu ho so","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{recipients.archiveLine}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{recipients.archiveLine}}","context":"[Auto-generated] {{recipients.archiveLine}}","blockId":"P0048"}}],"canonicalFields":[{"path":"document.issuePlaceDateLine","type":"string","label":"Dia danh, ngay ban hanh","source":"systemDate","required":true,"uiComponent":"text","section":"Tieu de van ban","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{document.issuePlaceDateLine}}","blockId":"P0010"}},{"path":"reception.startedAtTimeText","type":"string","label":"Thoi diem bat dau tiep nhan (gio)","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi","blockId":"P0015"}},{"path":"reception.startedAtDay","type":"string","label":"Ngay bat dau tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày","blockId":"P0015"}},{"path":"reception.startedAtMonth","type":"string","label":"Thang bat dau tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","blockId":"P0015"}},{"path":"reception.startedAtYear","type":"string","label":"Nam bat dau tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","blockId":"P0015"}},{"path":"reception.locationName","type":"string","label":"Dia diem tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","blockId":"P0015"}},{"path":"receiver.fullName","type":"string","label":"Ho ten nguoi tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Nguoi tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Tôi:","blockId":"P0016"}},{"path":"receiver.positionTitle","type":"string","label":"Chuc danh nguoi tiep nhan","source":"officialConfig","required":true,"uiComponent":"text","section":"Nguoi tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Tôi: {{receiver.fullName}};chức danh:","blockId":"P0016"}},{"path":"receiver.departmentName","type":"string","label":"Don vi cong tac","source":"manual","required":true,"uiComponent":"text","section":"Nguoi tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Đơn vị công tác","blockId":"P0017"}},{"path":"informant.fullName","type":"string","label":"Ho ten nguoi cung cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Họ tên:","blockId":"P0019"}},{"path":"informant.genderLabel","type":"string","label":"Gioi tinh","source":"manual","required":true,"uiComponent":"select","section":"Nguoi cung cap thong tin","reviewRequired":false,"options":[{"value":"Nam","label":"Nam"},{"value":"Nu","label":"Nu"}],"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Họ tên: {{informant.fullName}} Giới tính:","blockId":"P0019"}},{"path":"informant.otherName","type":"string","label":"Ten goi khac","source":"manual","required":false,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Tên gọi khác:","blockId":"P0020"}},{"path":"informant.birthDay","type":"string","label":"Ngay sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày","blockId":"P0021"}},{"path":"informant.birthMonth","type":"string","label":"Thang sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng","blockId":"P0021"}},{"path":"informant.birthYear","type":"string","label":"Nam sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","blockId":"P0021"}},{"path":"informant.placeOfBirth","type":"string","label":"Noi sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","blockId":"P0021"}},{"path":"informant.nationality","type":"string","label":"Quoc tich","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Quốc tịch:","blockId":"P0022"}},{"path":"informant.ethnicity","type":"string","label":"Dan toc","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc:","blockId":"P0022"}},{"path":"informant.religion","type":"string","label":"Ton giao","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","blockId":"P0022"}},{"path":"informant.occupation","type":"string","label":"Nghe nghiep","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nghề nghiệp:","blockId":"P0023"}},{"path":"informant.identityNo","type":"string","label":"So CMND/CCCD/HC","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","blockId":"P0024"}},{"path":"informant.identityIssuedDay","type":"string","label":"Ngay cap CMND","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Cấp ngày","blockId":"P0025"}},{"path":"informant.identityIssuedMonth","type":"string","label":"Thang cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng","blockId":"P0025"}},{"path":"informant.identityIssuedYear","type":"string","label":"Nam cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","blockId":"P0025"}},{"path":"informant.identityIssuedPlace","type":"string","label":"Noi cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","blockId":"P0025"}},{"path":"informant.permanentAddress","type":"string","label":"Noi thuong tru","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nơi thường trú:","blockId":"P0026"}},{"path":"informant.temporaryAddress","type":"string","label":"Noi tam tru","source":"manual","required":false,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nơi tạm trú:","blockId":"P0027"}},{"path":"informant.currentAddress","type":"string","label":"Noi o hien tai","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nơi ở hiện tại:","blockId":"P0028"}},{"path":"informant.phone","type":"string","label":"So dien thoai","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Số điện thoại:","blockId":"P0029"}},{"path":"informant.representedOrganization","type":"string","label":"Co quan/To chuc dai dien","source":"manual","required":false,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Là người đại diện của cơ quan, tổ chức (nếu có):","blockId":"P0030"}},{"path":"crimeReport.content","type":"string","label":"Noi dung nguon tin ve toi pham","source":"manual","required":true,"uiComponent":"textarea","section":"Noi dung nguon tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","blockId":"P0031"}},{"path":"crimeReport.attachedItemsDescription","type":"string","label":"Tai lieu/dam cuoi kem theo","source":"manual","required":false,"uiComponent":"textarea","section":"Noi dung nguon tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","blockId":"P0032"}},{"path":"reception.endedAtTimeText","type":"string","label":"Thoi diem ket thuc tiep nhan (gio)","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","blockId":"P0034"}},{"path":"reception.endedAtDay","type":"string","label":"Ngay ket thuc tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","blockId":"P0034"}},{"path":"reception.endedAtMonth","type":"string","label":"Thang ket thuc tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","blockId":"P0034"}},{"path":"reception.endedAtYear","type":"string","label":"Nam ket thuc tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","blockId":"P0034"}},{"path":"informant.signerName","type":"string","label":"Nguoi cung cap ky","source":"officialConfig","required":true,"uiComponent":"text","section":"Chu ky","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{informant.signerName}}","blockId":"P0041"}},{"path":"receiver.signerName","type":"string","label":"Nguoi tiep nhan ky","source":"officialConfig","required":true,"uiComponent":"text","section":"Chu ky","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{receiver.signerName}}","blockId":"P0047"}},{"path":"recipients.archiveLine","type":"string","label":"Luu ho so","source":"manual","required":true,"uiComponent":"text","section":"Noi nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{recipients.archiveLine}}","blockId":"P0048"}}],"renderBindings":[{"slotId":"document.issuePlaceDateLine","from":"document.issuePlaceDateLine","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtTimeText","from":"reception.startedAtTimeText","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtDay","from":"reception.startedAtDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtMonth","from":"reception.startedAtMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtYear","from":"reception.startedAtYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.locationName","from":"reception.locationName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.fullName","from":"receiver.fullName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.positionTitle","from":"receiver.positionTitle","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.departmentName","from":"receiver.departmentName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.fullName","from":"informant.fullName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.genderLabel","from":"informant.genderLabel","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.otherName","from":"informant.otherName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.birthDay","from":"informant.birthDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.birthMonth","from":"informant.birthMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.birthYear","from":"informant.birthYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.placeOfBirth","from":"informant.placeOfBirth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.nationality","from":"informant.nationality","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.ethnicity","from":"informant.ethnicity","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.religion","from":"informant.religion","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.occupation","from":"informant.occupation","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityNo","from":"informant.identityNo","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedDay","from":"informant.identityIssuedDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedMonth","from":"informant.identityIssuedMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedYear","from":"informant.identityIssuedYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedPlace","from":"informant.identityIssuedPlace","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.permanentAddress","from":"informant.permanentAddress","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.temporaryAddress","from":"informant.temporaryAddress","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.currentAddress","from":"informant.currentAddress","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.phone","from":"informant.phone","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.representedOrganization","from":"informant.representedOrganization","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"crimeReport.content","from":"crimeReport.content","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"crimeReport.attachedItemsDescription","from":"crimeReport.attachedItemsDescription","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtTimeText","from":"reception.endedAtTimeText","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtDay","from":"reception.endedAtDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtMonth","from":"reception.endedAtMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtYear","from":"reception.endedAtYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.signerName","from":"informant.signerName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.signerName","from":"receiver.signerName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"recipients.archiveLine","from":"recipients.archiveLine","transform":"identity","fallback":"","reviewRequired":false}],"rejectedCandidates":[{"slotId":"reception.startedAtTimeText","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.startedAtDay","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.startedAtMonth","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.startedAtYear","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.locationName","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"crimeReport.content","reason":"Namespace \"crimeReport\" không thuộc field-taxonomy"},{"slotId":"crimeReport.attachedItemsDescription","reason":"Namespace \"crimeReport\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtTimeText","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtDay","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtMonth","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtYear","reason":"Namespace \"reception\" không thuộc field-taxonomy"}],"unresolvedQuestions":[],"warnings":[],"productMetadata":{"stage":{"code":"01","label":"TIẾP NHẬN, GIẢI QUYẾT NGUỒN TIN VỀ TỘI PHẠM","suggestedBy":"path-heuristic","reviewRequired":false},"formNumber":"001/HS","legalBasisLine":"Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026","documentNumberSuffix":null,"reviewRequired":false,"reviewKind":"human","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00"},"renderFormatHints":{"fontFamily":"Times New Roman","baseFontSize":13,"requiresDifferentFirstPage":true,"requiresPageNumberIfMoreThanPages":2,"headerRules":[],"footerRules":[],"titleRules":[],"reviewRequired":false},"formInputHints":{"primaryEntities":["document","reception","receiver","informant","crimeReport","recipients"],"suggestedControls":[{"path":"document.issuePlaceDateLine","control":"text"},{"path":"reception.startedAtTimeText","control":"text"},{"path":"reception.startedAtDay","control":"text"},{"path":"reception.startedAtMonth","control":"text"},{"path":"reception.startedAtYear","control":"text"},{"path":"reception.locationName","control":"text"},{"path":"receiver.fullName","control":"text"},{"path":"receiver.positionTitle","control":"text"},{"path":"receiver.departmentName","control":"text"},{"path":"informant.fullName","control":"text"},{"path":"informant.genderLabel","control":"select"},{"path":"informant.otherName","control":"text"},{"path":"informant.birthDay","control":"text"},{"path":"informant.birthMonth","control":"text"},{"path":"informant.birthYear","control":"text"},{"path":"informant.placeOfBirth","control":"text"},{"path":"informant.nationality","control":"text"},{"path":"informant.ethnicity","control":"text"},{"path":"informant.religion","control":"text"},{"path":"informant.occupation","control":"text"},{"path":"informant.identityNo","control":"text"},{"path":"informant.identityIssuedDay","control":"text"},{"path":"informant.identityIssuedMonth","control":"text"},{"path":"informant.identityIssuedYear","control":"text"},{"path":"informant.identityIssuedPlace","control":"text"},{"path":"informant.permanentAddress","control":"text"},{"path":"informant.temporaryAddress","control":"text"},{"path":"informant.currentAddress","control":"text"},{"path":"informant.phone","control":"text"},{"path":"informant.representedOrganization","control":"text"},{"path":"crimeReport.content","control":"textarea"},{"path":"crimeReport.attachedItemsDescription","control":"textarea"},{"path":"reception.endedAtTimeText","control":"text"},{"path":"reception.endedAtDay","control":"text"},{"path":"reception.endedAtMonth","control":"text"},{"path":"reception.endedAtYear","control":"text"},{"path":"informant.signerName","control":"text"},{"path":"receiver.signerName","control":"text"},{"path":"recipients.archiveLine","control":"text"}],"previewRequired":true,"reviewRequired":false},"reportingHints":{"dimensions":["time","ward","offense"],"reviewRequired":false},"generatedAt":"2026-06-19T07:36:36.922Z","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewKind":"human"}'::jsonb,
--   '{"schemaVersion":"1.0","sourceId":"BM-001__f4c2aa3682d3","templateCode":"BM-001","documentKind":"form","duplicateIndex":1,"duplicateCount":1,"isDuplicateCode":false,"templateTitle":"Biên bản tiếp nhận nguồn tin về tội phạm","docx":{"sha256":"f4c2aa3682d3c2fbe68e1b88293e5a6024dfbce003e0203bdf1d163e12819d8e","fileName":"01-Biên bản tiếp nhận nguồn tin về tội phạm.doc","relativePath":"docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/01. TIEP NHAN GIAI QUYET NGUON TIN VE TOI PHAM/01-Biên bản tiếp nhận nguồn tin về tội phạm.doc","format":"doc"},"extractionSource":{"kind":"normalized-docx","relativePath":"storage/templates/normalized-docx/BM-001/BM-001_normalized.docx","sha256":"e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77","format":"docx"},"status":"locked","docxSlots":[{"slotId":"document.issuePlaceDateLine","location":{"partName":"word/document.xml","blockId":"P0010","tableCellId":null},"context":"{{document.issuePlaceDateLine}}","label":"Dia danh, ngay ban hanh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{document.issuePlaceDateLine}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{document.issuePlaceDateLine}}","context":"[Auto-generated] {{document.issuePlaceDateLine}}","blockId":"P0010"}},{"slotId":"reception.startedAtTimeText","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Thoi diem bat dau tiep nhan (gio)","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi","textAfter":", ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.lo","rawPattern":"{{reception.startedAtTimeText}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi","textAfter":", ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.lo","rawPattern":"{{reception.startedAtTimeText}}","context":"[Auto-generated] Hồi","blockId":"P0015"}},{"slotId":"reception.startedAtDay","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Ngay bat dau tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày","textAfter":"tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày","textAfter":"tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtDay}}","context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày","blockId":"P0015"}},{"slotId":"reception.startedAtMonth","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Thang bat dau tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","textAfter":"năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","textAfter":"năm {{reception.startedAtYear}}, tại {{reception.locationName}}","rawPattern":"{{reception.startedAtMonth}}","context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","blockId":"P0015"}},{"slotId":"reception.startedAtYear","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Nam bat dau tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","textAfter":", tại {{reception.locationName}}","rawPattern":"{{reception.startedAtYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","textAfter":", tại {{reception.locationName}}","rawPattern":"{{reception.startedAtYear}}","context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","blockId":"P0015"}},{"slotId":"reception.locationName","location":{"partName":"word/document.xml","blockId":"P0015","tableCellId":null},"context":"Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}}","label":"Dia diem tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","textAfter":"","rawPattern":"{{reception.locationName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","textAfter":"","rawPattern":"{{reception.locationName}}","context":"[Auto-generated] edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","blockId":"P0015"}},{"slotId":"receiver.fullName","location":{"partName":"word/document.xml","blockId":"P0016","tableCellId":null},"context":"Tôi: {{receiver.fullName}};chức danh: {{receiver.positionTitle}}","label":"Ho ten nguoi tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Tôi:","textAfter":";chức danh: {{receiver.positionTitle}}","rawPattern":"{{receiver.fullName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Tôi:","textAfter":";chức danh: {{receiver.positionTitle}}","rawPattern":"{{receiver.fullName}}","context":"[Auto-generated] Tôi:","blockId":"P0016"}},{"slotId":"receiver.positionTitle","location":{"partName":"word/document.xml","blockId":"P0016","tableCellId":null},"context":"Tôi: {{receiver.fullName}};chức danh: {{receiver.positionTitle}}","label":"Chuc danh nguoi tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Tôi: {{receiver.fullName}};chức danh:","textAfter":"","rawPattern":"{{receiver.positionTitle}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Tôi: {{receiver.fullName}};chức danh:","textAfter":"","rawPattern":"{{receiver.positionTitle}}","context":"[Auto-generated] Tôi: {{receiver.fullName}};chức danh:","blockId":"P0016"}},{"slotId":"receiver.departmentName","location":{"partName":"word/document.xml","blockId":"P0017","tableCellId":null},"context":"Đơn vị công tác {{receiver.departmentName}}","label":"Don vi cong tac","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Đơn vị công tác","textAfter":"","rawPattern":"{{receiver.departmentName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Đơn vị công tác","textAfter":"","rawPattern":"{{receiver.departmentName}}","context":"[Auto-generated] Đơn vị công tác","blockId":"P0017"}},{"slotId":"informant.fullName","location":{"partName":"word/document.xml","blockId":"P0019","tableCellId":null},"context":"Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}}","label":"Ho ten nguoi cung cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Họ tên:","textAfter":"Giới tính: {{informant.genderLabel}}","rawPattern":"{{informant.fullName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Họ tên:","textAfter":"Giới tính: {{informant.genderLabel}}","rawPattern":"{{informant.fullName}}","context":"[Auto-generated] Họ tên:","blockId":"P0019"}},{"slotId":"informant.genderLabel","location":{"partName":"word/document.xml","blockId":"P0019","tableCellId":null},"context":"Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}}","label":"Gioi tinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Họ tên: {{informant.fullName}} Giới tính:","textAfter":"","rawPattern":"{{informant.genderLabel}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Họ tên: {{informant.fullName}} Giới tính:","textAfter":"","rawPattern":"{{informant.genderLabel}}","context":"[Auto-generated] Họ tên: {{informant.fullName}} Giới tính:","blockId":"P0019"}},{"slotId":"informant.otherName","location":{"partName":"word/document.xml","blockId":"P0020","tableCellId":null},"context":"Tên gọi khác: {{informant.otherName}}","label":"Ten goi khac","slotType":"text","required":false,"confidence":1,"evidence":{"textBefore":"Tên gọi khác:","textAfter":"","rawPattern":"{{informant.otherName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Tên gọi khác:","textAfter":"","rawPattern":"{{informant.otherName}}","context":"[Auto-generated] Tên gọi khác:","blockId":"P0020"}},{"slotId":"informant.birthDay","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Ngay sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày","textAfter":"tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày","textAfter":"tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthDay}}","context":"[Auto-generated] Sinh ngày","blockId":"P0021"}},{"slotId":"informant.birthMonth","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Thang sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng","textAfter":"năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng","textAfter":"năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthMonth}}","context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng","blockId":"P0021"}},{"slotId":"informant.birthYear","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Nam sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","textAfter":"tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","textAfter":"tại: {{informant.placeOfBirth}}","rawPattern":"{{informant.birthYear}}","context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","blockId":"P0021"}},{"slotId":"informant.placeOfBirth","location":{"partName":"word/document.xml","blockId":"P0021","tableCellId":null},"context":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}}","label":"Noi sinh","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","textAfter":"","rawPattern":"{{informant.placeOfBirth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","textAfter":"","rawPattern":"{{informant.placeOfBirth}}","context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","blockId":"P0021"}},{"slotId":"informant.nationality","location":{"partName":"word/document.xml","blockId":"P0022","tableCellId":null},"context":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","label":"Quoc tich","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Quốc tịch:","textAfter":"; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.nationality}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Quốc tịch:","textAfter":"; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.nationality}}","context":"[Auto-generated] Quốc tịch:","blockId":"P0022"}},{"slotId":"informant.ethnicity","location":{"partName":"word/document.xml","blockId":"P0022","tableCellId":null},"context":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","label":"Dan toc","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc:","textAfter":"; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.ethnicity}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc:","textAfter":"; Tôn giáo: {{informant.religion}}","rawPattern":"{{informant.ethnicity}}","context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc:","blockId":"P0022"}},{"slotId":"informant.religion","location":{"partName":"word/document.xml","blockId":"P0022","tableCellId":null},"context":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}}","label":"Ton giao","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","textAfter":"","rawPattern":"{{informant.religion}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","textAfter":"","rawPattern":"{{informant.religion}}","context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","blockId":"P0022"}},{"slotId":"informant.occupation","location":{"partName":"word/document.xml","blockId":"P0023","tableCellId":null},"context":"Nghề nghiệp: {{informant.occupation}}","label":"Nghe nghiep","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Nghề nghiệp:","textAfter":"","rawPattern":"{{informant.occupation}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nghề nghiệp:","textAfter":"","rawPattern":"{{informant.occupation}}","context":"[Auto-generated] Nghề nghiệp:","blockId":"P0023"}},{"slotId":"informant.identityNo","location":{"partName":"word/document.xml","blockId":"P0024","tableCellId":null},"context":"Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.identityNo}}","label":"So CMND/CCCD/HC","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","textAfter":"","rawPattern":"{{informant.identityNo}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","textAfter":"","rawPattern":"{{informant.identityNo}}","context":"[Auto-generated] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","blockId":"P0024"}},{"slotId":"informant.identityIssuedDay","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Ngay cap CMND","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Cấp ngày","textAfter":"tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Cấp ngày","textAfter":"tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedDay}}","context":"[Auto-generated] Cấp ngày","blockId":"P0025"}},{"slotId":"informant.identityIssuedMonth","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Thang cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng","textAfter":"năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng","textAfter":"năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedMonth}}","context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng","blockId":"P0025"}},{"slotId":"informant.identityIssuedYear","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Nam cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","textAfter":"Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","textAfter":"Nơi cấp: {{informant.identityIssuedPlace}}","rawPattern":"{{informant.identityIssuedYear}}","context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","blockId":"P0025"}},{"slotId":"informant.identityIssuedPlace","location":{"partName":"word/document.xml","blockId":"P0025","tableCellId":null},"context":"Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}}","label":"Noi cap","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","textAfter":"","rawPattern":"{{informant.identityIssuedPlace}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","textAfter":"","rawPattern":"{{informant.identityIssuedPlace}}","context":"[Auto-generated] y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","blockId":"P0025"}},{"slotId":"informant.permanentAddress","location":{"partName":"word/document.xml","blockId":"P0026","tableCellId":null},"context":"Nơi thường trú: {{informant.permanentAddress}}","label":"Noi thuong tru","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Nơi thường trú:","textAfter":"","rawPattern":"{{informant.permanentAddress}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nơi thường trú:","textAfter":"","rawPattern":"{{informant.permanentAddress}}","context":"[Auto-generated] Nơi thường trú:","blockId":"P0026"}},{"slotId":"informant.temporaryAddress","location":{"partName":"word/document.xml","blockId":"P0027","tableCellId":null},"context":"Nơi tạm trú: {{informant.temporaryAddress}}","label":"Noi tam tru","slotType":"text","required":false,"confidence":1,"evidence":{"textBefore":"Nơi tạm trú:","textAfter":"","rawPattern":"{{informant.temporaryAddress}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nơi tạm trú:","textAfter":"","rawPattern":"{{informant.temporaryAddress}}","context":"[Auto-generated] Nơi tạm trú:","blockId":"P0027"}},{"slotId":"informant.currentAddress","location":{"partName":"word/document.xml","blockId":"P0028","tableCellId":null},"context":"Nơi ở hiện tại: {{informant.currentAddress}}","label":"Noi o hien tai","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Nơi ở hiện tại:","textAfter":"","rawPattern":"{{informant.currentAddress}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Nơi ở hiện tại:","textAfter":"","rawPattern":"{{informant.currentAddress}}","context":"[Auto-generated] Nơi ở hiện tại:","blockId":"P0028"}},{"slotId":"informant.phone","location":{"partName":"word/document.xml","blockId":"P0029","tableCellId":null},"context":"Số điện thoại: {{informant.phone}}","label":"So dien thoai","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Số điện thoại:","textAfter":"","rawPattern":"{{informant.phone}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Số điện thoại:","textAfter":"","rawPattern":"{{informant.phone}}","context":"[Auto-generated] Số điện thoại:","blockId":"P0029"}},{"slotId":"informant.representedOrganization","location":{"partName":"word/document.xml","blockId":"P0030","tableCellId":null},"context":"Là người đại diện của cơ quan, tổ chức (nếu có): {{informant.representedOrganization}}","label":"Co quan/To chuc dai dien","slotType":"text","required":false,"confidence":1,"evidence":{"textBefore":"Là người đại diện của cơ quan, tổ chức (nếu có):","textAfter":"","rawPattern":"{{informant.representedOrganization}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Là người đại diện của cơ quan, tổ chức (nếu có):","textAfter":"","rawPattern":"{{informant.representedOrganization}}","context":"[Auto-generated] Là người đại diện của cơ quan, tổ chức (nếu có):","blockId":"P0030"}},{"slotId":"crimeReport.content","location":{"partName":"word/document.xml","blockId":"P0031","tableCellId":null},"context":"I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM: {{crimeReport.content}}","label":"Noi dung nguon tin ve toi pham","slotType":"multilineText","required":true,"confidence":1,"evidence":{"textBefore":"I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","textAfter":"","rawPattern":"{{crimeReport.content}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","textAfter":"","rawPattern":"{{crimeReport.content}}","context":"[Auto-generated] I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","blockId":"P0031"}},{"slotId":"crimeReport.attachedItemsDescription","location":{"partName":"word/document.xml","blockId":"P0032","tableCellId":null},"context":"II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có): {{crimeReport.attachedItemsDescription}}","label":"Tai lieu/dam cuoi kem theo","slotType":"multilineText","required":false,"confidence":1,"evidence":{"textBefore":"II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","textAfter":"","rawPattern":"{{crimeReport.attachedItemsDescription}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","textAfter":"","rawPattern":"{{crimeReport.attachedItemsDescription}}","context":"[Auto-generated] II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","blockId":"P0032"}},{"slotId":"reception.endedAtTimeText","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Thoi diem ket thuc tiep nhan (gio)","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","textAfter":"ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtTimeText}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","textAfter":"ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtTimeText}}","context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","blockId":"P0034"}},{"slotId":"reception.endedAtDay","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Ngay ket thuc tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","textAfter":"tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtDay}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","textAfter":"tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtDay}}","context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","blockId":"P0034"}},{"slotId":"reception.endedAtMonth","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Thang ket thuc tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","textAfter":"năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtMonth}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","textAfter":"năm {{reception.endedAtYear}}.","rawPattern":"{{reception.endedAtMonth}}","context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","blockId":"P0034"}},{"slotId":"reception.endedAtYear","location":{"partName":"word/document.xml","blockId":"P0034","tableCellId":null},"context":"Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}.","label":"Nam ket thuc tiep nhan","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","textAfter":".","rawPattern":"{{reception.endedAtYear}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","textAfter":".","rawPattern":"{{reception.endedAtYear}}","context":"[Auto-generated] tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","blockId":"P0034"}},{"slotId":"informant.signerName","location":{"partName":"word/document.xml","blockId":"P0041","tableCellId":null},"context":"{{informant.signerName}}","label":"Nguoi cung cap ky","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{informant.signerName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{informant.signerName}}","context":"[Auto-generated] {{informant.signerName}}","blockId":"P0041"}},{"slotId":"receiver.signerName","location":{"partName":"word/document.xml","blockId":"P0047","tableCellId":null},"context":"{{receiver.signerName}}","label":"Nguoi tiep nhan ky","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{receiver.signerName}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{receiver.signerName}}","context":"[Auto-generated] {{receiver.signerName}}","blockId":"P0047"}},{"slotId":"recipients.archiveLine","location":{"partName":"word/document.xml","blockId":"P0048","tableCellId":null},"context":"{{recipients.archiveLine}}","label":"Luu ho so","slotType":"text","required":true,"confidence":1,"evidence":{"textBefore":"","textAfter":"","rawPattern":"{{recipients.archiveLine}}"},"reviewRequired":false,"reviewEvidence":{"textBefore":"","textAfter":"","rawPattern":"{{recipients.archiveLine}}","context":"[Auto-generated] {{recipients.archiveLine}}","blockId":"P0048"}}],"canonicalFields":[{"path":"document.issuePlaceDateLine","type":"string","label":"Dia danh, ngay ban hanh","source":"systemDate","required":true,"uiComponent":"text","section":"Tieu de van ban","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{document.issuePlaceDateLine}}","blockId":"P0010"}},{"path":"reception.startedAtTimeText","type":"string","label":"Thoi diem bat dau tiep nhan (gio)","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi","blockId":"P0015"}},{"path":"reception.startedAtDay","type":"string","label":"Ngay bat dau tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày","blockId":"P0015"}},{"path":"reception.startedAtMonth","type":"string","label":"Thang bat dau tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng","blockId":"P0015"}},{"path":"reception.startedAtYear","type":"string","label":"Nam bat dau tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Hồi {{reception.startedAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm","blockId":"P0015"}},{"path":"reception.locationName","type":"string","label":"Dia diem tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] edAtTimeText}}, ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại","blockId":"P0015"}},{"path":"receiver.fullName","type":"string","label":"Ho ten nguoi tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Nguoi tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Tôi:","blockId":"P0016"}},{"path":"receiver.positionTitle","type":"string","label":"Chuc danh nguoi tiep nhan","source":"officialConfig","required":true,"uiComponent":"text","section":"Nguoi tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Tôi: {{receiver.fullName}};chức danh:","blockId":"P0016"}},{"path":"receiver.departmentName","type":"string","label":"Don vi cong tac","source":"manual","required":true,"uiComponent":"text","section":"Nguoi tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Đơn vị công tác","blockId":"P0017"}},{"path":"informant.fullName","type":"string","label":"Ho ten nguoi cung cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Họ tên:","blockId":"P0019"}},{"path":"informant.genderLabel","type":"string","label":"Gioi tinh","source":"manual","required":true,"uiComponent":"select","section":"Nguoi cung cap thong tin","reviewRequired":false,"options":[{"value":"Nam","label":"Nam"},{"value":"Nu","label":"Nu"}],"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Họ tên: {{informant.fullName}} Giới tính:","blockId":"P0019"}},{"path":"informant.otherName","type":"string","label":"Ten goi khac","source":"manual","required":false,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Tên gọi khác:","blockId":"P0020"}},{"path":"informant.birthDay","type":"string","label":"Ngay sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày","blockId":"P0021"}},{"path":"informant.birthMonth","type":"string","label":"Thang sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng","blockId":"P0021"}},{"path":"informant.birthYear","type":"string","label":"Nam sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm","blockId":"P0021"}},{"path":"informant.placeOfBirth","type":"string","label":"Noi sinh","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại:","blockId":"P0021"}},{"path":"informant.nationality","type":"string","label":"Quoc tich","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Quốc tịch:","blockId":"P0022"}},{"path":"informant.ethnicity","type":"string","label":"Dan toc","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc:","blockId":"P0022"}},{"path":"informant.religion","type":"string","label":"Ton giao","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo:","blockId":"P0022"}},{"path":"informant.occupation","type":"string","label":"Nghe nghiep","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nghề nghiệp:","blockId":"P0023"}},{"path":"informant.identityNo","type":"string","label":"So CMND/CCCD/HC","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:","blockId":"P0024"}},{"path":"informant.identityIssuedDay","type":"string","label":"Ngay cap CMND","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Cấp ngày","blockId":"P0025"}},{"path":"informant.identityIssuedMonth","type":"string","label":"Thang cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng","blockId":"P0025"}},{"path":"informant.identityIssuedYear","type":"string","label":"Nam cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm","blockId":"P0025"}},{"path":"informant.identityIssuedPlace","type":"string","label":"Noi cap","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp:","blockId":"P0025"}},{"path":"informant.permanentAddress","type":"string","label":"Noi thuong tru","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nơi thường trú:","blockId":"P0026"}},{"path":"informant.temporaryAddress","type":"string","label":"Noi tam tru","source":"manual","required":false,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nơi tạm trú:","blockId":"P0027"}},{"path":"informant.currentAddress","type":"string","label":"Noi o hien tai","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Nơi ở hiện tại:","blockId":"P0028"}},{"path":"informant.phone","type":"string","label":"So dien thoai","source":"manual","required":true,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Số điện thoại:","blockId":"P0029"}},{"path":"informant.representedOrganization","type":"string","label":"Co quan/To chuc dai dien","source":"manual","required":false,"uiComponent":"text","section":"Nguoi cung cap thong tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Là người đại diện của cơ quan, tổ chức (nếu có):","blockId":"P0030"}},{"path":"crimeReport.content","type":"string","label":"Noi dung nguon tin ve toi pham","source":"manual","required":true,"uiComponent":"textarea","section":"Noi dung nguon tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:","blockId":"P0031"}},{"path":"crimeReport.attachedItemsDescription","type":"string","label":"Tai lieu/dam cuoi kem theo","source":"manual","required":false,"uiComponent":"textarea","section":"Noi dung nguon tin","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):","blockId":"P0032"}},{"path":"reception.endedAtTimeText","type":"string","label":"Thoi diem ket thuc tiep nhan (gio)","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi","blockId":"P0034"}},{"path":"reception.endedAtDay","type":"string","label":"Ngay ket thuc tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày","blockId":"P0034"}},{"path":"reception.endedAtMonth","type":"string","label":"Thang ket thuc tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng","blockId":"P0034"}},{"path":"reception.endedAtYear","type":"string","label":"Nam ket thuc tiep nhan","source":"manual","required":true,"uiComponent":"text","section":"Thong tin tiep nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm","blockId":"P0034"}},{"path":"informant.signerName","type":"string","label":"Nguoi cung cap ky","source":"officialConfig","required":true,"uiComponent":"text","section":"Chu ky","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{informant.signerName}}","blockId":"P0041"}},{"path":"receiver.signerName","type":"string","label":"Nguoi tiep nhan ky","source":"officialConfig","required":true,"uiComponent":"text","section":"Chu ky","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{receiver.signerName}}","blockId":"P0047"}},{"path":"recipients.archiveLine","type":"string","label":"Luu ho so","source":"manual","required":true,"uiComponent":"text","section":"Noi nhan","reviewRequired":false,"transform":"identity","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewEvidence":{"context":"[Auto-generated] {{recipients.archiveLine}}","blockId":"P0048"}}],"renderBindings":[{"slotId":"document.issuePlaceDateLine","from":"document.issuePlaceDateLine","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtTimeText","from":"reception.startedAtTimeText","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtDay","from":"reception.startedAtDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtMonth","from":"reception.startedAtMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.startedAtYear","from":"reception.startedAtYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.locationName","from":"reception.locationName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.fullName","from":"receiver.fullName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.positionTitle","from":"receiver.positionTitle","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.departmentName","from":"receiver.departmentName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.fullName","from":"informant.fullName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.genderLabel","from":"informant.genderLabel","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.otherName","from":"informant.otherName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.birthDay","from":"informant.birthDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.birthMonth","from":"informant.birthMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.birthYear","from":"informant.birthYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.placeOfBirth","from":"informant.placeOfBirth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.nationality","from":"informant.nationality","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.ethnicity","from":"informant.ethnicity","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.religion","from":"informant.religion","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.occupation","from":"informant.occupation","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityNo","from":"informant.identityNo","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedDay","from":"informant.identityIssuedDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedMonth","from":"informant.identityIssuedMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedYear","from":"informant.identityIssuedYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.identityIssuedPlace","from":"informant.identityIssuedPlace","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.permanentAddress","from":"informant.permanentAddress","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.temporaryAddress","from":"informant.temporaryAddress","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.currentAddress","from":"informant.currentAddress","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.phone","from":"informant.phone","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.representedOrganization","from":"informant.representedOrganization","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"crimeReport.content","from":"crimeReport.content","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"crimeReport.attachedItemsDescription","from":"crimeReport.attachedItemsDescription","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtTimeText","from":"reception.endedAtTimeText","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtDay","from":"reception.endedAtDay","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtMonth","from":"reception.endedAtMonth","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"reception.endedAtYear","from":"reception.endedAtYear","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"informant.signerName","from":"informant.signerName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"receiver.signerName","from":"receiver.signerName","transform":"identity","fallback":"","reviewRequired":false},{"slotId":"recipients.archiveLine","from":"recipients.archiveLine","transform":"identity","fallback":"","reviewRequired":false}],"rejectedCandidates":[{"slotId":"reception.startedAtTimeText","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.startedAtDay","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.startedAtMonth","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.startedAtYear","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.locationName","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"crimeReport.content","reason":"Namespace \"crimeReport\" không thuộc field-taxonomy"},{"slotId":"crimeReport.attachedItemsDescription","reason":"Namespace \"crimeReport\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtTimeText","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtDay","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtMonth","reason":"Namespace \"reception\" không thuộc field-taxonomy"},{"slotId":"reception.endedAtYear","reason":"Namespace \"reception\" không thuộc field-taxonomy"}],"unresolvedQuestions":[],"warnings":[],"productMetadata":{"stage":{"code":"01","label":"TIẾP NHẬN, GIẢI QUYẾT NGUỒN TIN VỀ TỘI PHẠM","suggestedBy":"path-heuristic","reviewRequired":false},"formNumber":"001/HS","legalBasisLine":"Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026","documentNumberSuffix":null,"reviewRequired":false,"reviewKind":"human","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00"},"renderFormatHints":{"fontFamily":"Times New Roman","baseFontSize":13,"requiresDifferentFirstPage":true,"requiresPageNumberIfMoreThanPages":2,"headerRules":[],"footerRules":[],"titleRules":[],"reviewRequired":false},"formInputHints":{"primaryEntities":["document","reception","receiver","informant","crimeReport","recipients"],"suggestedControls":[{"path":"document.issuePlaceDateLine","control":"text"},{"path":"reception.startedAtTimeText","control":"text"},{"path":"reception.startedAtDay","control":"text"},{"path":"reception.startedAtMonth","control":"text"},{"path":"reception.startedAtYear","control":"text"},{"path":"reception.locationName","control":"text"},{"path":"receiver.fullName","control":"text"},{"path":"receiver.positionTitle","control":"text"},{"path":"receiver.departmentName","control":"text"},{"path":"informant.fullName","control":"text"},{"path":"informant.genderLabel","control":"select"},{"path":"informant.otherName","control":"text"},{"path":"informant.birthDay","control":"text"},{"path":"informant.birthMonth","control":"text"},{"path":"informant.birthYear","control":"text"},{"path":"informant.placeOfBirth","control":"text"},{"path":"informant.nationality","control":"text"},{"path":"informant.ethnicity","control":"text"},{"path":"informant.religion","control":"text"},{"path":"informant.occupation","control":"text"},{"path":"informant.identityNo","control":"text"},{"path":"informant.identityIssuedDay","control":"text"},{"path":"informant.identityIssuedMonth","control":"text"},{"path":"informant.identityIssuedYear","control":"text"},{"path":"informant.identityIssuedPlace","control":"text"},{"path":"informant.permanentAddress","control":"text"},{"path":"informant.temporaryAddress","control":"text"},{"path":"informant.currentAddress","control":"text"},{"path":"informant.phone","control":"text"},{"path":"informant.representedOrganization","control":"text"},{"path":"crimeReport.content","control":"textarea"},{"path":"crimeReport.attachedItemsDescription","control":"textarea"},{"path":"reception.endedAtTimeText","control":"text"},{"path":"reception.endedAtDay","control":"text"},{"path":"reception.endedAtMonth","control":"text"},{"path":"reception.endedAtYear","control":"text"},{"path":"informant.signerName","control":"text"},{"path":"receiver.signerName","control":"text"},{"path":"recipients.archiveLine","control":"text"}],"previewRequired":true,"reviewRequired":false},"reportingHints":{"dimensions":["time","ward","offense"],"reviewRequired":false},"generatedAt":"2026-06-19T07:36:36.922Z","reviewedBy":"Le Huy","reviewedAt":"2026-06-22T08:15:00.000+07:00","reviewKind":"human"}'::jsonb,
--   1 n, 1 n, 1 n,
--   '2026-06-22 13:29:39',
--   '2026-06-22 13:29:39',
--   '2026-06-22 13:29:39',
--   '2026-06-22 13:29:39'
-- WHERE NOT EXISTS (
--   SELECT 1 FROM form_contract_versions
--   WHERE template_id = <template_id> AND scope_key = 'BM-001' AND contract_hash = 'bcc616eb5301470a972fef1a13f19d417f95b0816a56af80a72ba8c96905e95b' AND status = 'PUBLISHED'
-- );

COMMIT;