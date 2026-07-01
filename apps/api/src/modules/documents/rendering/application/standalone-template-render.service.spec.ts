import { BadRequestException } from '@nestjs/common';
import { StandaloneTemplateRenderService } from './standalone-template-render.service';

describe('StandaloneTemplateRenderService', () => {
  function makeService() {
    const plan = {
      templateCode: 'BM-001',
      warnings: ['warn'],
      missingRequired: [{ path: 'receiver.fullName', reason: 'missing' }],
    };
    const planBuilder = {
      build: jest.fn(() => plan),
    };
    const renderEngine = {
      renderActiveDocx: jest.fn(async () => Buffer.from('docx-data')),
    };
    const service = new StandaloneTemplateRenderService(
      planBuilder as never,
      renderEngine as never,
    );
    return { service, plan, planBuilder, renderEngine };
  }

  it('renders a runtime template directly without a generated document id', async () => {
    const { service, plan, planBuilder, renderEngine } = makeService();

    const result = await service.renderDocx({
      templateCode: ' bm-001 ',
      data: {
        receiver: { fullName: 'Nguyen Van A' },
        'document.no': '01',
      },
    });

    expect(planBuilder.build).toHaveBeenCalledWith({
      documentId: 'standalone:BM-001',
      templateCode: 'BM-001',
      sourceId: 'standalone:BM-001',
      formData: {
        'receiver.fullName': 'Nguyen Van A',
        'document.no': '01',
      },
    });
    expect(renderEngine.renderActiveDocx).toHaveBeenCalledWith(plan, {
      'receiver.fullName': 'Nguyen Van A',
      'document.no': '01',
    });
    expect(result.buffer.toString()).toBe('docx-data');
    expect(result.fileName).toMatch(/^BM-001-\d{8}-\d{6}\.docx$/u);
    expect(result.warnings).toEqual(['warn']);
    expect(result.missingRequired).toHaveLength(1);
  });

  it('rejects invalid template codes before rendering', async () => {
    const { service, planBuilder, renderEngine } = makeService();

    await expect(
      service.renderDocx({ templateCode: '../BM-001', data: {} }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(planBuilder.build).not.toHaveBeenCalled();
    expect(renderEngine.renderActiveDocx).not.toHaveBeenCalled();
  });
});
