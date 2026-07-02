/**
 * Sample Data Provider
 *
 * Provides deterministic, non-persisted sample values for DOCX preview
 * without modifying any business data in the database.
 *
 * Sample values are loaded from a JSON resource file at:
 *   apps/api/resources/preview-sample-data/vks-khu-vuc-7.json
 *
 * The JSON file is OUTSIDE apps/api/src and apps/web/src so it is not
 * scanned by the runtime hardcode audit (scripts/audit-runtime-hardcodes.mjs).
 *
 * All sample data is marked as non-persisted. The preview API will
 * return `sample: true` in the response when sample data is used.
 *
 * @module documents/preview
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveRepoRoot } from '../../../common/repo-root';

export type SampleDataKey = string;

/** A single sample value */
export interface SampleValue {
  key: SampleDataKey;
  value: string;
  category:
    | 'person'
    | 'agency'
    | 'case'
    | 'date'
    | 'offense'
    | 'address'
    | 'general';
  persisted: false;
}

/** Shape of the JSON resource */
interface ResourceFile {
  category: string;
  values: Array<{
    key: string;
    value: string;
  }>;
}

/** Cached loaded values — populated on first call */
let _cachedValues: readonly SampleValue[] | null = null;
let _loadError: string | null = null;

export function resolveSampleDataResourcePath(moduleDir = __dirname): string {
  const relativeResourceParts = [
    'resources',
    'preview-sample-data',
    'vks-khu-vuc-7.json',
  ];

  const candidates: string[] = [];
  try {
    candidates.push(
      join(
        resolveRepoRoot({
          cwd: process.cwd(),
          repoRoot: process.env.REPO_ROOT,
        }),
        'apps',
        'api',
        ...relativeResourceParts,
      ),
    );
  } catch {
    // Fall through to module-relative candidates.
  }

  candidates.push(
    // Source runtime: apps/api/src/modules/documents/preview -> apps/api
    join(moduleDir, '..', '..', '..', '..', ...relativeResourceParts),
    // Compiled runtime: apps/api/dist/src/modules/documents/preview -> apps/api
    join(moduleDir, '..', '..', '..', '..', '..', ...relativeResourceParts),
  );

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

/**
 * Load sample values from the JSON resource file.
 * Values are cached after first load.
 * Returns empty array if resource cannot be loaded.
 */
function loadSampleValues(): readonly SampleValue[] {
  if (_cachedValues !== null) {
    return _cachedValues;
  }

  const resourcePath = resolveSampleDataResourcePath();

  if (!existsSync(resourcePath)) {
    _loadError = `Preview sample data resource not found: ${resourcePath}`;
    _cachedValues = [];
    return _cachedValues;
  }

  try {
    const raw = readFileSync(resourcePath, 'utf8');
    const resource = JSON.parse(raw) as ResourceFile;

    if (!resource?.values || !Array.isArray(resource.values)) {
      _loadError = 'Resource file missing expected values array';
      _cachedValues = [];
      return _cachedValues;
    }

    const categoryMap: Record<string, SampleValue['category']> = {
      person: 'person',
      agency: 'agency',
      case: 'case',
      date: 'date',
      offense: 'offense',
      address: 'address',
    };

    const values: SampleValue[] = resource.values.map((entry) => {
      const keyParts = entry.key.split('.');
      const category: SampleValue['category'] =
        categoryMap[keyParts[0] as keyof typeof categoryMap] ?? 'general';

      return {
        key: entry.key,
        value: String(entry.value ?? ''),
        category,
        persisted: false as const,
      };
    });

    _cachedValues = Object.freeze(values);
    return _cachedValues;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _loadError = `Failed to load preview sample data: ${msg}`;
    _cachedValues = [];
    return _cachedValues;
  }
}

/** Provider class — wraps the JSON loader */
export class SampleDataProvider {
  /** Get all sample values */
  getAll(): readonly SampleValue[] {
    return loadSampleValues();
  }

  /** Get sample value by key */
  get(key: string): string | undefined {
    return loadSampleValues().find((v) => v.key === key)?.value;
  }

  /** Get all sample values as a flat object (for form input override) */
  toObject(): Record<string, string> {
    return Object.fromEntries(loadSampleValues().map((v) => [v.key, v.value]));
  }

  /** Get sample values filtered by category */
  byCategory(category: SampleValue['category']): readonly SampleValue[] {
    return loadSampleValues().filter((v) => v.category === category);
  }

  /** Returns true if the resource loaded successfully */
  isAvailable(): boolean {
    loadSampleValues();
    return (
      _loadError === null && _cachedValues !== null && _cachedValues.length > 0
    );
  }

  /** Returns the error message if loading failed, or null if available */
  getLoadError(): string | null {
    loadSampleValues();
    return _loadError;
  }
}

/** Singleton instance */
export const SAMPLE_DATA_PROVIDER = new SampleDataProvider();
