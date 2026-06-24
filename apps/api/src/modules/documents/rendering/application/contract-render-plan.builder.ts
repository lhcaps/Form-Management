import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
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

// Sources observed across the 213 locked BM contracts. `officialConfig` is
// the KSV-station configuration slot (position title, department, signer).
// `systemDate` is the runtime-injected document issue line.
const VALID_SOURCES = new Set([
  'agencyConfig',
  'officialConfig',
  'systemDate',
  'manual',
  'casePayload',
  'computed',
]);
// `date.issuePlaceDateLine` is the historic per-slot transform identifier
// used by the BM-002..BM-173 contracts for the document header date line.
// Semantically it is equivalent to `identity` (raw string passthrough);
// kept distinct so existing contract data does not need regeneration.
const VALID_TRANSFORMS = new Set([
  'identity',
  'derived',
  'uppercase',
  'lowercase',
  'trim',
  'date.issuePlaceDateLine',
]);

@Injectable()
export class ContractRenderPlanBuilder {
  private readonly logger = new Logger(ContractRenderPlanBuilder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspacePathsService,
  ) {}

  build(descriptor: GeneratedDocumentDescriptor): ContractRenderPlan {
    const normalizedCode = descriptor.templateCode.trim().toUpperCase();

    const contract = this.loadLockedContract(normalizedCode);

    if (contract.status !== 'locked') {
      throw new Error(
        `Contract "${descriptor.templateCode}" has status "${contract.status}"; only "locked" contracts are supported.`,
      );
    }

    const formData = this.resolveFormData(descriptor);

    const slotMap = new Map(contract.docxSlots.map((s) => [s.slotId, s]));

    const fields: ContractRenderPlanField[] = [];
    const bindings: ContractRenderPlanBinding[] = [];
    const missingRequired: ContractRenderPlanMissingRequired[] = [];
    const warnings: string[] = [];

    for (const canonical of contract.canonicalFields) {
      if (canonical.path.includes('.field#') || canonical.path.includes('[#')) {
        warnings.push(
          `Generic field path "${canonical.path}" not supported in contract render plan.`,
        );
        continue;
      }

      const source = canonical.source as ContractRenderPlanField['source'];
      if (!VALID_SOURCES.has(source)) {
        warnings.push(
          `Field "${canonical.path}" has unrecognized source "${canonical.source}". Treating as manual.`,
        );
      }

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
      if (slotMap.get(binding.slotId)?.reviewRequired === true) {
        warnings.push(
          `Binding for slot "${binding.slotId}" has reviewRequired=true.`,
        );
      }

      if (!VALID_TRANSFORMS.has(binding.transform)) {
        throw new Error(
          `Unknown transform "${binding.transform}" for slot "${binding.slotId}". Valid transforms: ${[...VALID_TRANSFORMS].join(', ')}.`,
        );
      }

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

  private resolveFormData(
    descriptor: GeneratedDocumentDescriptor,
  ): Record<string, unknown> {
    if (descriptor.formData && Object.keys(descriptor.formData).length > 0) {
      return descriptor.formData;
    }
    return {};
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
      case 'date.issuePlaceDateLine':
        // Alias of identity for the historic per-slot date transform used by
        // 63 of the 213 locked BM contracts. No date formatting is applied
        // here; the slot value is the full pre-formatted line.
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
