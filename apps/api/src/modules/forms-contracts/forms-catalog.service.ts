/**
 * Phase D — Forms catalog service (API side).
 *
 * Provides contract loading and catalog building as a NestJS injectable service.
 * Reads contracts from the filesystem (server-side only).
 * Self-contained — does NOT import from web features/.
 */

import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  LoadedFormContract,
  FormCatalogItem,
  FormCatalogQuery,
  DocxSlot,
  CanonicalField,
  RenderBinding,
} from './forms-catalog.types';

const GENERIC_FIELD_PATTERN = /^\w+\.field\d+$/i;

const FORM_STAGES = [
  {
    code: '01',
    label: 'Tiếp nhận và giải quyết nguồn tin',
    bmRange: [1, 30] as [number, number],
  },
  {
    code: '02',
    label: 'Biện pháp ngăn chặn, cưỡng chế',
    bmRange: [31, 69] as [number, number],
  },
  {
    code: '03',
    label: 'Người tham gia tố tụng',
    bmRange: [70, 84] as [number, number],
  },
  {
    code: '04',
    label: 'Giai đoạn điều tra',
    bmRange: [85, 140] as [number, number],
  },
  {
    code: '05',
    label: 'Giai đoạn truy tố',
    bmRange: [141, 168] as [number, number],
  },
  { code: '06', label: 'Vật chứng', bmRange: [169, 173] as [number, number] },
  {
    code: '07',
    label: 'Biện pháp điều tra đặc biệt',
    bmRange: [174, 178] as [number, number],
  },
  {
    code: '08',
    label: 'Thủ tục đặc biệt',
    bmRange: [179, 184] as [number, number],
  },
  {
    code: '09',
    label: 'Người chưa thành niên',
    bmRange: [185, 213] as [number, number],
  },
];

function getStageForBm(
  bmCode: string,
): { code: string; label: string } | undefined {
  const match = bmCode.match(/^BM-(\d+)/);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  const stage = FORM_STAGES.find((s) => n >= s.bmRange[0] && n <= s.bmRange[1]);
  return stage ? { code: stage.code, label: stage.label } : undefined;
}

function discoverContractPaths(contractsRoot: string): {
  locked: string[];
  draft: string[];
} {
  const locked: string[] = [];
  const draft: string[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'locked') scan(full);
      } else if (/\.contract\.(draft|locked)\.json$/.test(entry.name)) {
        if (entry.name.includes('.locked.')) locked.push(full);
        else draft.push(full);
      }
    }
  }

  scan(contractsRoot);
  return { locked, draft };
}

function loadContractFromPath(fp: string): object | null {
  try {
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Type guards ─────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

const isDocxSlot = (value: unknown): value is DocxSlot => {
  if (!isRecord(value)) return false;
  return (
    isString(value.slotId) &&
    isBoolean(value.required) &&
    isBoolean(value.reviewRequired)
  );
};

const isCanonicalField = (value: unknown): value is CanonicalField => {
  if (!isRecord(value)) return false;
  return isString(value.path) && isString(value.type);
};

const isRenderBinding = (value: unknown): value is RenderBinding => {
  if (!isRecord(value)) return false;
  return (
    isString(value.slotId) &&
    isString(value.from) &&
    isString(value.transform) &&
    Object.prototype.hasOwnProperty.call(value, 'fallback')
  );
};

const assertContractArray = <T>(
  value: unknown,
  guard: (item: unknown) => item is T,
  label: string,
  sourceId: string,
): T[] => {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`[${sourceId}] ${label} must be an array`);
  }
  const invalidIndex = value.findIndex((item) => !guard(item));
  if (invalidIndex !== -1) {
    throw new Error(`[${sourceId}] invalid ${label}[${invalidIndex}]`);
  }
  return value;
};

// ─── Contract normalizer ─────────────────────────────────────────────────────────

function normalizeContract(c: Record<string, unknown>): LoadedFormContract {
  const sourceId = String(c.sourceId ?? '');
  const templateCode = String(c.templateCode ?? '');

  const docxSlots = assertContractArray(
    c.docxSlots,
    isDocxSlot,
    'docxSlots',
    sourceId,
  );
  const canonicalFields = assertContractArray(
    c.canonicalFields,
    isCanonicalField,
    'canonicalFields',
    sourceId,
  );
  const renderBindings = assertContractArray(
    c.renderBindings,
    isRenderBinding,
    'renderBindings',
    sourceId,
  );

  const genericFieldCount = docxSlots.filter((s) =>
    GENERIC_FIELD_PATTERN.test(s.slotId),
  ).length;
  const fieldsNeedingReviewCount = canonicalFields.filter(
    (f) =>
      f.source === 'unknown' ||
      GENERIC_FIELD_PATTERN.test(f.path),
  ).length;
  const stage = getStageForBm(templateCode);

  return {
    sourceId,
    templateCode,
    title: String(c.templateTitle ?? ''),
    status: String(c.status ?? 'draft') as 'locked' | 'draft',
    documentKind: 'form',
    stage,
    docxSlots,
    canonicalFields,
    renderBindings,
    runtimeEligible: c.status === 'locked',
    needsReview: genericFieldCount > 0 || fieldsNeedingReviewCount > 0,
    genericFieldCount,
    fieldsNeedingReviewCount,
    lockedAt: c.lockedAt ? String(c.lockedAt) : undefined,
  };
}

