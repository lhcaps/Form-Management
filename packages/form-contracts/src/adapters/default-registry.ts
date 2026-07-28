/**
 * Default registry factory — registers the canonical Phase 2 adapters.
 *
 * Consumers of the registry should call `buildDefaultRegistry()` rather
 * than instantiating `AdapterRegistry` themselves, so that future
 * adapters (RECIPIENT_COPY, CASE_INFO_BLOCK, OFFICIAL_BLOCK, …) are
 * registered in the same canonical order without per-callsite changes.
 */

import { AdapterRegistry } from './adapter-registry';
import { SIGNATURE_SECTION_ADAPTER } from './signature-section-adapter';
import { ISSUE_PLACE_DATE_ADAPTER } from './issue-place-date-adapter';
import { RECIPIENT_COPY_ADAPTER } from './recipient-copy-adapter';
import { LEGAL_HEADER_ADAPTER } from './legal-header-adapter';
import { DOCUMENT_BASIC_ADAPTER } from './document-basic-adapter';

export function buildDefaultRegistry(): AdapterRegistry {
  const registry = new AdapterRegistry();
  // Registration order is canonical: SIGNATURE_SECTION is the largest
  // debt family (141 forms) and resolves first; ISSUE_PLACE_DATE is the
  // second-largest (120 forms). Future adapters are appended below.
  registry.register(SIGNATURE_SECTION_ADAPTER);
  registry.register(ISSUE_PLACE_DATE_ADAPTER);
  registry.register(RECIPIENT_COPY_ADAPTER);
  registry.register(LEGAL_HEADER_ADAPTER);
  registry.register(DOCUMENT_BASIC_ADAPTER);
  return registry;
}
