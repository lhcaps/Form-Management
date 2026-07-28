/** BM-206 through BM-211 semantic frontier closure guards. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROVENANCE_PATH =
  "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md";

/**
 * FORMS - canonical identities for BM-206 through BM-211.
 * compiledSha is the SHA256 of the full compiled.json FILE (not contractHash).
 */
const FORMS = [
  {
    code: "BM-206",
    extractId: "83dd8f078d92",
    compiledSha: "7fd97745e55ec59ea9261ce2f6787eb9388e5e038a7f4cdcf1bd3c01433234f2",
    extractMdSha: "588db6673fac099498a658ec0c503370efe96b7d2359dfeaf601e5ccd7de5748",
    title:
      "Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - Copy",
    operative:
      "áp dụng biện pháp giám sát điện tử đối với người chưa thành niên",
    legalBasis: "Điều 139 của Luật Tư pháp người chưa thành niên",
    documentType: "QUYẾT ĐỊNH",
    role: "ELECTRONIC_MONITORING_FAMILY application member",
    boundary: "BM-206/207/208 share electronic-monitoring domain",
    words: ["áp dụng biện pháp giám sát điện tử", "Điều 139"],
    copySuffixVerdict: "SOURCE_LITERAL_COPY_TITLE",
    copySourceTitle:
      "Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN",
    copyDisplayDecision:
      "preserve literal source/complied title; SOURCE_LITERAL_COPY_TITLE classification in profile docblock",
    lockedContractUnchanged: true,
    fieldCount: 15,
    sectionCount: 1,
  },
  {
    code: "BM-207",
    extractId: "34a77bfcbd63",
    compiledSha: "2a152adeddb7d3722b5e23e41d5598acbffdc21c7c0a531bb5baa009f1907188",
    extractMdSha: "17e1438a5f67174dd400f3155826130f5d42b55ab2d25c87bb2b2e894a19be65",
    title:
      "Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN",
    operative: "phê chuẩn quyết định áp dụng biện pháp giám sát điện tử",
    legalBasis: "Điều 139 của Luật Tư pháp người chưa thành niên",
    documentType: "QUYẾT ĐỊNH",
    role: "ELECTRONIC_MONITORING_FAMILY approval member",
    boundary: "BM-206/207/208 share electronic-monitoring domain",
    words: ["phê chuẩn", "áp dụng biện pháp giám sát điện tử"],
    fieldCount: 15,
    sectionCount: 1,
  },
  {
    code: "BM-208",
    extractId: "93ee4a40d673",
    compiledSha: "07a288578a875b3519f490878a343ca5a6074e392a560f8fecbddd60bb02f08f",
    extractMdSha: "386576fbf7385180ee580c0eca3a0932b735f7e7b6f1525c463a008b8ec5108c",
    title:
      "Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN",
    operative:
      "không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử",
    legalBasis: "Điều 139 của Luật Tư pháp người chưa thành niên",
    documentType: "QUYẾT ĐỊNH",
    role: "ELECTRONIC_MONITORING_FAMILY non-approval member",
    boundary: "BM-206/207/208 share electronic-monitoring domain",
    words: ["không phê chuẩn", "áp dụng biện pháp giám sát điện tử"],
    fieldCount: 15,
    sectionCount: 1,
  },
  {
    code: "BM-209",
    extractId: "2547ef797798",
    compiledSha: "e2cf2841860de839a6093281a0dc1fe9b15b586631718e0e465ce33e5a91dee5",
    extractMdSha: "39fb403d5f2f4e7e2434b3e5ab2b23901bc15f0af10609a289d3cd8a04ba58fd",
    title: "Quyết định áp dụng biện pháp giám sát bởi người đại diện",
    operative: "áp dụng biện pháp giám sát bởi người đại diện",
    legalBasis: "Điều 140 của Luật Tư pháp người chưa thành niên",
    documentType: "QUYẾT ĐỊNH",
    role: "REPRESENTATIVE_SUPERVISION_FAMILY application member",
    boundary: "BM-209/210 share representative-supervision domain",
    words: ["giám sát bởi người đại diện", "Điều 140"],
    fieldCount: 14,
    sectionCount: 1,
  },
  {
    code: "BM-210",
    extractId: "7266a312afb8",
    compiledSha: "2318ee76b0404169493a4deb40d3a5a173c99b718d488cad38ff6af01bfbc105",
    extractMdSha: "f0036019505cbb63f5334aa680875cc2f975cdbdcc4a11141dbd8d7588cc9485",
    title: "Quyết định thay đổi người đại diện",
    operative: "thay đổi người đại diện giám sát",
    legalBasis: "Điều 140 của Luật Tư pháp người chưa thành niên",
    documentType: "QUYẾT ĐỊNH",
    role: "REPRESENTATIVE_SUPERVISION_FAMILY change-of-representative member",
    boundary: "BM-209/210 share representative-supervision domain",
    words: ["thay đổi người đại diện", "Điều 140"],
    fieldCount: 12,
    sectionCount: 1,
  },
  {
    code: "BM-211",
    extractId: "ff91d4c3b4e0",
    compiledSha: "4c881d026a10a75540a144719361925e548846c08b5b6ed10a0cb0c6a1267aa7",
    extractMdSha: "3b95ce39a3c592790bc84711342c6d19d1519f046a94815c708ae708e2ba00c6",
    title: "Thông báo về việc thụ lý vụ án",
    operative: "thông báo về việc thụ lý vụ án",
    legalBasis: "Luật Tư pháp người chưa thành niên",
    documentType: "THÔNG BÁO",
    role: "ISOLATED_SINGLETON case-acceptance procedural notice",
    boundary: "BM-211 is a procedural notification distinct from decision forms",
    words: ["thụ lý vụ án", "Luật Tư pháp"],
    fieldCount: 21,
    sectionCount: 1,
  },
];

