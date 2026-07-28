import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { FormPlatformCatalogService } from './application/form-platform-catalog.service';

@ApiTags('Form Platform Catalog')
@Controller('form-platform/catalog')
export class FormPlatformCatalogController {
  constructor(private readonly catalog: FormPlatformCatalogService) {}

  @Get()
  list(@CurrentUser() user?: CurrentUserType | null) {
    return this.catalog.listCatalog(user?.agencyId ?? null);
  }

  @Get(':templateCode')
  get(
    @Param('templateCode') templateCode: string,
    @CurrentUser() user?: CurrentUserType | null,
  ) {
    return this.catalog.getCatalogItem(templateCode, user?.agencyId ?? null);
  }
}
