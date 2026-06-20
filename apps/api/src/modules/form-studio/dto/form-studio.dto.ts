import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBlankFormTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class CloneFormTemplateDto {
  @IsString()
  @IsNotEmpty()
  sourceTemplateId!: string;
}

export class PatchFormDraftDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @IsArray()
  operations!: unknown[];
}

export class FormReviewCommentDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  comment?: string;
}

export class PreviewFormDraftDto {
  @IsObject()
  @IsOptional()
  sampleData?: Record<string, unknown>;
}

export class GrantFormPermissionDto {
  @IsString()
  @IsNotEmpty()
  officialId!: string;

  @IsString()
  @IsOptional()
  agencyId?: string;

  @IsString()
  @IsNotEmpty()
  permission!: string;
}