const readText = (p) => readFileSync(resolve(ROOT, p), "utf8");
const readJson = (p) => JSON.parse(readText(p));
const sha256File = (p) =>
  createHash("sha256").update(readFileSync(resolve(ROOT, p))).digest("hex");
const compiledPath = (f) =>
  `docs/audit/docx/compiled-v2/${f.code}.compiled.json`;
const extractJsonPath = (f) =>
  `docs/audit/docx/extracted/${f.code}__${f.extractId}.extract.json`;
const extractMdPath = (f) =>
  `docs/audit/docx/extracted/${f.code}__${f.extractId}.extract.md`;
/** Profile filename strips hyphen from code: BM-206 -> bm206 */
const profilePath = (f) => {
  const base = f.code.replace(/-/g, "").toLowerCase();
  return `apps/web/src/lib/runtime-ux/${base}-runtime-ux-profile.ts`;
};
const profileSections = (src) =>
  [...src.matchAll(/sectionId:\s*["']([^"']+)["']/gu)].map((m) => m[1]);
const profileFields = (src) => {
  const match = src.match(/const BM\d+_FIELDS = \{([\s\S]*?)\n\} as const;/u);
  if (!match) return [];
  return [...match[1].matchAll(/^\s*["']([^"']+)["']:/gm)].map(
    (m) => m[1],
  );
};
const sourceText = (extract) =>
  extract.textBlocks.map((b) => b.text).join(" ").replace(/\s+/gu, " ");
const provenanceRow = (code, text = readText(PROVENANCE_PATH)) =>
  text.match(new RegExp(`^\\| ${code} \\|[^\\n]*`, "mu"))?.[0] ?? "";

function canonicalState(form) {
  return {
    compiled: readJson(compiledPath(form)),
    extract: readJson(extractJsonPath(form)),
    profile: readText(profilePath(form)),
    provenance: provenanceRow(form.code),
  };
}

