import { Injectable } from '@nestjs/common';
import type { ContractRenderPlanMissingRequired } from '../../domain/contract-render-plan';
import { StandaloneTemplateRenderService } from '../standalone-template-render.service';
import type { RuntimeTemplateRenderAdapterContract } from './api-render-adapter.contract';

export type RenderRuntimePreviewDocxInput = {
  templateCode: string;
  data?: Record<string, unknown>;
};

export type RenderRuntimePreviewDocxResult = {
  templateCode: string;
  fileName: string;
  buffer: Buffer;
  warnings: readonly string[];
  missingRequired: readonly ContractRenderPlanMissingRequired[];
};

@Injectable()
export class RuntimeTemplateRenderAdapter implements RuntimeTemplateRenderAdapterContract {
  readonly lifecycle = 'runtime-template' as const;

  constructor(private readonly renderer: StandaloneTemplateRenderService) {}

  renderPreviewDocx(
    input: RenderRuntimePreviewDocxInput,
  ): Promise<RenderRuntimePreviewDocxResult> {
    return this.renderer.renderDocx(input);
  }
}
