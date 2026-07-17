/**
 * Runtime UX profile registry — per-template UX overrides for the standalone
 * `/templates/:templateCode` runtime preview workspace.
 *
 * Architecture: Option B (generic registry). One well-typed entry point
 * (`getRuntimeUxProfile`) so future templates can add profiles without
 * touching the contract renderer or the workspace shell.
 *
 * Boundaries:
 * - Profiles only affect UI presentation (labels, descriptions, placeholders,
 *   input-type hints, demo fixture, safe prefill entries).
 * - Profiles do NOT mutate locked contracts, normalized DOCX, or
 *   `CompiledFormContract` payloads — they are pure UI metadata.
 * - Profiles do NOT write to `generated_documents` or create
 *   `generatedDocumentId` values.
 *
 * Use:
 * - `getRuntimeUxProfile(templateCode)` returns `RuntimeUxProfile | null`.
 * - The renderer (`ContractV2Renderer`) and the workspace
 *   (`TemplatePreviewWorkspace`) consume the profile via `uxProfile` prop /
 *   `getRuntimeUxProfile(templateCode)` lookup respectively.
 */

/**
 * Per-template runtime UX profile.
 *
 * Sections describe display overrides applied in order. Fields not listed
 * here fall back to the contract values untouched.
 */
export type RuntimeUxProfile = {
  /** Template code this profile applies to (e.g. "BM-171"). */
  readonly templateCode: string;
  /** Stable, human-friendly version label, surfaced in audit artifacts. */
  readonly versionLabel: string;
  /**
   * Section display overrides. Sections listed here replace the contract
   * `section.title` / `section.description`. Sections in the contract but
   * NOT in this map are rendered with contract values, but ordered last.
   */
  readonly sections: ReadonlyArray<{
    readonly sectionId: string;
    readonly title: string;
    readonly description?: string;
  }>;
  /**
   * Field-level overrides:
   *  - `label`: more user-friendly wording where contract label is too
   *    terse or technical.
   *  - `placeholder`: in-form hint text (never real data).
   *  - `helpText`: longer explanation rendered under the input.
   *  - `control`: optional override (e.g. force "TEXTAREA" on a long
   *    legal-basis field that the contract declared as "TEXT"). Limited
   *    to "TEXT" | "TEXTAREA" because the renderer cannot morph other
   *    control types safely.
   */
  readonly fields: Readonly<Record<string, {
    readonly label?: string;
    readonly placeholder?: string;
    readonly helpText?: string;
    readonly control?: "TEXT" | "TEXTAREA" | "DATE_TEXT";
    /**
     * Smart-field override. When present, the renderer routes the
     * field through the smart-field helper pipeline (date picker,
     * time picker, select, textarea, or derived multi-target fields).
     * Fields without `smart` continue to render exactly as before.
     *
     * Documented in
     * `docs/audit/unified-bm-workspace/RUNTIME_UX_SMART_FIELD_CONTRACT.latest.md`.
     * The shape itself lives in `apps/web/src/lib/runtime-ux/smart-field-helpers.ts`
     * so the renderer and the guard tests can import the same type
     * without pulling a cycle through the profile layer.
     */
    readonly smart?: {
      readonly key: string;
      readonly label?: string;
      readonly kind?:
        | "text"
        | "textarea"
        | "date"
        | "time"
        | "select"
        | "date-parts"
        | "year-or-date"
        | "issue-place-date-line";
      readonly placeholder?: string;
      readonly options?: readonly string[];
      readonly rows?: number;
      readonly derivedTargets?: readonly string[];
    };
  }>>;
  /**
   * Synthetic demo fixture (non-real PII). Used when the user explicitly
   * clicks the "Dữ liệu demo" button in the runtime workspace.
   */
  readonly demo: Readonly<Record<string, string>>;
  /**
   * Preview summary — optional read-only "quick-check" view that mirrors
   * the key lines of the synthesized DOCX so the operator can eyeball
   * the data before downloading. NOT the DOCX preview itself.
   */
  readonly summaryLines?: ReadonlyArray<{
    readonly label: string;
    readonly value: string | ((data: Record<string, unknown>) => string);
  }>;
};

const RUNTIME_UX_PROFILES: Map<string, RuntimeUxProfile> = new Map([
  // Profiles are registered here. Each module side-effects this map by
  // importing it and calling `registerRuntimeUxProfile(profile)`.
]);

/**
 * Side-effect registration. Should be called at module top-level from a
 * profile module (e.g. `bm171-runtime-ux-profile.ts`). Calling twice with
 * the same `templateCode` is allowed and replaces the previous profile,
 * which makes it easy to update a profile during testing.
 */
export function registerRuntimeUxProfile(profile: RuntimeUxProfile): void {
  RUNTIME_UX_PROFILES.set(profile.templateCode, profile);
}

function clone<T>(value: T): T {
  // structuredClone cannot clone functions, and `summaryLines[i].value`
  // may be a `(data) => string` function. We deep-clone the object
  // tree while preserving functions in-place — they are pure,
  // shared, and immutable in this codebase, so passing them through
  // is safe and avoids accidental capture-state leakage.
  return clonePreservingFunctions(value);
}

function clonePreservingFunctions<T>(value: T): T {
  if (typeof value === "function") return value;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((entry) => clonePreservingFunctions(entry)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = clonePreservingFunctions(v);
  }
  return out as T;
}

/**
 * Look up the runtime UX profile for a given template code, returning a
 * defensive deep-clone. Returning `null` is intentional — the renderer
 * and workspace must both be safe when no profile exists.
 */
export function getRuntimeUxProfile(
  templateCode: string,
): RuntimeUxProfile | null {
  const profile = RUNTIME_UX_PROFILES.get(templateCode);
  return profile ? clone(profile) : null;
}

/**
 * List registered template codes. Intended for diagnostics and tests.
 */
export function listRegisteredRuntimeUxProfiles(): readonly string[] {
  return Array.from(RUNTIME_UX_PROFILES.keys()).sort();
}

/**
 * Test-only: clear all registered profiles. Production code MUST NOT
 * import this helper.
 */
export function __resetRuntimeUxProfilesForTests(): void {
  RUNTIME_UX_PROFILES.clear();
}