function assertDocumentIdentity(form, state) {
  assert.equal(
    state.compiled.templateCode,
    form.code,
    `SCOPED_ASSERTION ${form.code} compiled code`,
  );
  assert.equal(
    state.compiled.title,
    form.title,
    `SCOPED_ASSERTION ${form.code} compiled title`,
  );
  assert.equal(
    sha256File(compiledPath(form)),
    form.compiledSha,
    `SCOPED_ASSERTION ${form.code} compiled hash`,
  );
  assert.equal(
    sha256File(extractMdPath(form)),
    form.extractMdSha,
    `SCOPED_ASSERTION ${form.code} extract hash`,
  );
  assert.equal(
    state.extract.templateCode,
    form.code,
    `SCOPED_ASSERTION ${form.code} extract code`,
  );
  assert.equal(
    state.extract.detectedTitle,
    form.title,
    `SCOPED_ASSERTION ${form.code} extract heading`,
  );
  assert.ok(
    state.extract.sourceId.includes(form.extractId),
    `SCOPED_ASSERTION ${form.code} extract identity`,
  );
  assert.equal(
    state.compiled.source.sections.length,
    form.sectionCount,
    `SCOPED_ASSERTION ${form.code} section count`,
  );
  assert.equal(
    state.compiled.source.fields.length,
    form.fieldCount,
    `SCOPED_ASSERTION ${form.code} field count`,
  );
  const text = sourceText(state.extract).toLocaleLowerCase();
  assert.ok(
    text.includes(form.operative.toLocaleLowerCase()),
    `SCOPED_ASSERTION ${form.code} operative phrase`,
  );
  assert.ok(
    text.includes(form.legalBasis.toLocaleLowerCase()),
    `SCOPED_ASSERTION ${form.code} legal basis`,
  );
}

