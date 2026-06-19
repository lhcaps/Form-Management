import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';
import type { GeneratedDocumentDescriptor } from '../application/document-renderer.ports';
import {
  createContractRenderPlan,
  type ContractRenderPlan,
  type ContractRenderPlanField,
  type ContractRenderPlanBinding,
  type ContractRenderPlanMissingRequired,
} from '../domain/contract-render-plan';

interface ContractSlot {
  slotId: string;
  required: boolean;
  reviewRequired: boolean;
}

interface ContractCanonicalField {
  path: string;
  source: string;
  required: boolean;
  transform: string;
}

interface ContractRenderBinding {
  slotId: string;
  from: string;
  transform: string;
  fallback: unknown;
  reviewRequired: boolean;
}

interface LockedContract {
  sourceId: string;
  templateCode: string;
  status: string;
  docxSlots: ContractSlot[];
  canonicalFields: ContractCanonicalField[];
  renderBindings: ContractRenderBinding[];
}

const VALID_SOURCES = new Set([
  'agencyConfig',
  'manual',
  'casePayload',
  'computed',
]);
const VALID_TRANSFORMS = new Set([
  'identity',
  'derived',
  'uppercase',
  'lowercase',
  'trim',
]);

@Injectable()
export class ContractRenderPlanBuilder {
  private readonly logger = new Logger(ContractRenderPlanBuilder.name);

  constructor(private readonly workspace: WorkspacePathsService) {}

  build(descriptor: GeneratedDocumentDescriptor): ContractRenderPlan {
    const normalizedCode = descriptor.templateCode.trim().toUpperCase();

    const contract = this.loadLockedContract(normalizedCode);

    if (contract.status !== 'locked') {
      throw new Error(
        `Contract "${descriptor.templateCode}" has status "${contract.status}"; only "locked" contracts are supported.`,
      );
    }

    const slotMap = new Map(contract.docxSlots.map((s) => [s.slotId, s]));

    const fields: ContractRenderPlanField[] = [];
    const bindings: ContractRenderPlanBinding[] = [];
    const missingRequired: ContractRenderPlanMissingRequired[] = [];
    const warnings: string[] = [];

    for (const canonical of contract.canonicalFields) {
      if (canonical.path.includes('.field#') || canonical.path.includes('[#')) {
        warnings.push(
          `Generic field path "${canonical.path}" not supported in BM-001 plan.`,
        );
        continue;
      }

      const source = canonical.source as ContractRenderPlanField['source'];
      if (!VALID_SOURCES.has(source)) {
        warnings.push(
          `Field "${canonical.path}" has unrecognized source "${canonical.source}". Treating as manual.`,
        );
      }

      const formData = descriptor.formData ?? {};
      const rawValue = formData[canonical.path];
      const resolvedValue = rawValue ?? null;
      const isMissingRequired =
        canonical.required &&
        (rawValue === undefined || rawValue === null || rawValue === '');

      fields.push({
        path: canonical.path,
        value: resolvedValue,
        source: VALID_SOURCES.has(source) ? source : 'manual',
        required: canonical.required,
      });

      if (isMissingRequired) {
        const slot = slotMap.get(canonical.path);
        missingRequired.push({
          path: canonical.path,
          slotId: slot?.slotId,
          reason: `Required field "${canonical.path}" has no value in form data.`,
        });
      }
    }

    for (const binding of contract.renderBindings) {
      const slot = slotMap.get(binding.slotId);
      if (slot?.reviewRequired === true) {
        warnings.push(
          `Binding for slot "${binding.slotId}" has reviewRequired=true; D.2.2 shadow render skips review slots.`,
        );
      }

      if (!VALID_TRANSFORMS.has(binding.transform)) {
        throw new Error(
          `Unknown transform "${binding.transform}" for slot "${binding.slotId}". Valid transforms: ${[...VALID_TRANSFORMS].join(', ')}.`,
        );
      }

      const formData = descriptor.formData ?? {};
      const rawValue = formData[binding.from];
      const resolvedValue = this.applyTransform(
        binding.transform,
        rawValue,
        binding.fallback,
      );

      bindings.push({
        slotId: binding.slotId,
        from: binding.from,
        transform: binding.transform,
        fallback: binding.fallback,
        value: resolvedValue,
      });
    }

    return createContractRenderPlan(
      { fields, bindings, missingRequired, warnings },
      contract.sourceId,
      normalizedCode,
    );
  }

  private loadLockedContract(templateCode: string): LockedContract {
    const lockedRoot = join(this.workspace.contractsRoot, 'locked');
    const contractFiles = readdirSync(lockedRoot)
      .filter(
        (fileName) =>
          fileName.startsWith(`${templateCode}__`) &&
          fileName.endsWith('.contract.locked.json'),
      )
      .sort();

    if (contractFiles.length === 0) {
      throw new Error(
        `Locked contract for "${templateCode}" not found in "${lockedRoot}". ` +
          'Ensure the locked contract JSON exists in docs/audit/docx/contracts/locked/.',
      );
    }

    if (contractFiles.length > 1) {
      throw new Error(
        `Multiple locked contracts found for "${templateCode}": ${contractFiles.join(', ')}. Resolve the ambiguity before rendering.`,
      );
    }

    const contractPath = join(lockedRoot, contractFiles[0]);
    const raw = readFileSync(contractPath, 'utf-8');
    return JSON.parse(raw) as LockedContract;
  }

  private applyTransform(
    transform: string,
    value: unknown,
    fallback: unknown,
  ): unknown {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    switch (transform) {
      case 'identity':
        return value;
      case 'derived':
        return value;
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      default:
        return fallback;
    }
  }
}
