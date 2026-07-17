import { Test } from '@nestjs/testing';
import { AuthModule } from '../auth/auth.module';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { DocumentsModule } from './documents.module';
import { FormsContractsModule } from '../forms-contracts/forms-contracts.module';
import { TemplatesModule } from '../templates/templates.module';
import { ContractPlatformModule } from '../contract-platform/contract-platform.module';
import { Bm031DirectModule } from '../bm031-direct/bm031-direct.module';
import { GeneratedInputSaveModule } from './rendering/application/generated-input-save-core/generated-input-save.module';
import {
  CONTRACT_DOCUMENT_RENDERER,
  GENERATED_DOCUMENT_DESCRIPTOR,
  LEGACY_DOCUMENT_RENDERER,
} from './rendering/application/document-renderer.ports';
import { RenderGeneratedDocumentUseCase } from './rendering/application/render-generated-document.use-case';

describe('DocumentsModule renderer seam', () => {
  it('resolves the use case and every renderer port through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthModule,
        InfrastructureModule,
        PrismaModule,
        // PR-E: the three sibling modules provide the generated-save
        // adapters; the orchestrator is provided by
        // GeneratedInputSaveModule. All three feature modules plus the
        // core are imported here because the controller wires use a
        // forwardRef-based dependency graph.
        FormsContractsModule,
        TemplatesModule,
        ContractPlatformModule,
        Bm031DirectModule,
        GeneratedInputSaveModule,
        DocumentsModule,
      ],
    }).compile();

    expect(moduleRef.get(RenderGeneratedDocumentUseCase)).toBeDefined();
    expect(moduleRef.get(LEGACY_DOCUMENT_RENDERER)).toBeDefined();
    expect(moduleRef.get(CONTRACT_DOCUMENT_RENDERER)).toBeDefined();
    expect(moduleRef.get(GENERATED_DOCUMENT_DESCRIPTOR)).toBeDefined();

    await moduleRef.close();
  });
});
