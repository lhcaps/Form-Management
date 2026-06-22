# Slot Coverage Summary

Sinh lúc: 2026-06-22T07:48:50.206Z

## Phạm vi verify

- ✅ **Structural verification**: schema hợp lệ, slotId duy nhất, renderBinding trỏ tới slot tồn tại, namespace trong field-taxonomy, source trong source-taxonomy, transform trong transform-taxonomy.
- ❌ **Semantic / legal verification**: KHÔNG thuộc phạm vi pipeline này. Reviewer phải đọc DOCX đối chiếu.
- ✅ **Locked contract count**: Hiện tại = 210. Các contract này được tính theo bản locked canonical, không đếm lặp bản draft cùng sourceId.
- ⚠️ **Unknown sources**: 110/2053 canonicalField đang `source=unknown`; các field này thuộc contract draft và vẫn chờ reviewer quyết định nguồn.
- ⚠️ **Review-required**: Còn 330 cờ review trên inventory canonical; contract locked phải có 0 cờ review.

> Kết luận: Mọi số liệu dưới đây mô tả **structure của inventory canonical (draft + locked)**. Chỉ trạng thái locked mới phản ánh review đã hoàn tất; kiểm tra này không tự chứng nhận tính đúng đắn pháp lý/nghiệp vụ.

## Tổng quan

- Tổng contract (form, KHÔNG tính reference docs): **214**
- Tổng docxSlots: **2053**
- Tổng renderBindings: **2053**
- Tổng canonicalFields: **2053**
- Tổng canonicalFields có source=unknown: **110**
- Tổng reviewRequired (slot+field+binding): **330**
- Tổng slot thiếu binding: **0**
- Contract locked: **210** | draft: **4**
- Structural issues: **0**
- Structural warnings: **0**
- Extraction / contract warnings: **4**
- Locked contract invalid: **0** (sẽ thoát non-zero)

## Per BM

