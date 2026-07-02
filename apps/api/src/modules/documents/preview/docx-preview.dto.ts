/**
 * DOCX Preview DTOs
 *
 * @module documents/preview
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class PreviewDocxQueryDto {
  @ApiPropertyOptional({
    description: 'If true, use sample preview data instead of case/form data.',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sample?: boolean = false;
}

export class PreviewDocxDto {
  @ApiPropertyOptional({
    description:
      'Override specific form fields with sample values. Key-value pairs.',
    example: { 'person.fullName': 'Nguyễn Văn A' },
  })
  @IsOptional()
  sampleData?: Record<string, string>;
}
