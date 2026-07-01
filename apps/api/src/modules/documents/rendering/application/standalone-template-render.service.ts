import { BadRequestException, Injectable } from '@nestjs/common';
import type { ContractRenderPlanMissingRequired } from '../domain/contract-render-plan';
import { ContractRenderPlanBuilder } from './contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from '../infrastructure/docxtemplater-contract-render-engine';

type RenderStandaloneTemplateInput = {
  templateCode: string;
  data?: unknown;
};

type RenderStandaloneTemplateResult = {
  templateCode: string;
  fileName: string;
  buffer: Buffer;
  warnings: readonly string[];
  missingRequired: readonly ContractRenderPlanMissingRequired[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeStandaloneTemplateCode(templateCode: string): string {
  const normalized = templateCode.trim().toUpperCase();
  if (!/^BM-\d{3}$/u.test(normalized)) {
    throw new BadRequestException('Ma bieu mau khong hop le.');
  }
  return normalized;
}

function timestampForFileName(date = new Date()): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10).replace(/-/g, '')}-${iso.slice(11, 19).replace(/:/g, '')}`;
}

function flattenRuntimeTemplateDataInto(
  value: Record<string, unknown>,
  output: Record<string, unknown>,
  prefix = '',
): void {
  for (const [key, nested] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(nested)) {
      flattenRuntimeTemplateDataInto(nested, output, path);
      continue;
    }
    output[path] = nested;
  }
}

export function flattenRuntimeTemplateData(
  value: unknown,
): Record<string, unknown> {
  if (!isRecord(value)) return {};
  const output: Record<string, unknown> = {};
  flattenRuntimeTemplateDataInto(value, output);
  return output;
}

@Injectable()
export class StandaloneTemplateRenderService {
  constructor(
    private readonly planBuilder: ContractRenderPlanBuilder,
    private readonly renderEngine: DocxtemplaterContractRenderEngine,
  ) {}

  async renderDocx(
    input: RenderStandaloneTemplateInput,
  ): Promise<RenderStandaloneTemplateResult> {
    const templateCode = normalizeStandaloneTemplateCode(input.templateCode);
    const formData = flattenRuntimeTemplateData(input.data);
    const standaloneId = `standalone:${templateCode}`;
    const plan = this.planBuilder.build({
      documentId: standaloneId,
      templateCode,
      sourceId: standaloneId,
      formData,
    });
    const buffer = await this.renderEngine.renderActiveDocx(plan, formData);

    return {
      templateCode,
      buffer,
      fileName: `${templateCode}-${timestampForFileName()}.docx`,
      warnings: plan.warnings,
      missingRequired: plan.missingRequired,
    };
  }
}
