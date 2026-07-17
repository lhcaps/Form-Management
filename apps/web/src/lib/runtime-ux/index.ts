/**
 * Public surface for the runtime UX profile layer.
 *
 * Importing this barrel eagerly loads every registered profile so that
 * `getRuntimeUxProfile("BM-171")` works the moment the bundle is
 * imported in `TemplatePreviewWorkspace` or its tests.
 */

// Import order matters — each profile module side-effects the registry.
import "./bm171-runtime-ux-profile";
// BM-001 runtime-ready parity: import the BM-001 profile so that
// `getRuntimeUxProfile("BM-001")` returns the populated profile and the
// runtime workspace renders the BM-171-style panel instead of falling
// back to the generic `getSampleData(...)` heuristic (which leaks
// legacy stale fixture values). The profile module itself
// declares its demo aligned to `BM001_DEMO`. See
// `RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.md` for future
// BM-NNN promotion steps.
import "./bm001-runtime-ux-profile";
// Auto-imported by scripts/audit/generate-runtime-ux-profiles.mjs
// (213 conservative runtime-ux profiles — BM-002 .. BM-213).
import "./bm002-runtime-ux-profile";
import "./bm003-runtime-ux-profile";
import "./bm004-runtime-ux-profile";
import "./bm005-runtime-ux-profile";
import "./bm006-runtime-ux-profile";
import "./bm007-runtime-ux-profile";
import "./bm008-runtime-ux-profile";
import "./bm009-runtime-ux-profile";
import "./bm010-runtime-ux-profile";
import "./bm011-runtime-ux-profile";
import "./bm012-runtime-ux-profile";
import "./bm013-runtime-ux-profile";
import "./bm014-runtime-ux-profile";
import "./bm015-runtime-ux-profile";
import "./bm016-runtime-ux-profile";
import "./bm017-runtime-ux-profile";
import "./bm018-runtime-ux-profile";
import "./bm019-runtime-ux-profile";
import "./bm020-runtime-ux-profile";
import "./bm021-runtime-ux-profile";
import "./bm022-runtime-ux-profile";
import "./bm023-runtime-ux-profile";
import "./bm024-runtime-ux-profile";
import "./bm025-runtime-ux-profile";
import "./bm026-runtime-ux-profile";
import "./bm027-runtime-ux-profile";
import "./bm028-runtime-ux-profile";
import "./bm029-runtime-ux-profile";
import "./bm030-runtime-ux-profile";
import "./bm031-runtime-ux-profile";
import "./bm032-runtime-ux-profile";
import "./bm033-runtime-ux-profile";
import "./bm034-runtime-ux-profile";
import "./bm035-runtime-ux-profile";
import "./bm036-runtime-ux-profile";
import "./bm037-runtime-ux-profile";
import "./bm038-runtime-ux-profile";
import "./bm039-runtime-ux-profile";
import "./bm040-runtime-ux-profile";
import "./bm041-runtime-ux-profile";
import "./bm042-runtime-ux-profile";
import "./bm043-runtime-ux-profile";
import "./bm044-runtime-ux-profile";
import "./bm045-runtime-ux-profile";
import "./bm046-runtime-ux-profile";
import "./bm047-runtime-ux-profile";
import "./bm048-runtime-ux-profile";
import "./bm049-runtime-ux-profile";
import "./bm050-runtime-ux-profile";
import "./bm051-runtime-ux-profile";
import "./bm052-runtime-ux-profile";
import "./bm053-runtime-ux-profile";
import "./bm054-runtime-ux-profile";
import "./bm055-runtime-ux-profile";
import "./bm056-runtime-ux-profile";
import "./bm057-runtime-ux-profile";
import "./bm058-runtime-ux-profile";
import "./bm059-runtime-ux-profile";
import "./bm060-runtime-ux-profile";
import "./bm061-runtime-ux-profile";
import "./bm062-runtime-ux-profile";
import "./bm063-runtime-ux-profile";
import "./bm064-runtime-ux-profile";
import "./bm065-runtime-ux-profile";
import "./bm066-runtime-ux-profile";
import "./bm067-runtime-ux-profile";
import "./bm068-runtime-ux-profile";
import "./bm069-runtime-ux-profile";
import "./bm070-runtime-ux-profile";
import "./bm071-runtime-ux-profile";
import "./bm072-runtime-ux-profile";
import "./bm073-runtime-ux-profile";
import "./bm074-runtime-ux-profile";
import "./bm075-runtime-ux-profile";
import "./bm076-runtime-ux-profile";
import "./bm077-runtime-ux-profile";
import "./bm078-runtime-ux-profile";
import "./bm079-runtime-ux-profile";
import "./bm080-runtime-ux-profile";
import "./bm081-runtime-ux-profile";
import "./bm082-runtime-ux-profile";
import "./bm083-runtime-ux-profile";
import "./bm084-runtime-ux-profile";
import "./bm085-runtime-ux-profile";
import "./bm086-runtime-ux-profile";
import "./bm087-runtime-ux-profile";
import "./bm088-runtime-ux-profile";
import "./bm089-runtime-ux-profile";
import "./bm090-runtime-ux-profile";
import "./bm091-runtime-ux-profile";
import "./bm092-runtime-ux-profile";
import "./bm093-runtime-ux-profile";
import "./bm094-runtime-ux-profile";
import "./bm095-runtime-ux-profile";
import "./bm096-runtime-ux-profile";
import "./bm097-runtime-ux-profile";
import "./bm098-runtime-ux-profile";
import "./bm099-runtime-ux-profile";
import "./bm100-runtime-ux-profile";
import "./bm101-runtime-ux-profile";
import "./bm102-runtime-ux-profile";
import "./bm103-runtime-ux-profile";
import "./bm104-runtime-ux-profile";
import "./bm105-runtime-ux-profile";
import "./bm106-runtime-ux-profile";
import "./bm107-runtime-ux-profile";
import "./bm108-runtime-ux-profile";
import "./bm109-runtime-ux-profile";
import "./bm110-runtime-ux-profile";
import "./bm111-runtime-ux-profile";
import "./bm112-runtime-ux-profile";
import "./bm113-runtime-ux-profile";
import "./bm114-runtime-ux-profile";
import "./bm115-runtime-ux-profile";
import "./bm116-runtime-ux-profile";
import "./bm117-runtime-ux-profile";
import "./bm118-runtime-ux-profile";
import "./bm119-runtime-ux-profile";
import "./bm120-runtime-ux-profile";
import "./bm121-runtime-ux-profile";
import "./bm122-runtime-ux-profile";
import "./bm123-runtime-ux-profile";
import "./bm124-runtime-ux-profile";
import "./bm125-runtime-ux-profile";
import "./bm126-runtime-ux-profile";
import "./bm127-runtime-ux-profile";
import "./bm128-runtime-ux-profile";
import "./bm129-runtime-ux-profile";
import "./bm130-runtime-ux-profile";
import "./bm131-runtime-ux-profile";
import "./bm132-runtime-ux-profile";
import "./bm133-runtime-ux-profile";
import "./bm134-runtime-ux-profile";
import "./bm135-runtime-ux-profile";
import "./bm136-runtime-ux-profile";
import "./bm137-runtime-ux-profile";
import "./bm138-runtime-ux-profile";
import "./bm139-runtime-ux-profile";
import "./bm140-runtime-ux-profile";
import "./bm141-runtime-ux-profile";
import "./bm142-runtime-ux-profile";
import "./bm143-runtime-ux-profile";
import "./bm144-runtime-ux-profile";
import "./bm145-runtime-ux-profile";
import "./bm146-runtime-ux-profile";
import "./bm147-runtime-ux-profile";
import "./bm148-runtime-ux-profile";
import "./bm149-runtime-ux-profile";
import "./bm150-runtime-ux-profile";
import "./bm151-runtime-ux-profile";
import "./bm152-runtime-ux-profile";
import "./bm153-runtime-ux-profile";
import "./bm154-runtime-ux-profile";
import "./bm155-runtime-ux-profile";
import "./bm156-runtime-ux-profile";
import "./bm157-runtime-ux-profile";
import "./bm158-runtime-ux-profile";
import "./bm159-runtime-ux-profile";
import "./bm160-runtime-ux-profile";
import "./bm161-runtime-ux-profile";
import "./bm162-runtime-ux-profile";
import "./bm163-runtime-ux-profile";
import "./bm164-runtime-ux-profile";
import "./bm165-runtime-ux-profile";
import "./bm166-runtime-ux-profile";
import "./bm167-runtime-ux-profile";
import "./bm168-runtime-ux-profile";
import "./bm169-runtime-ux-profile";
import "./bm170-runtime-ux-profile";
import "./bm172-runtime-ux-profile";
import "./bm173-runtime-ux-profile";
import "./bm174-runtime-ux-profile";
import "./bm175-runtime-ux-profile";
import "./bm176-runtime-ux-profile";
import "./bm177-runtime-ux-profile";
import "./bm178-runtime-ux-profile";
import "./bm179-runtime-ux-profile";
import "./bm180-runtime-ux-profile";
import "./bm181-runtime-ux-profile";
import "./bm182-runtime-ux-profile";
import "./bm183-runtime-ux-profile";
import "./bm184-runtime-ux-profile";
import "./bm185-runtime-ux-profile";
import "./bm186-runtime-ux-profile";
import "./bm187-runtime-ux-profile";
import "./bm188-runtime-ux-profile";
import "./bm189-runtime-ux-profile";
import "./bm190-runtime-ux-profile";
import "./bm191-runtime-ux-profile";
import "./bm192-runtime-ux-profile";
import "./bm193-runtime-ux-profile";
import "./bm194-runtime-ux-profile";
import "./bm195-runtime-ux-profile";
import "./bm196-runtime-ux-profile";
import "./bm197-runtime-ux-profile";
import "./bm198-runtime-ux-profile";
import "./bm199-runtime-ux-profile";
import "./bm200-runtime-ux-profile";
import "./bm201-runtime-ux-profile";
import "./bm202-runtime-ux-profile";
import "./bm203-runtime-ux-profile";
import "./bm204-runtime-ux-profile";
import "./bm205-runtime-ux-profile";
import "./bm206-runtime-ux-profile";
import "./bm207-runtime-ux-profile";
import "./bm208-runtime-ux-profile";
import "./bm209-runtime-ux-profile";
import "./bm210-runtime-ux-profile";
import "./bm211-runtime-ux-profile";
import "./bm212-runtime-ux-profile";
import "./bm213-runtime-ux-profile";
import "./bm141-runtime-ux-profile";
import "./bm141-runtime-ux-profile";
import "./bm142-runtime-ux-profile";
import "./bm143-runtime-ux-profile";
import "./bm144-runtime-ux-profile";
import "./bm145-runtime-ux-profile";
import "./bm146-runtime-ux-profile";
import "./bm147-runtime-ux-profile";
import "./bm148-runtime-ux-profile";
import "./bm149-runtime-ux-profile";
import "./bm150-runtime-ux-profile";
import "./bm151-runtime-ux-profile";
import "./bm152-runtime-ux-profile";
import "./bm153-runtime-ux-profile";
import "./bm154-runtime-ux-profile";
import "./bm155-runtime-ux-profile";
import "./bm156-runtime-ux-profile";
import "./bm157-runtime-ux-profile";
import "./bm158-runtime-ux-profile";
import "./bm159-runtime-ux-profile";
import "./bm160-runtime-ux-profile";
import "./bm182-runtime-ux-profile";
import "./bm183-runtime-ux-profile";
import "./bm184-runtime-ux-profile";
import "./bm185-runtime-ux-profile";
import "./bm186-runtime-ux-profile";
import "./bm187-runtime-ux-profile";
import "./bm188-runtime-ux-profile";
import "./bm189-runtime-ux-profile";
import "./bm190-runtime-ux-profile";
import "./bm191-runtime-ux-profile";
import "./bm192-runtime-ux-profile";
import "./bm193-runtime-ux-profile";
import "./bm194-runtime-ux-profile";
import "./bm195-runtime-ux-profile";
import "./bm196-runtime-ux-profile";
import "./bm197-runtime-ux-profile";
import "./bm198-runtime-ux-profile";
import "./bm199-runtime-ux-profile";
import "./bm201-runtime-ux-profile";
import "./bm202-runtime-ux-profile";

export {
  type RuntimeUxProfile,
  getRuntimeUxProfile,
  listRegisteredRuntimeUxProfiles,
  registerRuntimeUxProfile,
  __resetRuntimeUxProfilesForTests,
} from "./runtime-ux-profile";

export {
  buildRuntimePreviewPayloadFromDraft,
  setNestedPath,
  type RuntimePreviewPayloadMode,
  type BuildPayloadInput,
  type BuildPayloadResult,
  type BuildPayloadWarning,
} from "./runtime-preview-payload";

export {
  isKnownStaleFallback,
  listKnownStaleFallbacks,
} from "./placeholder-blocklist";

export {
  applySmartFieldWrites,
  deriveDateToDayMonthYear,
  deriveYearOrDateToBirthParts,
  formatVietnameseIssueLine,
  isHiddenBySmartOverride,
  parseIsoDate,
  toDayMonthYear,
  type DerivedDateParts,
  type SmartField,
  type SmartFieldKind,
} from "./smart-field-helpers";