function assertPresentationIdentity(form, state) {
  assert.ok(
    state.profile.includes(`templateCode: "${form.code}"`),
    `SCOPED_ASSERTION ${form.code} profile code`,
  );
  assert.deepEqual(
    profileSections(state.profile),
    state.compiled.source.sections.map((s) => s.id),
    `SCOPED_ASSERTION ${form.code} section set/order`,
  );
  assert.deepEqual(
    profileFields(state.profile),
    state.compiled.source.fields.map((f) => f.key),
    `SCOPED_ASSERTION ${form.code} field set/order`,
  );
  const description =
    state.profile.match(/description:\s*\n?\s*["']([^"']+)["']/u)?.[1] ?? "";
  assert.ok(description, `SCOPED_ASSERTION ${form.code} description`);
  for (const word of form.words)
    assert.ok(
      description.toLocaleLowerCase().includes(word.toLocaleLowerCase()),
      `SCOPED_ASSERTION ${form.code} role wording: "${word}"`,
    );
  const forbidden =
    /Field\s+\d+|Người nhận \(dòng|\[GENERATED\]|auto-generated|safe synthetic demo|\(mẫu BM-\d{3}\)/iu;
  assert.doesNotMatch(
    state.profile,
    forbidden,
    `SCOPED_ASSERTION ${form.code} generic marker`,
  );
  assert.doesNotMatch(
    state.profile,
    /section-(?:thong-tin-ca-nhan|noi-dung|can-cu-va-noi-dung)/u,
    `SCOPED_ASSERTION ${form.code} phantom section`,
  );
}

function assertProvenanceIdentity(form, state) {
  assert.ok(state.provenance, `SCOPED_ASSERTION ${form.code} provenance row`);
  assert.ok(
    state.provenance.includes(compiledPath(form)),
    `SCOPED_ASSERTION ${form.code} compiled path`,
  );
  assert.ok(
    state.provenance.includes(form.compiledSha),
    `SCOPED_ASSERTION ${form.code} compiled hash`,
  );
  assert.ok(
    state.provenance.includes(extractMdPath(form)),
    `SCOPED_ASSERTION ${form.code} extract path`,
  );
  assert.match(
    state.provenance,
    /fieldEvidenceMap/u,
    `SCOPED_ASSERTION ${form.code} evidence map`,
  );
  assert.match(
    state.provenance,
    /confidenceByField/u,
    `SCOPED_ASSERTION ${form.code} confidence map`,
  );
  assert.ok(
    state.provenance.includes(form.role),
    `SCOPED_ASSERTION ${form.code} family role`,
  );
  assert.ok(
    state.provenance.includes(form.boundary),
    `SCOPED_ASSERTION ${form.code} family boundary`,
  );
  assert.ok(
    state.provenance.includes("runtimeReady=NOT_PROMOTED"),
    `SCOPED_ASSERTION ${form.code} runtime boundary`,
  );
}

function assertBm206CopySuffixInvariant(form, state) {
  assert.ok(
    state.compiled.title.includes("- Copy"),
    `SCOPED_ASSERTION ${form.code} compiled title literal preserved`,
  );
  assert.ok(
    state.profile.includes("SOURCE_LITERAL_COPY_TITLE"),
    `SCOPED_ASSERTION ${form.code} SOURCE_LITERAL_COPY_TITLE classification`,
  );
  assert.ok(
    state.provenance.includes("SOURCE_LITERAL_COPY_TITLE"),
    `SCOPED_ASSERTION ${form.code} copy suffix in provenance`,
  );
  assert.ok(
    state.provenance.includes(form.copySourceTitle),
    `SCOPED_ASSERTION ${form.code} source title in provenance`,
  );
  assert.ok(
    state.provenance.includes("lockedContractUnchanged=true"),
    `SCOPED_ASSERTION ${form.code} locked contract not modified`,
  );
}

function assertCanonical(form, state) {
  assertDocumentIdentity(form, state);
  assertPresentationIdentity(form, state);
  assertProvenanceIdentity(form, state);
  if (form.copySuffixVerdict)
    assertBm206CopySuffixInvariant(form, state);
}

function assertMutation(form, mutate) {
  const state = structuredClone(canonicalState(form));
  const before = JSON.stringify({
    compiled: state.compiled,
    extract: state.extract,
    profile: state.profile,
    provenance: state.provenance,
  });
  mutate(state);
  const after = JSON.stringify({
    compiled: state.compiled,
    extract: state.extract,
    profile: state.profile,
    provenance: state.provenance,
  });
  assert.notEqual(
    after,
    before,
    `${form.code} mutation changes serialized state`,
  );
  assert.throws(() => assertCanonical(form, state), /SCOPED_ASSERTION/u);
}

describe(
  "BM-206 through BM-211 semantic frontier closure",
  { concurrency: false },
  () => {
    for (const form of FORMS) {
      describe(form.code, () => {
        it("matches own document, presentation, and provenance identity", () =>
          assertCanonical(form, canonicalState(form)),
        );
        it("rejects document identity mutations", () => {
          assertMutation(form, (state) => {
            state.compiled.templateCode = "BM-212";
          });
          assertMutation(form, (state) => {
            state.compiled.title = "SIBLING_TITLE";
          });
          assertMutation(form, (state) => {
            state.extract.detectedTitle = "SIBLING_HEADING";
          });
          assertMutation(form, (state) => {
            state.extract.sourceId = "SIBLING_SOURCE";
          });
        });
        it("rejects presentation mutations", () => {
          assertMutation(form, (state) => {
            state.profile = state.profile.replace(
              "section-thong-tin-bieu-mau",
              "section-phantom",
            );
          });
          assertMutation(form, (state) => {
            state.profile = state.profile.replace(
              /description:\s*\n?\s*"[^"]+"/u,
              'description: ""',
            );
          });
          assertMutation(form, (state) => {
            state.profile = state.profile.replaceAll(
              state.compiled.source.fields[0].key,
              "outside.contract.field",
            );
          });
          assertMutation(form, (state) => {
            state.profile = state.profile.replace(
              'label: "',
              'label: "Field 1 - ',
            );
          });
        });
        it("rejects provenance mutations", () => {
          assertMutation(form, (state) => {
            state.provenance = "";
          });
          assertMutation(form, (state) => {
            state.provenance = state.provenance.replace(
              form.compiledSha,
              "0".repeat(64),
            );
          });
          assertMutation(form, (state) => {
            state.provenance = state.provenance.replace(
              form.role,
              "ROLE_REMOVED",
            );
          });
          assertMutation(form, (state) => {
            state.provenance = state.provenance.replace(
              /fieldEvidenceMap/u,
              "fieldEvidenceRemoved",
            );
          });
          assertMutation(form, (state) => {
            state.provenance = state.provenance.replace(
              "runtimeReady=NOT_PROMOTED",
              "runtimeReady=PROMOTED",
            );
          });
        });
      });
    }

    it("BM-206 copy-suffix invariants preserved against mutations", () => {
      const form = FORMS[0];
      assertMutation(form, (s) => {
        s.compiled.title = s.compiled.title.replace("- Copy", "");
      });
      assertMutation(form, (s) => {
        s.profile = s.profile.replaceAll(
          "SOURCE_LITERAL_COPY_TITLE",
          "COPY_SUFFIX_REMOVED",
        );
      });
      assertMutation(form, (s) => {
        s.provenance = s.provenance.replaceAll(
          "SOURCE_LITERAL_COPY_TITLE",
          "CLASSIFICATION_REMOVED",
        );
      });
      assertMutation(form, (s) => {
        s.provenance = s.provenance.replaceAll(
          form.copySourceTitle,
          "SOURCE_TITLE_REMOVED",
        );
      });
      assertMutation(form, (s) => {
        s.provenance = s.provenance.replace(
          "lockedContractUnchanged=true",
          "lockedContractUnchanged=false",
        );
      });
    });

    it("distinguishes electronic monitoring triplet: application, approval, non-approval", () => {
      const [bm206, bm207, bm208] = FORMS.slice(0, 3).map(
        (f) => canonicalState(f).profile,
      );
      assert.match(
        bm206,
        /áp dụng biện pháp giám sát điện tử.*người chưa thành niên/iu,
      );
      assert.match(
        bm207,
        /phê chuẩn.*áp dụng biện pháp giám sát điện tử/iu,
      );
      assert.match(
        bm208,
        /không phê chuẩn.*áp dụng biện pháp giám sát điện tử/iu,
      );
      assert.doesNotMatch(bm207, /không phê chuẩn|không có căn cứ/iu);
      assert.doesNotMatch(
        bm208,
        /Số quyết định được phê chuẩn|Quyết định phê chuẩn quyết định áp dụng|Phê duyệt việc áp dụng/iu,
      );
      assert.match(bm208, /Số quyết định không được phê chuẩn/iu);
      assert.match(bm207, /Số quyết định được phê chuẩn/iu);
    });

    it("distinguishes representative-supervision pair: original application versus change", () => {
      const [bm209, bm210] = FORMS.slice(3, 5).map(
        (f) => canonicalState(f).profile,
      );
      assert.match(
        bm209,
        /áp dụng biện pháp giám sát bởi người đại diện/iu,
      );
      assert.match(bm210, /thay đổi người đại diện giám sát/iu);
      assert.doesNotMatch(bm210, /áp dụng biện pháp giám sát điện tử/iu);
      assert.doesNotMatch(
        bm209,
        /thay đổi người đại diện giám sát/iu,
      );
    });

    it("BM-211 is distinct from all other forms in the batch", () => {
      const bm211 = canonicalState(FORMS[5]).profile;
      assert.match(bm211, /thụ lý vụ án/iu);
      assert.doesNotMatch(
        bm211,
        /áp dụng biện pháp giám sát điện tử/iu,
      );
    });
  },
);