function buildFormCatalog(
  contracts: LoadedFormContract[],
  query: FormCatalogQuery = {},
): FormCatalogItem[] {
  let items: FormCatalogItem[] = contracts.map((c) => ({
    sourceId: c.sourceId,
    templateCode: c.templateCode,
    title: c.title,
    stageCode: c.stage?.code,
    stageLabel: c.stage?.label,
    status: c.status,
    runtimeEligible: c.runtimeEligible,
    reviewRequired: c.needsReview,
    genericFieldCount: c.genericFieldCount,
    lockedAt: c.lockedAt,
  }));

  if (query.sourceId)
    items = items.filter((i) => i.sourceId === query.sourceId);
  if (query.status) items = items.filter((i) => i.status === query.status);
  if (query.stage) items = items.filter((i) => i.stageCode === query.stage);
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.templateCode.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        (i.stageLabel?.toLowerCase().includes(q) ?? false),
    );
  }
  return items;
}

@Injectable()
export class FormsCatalogService {
  private readonly contractsRoot: string;

  constructor() {
    const projectRoot = path.resolve(process.cwd());
    this.contractsRoot = path.join(
      projectRoot,
      'docs',
      'audit',
      'docx',
      'contracts',
    );
  }

  getContract(identifier: string): LoadedFormContract | null {
    const direct = this.loadBySourceId(identifier);
    if (direct) return direct;
    return this.loadByTemplateCode(identifier);
  }

  private loadBySourceId(sourceId: string): LoadedFormContract | null {
    const { locked, draft } = discoverContractPaths(this.contractsRoot);
    for (const fp of [...locked, ...draft]) {
      const c = loadContractFromPath(fp) as Record<string, unknown> | null;
      if (!c || c.documentKind === 'reference') continue;
      if (c.sourceId === sourceId) return normalizeContract(c);
    }
    return null;
  }

  private loadByTemplateCode(templateCode: string): LoadedFormContract | null {
    const { locked, draft } = discoverContractPaths(this.contractsRoot);
    for (const fp of locked) {
      const c = loadContractFromPath(fp) as Record<string, unknown> | null;
      if (!c || c.documentKind === 'reference') continue;
      if (c.templateCode === templateCode) return normalizeContract(c);
    }
    for (const fp of draft) {
      const c = loadContractFromPath(fp) as Record<string, unknown> | null;
      if (!c || c.documentKind === 'reference') continue;
      if (c.templateCode === templateCode) return normalizeContract(c);
    }
    return null;
  }

  getCatalog(query: FormCatalogQuery = {}): FormCatalogItem[] {
    return buildFormCatalog(this.loadAllContracts(), query);
  }

  getCatalogByStage(): Array<{
    stageCode: string;
    stageLabel: string;
    forms: FormCatalogItem[];
  }> {
    return FORM_STAGES.map((stage) => ({
      stageCode: stage.code,
      stageLabel: stage.label,
      forms: buildFormCatalog(this.loadAllContracts(), { stage: stage.code }),
    }));
  }

  private loadAllContracts(): LoadedFormContract[] {
    try {
      const { locked, draft } = discoverContractPaths(this.contractsRoot);
      const byCode = new Map<string, LoadedFormContract>();

      for (const fp of locked) {
        const c = loadContractFromPath(fp) as Record<string, unknown> | null;
        if (!c || c.documentKind === 'reference') continue;
        const loaded = normalizeContract(c);
        byCode.set(loaded.templateCode, loaded);
      }
      for (const fp of draft) {
        const c = loadContractFromPath(fp) as Record<string, unknown> | null;
        if (!c || c.documentKind === 'reference') continue;
        if (byCode.has(String(c.templateCode))) continue;
        const loaded = normalizeContract(c);
        byCode.set(loaded.templateCode, loaded);
      }

      return Array.from(byCode.values()).sort((a, b) =>
        (a.templateCode ?? '').localeCompare(b.templateCode ?? ''),
      );
    } catch {
      return [];
    }
  }
}
