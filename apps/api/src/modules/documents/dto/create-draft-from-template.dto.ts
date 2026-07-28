import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateDraftFromTemplateDto {
  @ApiProperty({
    description: 'Template code (e.g., BM-002)',
    example: 'BM-002',
    pattern: '^BM-\\d{3}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^BM-\d{3}$/, {
    message: 'Template code must match format BM-XXX (e.g., BM-002)',
  })
  templateCode!: string;

  @ApiProperty({
    description: 'Case ID for the draft document',
    example: '123',
  })
  @IsString()
  @IsNotEmpty()
  caseId!: string;

  @ApiProperty({
    description: 'Optional target person ID for person-level forms',
    example: '456',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetPersonId?: string;
}