| SourceId | BM | Status | Slots | Bound | Unknown source | Review required | Missing binding | Issues | Warnings | Extract/Contract Warnings |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| BM-001__f4c2aa3682d3 | BM-001 | locked | 39 | 39 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-002__f78301178da7 | BM-002 | locked | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-003__bb64990bc49b | BM-003 | locked | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-004__2775520fd22c | BM-004 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-005__4cf240724a90 | BM-005 | locked | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-006__87ff96f9a866 | BM-006 | locked | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-007__549970d471d1 | BM-007 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-008__87981f1c5cf8 | BM-008 | locked | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-009__ad542fd7bc45 | BM-009 | locked | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-010__3814cd2b4bcf | BM-010 | locked | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-011__26e6e688d223 | BM-011 | locked | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-012__7733d5ac8e86 | BM-012 | locked | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-013__9a1f7d37fec9 | BM-013 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-014__ff318bb91779 | BM-014 | locked | 19 | 19 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-015__08f17df338d2 | BM-015 | locked | 28 | 28 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-016__565ec1fc2103 | BM-016 | locked | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-017__6b3cad999c61 | BM-017 | locked | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-018__fe8c39468552 | BM-018 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-019__3c2858f47dad | BM-019 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-020__0f61c04c750d | BM-020 | locked | 13 | 13 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-021__772319486f41 | BM-021 | locked | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-022__13d342bdfc56 | BM-022 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-023__78e4f3906e4c | BM-023 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-024__575a6d8e9173 | BM-024 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-025__5dcf0eb7f481 | BM-025 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-026__6e339663e320 | BM-026 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-027__7c207d24faee | BM-027 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-028__e895e0889340 | BM-028 | locked | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-029__0bf65fba614a | BM-029 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-030__0cfa7ae4b177 | BM-030 | locked | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-031__ec3276d1eebe | BM-031 | locked | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-032__cce50086cd38 | BM-032 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-033__51058a699877 | BM-033 | locked | 21 | 21 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-034__e02f842b6038 | BM-034 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-035__be0035952622 | BM-035 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-036__6f4466480a94 | BM-036 | locked | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-037__1fa31d43251e | BM-037 | locked | 19 | 19 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-038__7a37ca9c9d8e | BM-038 | locked | 20 | 20 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-039__733f9ddd4783 | BM-039 | locked | 40 | 40 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-040__aab092911088 | BM-040 | locked | 20 | 20 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-041__9a027eeceb3a | BM-041 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-042__a4da3c74d437 | BM-042 | locked | 23 | 23 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-043__8eab35cfeedb | BM-043 | locked | 19 | 19 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-044__8552b13c78ff | BM-044 | locked | 20 | 20 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-045__13efe0d94756 | BM-045 | locked | 20 | 20 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-046__501a15f0fbb7 | BM-046 | locked | 20 | 20 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-047__ec7dc3448f91 | BM-047 | locked | 34 | 34 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-048__724a5a8b3421 | BM-048 | locked | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-049__798e9b21ce2e | BM-049 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-050__2d31c941887e | BM-050 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-051__594c6c63b397 | BM-051 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-052__9919ecdb3971 | BM-052 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-053__0a5a43238f28 | BM-053 | locked | 34 | 34 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-054__71a4c9ac7e0e | BM-054 | locked | 28 | 28 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-055__b1819db1f92b | BM-055 | locked | 33 | 33 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-056__eea9a3391f5f | BM-056 | locked | 28 | 28 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-057__9053c61ee677 | BM-057 | locked | 28 | 28 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-058__6de8f0022bff | BM-058 | draft | 36 | 36 | 36 | 108 | 0 | 0 | 0 | 1 |
| BM-059__4cdec41fdb1d | BM-059 | locked | 39 | 39 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-060__55a252b4f98f | BM-060 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-061__ec44550246e9 | BM-061 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-062__110961a781fa | BM-062 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-063__54b73110a34f | BM-063 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-064__4d8cebc3515b | BM-064 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-065__4a64c8d7e96c | BM-065 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-066__e3bc56081554 | BM-066 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-067__0f7607122f29 | BM-067 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-068__6c1275cc752e | BM-068 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-069__3a67d1a2e298 | BM-069 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-070__e63499f6fc20 | BM-070 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-071__cacf3f480888 | BM-071 | locked | 19 | 19 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-072__fadb53cde2cb | BM-072 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-073__e412fccad227 | BM-073 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-074__e7b3ef2ccb68 | BM-074 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-075__dc493cfb5fd3 | BM-075 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-076__cd44ed3c7e5d | BM-076 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-077__99d7843f9f9e | BM-077 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-078__6845bd7e6cb1 | BM-078 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-079__80698c347564 | BM-079 | locked | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-080__a7aa64d4b889 | BM-080 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-081__232b8c1d66ae | BM-081 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-082__44cc2b043383 | BM-082 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-083__71218955a7c2 | BM-083 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-084__c21e2b7fa5cc | BM-084 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-085__ae0054d1db43 | BM-085 | locked | 19 | 19 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-086__df834c030dc6 | BM-086 | locked | 18 | 18 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-087__80e8edb6b8b2 | BM-087 | locked | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-088__d9d213d94690 | BM-088 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-089__9d0d4280c6a1 | BM-089 | locked | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-090__1c7858168558 | BM-090 | locked | 18 | 18 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-091__18a41431ecae | BM-091 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-092__f8ca4bc8033d | BM-092 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-093__7273ce5a66b8 | BM-093 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-094__12ad016b36d2 | BM-094 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-095__83c3c1ef212f | BM-095 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-096__a50a08efa62f | BM-096 | locked | 18 | 18 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-097__17f981bf5afd | BM-097 | locked | 32 | 32 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-098__949d75027001 | BM-098 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-099__ce4aa505a071 | BM-099 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-100__a359d20c8fed | BM-100 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-101__2fe2187f4777 | BM-101 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-102__88bde5060df8 | BM-102 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-103__665eb32a5626 | BM-103 | locked | 21 | 21 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-104__6d6f5903cad3 | BM-104 | locked | 18 | 18 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-105__c83181e6b64b | BM-105 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-106__7f44c9dd261a | BM-106 | locked | 11 | 11 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-107__9b3379af7cfe | BM-107 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-108__baea4e0f603e | BM-108 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-109__0fe502079a3e | BM-109 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-110__a1f991fed29c | BM-110 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-111__33851c577165 | BM-111 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-112__109c846bbe17 | BM-112 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-113__2651c6185250 | BM-113 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-114__84cec283ce1b | BM-114 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-115__94659bf76001 | BM-115 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-116__23c45f530ed1 | BM-116 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-117__c9531f5e460e | BM-117 | locked | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-118__7d13f5eae86d | BM-118 | locked | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-119__bb054433cbac | BM-119 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-120__e702d429a0f3 | BM-120 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-121__a7983088c6ec | BM-121 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-122__c6efcf63e36a | BM-122 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-123__8aa275f0ac70 | BM-123 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-124__1fca98cb2e90 | BM-124 | locked | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-125__77ec214513fb | BM-125 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-126__2d8c3d38368b | BM-126 | locked | 11 | 11 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-127__582febaeadf0 | BM-127 | locked | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-128__8eab646ee06f | BM-128 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-129__7fb66a442c28 | BM-129 | locked | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-130__9a859e843d48 | BM-130 | locked | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-131__91726e55d979 | BM-131 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-132__670b47f0b235 | BM-132 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-133__1f7f12f1a249 | BM-133 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-134__7c1e123c01b0 | BM-134 | locked | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-135__79b31ad7511e | BM-135 | locked | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-136__f7c2e28ddd12 | BM-136 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-137__d2c569c61fb7 | BM-137 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-138__bf31a1f547b0 | BM-138 | locked | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-139__23306e6022bd | BM-139 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-139__9795f14f931c | BM-139 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 | 1 |
| BM-140__13e1ade15acd | BM-140 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-141__abc5fb5fb096 | BM-141 | locked | 19 | 19 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-142__02d373abb354 | BM-142 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-143__7ad54f65b3a0 | BM-143 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-144__720233712d47 | BM-144 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-145__fc22267f4a63 | BM-145 | locked | 21 | 21 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-146__59e5d7e21119 | BM-146 | locked | 18 | 18 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-147__7bf9bc811cad | BM-147 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-148__d4d27bb90141 | BM-148 | locked | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-149__3990ac4442f1 | BM-149 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-150__d19a8665087c | BM-150 | locked | 22 | 22 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-151__d3ead7c40b56 | BM-151 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-152__d28f03a3f72b | BM-152 | locked | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-153__829ed04c824a | BM-153 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-154__618d13a959ca | BM-154 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-155__d89766f2092a | BM-155 | locked | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-156__ef438a40e567 | BM-156 | draft | 41 | 41 | 41 | 123 | 0 | 0 | 0 | 1 |
| BM-157__a5c6971a69d2 | BM-157 | locked | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-158__7a98055a3e9c | BM-158 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-159__d95eb7bda8e3 | BM-159 | locked | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-160__2f8e7c014448 | BM-160 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-161__5c910ef4adf5 | BM-161 | locked | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-162__6e7e16348066 | BM-162 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-163__61941122b9e4 | BM-163 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-164__04fa37dd8384 | BM-164 | locked | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-165__d391dc4d1ffb | BM-165 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-166__d0762a0ffb28 | BM-166 | locked | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-167__70817b325370 | BM-167 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-168__3369df5870b2 | BM-168 | locked | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-169__b737aefc0c16 | BM-169 | locked | 20 | 20 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-170__c8f50b0e9f5b | BM-170 | locked | 17 | 17 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-171__46b9a8be4e01 | BM-171 | locked | 34 | 34 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-172__e3a3eb687d2f | BM-172 | locked | 34 | 34 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-173__2e06ac25958d | BM-173 | locked | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-174__f8e45c638bb6 | BM-174 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-175__6d3f2b46283d | BM-175 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-176__8f1b057e17a7 | BM-176 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-177__05be0ed97398 | BM-177 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-178__7f2719dcacc7 | BM-178 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-179__186c49575a2e | BM-179 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-180__d608f62a685a | BM-180 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-181__ec1d8701fc13 | BM-181 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-182__95dc6d1f57ab | BM-182 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-183__294fc847169f | BM-183 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-184__fb1c01087fa5 | BM-184 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-185__69c976088827 | BM-185 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-186__84cb2023273b | BM-186 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-187__e47644149068 | BM-187 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-188__cb14348d184c | BM-188 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-189__70da8df0a0da | BM-189 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-190__36fb96ee1a73 | BM-190 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-191__11335dc18806 | BM-191 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-192__42db503bed2a | BM-192 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-193__e24862458ecb | BM-193 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-194__946009a4f0e0 | BM-194 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-195__0b409423eb38 | BM-195 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-196__0c6aec084a26 | BM-196 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-197__37dda9913570 | BM-197 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-198__269efb9590af | BM-198 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-199__e4724bd967ad | BM-199 | locked | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-200__d340f628394e | BM-200 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-201__2d0aab05928d | BM-201 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-202__0c74f6ae9727 | BM-202 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-203__7572e687ae0f | BM-203 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-204__f334b93daabe | BM-204 | locked | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-205__e6427663d551 | BM-205 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-206__83dd8f078d92 | BM-206 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-207__34a77bfcbd63 | BM-207 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-208__93ee4a40d673 | BM-208 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-209__2547ef797798 | BM-209 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-210__7266a312afb8 | BM-210 | locked | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-211__ff91d4c3b4e0 | BM-211 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-212__b1bab1e5a854 | BM-212 | locked | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| BM-213__33383be18132 | BM-213 | draft | 28 | 28 | 28 | 84 | 0 | 0 | 0 | 1 |

## Per-BM coverage files
