import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ListIdentitiesDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(['linked', 'unlinked', 'all'])
  @IsOptional()
  linked?: 'linked' | 'unlinked' | 'all' = 'all';

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  pageSize?: string;
}

export class SearchOfficialsDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  agencyId?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  pageSize?: string;
}

export class LinkIdentityDto {
  @IsString()
  @IsNotEmpty()
  officialId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

export class UnlinkIdentityDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
