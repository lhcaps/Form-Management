import { ApiProperty } from '@nestjs/swagger';

export class CreateDraftFromTemplateResponseDto {
  @ApiProperty({
    description: 'Created or reused document ID',
    example: '789',
  })
  documentId!: string;

  @ApiProperty({
    description: 'Template code',
    example: 'BM-002',
  })
  templateCode!: string;

  @ApiProperty({
    description: 'Whether a new draft was created',
    example: true,
  })
  isNew!: boolean;

  @ApiProperty({
    description: 'Whether an existing draft was reused',
    example: false,
  })
  reused!: boolean;

  @ApiProperty({
    description: 'Case ID',
    example: '123',
  })
  caseId!: string;

  @ApiProperty({
    description: 'Review status of the document',
    example: 'DRAFT',
  })
  reviewStatus!: string;

  @ApiProperty({
    description: 'Document title',
    example: 'Biểu mẫu BM-002 - ABC-2026-001',
  })
  documentTitle!: string;
}
