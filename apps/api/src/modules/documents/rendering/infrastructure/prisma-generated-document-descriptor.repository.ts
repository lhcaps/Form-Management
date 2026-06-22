import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  GeneratedDocumentDescriptor,
  GeneratedDocumentDescriptorPort,
} from '../application/document-renderer.ports';

@Injectable()
export class PrismaGeneratedDocumentDescriptorRepository implements GeneratedDocumentDescriptorPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByDocumentId(
    documentIdRaw: string,
  ): Promise<GeneratedDocumentDescriptor> {
    const documentId = this.parseDocumentId(documentIdRaw);
    const document = await this.prisma.generated_documents.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        render_payload_snapshot: true,
        templates: {
          select: {
            id: true,
            template_code: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }

    return {
      documentId: String(document.id),
      templateCode: document.templates.template_code,
      templateId: String(document.templates.id),
      sourceId: document.templates.template_code,
      formData:
        (document.render_payload_snapshot as Record<string, unknown>) ?? {},
    };
  }

  private parseDocumentId(value: string): bigint {
    try {
      const parsed = BigInt(value);
      if (parsed <= 0n) throw new Error('not positive');
      return parsed;
    } catch {
      throw new BadRequestException('documentId không hợp lệ.');
    }
  }
}
