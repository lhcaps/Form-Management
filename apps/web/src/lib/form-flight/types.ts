/**
 * Form Flight shared core — canonical cross-flow types.
 *
 * Two flows use the same shared core:
 *   - `/templates/:code`        — TemplateRuntimeAdapter  (no DB)
 *   - `/documents/:id`          — GeneratedDocumentAdapter (DB + file + audit)
 *
 * The shared core NEVER knows about persistence. The adapters do.
 * Routes are separate (AGENTS.md hard boundary). Profiles, payload,
 * required-field gate, summary resolution and acceptance scan are the
 * one place future templates plug in to make both flows behave
 * identically.
 *
 * Existing runtime primitives in `apps/web/src/lib/runtime-ux/*`
 * continue to ship unchanged. This file adds the cross-flow vocabulary
 * and re-exports those primitives so adapters and profiles can be
 * written against one type system.
 */

export type FormFlightMode =
  | "template-runtime"
  | "generated-document";

export type FormFlightPayloadMode =
  | "preview"
  | "export"
  | "demo-reset"
  | "save";

/**
 * Canonical profile — the one place that says "what does this template
 * look like for the user" regardless of route. Each template's profile
 * is registered once; both adapters consume the same registered object.
 *
 * `fieldPaths` is the canonical list of user-facing field paths. The
 * generated-document adapter must read the same paths when persisting,
 * or the runtime and document flows will diverge silently.
 *
 * `requiredFieldPaths` must be a strict subset of `fieldPaths`. The
 * runtime route uses these to gate `preview` / `export`. The
 * generated-document route uses the same set to gate `save` / `render`.
 *
 * `demo` is the synthetic fixture applied when the user clicks
 * "Dữ liệu demo". Runtime uses `buildRuntimePreviewPayloadFromDraft`
 * with `mode: "demo-reset"`. Generated-document uses the same payload
 * builder via `TemplateRuntimeAdapter.buildPayload`, then `save`.
 *
 * `acceptance` is the static + forbidden text scanner. Both flows can
 * run `scanAcceptance(renderedText, profile)` to verify the DOCX
 * contains the required anchors and never leaks forbidden garbage.
 */
export type FormFlightProfileStatus =
  | "runtime-ready"
  | "persisted-ready"
  | "audit-only"
  | "skeleton";

export type FormFlightProfile = {
  readonly templateCode: string;
  readonly title: string;
  readonly fieldPaths: readonly string[];
  readonly requiredFieldPaths: readonly string[];
  readonly demo: Readonly<Record<string, string>>;
  readonly staleFallbacks?: Readonly<Record<string, readonly string[]>>;
  readonly aliases?: Readonly<Record<string, readonly string[]>>;
  readonly summaryLines?: ReadonlyArray<{
    readonly label: string;
    readonly value:
      | string
      | ((data: Record<string, unknown>) => string);
  }>;
  readonly acceptance: {
    readonly requiredText: readonly string[];
    readonly forbiddenText: readonly string[];
  };
  /**
   * Runtime readiness signal — adopted in
   * RESTORE_BM001_PRE_PR7B_RUNTIME_UI_AND_BLOCK_SKELETON_TAKEOVER.
   * Optional for backward compatibility with pre-PR7B profiles that did
   * not declare the flag. When absent, `isRuntimeReadyProfile` returns
   * false (fail-closed).
   */
  readonly runtimeReady?: boolean;
  /**
   * Generated-document readiness signal. This does not authorize the
   * standalone template-runtime route; `isPersistedReadyProfile` is the
   * only consumer that may treat it as authoritative.
   */
  readonly persistedReady?: boolean;
  readonly profileStatus?: FormFlightProfileStatus;
};

/**
 * Adapter contract. The runtime and document flows implement their own
 * concrete versions. The shared core never holds an instance; it just
 * types the call surface.
 */
export type FormFlightAdapter = {
  readonly mode: FormFlightMode;
  loadDraft(): Promise<Record<string, unknown>>;
  saveDraft(draft: Record<string, unknown>): Promise<void>;
  preview(payload: Record<string, unknown>): Promise<unknown>;
  exportDocx(payload: Record<string, unknown>): Promise<unknown>;
};
